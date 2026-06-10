import sharp from "sharp";

import { db } from "@/db";
import {
  renderAssets,
  type RenderAssetType,
  type RenderOutputFormat,
} from "@/db/schema";
import { renderAssetKey, storage } from "@/lib/storage";
import type { UploadedFile } from "./types";

const OUTPUT_FORMATS = new Set<RenderOutputFormat>([
  "jpg",
  "png",
  "webp",
  "avif",
  "original",
]);

export function normalizeOutputFormat(
  value: string | null | undefined,
): RenderOutputFormat {
  return value && OUTPUT_FORMATS.has(value as RenderOutputFormat)
    ? (value as RenderOutputFormat)
    : "jpg";
}

async function imageMeta(data: Buffer) {
  const meta = await sharp(data).metadata().catch(() => null);
  return {
    width: meta?.width ?? null,
    height: meta?.height ?? null,
  };
}

export async function storeAsset(params: {
  renderId: string;
  userId: string;
  projectId: string;
  type: RenderAssetType;
  file: UploadedFile;
  index?: number;
}) {
  const key = renderAssetKey({
    userId: params.userId,
    projectId: params.projectId,
    renderId: params.renderId,
    type: params.type,
    ext: params.file.ext,
    index: params.index,
  });
  const stored = await storage().putObject({
    key,
    body: params.file.data,
    contentType: params.file.contentType,
  });
  const [asset] = await db
    .insert(renderAssets)
    .values({
      renderId: params.renderId,
      userId: params.userId,
      projectId: params.projectId,
      type: params.type,
      fileUrl: stored.url,
      fileKey: key,
      fileName: params.file.fileName,
      fileSize: params.file.size,
      mimeType: params.file.contentType,
      width: params.file.width,
      height: params.file.height,
    })
    .returning();
  return asset;
}

export async function storeResultAsset(params: {
  renderId: string;
  userId: string;
  projectId: string;
  data: Buffer;
  contentType: string;
  index: number;
}) {
  const ext = params.contentType.includes("png")
    ? "png"
    : params.contentType.includes("webp")
      ? "webp"
      : params.contentType.includes("avif")
        ? "avif"
        : "jpg";
  const key = renderAssetKey({
    userId: params.userId,
    projectId: params.projectId,
    renderId: params.renderId,
    type: "result",
    ext,
    index: params.index,
  });
  const stored = await storage().putObject({
    key,
    body: params.data,
    contentType: params.contentType,
  });
  const meta = await imageMeta(params.data);
  const [asset] = await db
    .insert(renderAssets)
    .values({
      renderId: params.renderId,
      userId: params.userId,
      projectId: params.projectId,
      type: "result",
      fileUrl: stored.url,
      fileKey: key,
      fileSize: params.data.length,
      mimeType: params.contentType,
      width: meta.width,
      height: meta.height,
    })
    .returning();
  return asset;
}

export async function fetchAssetBytes(fileUrl: string, fileKey: string) {
  if (storage().name === "local") {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    return readFile(join(process.cwd(), "public", "uploads", fileKey));
  }

  const url = await storage().getSignedDownloadUrl(fileKey, 60);
  const res = await fetch(url || fileUrl);
  if (!res.ok) throw new Error("Gagal membaca asset original");
  return Buffer.from(await res.arrayBuffer());
}
