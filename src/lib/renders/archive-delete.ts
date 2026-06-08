import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { renderAssets, renderJobs, renders } from "@/db/schema";
import { storage } from "@/lib/storage";
import { getRenderDetail } from "./queries";

export async function archiveRender(userId: string, renderId: string) {
  const now = new Date();
  const [row] = await db
    .update(renders)
    .set({ archivedAt: now })
    .where(
      and(
        eq(renders.id, renderId),
        eq(renders.userId, userId),
        isNull(renders.deletedAt),
      ),
    )
    .returning();
  return Boolean(row);
}

export async function restoreRender(userId: string, renderId: string) {
  const [row] = await db
    .update(renders)
    .set({ archivedAt: null })
    .where(
      and(
        eq(renders.id, renderId),
        eq(renders.userId, userId),
        isNull(renders.deletedAt),
      ),
    )
    .returning();
  return Boolean(row);
}

export async function deleteRenderPermanently(
  userId: string,
  renderId: string,
  deletedBy = userId,
) {
  const detail = await getRenderDetail(userId, renderId);
  if (!detail) return false;

  const now = new Date();
  await Promise.all(
    detail.assets.map((asset) => storage().deleteObject(asset.fileKey)),
  );
  await db
    .update(renderAssets)
    .set({ deletedAt: now })
    .where(and(eq(renderAssets.renderId, renderId), isNull(renderAssets.deletedAt)));
  await db
    .update(renderJobs)
    .set({
      status: "failed",
      failedAt: now,
      errorMessage: "Render dihapus permanen",
      updatedAt: now,
    })
    .where(and(eq(renderJobs.renderId, renderId), eq(renderJobs.status, "queued")));
  await db
    .update(renders)
    .set({ deletedAt: now, deletedBy })
    .where(and(eq(renders.id, renderId), eq(renders.userId, userId)));
  return true;
}
