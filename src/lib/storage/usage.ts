import { and, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  renderAssets,
  renderJobs,
  renders,
  type RenderAssetType,
} from "@/db/schema";
import { storage } from "@/lib/storage";

export const USER_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;

export type StorageUsageCategory = {
  type: RenderAssetType;
  bytes: number;
  count: number;
};

export type UserStorageUsage = {
  usedBytes: number;
  limitBytes: number;
  assetCount: number;
  categories: StorageUsageCategory[];
};

export class StorageQuotaExceededError extends Error {
  readonly code = "STORAGE_QUOTA_EXCEEDED";
  readonly status = 413;

  constructor() {
    super("Penyimpanan kamu sudah mencapai batas 1 GB. Hapus file lama dulu.");
    this.name = "StorageQuotaExceededError";
  }
}

const CATEGORY_ORDER: RenderAssetType[] = [
  "original",
  "reference",
  "result",
  "edit",
  "upscale",
];

function numberFrom(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

export async function getUserStorageUsage(
  userId: string,
): Promise<UserStorageUsage> {
  const rows = await db
    .select({
      type: renderAssets.type,
      bytes: sql<string>`coalesce(sum(${renderAssets.fileSize}), 0)`,
      count: sql<string>`count(*)`,
    })
    .from(renderAssets)
    .where(and(eq(renderAssets.userId, userId), isNull(renderAssets.deletedAt)))
    .groupBy(renderAssets.type);

  const byType = new Map<RenderAssetType, StorageUsageCategory>();
  for (const row of rows) {
    byType.set(row.type, {
      type: row.type,
      bytes: numberFrom(row.bytes),
      count: numberFrom(row.count),
    });
  }

  const categories = CATEGORY_ORDER.map(
    (type) => byType.get(type) ?? { type, bytes: 0, count: 0 },
  );
  const usedBytes = categories.reduce((sum, item) => sum + item.bytes, 0);
  const assetCount = categories.reduce((sum, item) => sum + item.count, 0);

  return {
    usedBytes,
    limitBytes: USER_STORAGE_LIMIT_BYTES,
    assetCount,
    categories,
  };
}

export async function assertUserStorageCapacity(
  userId: string,
  incomingBytes: number,
) {
  const usage = await getUserStorageUsage(userId);
  if (usage.usedBytes + incomingBytes > usage.limitBytes) {
    throw new StorageQuotaExceededError();
  }
}

export async function clearUserRenderStorage(userId: string) {
  const assets = await db.query.renderAssets.findMany({
    where: and(eq(renderAssets.userId, userId), isNull(renderAssets.deletedAt)),
  });
  const renderIds = Array.from(new Set(assets.map((asset) => asset.renderId)));

  await Promise.all(assets.map((asset) => storage().deleteObject(asset.fileKey)));

  const now = new Date();
  if (assets.length > 0) {
    await db
      .update(renderAssets)
      .set({ deletedAt: now })
      .where(and(eq(renderAssets.userId, userId), isNull(renderAssets.deletedAt)));
  }

  if (renderIds.length > 0) {
    await db
      .update(renderJobs)
      .set({
        status: "failed",
        failedAt: now,
        errorMessage: "Storage user dihapus",
        updatedAt: now,
      })
      .where(inArray(renderJobs.renderId, renderIds));

    await db
      .update(renders)
      .set({
        deletedAt: now,
        deletedBy: userId,
        archivedAt: null,
      })
      .where(inArray(renders.id, renderIds));
  }

  return { deletedAssets: assets.length, deletedRenders: renderIds.length };
}
