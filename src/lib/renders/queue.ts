import { and, count, desc, eq, gte, inArray, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { projects, renderJobs, renders } from "@/db/schema";

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
  // panel until the user opens the latest completed result.
  const queueWhere = and(
    eq(renderJobs.userId, userId),
    isNull(renders.deletedAt),
    or(
      inArray(renderJobs.status, ["queued", "processing"]),
      and(
        eq(renderJobs.status, "success"),
        eq(renders.status, "success"),
        gte(renderJobs.completedAt, completedCutoff),
        isNull(renders.seenAt),
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

/** Persist that a user has opened a completed render from any entry point. */
export async function markRenderQueueSeen(userId: string, renderId: string) {
  await db
    .update(renders)
    .set({ seenAt: new Date() })
    .where(
      and(
        eq(renders.userId, userId),
        eq(renders.id, renderId),
        eq(renders.status, "success"),
        isNull(renders.seenAt),
      ),
    );
}
