import { and, count, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  renderJobs,
  renders,
  user,
  type RenderMode,
  type RenderStatus,
} from "@/db/schema";
import { writeAuditLog } from "./audit";

export interface AdminRenderRow {
  id: string;
  mode: RenderMode;
  status: string;
  userName: string;
  aiProvider: string | null;
  errorMessage: string | null;
  providerRequestId: string | null;
  createdAt: Date;
}

export async function listAllRenders(
  limit = 100,
  filters: { status?: RenderStatus; mode?: RenderMode } = {},
  offset = 0,
): Promise<AdminRenderRow[]> {
  return db
    .select({
      id: renders.id,
      mode: renders.mode,
      status: renders.status,
      userName: user.name,
      aiProvider: renders.aiProvider,
      errorMessage: renders.errorMessage,
      providerRequestId: renders.providerRequestId,
      createdAt: renders.createdAt,
    })
    .from(renders)
    .innerJoin(user, eq(user.id, renders.userId))
    .where(
      and(
        isNull(renders.deletedAt),
        filters.status ? eq(renders.status, filters.status) : undefined,
        filters.mode ? eq(renders.mode, filters.mode) : undefined,
      ),
    )
    .orderBy(desc(renders.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function countAllRenders(
  filters: { status?: RenderStatus; mode?: RenderMode } = {},
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(renders)
    .where(
      and(
        isNull(renders.deletedAt),
        filters.status ? eq(renders.status, filters.status) : undefined,
        filters.mode ? eq(renders.mode, filters.mode) : undefined,
      ),
    );
  return row.value;
}

/** Re-queue a failed render for another attempt (PRD §27.4). */
export async function retryRender(adminUserId: string, renderId: string) {
  const render = await db.query.renders.findFirst({
    where: eq(renders.id, renderId),
  });
  if (!render || render.deletedAt || render.status !== "failed") return false;

  const now = new Date();
  await db
    .update(renders)
    .set({
      status: "queued",
      errorCode: null,
      errorMessage: null,
      failedAt: null,
      startedAt: null,
    })
    .where(eq(renders.id, renderId));

  const existing = await db.query.renderJobs.findFirst({
    where: eq(renderJobs.renderId, renderId),
  });
  if (existing) {
    await db
      .update(renderJobs)
      .set({
        status: "queued",
        attempts: 0,
        lockedAt: null,
        lockedBy: null,
        availableAt: now,
        startedAt: null,
        completedAt: null,
        failedAt: null,
        errorMessage: null,
        updatedAt: now,
      })
      .where(eq(renderJobs.id, existing.id));
  } else {
    await db.insert(renderJobs).values({
      renderId,
      userId: render.userId,
      status: "queued",
      attempts: 0,
      maxAttempts: 3,
      availableAt: now,
    });
  }

  await writeAuditLog({
    adminUserId,
    targetUserId: render.userId,
    action: "render.retry",
    entityType: "render",
    metadata: { renderId },
  });
  return true;
}
