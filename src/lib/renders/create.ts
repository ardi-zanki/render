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
import { assertUserStorageCapacity } from "@/lib/storage/usage";
import { storeAsset } from "./assets";
import { renderDisplayName } from "./labels";
import {
  RENDER_COST,
  type CreateRenderParams,
  type CreateRenderResult,
  type ProviderRequestOptions,
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
      originalUrl: original.fileUrl,
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
      originalUrl: original.fileUrl,
      balance: deduction.balance,
    };
  } catch (err) {
    // Roll back: keep the prior successful version and refund the reservation.
    await db
      .update(renders)
      .set({ status: "success" })
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
