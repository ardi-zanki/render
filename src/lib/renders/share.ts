import { randomBytes } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { renderAssets, renders, type RenderMode } from "@/db/schema";
import { env } from "@/env";

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
  prompt: string | null;
  resultUrl: string;
  createdAt: Date;
}

/** Fetch a public render by share slug (only successful, non-deleted). */
export async function getPublicRender(
  slug: string,
): Promise<PublicRender | null> {
  const r = await db.query.renders.findFirst({
    where: and(eq(renders.shareSlug, slug), isNull(renders.deletedAt)),
  });
  if (!r || r.status !== "success") return null;

  const asset = await db.query.renderAssets.findFirst({
    where: and(
      eq(renderAssets.renderId, r.id),
      eq(renderAssets.type, "result"),
      isNull(renderAssets.deletedAt),
    ),
  });
  if (!asset) return null;

  return {
    mode: r.mode,
    prompt: r.prompt,
    resultUrl: asset.fileUrl,
    createdAt: r.createdAt,
  };
}
