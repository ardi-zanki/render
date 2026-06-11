import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { projects, renderAssets, renderJobs, renders } from "@/db/schema";
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
    const reference = assets.find((a) => a.type === "reference");
    if (!original) throw new Error("Asset original tidak ditemukan");

    const originalBytes = await fetchAssetBytes(original.fileUrl, original.fileKey);
    const referenceBytes = reference
      ? await fetchAssetBytes(reference.fileUrl, reference.fileKey)
      : undefined;
    const requestOptions =
      render.providerResponse &&
      typeof render.providerResponse === "object" &&
      "requestOptions" in render.providerResponse
        ? ((render.providerResponse as { requestOptions?: ProviderRequestOptions })
            .requestOptions ?? {})
        : {};
    const result = await aiProvider().createRender({
      mode: render.mode,
      imageUrl: original.fileUrl,
      imageContentType: original.mimeType ?? undefined,
      imageBuffer: originalBytes,
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

    let firstResultUrl = "";
    for (let i = 0; i < result.outputs.length; i++) {
      const out = result.outputs[i];
      const asset = await storeResultAsset({
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
      if (i === 0) firstResultUrl = asset.fileUrl;
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
      await db
        .update(projects)
        .set({ coverImageUrl: firstResultUrl, updatedAt: now })
        .where(
          and(eq(projects.id, render.projectId), isNull(projects.coverImageUrl)),
        );

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
