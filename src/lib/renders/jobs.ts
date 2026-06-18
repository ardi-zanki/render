import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  or,
} from "drizzle-orm";

import { db } from "@/db";
import { projects, renderJobs, renders } from "@/db/schema";
import { env } from "@/env";
import { applyCreditChange } from "@/lib/credits";
import { notifyUser } from "@/lib/notifications/service";
import { RENDER_COST } from "./types";

/** Window for keeping finished jobs in the queue panel (as "Selesai"). */
const RECENT_COMPLETED_MS = 24 * 60 * 60 * 1000;

export async function listActiveRenderQueue(userId: string, limit = 20) {
  const completedCutoff = new Date(Date.now() - RECENT_COMPLETED_MS);

  const activeWhere = and(
    eq(renderJobs.userId, userId),
    inArray(renderJobs.status, ["queued", "processing"]),
    isNull(renders.deletedAt),
  );

  // Active jobs, plus recently-finished ones so they linger as "Selesai" in the
  // panel until the user opens them (the client dismisses seen completions).
  const queueWhere = and(
    eq(renderJobs.userId, userId),
    isNull(renders.deletedAt),
    or(
      inArray(renderJobs.status, ["queued", "processing"]),
      and(
        eq(renderJobs.status, "success"),
        gte(renderJobs.completedAt, completedCutoff),
      ),
    ),
  );

  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(renderJobs)
      .innerJoin(renders, eq(renderJobs.renderId, renders.id))
      .where(activeWhere),
    db
      .select({
        id: renderJobs.id,
        renderId: renderJobs.renderId,
        status: renderJobs.status,
        attempts: renderJobs.attempts,
        maxAttempts: renderJobs.maxAttempts,
        mode: renders.mode,
        prompt: renders.prompt,
        projectName: projects.name,
        createdAt: renderJobs.createdAt,
        startedAt: renderJobs.startedAt,
        completedAt: renderJobs.completedAt,
      })
      .from(renderJobs)
      .innerJoin(renders, eq(renderJobs.renderId, renders.id))
      .innerJoin(projects, eq(renders.projectId, projects.id))
      .where(queueWhere)
      .orderBy(desc(renderJobs.createdAt))
      .limit(limit),
  ]);

  return {
    // Count reflects in-progress work; the client adds unseen completions.
    count: totalRow[0]?.value ?? 0,
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

  const staleJobs = await db
    .select()
    .from(renderJobs)
    .where(
      and(
        eq(renderJobs.status, "processing"),
        lt(renderJobs.lockedAt, staleBefore),
      ),
    );

  if (staleJobs.length === 0) return 0;

  const retryable = staleJobs.filter((job) => job.attempts < job.maxAttempts);
  const exhausted = staleJobs.filter((job) => job.attempts >= job.maxAttempts);

  if (retryable.length > 0) {
    await db
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
        inArray(
          renderJobs.id,
          retryable.map((job) => job.id),
        ),
      );

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
            retryable.map((job) => job.renderId),
          ),
          eq(renders.status, "processing"),
        ),
      );
  }

  for (const job of exhausted) {
    await finalizeFailedRender({
      renderId: job.renderId,
      userId: job.userId,
      jobId: job.id,
      editId: job.editId,
      message: "Job berhenti setelah mencapai batas percobaan maksimal.",
      code: "MAX_ATTEMPTS_EXHAUSTED",
    });
  }

  return staleJobs.length;
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
  /** Set for a failed edit/re-render — keys the refund and keeps prior version. */
  editId?: string | null;
  message: string;
  code: string;
}) {
  const now = new Date();
  const isEdit = Boolean(params.editId);

  await db
    .update(renderJobs)
    .set({
      status: "failed",
      failedAt: now,
      completedAt: null,
      lockedAt: null,
      lockedBy: null,
      errorMessage: params.message,
      updatedAt: now,
    })
    .where(eq(renderJobs.id, params.jobId));

  // A failed edit leaves the prior successful version intact, so the render
  // reverts to "success". Only an initial render becomes "failed".
  await db
    .update(renders)
    .set(
      isEdit
        ? { status: "success", failedAt: null, errorCode: null, errorMessage: null }
        : {
            status: "failed",
            failedAt: now,
            errorMessage: params.message,
            errorCode: params.code,
          },
    )
    .where(eq(renders.id, params.renderId));

  await applyCreditChange({
    userId: params.userId,
    type: "refund",
    amount: RENDER_COST,
    description: isEdit ? "Refund edit gagal" : "Refund render gagal",
    renderId: params.renderId,
    idempotencyKey: params.editId
      ? `render-refund:${params.editId}`
      : `render-refund:${params.renderId}`,
  });

  // In-app only (PRD email scope: render events do not email).
  await notifyUser({
    userId: params.userId,
    type: "render_failed",
    title: isEdit ? "Edit gagal diproses" : "Render gagal diproses",
    message: "Kredit kamu sudah dikembalikan. Silakan coba lagi.",
    actionUrl: isEdit ? `/renders/${params.renderId}` : "/renders/new",
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

export type CancelRenderJobResult =
  | { ok: true; balance: number }
  | {
      ok: false;
      reason: "render_not_found" | "job_not_active" | "max_attempts_reached";
    };

export async function cancelRenderJob(
  userId: string,
  renderId: string,
): Promise<CancelRenderJobResult> {
  const render = await db.query.renders.findFirst({
    where: and(
      eq(renders.id, renderId),
      eq(renders.userId, userId),
      isNull(renders.deletedAt),
    ),
  });
  if (!render) return { ok: false, reason: "render_not_found" };

  const cancelled = await db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(renderJobs)
      .where(
        and(
          eq(renderJobs.renderId, renderId),
          inArray(renderJobs.status, ["queued", "processing"]),
        ),
      )
      .orderBy(desc(renderJobs.createdAt))
      .limit(1)
      .for("update");

    if (!job) {
      return { ok: false as const, reason: "job_not_active" as const };
    }
    if (job.attempts >= job.maxAttempts) {
      return { ok: false as const, reason: "max_attempts_reached" as const };
    }

    const now = new Date();
    const isEdit = Boolean(job.editId);
    await tx
      .update(renderJobs)
      .set({
        status: "failed",
        failedAt: now,
        completedAt: null,
        lockedAt: null,
        lockedBy: null,
        errorMessage: "Render dibatalkan oleh pengguna",
        updatedAt: now,
      })
      .where(eq(renderJobs.id, job.id));

    await tx
      .update(renders)
      .set(
        isEdit
          ? {
              status: "success",
              errorCode: "USER_CANCELLED",
              errorMessage: null,
              failedAt: null,
            }
          : {
              status: "cancelled",
              failedAt: now,
              errorCode: "USER_CANCELLED",
              errorMessage: "Render dibatalkan oleh pengguna",
            },
      )
      .where(eq(renders.id, renderId));

    return { ok: true as const, editId: job.editId, isEdit };
  });

  if (!cancelled.ok) return cancelled;

  const refund = await applyCreditChange({
    userId,
    type: "refund",
    amount: RENDER_COST,
    description: cancelled.isEdit
      ? "Refund edit dibatalkan"
      : "Refund render dibatalkan",
    renderId,
    idempotencyKey: cancelled.editId
      ? `render-refund:${cancelled.editId}`
      : `render-refund:${renderId}`,
  });

  return { ok: true, balance: refund.balance };
}
