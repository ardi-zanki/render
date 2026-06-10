import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  lte,
} from "drizzle-orm";

import { db } from "@/db";
import { projects, renderJobs, renders } from "@/db/schema";
import { env } from "@/env";
import { applyCreditChange } from "@/lib/credits";
import { renderResultEmail } from "@/lib/email";
import { notifyUser } from "@/lib/notifications/service";
import { RENDER_COST } from "./types";

export async function listActiveRenderQueue(userId: string, limit = 20) {
  const activeQueueWhere = and(
    eq(renderJobs.userId, userId),
    inArray(renderJobs.status, ["queued", "processing"]),
    isNull(renders.deletedAt),
  );

  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(renderJobs)
      .innerJoin(renders, eq(renderJobs.renderId, renders.id))
      .where(activeQueueWhere),
    db
      .select({
        id: renderJobs.id,
        renderId: renderJobs.renderId,
        status: renderJobs.status,
        attempts: renderJobs.attempts,
        mode: renders.mode,
        prompt: renders.prompt,
        projectName: projects.name,
        createdAt: renderJobs.createdAt,
        startedAt: renderJobs.startedAt,
      })
      .from(renderJobs)
      .innerJoin(renders, eq(renderJobs.renderId, renders.id))
      .innerJoin(projects, eq(renders.projectId, projects.id))
      .where(activeQueueWhere)
      .orderBy(desc(renderJobs.createdAt))
      .limit(limit),
  ]);

  return {
    count: totalRow[0]?.value ?? rows.length,
    items: rows,
  };
}

export async function lockJobByRenderId(renderId: string, lockedBy: string) {
  return db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(renderJobs)
      .where(
        and(eq(renderJobs.renderId, renderId), eq(renderJobs.status, "queued")),
      )
      .for("update");

    if (!job) return null;

    const now = new Date();
    const [locked] = await tx
      .update(renderJobs)
      .set({
        status: "processing",
        attempts: job.attempts + 1,
        lockedAt: now,
        lockedBy,
        startedAt: job.startedAt ?? now,
        updatedAt: now,
      })
      .where(eq(renderJobs.id, job.id))
      .returning();
    return locked;
  });
}

export async function recoverStaleRenderJobs(now = new Date()) {
  const staleBefore = new Date(
    now.getTime() - env.JOB_LOCK_TIMEOUT_SECONDS * 1000,
  );

  const recovered = await db
    .update(renderJobs)
    .set({
      status: "queued",
      lockedAt: null,
      lockedBy: null,
      availableAt: now,
      errorMessage: "Job dipulihkan setelah worker tidak merespons",
      updatedAt: now,
    })
    .where(
      and(
        eq(renderJobs.status, "processing"),
        lt(renderJobs.lockedAt, staleBefore),
      ),
    )
    .returning({ renderId: renderJobs.renderId });

  if (recovered.length === 0) return 0;

  await db
    .update(renders)
    .set({
      status: "queued",
      errorCode: "STALE_JOB_RECOVERED",
      errorMessage: "Job dipulihkan setelah worker tidak merespons",
    })
    .where(
      and(
        inArray(
          renders.id,
          recovered.map((job) => job.renderId),
        ),
        eq(renders.status, "processing"),
      ),
    );

  return recovered.length;
}

export async function lockNextJob(lockedBy: string) {
  const now = new Date();
  await recoverStaleRenderJobs(now);

  return db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(renderJobs)
      .where(and(eq(renderJobs.status, "queued"), lte(renderJobs.availableAt, now)))
      .orderBy(asc(renderJobs.availableAt))
      .limit(1)
      // SKIP LOCKED lets multiple worker containers pull different jobs in
      // parallel without blocking each other (deployment PRD §13 — 2+ workers).
      .for("update", { skipLocked: true });

    if (!job) return null;

    const [locked] = await tx
      .update(renderJobs)
      .set({
        status: "processing",
        attempts: job.attempts + 1,
        lockedAt: now,
        lockedBy,
        startedAt: job.startedAt ?? now,
        updatedAt: now,
      })
      .where(eq(renderJobs.id, job.id))
      .returning();
    return locked;
  });
}

export async function finalizeFailedRender(params: {
  renderId: string;
  userId: string;
  jobId: string;
  message: string;
  code: string;
}) {
  const now = new Date();
  await db
    .update(renderJobs)
    .set({
      status: "failed",
      failedAt: now,
      completedAt: null,
      errorMessage: params.message,
      updatedAt: now,
    })
    .where(eq(renderJobs.id, params.jobId));

  await db
    .update(renders)
    .set({
      status: "failed",
      failedAt: now,
      errorMessage: params.message,
      errorCode: params.code,
    })
    .where(eq(renders.id, params.renderId));

  await applyCreditChange({
    userId: params.userId,
    type: "refund",
    amount: RENDER_COST,
    description: "Refund render gagal",
    renderId: params.renderId,
    idempotencyKey: `render-refund:${params.renderId}`,
  });

  await notifyUser({
    userId: params.userId,
    type: "render_failed",
    title: "Render gagal diproses",
    message: "Kredit kamu sudah dikembalikan. Silakan coba lagi.",
    actionUrl: "/renders/new",
    email: renderResultEmail({
      success: false,
      url: `${env.APP_URL.replace(/\/$/, "")}/renders/new`,
    }),
  });
}

export async function rescheduleJob(params: {
  jobId: string;
  renderId: string;
  message: string;
  attempt: number;
}) {
  const now = new Date();
  const delayMs = Math.min(30_000, params.attempt * 5_000);
  await db
    .update(renderJobs)
    .set({
      status: "queued",
      lockedAt: null,
      lockedBy: null,
      availableAt: new Date(now.getTime() + delayMs),
      errorMessage: params.message,
      updatedAt: now,
    })
    .where(eq(renderJobs.id, params.jobId));

  await db
    .update(renders)
    .set({
      status: "queued",
      errorMessage: params.message,
      errorCode: "RETRYING",
    })
    .where(eq(renders.id, params.renderId));
}
