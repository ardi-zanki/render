import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  projects,
  renderAssets,
  renders,
  type RenderMode,
} from "@/db/schema";
import { env } from "@/env";
import {
  applyCreditChange,
  getBalance,
  InsufficientCreditsError,
} from "@/lib/credits";
import { aiProvider } from "@/lib/providers/ai";
import { renderAssetKey, storage } from "@/lib/storage";

export const RENDER_COST = 1;

export interface UploadedFile {
  data: Buffer;
  contentType: string;
  ext: string;
  fileName?: string;
}

export interface CreateRenderParams {
  userId: string;
  projectId: string;
  mode: RenderMode;
  prompt: string;
  outputFormat?: "jpg" | "png";
  original: UploadedFile;
  reference?: UploadedFile;
}

export interface CreateRenderResult {
  renderId: string;
  status: "success";
  resultUrl: string;
  originalUrl: string;
}

/**
 * Full render pipeline (PRD §18): check balance → create row → deduct credit
 * (idempotent) → store original → call AI provider → persist result → mark
 * success. On any failure the render is marked failed and the credit refunded.
 */
export async function createRender(
  params: CreateRenderParams,
): Promise<CreateRenderResult> {
  const { userId, projectId, mode } = params;
  const outputFormat = params.outputFormat ?? "jpg";

  if ((await getBalance(userId)) < RENDER_COST) {
    throw new InsufficientCreditsError();
  }

  const [render] = await db
    .insert(renders)
    .values({
      userId,
      projectId,
      mode,
      prompt: params.prompt,
      outputFormat,
      status: "queued",
      aiProvider: env.AI_PROVIDER,
    })
    .returning();

  await applyCreditChange({
    userId,
    type: "usage",
    amount: -RENDER_COST,
    description: `Render ${mode}`,
    renderId: render.id,
    idempotencyKey: `render-usage:${render.id}`,
  });

  try {
    await db
      .update(renders)
      .set({ status: "processing", startedAt: new Date() })
      .where(eq(renders.id, render.id));

    // Store original.
    const originalKey = renderAssetKey({
      userId,
      projectId,
      renderId: render.id,
      type: "original",
      ext: params.original.ext,
    });
    const original = await storage().putObject({
      key: originalKey,
      body: params.original.data,
      contentType: params.original.contentType,
    });
    await db.insert(renderAssets).values({
      renderId: render.id,
      userId,
      projectId,
      type: "original",
      fileUrl: original.url,
      fileKey: originalKey,
      fileName: params.original.fileName,
      fileSize: params.original.data.length,
      mimeType: params.original.contentType,
    });

    // Optional reference image (style transfer).
    let referenceUrl: string | undefined;
    if (params.reference) {
      const refKey = renderAssetKey({
        userId,
        projectId,
        renderId: render.id,
        type: "reference",
        ext: params.reference.ext,
      });
      const ref = await storage().putObject({
        key: refKey,
        body: params.reference.data,
        contentType: params.reference.contentType,
      });
      referenceUrl = ref.url;
      await db.insert(renderAssets).values({
        renderId: render.id,
        userId,
        projectId,
        type: "reference",
        fileUrl: ref.url,
        fileKey: refKey,
        fileSize: params.reference.data.length,
        mimeType: params.reference.contentType,
      });
    }

    // Call the AI provider.
    const result = await aiProvider().createRender({
      mode,
      imageUrl: original.url,
      imageBuffer: params.original.data,
      referenceUrl,
      prompt: params.prompt,
      outputFormat,
    });

    if (result.outputs.length === 0) {
      throw new Error("Provider tidak mengembalikan hasil render");
    }

    // Persist outputs.
    let firstResultUrl = "";
    for (let i = 0; i < result.outputs.length; i++) {
      const out = result.outputs[i];
      const ext = out.contentType.includes("png") ? "png" : "jpg";
      const key = renderAssetKey({
        userId,
        projectId,
        renderId: render.id,
        type: "result",
        ext,
        index: i + 1,
      });
      const stored = await storage().putObject({
        key,
        body: out.data,
        contentType: out.contentType,
      });
      await db.insert(renderAssets).values({
        renderId: render.id,
        userId,
        projectId,
        type: "result",
        fileUrl: stored.url,
        fileKey: key,
        fileSize: out.data.length,
        mimeType: out.contentType,
      });
      if (i === 0) firstResultUrl = stored.url;
    }

    await db
      .update(renders)
      .set({
        status: "success",
        completedAt: new Date(),
        creditsUsed: RENDER_COST,
        providerRequestId: result.providerRequestId,
        providerResponse: result.raw as Record<string, unknown>,
      })
      .where(eq(renders.id, render.id));

    // Use the first result as the project cover if none set yet.
    await db
      .update(projects)
      .set({ coverImageUrl: firstResultUrl, updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), isNull(projects.coverImageUrl)));

    return {
      renderId: render.id,
      status: "success",
      resultUrl: firstResultUrl,
      originalUrl: original.url,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "RENDER_FAILED";

    await db
      .update(renders)
      .set({
        status: "failed",
        failedAt: new Date(),
        errorMessage: message,
        errorCode: code,
      })
      .where(eq(renders.id, render.id));

    // Refund the deducted credit (idempotent).
    await applyCreditChange({
      userId,
      type: "refund",
      amount: RENDER_COST,
      description: "Refund render gagal",
      renderId: render.id,
      idempotencyKey: `render-refund:${render.id}`,
    });

    throw err;
  }
}

export interface RenderListItem {
  id: string;
  mode: RenderMode;
  status: string;
  prompt: string | null;
  createdAt: Date;
  resultUrl: string | null;
  originalUrl: string | null;
}

/** List a user's renders (optionally by project) with thumbnail URLs. */
export async function listRenders(
  userId: string,
  opts: { projectId?: string; limit?: number } = {},
): Promise<RenderListItem[]> {
  const rows = await db.query.renders.findMany({
    where: and(
      eq(renders.userId, userId),
      isNull(renders.deletedAt),
      opts.projectId ? eq(renders.projectId, opts.projectId) : undefined,
    ),
    orderBy: desc(renders.createdAt),
    limit: opts.limit ?? 50,
  });

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const assets = await db.query.renderAssets.findMany({
    where: and(
      inArray(renderAssets.renderId, ids),
      isNull(renderAssets.deletedAt),
    ),
  });

  const resultByRender = new Map<string, string>();
  const originalByRender = new Map<string, string>();
  for (const a of assets) {
    if (a.type === "result" && !resultByRender.has(a.renderId)) {
      resultByRender.set(a.renderId, a.fileUrl);
    }
    if (a.type === "original" && !originalByRender.has(a.renderId)) {
      originalByRender.set(a.renderId, a.fileUrl);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    mode: r.mode,
    status: r.status,
    prompt: r.prompt,
    createdAt: r.createdAt,
    resultUrl: resultByRender.get(r.id) ?? null,
    originalUrl: originalByRender.get(r.id) ?? null,
  }));
}
