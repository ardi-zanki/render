import { randomBytes } from "node:crypto";

import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { renderAssets, renders, user, type RenderMode } from "@/db/schema";
import { env } from "@/env";
import { browserAssetUrl } from "@/lib/storage";
import { getLatestRenderableAsset } from "./types";

function genSlug() {
  return randomBytes(8).toString("base64url");
}

export interface ShareResult {
  slug: string;
  url: string;
}

/** Make a successful render publicly shareable; idempotent (reuses any slug). */
export async function enableShare(
  userId: string,
  renderId: string,
): Promise<ShareResult | null> {
  const r = await db.query.renders.findFirst({
    where: and(
      eq(renders.id, renderId),
      eq(renders.userId, userId),
      isNull(renders.deletedAt),
    ),
  });
  if (!r || r.status !== "success") return null;

  let slug = r.shareSlug;
  if (!slug) {
    slug = genSlug();
    await db.update(renders).set({ shareSlug: slug }).where(eq(renders.id, r.id));
  }
  return { slug, url: `${env.APP_URL.replace(/\/$/, "")}/s/${slug}` };
}

export interface PublicRender {
  mode: RenderMode;
  resultUrl: string;
  createdAt: Date;
  creatorName: string;
}

/** Fetch a public render by share slug (only successful, non-deleted). */
export async function getPublicRender(
  slug: string,
): Promise<PublicRender | null> {
  const r = await db.query.renders.findFirst({
    where: and(eq(renders.shareSlug, slug), isNull(renders.deletedAt)),
  });
  if (!r || r.status !== "success") return null;

  const assets = await db.query.renderAssets.findMany({
    where: and(
      eq(renderAssets.renderId, r.id),
      inArray(renderAssets.type, ["result", "edit"]),
      isNull(renderAssets.deletedAt),
    ),
    orderBy: asc(renderAssets.createdAt),
  });
  const asset = getLatestRenderableAsset(assets);
  if (!asset) return null;

  const owner = await db.query.user.findFirst({
    where: eq(user.id, r.userId),
    columns: { name: true },
  });

  // The composed prompt is internal/secret — never expose it to the public
  // Share page (principle of least privilege: return only what the UI needs).
  return {
    mode: r.mode,
    resultUrl: browserAssetUrl(asset.fileUrl, asset.fileKey),
    createdAt: r.createdAt,
    creatorName: owner?.name ?? "Render Studio user",
  };
}
