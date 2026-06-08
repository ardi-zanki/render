import { and, asc, eq, lte } from "drizzle-orm";

import { db } from "@/db";
import { renderJobs, renders } from "@/db/schema";
import { env } from "@/env";
import { applyCreditChange } from "@/lib/credits";
import { renderResultEmail } from "@/lib/email";
import { notifyUser } from "@/lib/notifications/service";
import { RENDER_COST } from "./types";

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

export async function lockNextJob(lockedBy: string) {
  const now = new Date();
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
