import { eq } from "drizzle-orm";

import { db } from "@/db";
import { renderJobs, renders } from "@/db/schema";
import { env } from "@/env";
import {
  applyCreditChange,
  getBalance,
  InsufficientCreditsError,
} from "@/lib/credits";
import { assertUserStorageCapacity } from "@/lib/storage/usage";
import { storeAsset } from "./assets";
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
