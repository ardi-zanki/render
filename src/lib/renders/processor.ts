import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { renderAssets, renderJobs, renders } from "@/db/schema";
import { getBalance } from "@/lib/credits";
import { notifyUser } from "@/lib/notifications/service";
import { aiProvider } from "@/lib/providers/ai";
import {
  fetchAssetBytes,
  normalizeOutputFormat,
  storeResultAsset,
} from "./assets";
import {
  finalizeFailedRender,
  lockJobByRenderId,
  lockNextJob,
  rescheduleJob,
} from "./jobs";
import {
  LOW_CREDIT_THRESHOLD,
  RENDER_COST,
  type ProviderRequestOptions,
} from "./types";

export async function processRenderJob(
  renderId: string,
  lockedBy = `worker-${process.pid}`,
) {
  const job = await lockJobByRenderId(renderId, lockedBy);
  if (!job) return { processed: false, reason: "job_not_available" as const };
  return processLockedJob(job.id);
}

export async function processNextRenderJob(lockedBy = `worker-${process.pid}`) {
  const job = await lockNextJob(lockedBy);
  if (!job) return { processed: false, reason: "job_not_available" as const };
  return processLockedJob(job.id);
}

async function processLockedJob(jobId: string) {
  const job = await db.query.renderJobs.findFirst({
    where: eq(renderJobs.id, jobId),
  });
  if (!job) return { processed: false, reason: "job_not_found" as const };

  const render = await db.query.renders.findFirst({
    where: eq(renders.id, job.renderId),
  });
  if (!render || render.deletedAt) {
    await db
      .update(renderJobs)
      .set({
        status: "failed",
        failedAt: new Date(),
        errorMessage: "Render tidak ditemukan atau sudah dihapus",
        updatedAt: new Date(),
      })
      .where(eq(renderJobs.id, job.id));
    return { processed: false, reason: "render_not_found" as const };
  }

  try {
    await db
      .update(renders)
      .set({ status: "processing", startedAt: render.startedAt ?? new Date() })
      .where(eq(renders.id, render.id));

    const assets = await db.query.renderAssets.findMany({
      where: and(eq(renderAssets.renderId, render.id), isNull(renderAssets.deletedAt)),
    });
    const original = assets.find((a) => a.type === "original");
    if (!original) throw new Error("Asset original tidak ditemukan");

    const requestOptions =
      render.providerResponse &&
      typeof render.providerResponse === "object" &&
      "requestOptions" in render.providerResponse
        ? ((render.providerResponse as { requestOptions?: ProviderRequestOptions })
            .requestOptions ?? {})
        : {};
    const isInpaint = Boolean(requestOptions.inpaint);
    const reference = isInpaint
      ? requestOptions.referenceAssetId
        ? assets.find((a) => a.id === requestOptions.referenceAssetId)
        : undefined
      : assets.find((a) => a.type === "reference");

    // Iterative edits build on a chosen prior version; otherwise use the original.
    const baseAsset =
      (job.baseAssetId && assets.find((a) => a.id === job.baseAssetId)) ||
      original;
    const baseBytes = await fetchAssetBytes(baseAsset.fileUrl, baseAsset.fileKey);
    const referenceBytes = reference
      ? await fetchAssetBytes(reference.fileUrl, reference.fileKey)
      : undefined;
    // Region/texture edit: locate this edit's mask and run the inpaint path.
    const maskAsset = isInpaint
      ? (requestOptions.maskAssetId &&
          assets.find((a) => a.id === requestOptions.maskAssetId)) ||
        assets.find((a) => a.type === "mask")
      : undefined;
    if (isInpaint && !maskAsset) {
      throw new Error("Mask tidak ditemukan untuk edit tekstur");
    }
    const maskBytes = maskAsset
      ? await fetchAssetBytes(maskAsset.fileUrl, maskAsset.fileKey)
      : undefined;

    const result = await aiProvider().createRender({
      mode: render.mode,
      operation: isInpaint ? "inpaint" : "render",
      imageUrl: baseAsset.fileUrl,
      imageContentType: baseAsset.mimeType ?? undefined,
      imageBuffer: baseBytes,
      maskUrl: maskAsset?.fileUrl,
      maskContentType: maskAsset?.mimeType ?? undefined,
      maskBuffer: maskBytes,
      referenceUrl: reference?.fileUrl,
      referenceContentType: reference?.mimeType ?? undefined,
      referenceBuffer: referenceBytes,
      prompt: render.prompt ?? "",
      outputFormat: normalizeOutputFormat(render.outputFormat),
      negativePrompt: requestOptions.negativePrompt,
      styleTransferStrength: requestOptions.styleTransferStrength,
    });

    if (result.outputs.length === 0) {
      throw new Error("Provider tidak mengembalikan hasil render");
    }

    const currentJob = await db.query.renderJobs.findFirst({
      where: eq(renderJobs.id, job.id),
    });
    const currentRender = await db.query.renders.findFirst({
      where: eq(renders.id, render.id),
    });
    if (
      !currentJob ||
      currentJob.status !== "processing" ||
      currentRender?.status === "cancelled"
    ) {
      return { processed: false, reason: "job_cancelled" as const };
    }

    // An edit (job.editId set) appends a new version; the initial render
    // replaces any partial result from a prior failed attempt.
    const isEdit = Boolean(job.editId);
    const priorVersions = isEdit
      ? assets.filter((a) => a.type === "result" || a.type === "edit").length
      : 0;
    if (!isEdit) {
      await db
        .update(renderAssets)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(renderAssets.renderId, render.id),
            eq(renderAssets.type, "result"),
            isNull(renderAssets.deletedAt),
          ),
        );
    }

    for (let i = 0; i < result.outputs.length; i++) {
      const out = result.outputs[i];
      await storeResultAsset({
        renderId: render.id,
        userId: render.userId,
        projectId: render.projectId,
        data: out.data,
        contentType: out.contentType,
        index: priorVersions + i + 1,
        assetType: isEdit ? "edit" : "result",
        config: render.config,
        prompt: render.prompt,
      });
    }
    const versionCount = priorVersions + result.outputs.length;

    const now = new Date();
    await db
      .update(renders)
      .set({
        status: "success",
        completedAt: now,
        failedAt: null,
        creditsUsed: versionCount * RENDER_COST,
        providerRequestId: result.providerRequestId,
        providerResponse: {
          requestOptions,
          response: result.raw,
        },
        errorCode: null,
        errorMessage: null,
      })
      .where(eq(renders.id, render.id));

    await db
      .update(renderJobs)
      .set({
        status: "success",
        completedAt: now,
        lockedAt: null,
        lockedBy: null,
        errorMessage: null,
        updatedAt: now,
      })
      .where(eq(renderJobs.id, job.id));

    // Post-success side effects are non-critical: never let them throw back
    // into the catch below (which would reschedule an already-succeeded job and
    // duplicate the stored version).
    try {
      // In-app only (PRD email scope: render events do not email).
      await notifyUser({
        userId: render.userId,
        type: "render_success",
        title: "Render kamu sudah jadi",
        message: `Render ${render.mode} berhasil diproses.`,
        actionUrl: `/renders/${render.id}`,
      });

      const balance = await getBalance(render.userId);
      if (balance <= LOW_CREDIT_THRESHOLD) {
        // In-app only (PRD email scope: low-credit alerts do not email).
        await notifyUser({
          userId: render.userId,
          type: "low_credit",
          title: "Kredit kamu menipis",
          message: `Sisa kredit kamu tinggal ${balance}. Yuk top up.`,
          actionUrl: "/payments",
        });
      }
    } catch (sideEffectErr) {
      console.warn("processRenderJob: post-success side effect failed", sideEffectErr);
    }

    return { processed: true, renderId: render.id, status: "success" as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "RENDER_FAILED";
    const finalAttempt = job.attempts >= job.maxAttempts;

    if (finalAttempt) {
      await finalizeFailedRender({
        renderId: render.id,
        userId: render.userId,
        jobId: job.id,
        editId: job.editId,
        message,
        code,
      });
      return { processed: true, renderId: render.id, status: "failed" as const };
    }

    await rescheduleJob({
      jobId: job.id,
      renderId: render.id,
      message,
      attempt: job.attempts,
    });
    return { processed: true, renderId: render.id, status: "retrying" as const };
  }
}
