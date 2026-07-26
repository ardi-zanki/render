import { randomUUID } from "node:crypto";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { renderAssets, renderJobs, renders, type RenderConfig } from "@/db/schema";
import { env } from "@/env";
import {
  applyCreditChange,
  getBalance,
  InsufficientCreditsError,
} from "@/lib/credits";
import { browserAssetUrl } from "@/lib/storage";
import { assertUserStorageCapacity } from "@/lib/storage/usage";
import { storeAsset } from "./assets";
import { renderDisplayName } from "./labels";
import {
  RENDER_COST,
  type CreateRenderParams,
  type CreateRenderResult,
  type ProviderRequestOptions,
  type UploadedFile,
} from "./types";

/**
 * Enqueue a render request. The HTTP request only validates, stores uploaded
 * assets, reserves credit, and creates a DB-backed job. Provider execution is
 * handled by `processRenderJob` / worker code.
 */
export async function createRender(
  params: CreateRenderParams,
): Promise<CreateRenderResult> {
  const { userId, projectId, mode } = params;
  const outputFormat = params.outputFormat ?? "jpg";
  const providerRequestOptions: ProviderRequestOptions = {};
  if (params.negativePrompt) {
    providerRequestOptions.negativePrompt = params.negativePrompt;
  }
  if (typeof params.styleTransferStrength === "number") {
    providerRequestOptions.styleTransferStrength = params.styleTransferStrength;
  }
  const hasProviderRequestOptions =
    Object.keys(providerRequestOptions).length > 0;

  if (mode === "style_transfer" && !params.reference) {
    throw new Error("Reference image wajib diunggah untuk Style Transfer");
  }

  await assertUserStorageCapacity(
    userId,
    params.original.size + (params.reference?.size ?? 0),
  );

  if ((await getBalance(userId)) < RENDER_COST) {
    throw new InsufficientCreditsError();
  }

  const [render] = await db
    .insert(renders)
    .values({
      userId,
      projectId,
      mode,
      name: params.name?.trim() || renderDisplayName(mode),
      prompt: params.prompt,
      config: params.config ?? null,
      outputFormat,
      status: "queued",
      aiProvider: env.AI_PROVIDER,
      providerResponse: hasProviderRequestOptions
        ? { requestOptions: providerRequestOptions }
        : null,
    })
    .returning();

  let balanceAfterDeduction = 0;
  let creditDeducted = false;
  try {
    const deduction = await applyCreditChange({
      userId,
      type: "usage",
      amount: -RENDER_COST,
      description: `Render ${mode}`,
      renderId: render.id,
      idempotencyKey: `render-usage:${render.id}`,
    });
    balanceAfterDeduction = deduction.balance;
    creditDeducted = deduction.applied;

    const original = await storeAsset({
      renderId: render.id,
      userId,
      projectId,
      type: "original",
      file: params.original,
    });

    if (params.reference) {
      await storeAsset({
        renderId: render.id,
        userId,
        projectId,
        type: "reference",
        file: params.reference,
      });
    }

    await db.insert(renderJobs).values({
      renderId: render.id,
      userId,
      status: "queued",
      attempts: 0,
      maxAttempts: 3,
      availableAt: new Date(),
    });

    return {
      renderId: render.id,
      status: "queued",
      originalUrl: await browserAssetUrl(original.fileUrl, original.fileKey),
      balance: balanceAfterDeduction,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(renders)
      .set({
        status: "failed",
        failedAt: new Date(),
        errorCode: "ENQUEUE_FAILED",
        errorMessage: message,
      })
      .where(eq(renders.id, render.id));
    if (creditDeducted) {
      await applyCreditChange({
        userId,
        type: "refund",
        amount: RENDER_COST,
        description: "Refund render gagal dibuat",
        renderId: render.id,
        idempotencyKey: `render-refund:${render.id}`,
      });
    }
    throw err;
  }
}

export interface CreateRenderEditParams {
  userId: string;
  renderId: string;
  config?: RenderConfig;
  prompt: string;
  /** Version (render_assets.id) to edit from. Defaults to the latest version. */
  baseAssetId?: string;
}

/**
 * Re-render ("edit") an existing render in place: produce a NEW version on the
 * SAME render row (no new record), reserving 1 credit. The original image and
 * prior versions are kept; the processor appends an `edit` asset. Refunds the
 * reserved credit if enqueue or processing ultimately fails.
 */
export async function createRenderEdit(
  params: CreateRenderEditParams,
): Promise<CreateRenderResult> {
  const { userId, renderId } = params;

  const render = await db.query.renders.findFirst({
    where: and(
      eq(renders.id, renderId),
      eq(renders.userId, userId),
      isNull(renders.deletedAt),
    ),
  });
  if (!render) throw new Error("Render tidak ditemukan");
  if (render.status !== "success") {
    throw new Error("Render harus selesai sebelum bisa diedit ulang");
  }

  const original = await db.query.renderAssets.findFirst({
    where: and(
      eq(renderAssets.renderId, renderId),
      eq(renderAssets.type, "original"),
      isNull(renderAssets.deletedAt),
    ),
  });
  if (!original) throw new Error("Gambar asli tidak ditemukan");

  // Iterative base: edit from the chosen version, or the latest one by default.
  let baseAssetId = params.baseAssetId;
  if (baseAssetId) {
    const baseAsset = await db.query.renderAssets.findFirst({
      where: and(
        eq(renderAssets.id, baseAssetId),
        eq(renderAssets.renderId, renderId),
        isNull(renderAssets.deletedAt),
      ),
    });
    if (!baseAsset) throw new Error("Versi dasar tidak ditemukan");
  } else {
    const latest = await db.query.renderAssets.findFirst({
      where: and(
        eq(renderAssets.renderId, renderId),
        inArray(renderAssets.type, ["result", "edit"]),
        isNull(renderAssets.deletedAt),
      ),
      orderBy: desc(renderAssets.createdAt),
    });
    baseAssetId = latest?.id ?? original.id;
  }

  if ((await getBalance(userId)) < RENDER_COST) {
    throw new InsufficientCreditsError();
  }

  // Per-generation key so each edit charges/refunds independently.
  const editId = randomUUID();
  const deduction = await applyCreditChange({
    userId,
    type: "usage",
    amount: -RENDER_COST,
    description: `Edit render ${render.mode}`,
    renderId,
    idempotencyKey: `render-usage:${editId}`,
  });

  try {
    await db
      .update(renders)
      .set({
        config: params.config ?? null,
        prompt: params.prompt,
        status: "queued",
        seenAt: null,
        errorCode: null,
        errorMessage: null,
      })
      .where(eq(renders.id, renderId));

    await db.insert(renderJobs).values({
      renderId,
      userId,
      editId,
      baseAssetId,
      status: "queued",
      attempts: 0,
      maxAttempts: 3,
      availableAt: new Date(),
    });

    return {
      renderId,
      status: "queued",
      originalUrl: await browserAssetUrl(original.fileUrl, original.fileKey),
      balance: deduction.balance,
    };
  } catch (err) {
    // Roll back: keep the prior successful version and refund the reservation.
    await db
      .update(renders)
      .set({ status: "success", seenAt: render.seenAt })
      .where(eq(renders.id, renderId));
    if (deduction.applied) {
      await applyCreditChange({
        userId,
        type: "refund",
        amount: RENDER_COST,
        description: "Refund edit gagal dibuat",
        renderId,
        idempotencyKey: `render-refund:${editId}`,
      });
    }
    throw err;
  }
}

export interface CreateRenderTextureEditParams {
  userId: string;
  renderId: string;
  /** Validated PNG mask (white = region to replace). */
  mask: UploadedFile;
  /** Optional uploaded texture reference image. */
  texture?: UploadedFile;
  /** Composed inpaint prompt (already built by the route). */
  texturePrompt: string;
  /** Human-readable texture name for the "Edit Texture" marker. */
  textureLabel: string;
  /** Version (render_assets.id) to edit from. Defaults to the latest version. */
  baseAssetId?: string;
}

/**
 * Region/texture edit: inpaint a masked area of an existing successful render,
 * producing a NEW version (an `edit` asset) on the SAME render and reserving 1
 * credit. The mask is stored as a `mask` asset and the inpaint parameters ride
 * on `providerResponse.requestOptions` for the processor. Refunds on failure.
 */
export async function createRenderTextureEdit(
  params: CreateRenderTextureEditParams,
): Promise<CreateRenderResult> {
  const { userId, renderId } = params;

  const render = await db.query.renders.findFirst({
    where: and(
      eq(renders.id, renderId),
      eq(renders.userId, userId),
      isNull(renders.deletedAt),
    ),
  });
  if (!render) throw new Error("Render tidak ditemukan");
  if (render.status !== "success") {
    throw new Error("Render harus selesai sebelum tekstur bisa diedit");
  }

  const original = await db.query.renderAssets.findFirst({
    where: and(
      eq(renderAssets.renderId, renderId),
      eq(renderAssets.type, "original"),
      isNull(renderAssets.deletedAt),
    ),
  });
  if (!original) throw new Error("Gambar asli tidak ditemukan");

  // Inpaint builds on the chosen version, or the latest one by default.
  let baseAssetId = params.baseAssetId;
  if (baseAssetId) {
    const baseAsset = await db.query.renderAssets.findFirst({
      where: and(
        eq(renderAssets.id, baseAssetId),
        eq(renderAssets.renderId, renderId),
        isNull(renderAssets.deletedAt),
      ),
    });
    if (!baseAsset) throw new Error("Versi dasar tidak ditemukan");
  } else {
    const latest = await db.query.renderAssets.findFirst({
      where: and(
        eq(renderAssets.renderId, renderId),
        inArray(renderAssets.type, ["result", "edit"]),
        isNull(renderAssets.deletedAt),
      ),
      orderBy: desc(renderAssets.createdAt),
    });
    baseAssetId = latest?.id ?? original.id;
  }

  if ((await getBalance(userId)) < RENDER_COST) {
    throw new InsufficientCreditsError();
  }

  const editId = randomUUID();
  const deduction = await applyCreditChange({
    userId,
    type: "usage",
    amount: -RENDER_COST,
    description: `Edit tekstur render ${render.mode}`,
    renderId,
    idempotencyKey: `render-usage:${editId}`,
  });

  try {
    const maskAsset = await storeAsset({
      renderId,
      userId,
      projectId: render.projectId,
      type: "mask",
      file: params.mask,
    });
    const textureAsset = params.texture
      ? await storeAsset({
          renderId,
          userId,
          projectId: render.projectId,
          type: "reference",
          file: params.texture,
        })
      : null;

    // The result asset inherits this config, marking the version as a texture
    // edit (read by the studio's render info + version history).
    const textureConfig: RenderConfig = {
      editKind: "texture",
      textureLabel: params.textureLabel,
      texturePrompt: params.texturePrompt,
    };
    const requestOptions: ProviderRequestOptions = {
      inpaint: true,
      maskAssetId: maskAsset.id,
      referenceAssetId: textureAsset?.id,
      texturePrompt: params.texturePrompt,
      textureLabel: params.textureLabel,
    };

    await db
      .update(renders)
      .set({
        config: textureConfig,
        prompt: params.texturePrompt,
        status: "queued",
        seenAt: null,
        errorCode: null,
        errorMessage: null,
        providerResponse: { requestOptions },
      })
      .where(eq(renders.id, renderId));

    await db.insert(renderJobs).values({
      renderId,
      userId,
      editId,
      baseAssetId,
      status: "queued",
      attempts: 0,
      maxAttempts: 3,
      availableAt: new Date(),
    });

    return {
      renderId,
      status: "queued",
      originalUrl: await browserAssetUrl(original.fileUrl, original.fileKey),
      balance: deduction.balance,
    };
  } catch (err) {
    await db
      .update(renders)
      .set({ status: "success", seenAt: render.seenAt })
      .where(eq(renders.id, renderId));
    if (deduction.applied) {
      await applyCreditChange({
        userId,
        type: "refund",
        amount: RENDER_COST,
        description: "Refund edit tekstur gagal dibuat",
        renderId,
        idempotencyKey: `render-refund:${editId}`,
      });
    }
    throw err;
  }
}
