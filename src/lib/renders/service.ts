import sharp from "sharp";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lte,
} from "drizzle-orm";

import { db } from "@/db";
import {
  projects,
  renderAssets,
  renderJobs,
  renders,
  type RenderAssetType,
  type RenderMode,
  type RenderOutputFormat,
  type RenderStatus,
} from "@/db/schema";
import { env } from "@/env";
import {
  applyCreditChange,
  getBalance,
  InsufficientCreditsError,
} from "@/lib/credits";
import { renderResultEmail } from "@/lib/email";
import { createNotification, notifyUser } from "@/lib/notifications/service";
import { aiProvider } from "@/lib/providers/ai";
import { renderAssetKey, storage } from "@/lib/storage";
import type { ValidatedImageUpload } from "@/lib/uploads/images";

export const RENDER_COST = 1;
const LOW_CREDIT_THRESHOLD = 3;

export type UploadedFile = ValidatedImageUpload;

export interface CreateRenderParams {
  userId: string;
  projectId: string;
  mode: RenderMode;
  prompt: string;
  outputFormat?: RenderOutputFormat;
  negativePrompt?: string;
  styleTransferStrength?: number;
  original: UploadedFile;
  reference?: UploadedFile;
}

export interface CreateRenderResult {
  renderId: string;
  status: "queued";
  originalUrl: string;
  balance: number;
}

export interface RenderAssetView {
  id: string;
  type: RenderAssetType;
  fileUrl: string;
  fileKey: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
}

export interface RenderDetail {
  id: string;
  mode: RenderMode;
  status: RenderStatus;
  prompt: string | null;
  outputFormat: string;
  creditsUsed: number;
  projectId: string;
  projectName: string;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  archivedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  resultUrl: string | null;
  originalUrl: string | null;
  referenceUrl: string | null;
  assets: RenderAssetView[];
}

export interface RenderListItem {
  id: string;
  mode: RenderMode;
  status: RenderStatus;
  prompt: string | null;
  createdAt: Date;
  projectId: string;
  projectName: string | null;
  creditsUsed: number;
  resultUrl: string | null;
  originalUrl: string | null;
}

type ProviderRequestOptions = {
  negativePrompt?: string;
  styleTransferStrength?: number;
};

const OUTPUT_FORMATS = new Set<RenderOutputFormat>([
  "jpg",
  "png",
  "webp",
  "avif",
]);

function normalizeOutputFormat(value: string | null | undefined): RenderOutputFormat {
  return value && OUTPUT_FORMATS.has(value as RenderOutputFormat)
    ? (value as RenderOutputFormat)
    : "jpg";
}

function isFinal(status: string) {
  return ["success", "failed", "cancelled", "refunded"].includes(status);
}

async function imageMeta(data: Buffer) {
  const meta = await sharp(data).metadata().catch(() => null);
  return {
    width: meta?.width ?? null,
    height: meta?.height ?? null,
  };
}

async function storeAsset(params: {
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

async function storeResultAsset(params: {
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
      providerResponse: hasProviderRequestOptions
        ? { requestOptions: providerRequestOptions }
        : null,
    })
    .returning();

  let balanceAfterDeduction = 0;
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
    await applyCreditChange({
      userId,
      type: "refund",
      amount: RENDER_COST,
      description: "Refund render gagal dibuat",
      renderId: render.id,
      idempotencyKey: `render-refund:${render.id}`,
    });
    throw err;
  }
}

async function lockJobByRenderId(renderId: string, lockedBy: string) {
  return db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(renderJobs)
      .where(and(eq(renderJobs.renderId, renderId), eq(renderJobs.status, "queued")))
      .for("update");

    if (!job) return null;

    const now = new Date();
    const [locked] = await tx
      .update(renderJobs)
      .set({
        status: "processing",
        attempts: job.attempts + 1,
        lockedAt: now,
        lockedBy,
        startedAt: job.startedAt ?? now,
        updatedAt: now,
      })
      .where(eq(renderJobs.id, job.id))
      .returning();
    return locked;
  });
}

async function lockNextJob(lockedBy: string) {
  const now = new Date();
  return db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(renderJobs)
      .where(and(eq(renderJobs.status, "queued"), lte(renderJobs.availableAt, now)))
      .orderBy(asc(renderJobs.availableAt))
      .limit(1)
      .for("update");

    if (!job) return null;

    const [locked] = await tx
      .update(renderJobs)
      .set({
        status: "processing",
        attempts: job.attempts + 1,
        lockedAt: now,
        lockedBy,
        startedAt: job.startedAt ?? now,
        updatedAt: now,
      })
      .where(eq(renderJobs.id, job.id))
      .returning();
    return locked;
  });
}

async function finalizeFailedRender(params: {
  renderId: string;
  userId: string;
  jobId: string;
  message: string;
  code: string;
}) {
  const now = new Date();
  await db
    .update(renderJobs)
    .set({
      status: "failed",
      failedAt: now,
      completedAt: null,
      errorMessage: params.message,
      updatedAt: now,
    })
    .where(eq(renderJobs.id, params.jobId));

  await db
    .update(renders)
    .set({
      status: "failed",
      failedAt: now,
      errorMessage: params.message,
      errorCode: params.code,
    })
    .where(eq(renders.id, params.renderId));

  await applyCreditChange({
    userId: params.userId,
    type: "refund",
    amount: RENDER_COST,
    description: "Refund render gagal",
    renderId: params.renderId,
    idempotencyKey: `render-refund:${params.renderId}`,
  });

  await notifyUser({
    userId: params.userId,
    type: "render_failed",
    title: "Render gagal diproses",
    message: "Kredit kamu sudah dikembalikan. Silakan coba lagi.",
    actionUrl: "/renders/new",
    email: renderResultEmail({
      success: false,
      url: `${env.APP_URL.replace(/\/$/, "")}/renders/new`,
    }),
  });
}

async function rescheduleJob(params: {
  jobId: string;
  renderId: string;
  message: string;
  attempt: number;
}) {
  const now = new Date();
  const delayMs = Math.min(30_000, params.attempt * 5_000);
  await db
    .update(renderJobs)
    .set({
      status: "queued",
      lockedAt: null,
      lockedBy: null,
      availableAt: new Date(now.getTime() + delayMs),
      errorMessage: params.message,
      updatedAt: now,
    })
    .where(eq(renderJobs.id, params.jobId));

  await db
    .update(renders)
    .set({
      status: "queued",
      errorMessage: params.message,
      errorCode: "RETRYING",
    })
    .where(eq(renders.id, params.renderId));
}

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
      imageBuffer: originalBytes,
      referenceUrl: reference?.fileUrl,
      prompt: render.prompt ?? "",
      outputFormat: normalizeOutputFormat(render.outputFormat),
      negativePrompt: requestOptions.negativePrompt,
      styleTransferStrength: requestOptions.styleTransferStrength,
    });

    if (result.outputs.length === 0) {
      throw new Error("Provider tidak mengembalikan hasil render");
    }

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

    let firstResultUrl = "";
    for (let i = 0; i < result.outputs.length; i++) {
      const out = result.outputs[i];
      const asset = await storeResultAsset({
        renderId: render.id,
        userId: render.userId,
        projectId: render.projectId,
        data: out.data,
        contentType: out.contentType,
        index: i + 1,
      });
      if (i === 0) firstResultUrl = asset.fileUrl;
    }

    const now = new Date();
    await db
      .update(renders)
      .set({
        status: "success",
        completedAt: now,
        failedAt: null,
        creditsUsed: RENDER_COST,
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

    await db
      .update(projects)
      .set({ coverImageUrl: firstResultUrl, updatedAt: now })
      .where(and(eq(projects.id, render.projectId), isNull(projects.coverImageUrl)));

    await notifyUser({
      userId: render.userId,
      type: "render_success",
      title: "Render kamu sudah jadi",
      message: `Render ${render.mode} berhasil diproses.`,
      actionUrl: `/renders/${render.id}`,
      email: renderResultEmail({
        success: true,
        url: `${env.APP_URL.replace(/\/$/, "")}/renders/${render.id}`,
      }),
    });

    const balance = await getBalance(render.userId);
    if (balance <= LOW_CREDIT_THRESHOLD) {
      await createNotification({
        userId: render.userId,
        type: "low_credit",
        title: "Kredit kamu menipis",
        message: `Sisa kredit kamu tinggal ${balance}. Yuk top up.`,
        actionUrl: "/payments",
      });
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

async function fetchAssetBytes(fileUrl: string, fileKey: string) {
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

export async function getRenderDetail(
  userId: string,
  renderId: string,
): Promise<RenderDetail | null> {
  const render = await db.query.renders.findFirst({
    where: and(
      eq(renders.id, renderId),
      eq(renders.userId, userId),
      isNull(renders.deletedAt),
    ),
  });
  if (!render) return null;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, render.projectId),
  });
  const assets = await db.query.renderAssets.findMany({
    where: and(eq(renderAssets.renderId, render.id), isNull(renderAssets.deletedAt)),
    orderBy: asc(renderAssets.createdAt),
  });

  const views = assets.map((a) => ({
    id: a.id,
    type: a.type,
    fileUrl: a.fileUrl,
    fileKey: a.fileKey,
    fileName: a.fileName,
    fileSize: a.fileSize,
    mimeType: a.mimeType,
    width: a.width,
    height: a.height,
  }));

  return {
    id: render.id,
    mode: render.mode,
    status: render.status,
    prompt: render.prompt,
    outputFormat: render.outputFormat,
    creditsUsed: render.creditsUsed,
    projectId: render.projectId,
    projectName: project?.name ?? "Project",
    createdAt: render.createdAt,
    startedAt: render.startedAt,
    completedAt: render.completedAt,
    failedAt: render.failedAt,
    archivedAt: render.archivedAt,
    errorCode: render.errorCode,
    errorMessage: render.errorMessage,
    resultUrl: views.find((a) => a.type === "result")?.fileUrl ?? null,
    originalUrl: views.find((a) => a.type === "original")?.fileUrl ?? null,
    referenceUrl: views.find((a) => a.type === "reference")?.fileUrl ?? null,
    assets: views,
  };
}

/** List a user's renders (optionally by project) with thumbnail URLs. */
export async function listRenders(
  userId: string,
  opts: {
    projectId?: string;
    limit?: number;
    offset?: number;
    archived?: boolean;
    status?: RenderStatus;
  } = {},
): Promise<RenderListItem[]> {
  const rows = await db.query.renders.findMany({
    where: and(
      eq(renders.userId, userId),
      isNull(renders.deletedAt),
      opts.projectId ? eq(renders.projectId, opts.projectId) : undefined,
      opts.archived ? isNotNull(renders.archivedAt) : isNull(renders.archivedAt),
      opts.status ? eq(renders.status, opts.status) : undefined,
    ),
    orderBy: desc(renders.createdAt),
    limit: opts.limit ?? 50,
    offset: opts.offset,
  });

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const projectIds = Array.from(new Set(rows.map((r) => r.projectId)));
  const [assets, projectRows] = await Promise.all([
    db.query.renderAssets.findMany({
      where: and(
        inArray(renderAssets.renderId, ids),
        isNull(renderAssets.deletedAt),
      ),
    }),
    db.query.projects.findMany({
      where: inArray(projects.id, projectIds),
    }),
  ]);

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
  const projectById = new Map(projectRows.map((p) => [p.id, p.name]));

  return rows.map((r) => ({
    id: r.id,
    mode: r.mode,
    status: r.status,
    prompt: r.prompt,
    createdAt: r.createdAt,
    projectId: r.projectId,
    projectName: projectById.get(r.projectId) ?? null,
    creditsUsed: r.creditsUsed,
    resultUrl: resultByRender.get(r.id) ?? null,
    originalUrl: originalByRender.get(r.id) ?? null,
  }));
}

/** Total non-deleted renders for a user, matching the same filters as listRenders. */
export async function countRenders(
  userId: string,
  opts: { projectId?: string; archived?: boolean; status?: RenderStatus } = {},
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(renders)
    .where(
      and(
        eq(renders.userId, userId),
        isNull(renders.deletedAt),
        opts.projectId ? eq(renders.projectId, opts.projectId) : undefined,
        opts.archived
          ? isNotNull(renders.archivedAt)
          : isNull(renders.archivedAt),
        opts.status ? eq(renders.status, opts.status) : undefined,
      ),
    );
  return row.value;
}

export async function archiveRender(userId: string, renderId: string) {
  const now = new Date();
  const [row] = await db
    .update(renders)
    .set({ archivedAt: now })
    .where(
      and(eq(renders.id, renderId), eq(renders.userId, userId), isNull(renders.deletedAt)),
    )
    .returning();
  return Boolean(row);
}

export async function restoreRender(userId: string, renderId: string) {
  const [row] = await db
    .update(renders)
    .set({ archivedAt: null })
    .where(
      and(eq(renders.id, renderId), eq(renders.userId, userId), isNull(renders.deletedAt)),
    )
    .returning();
  return Boolean(row);
}

export async function deleteRenderPermanently(
  userId: string,
  renderId: string,
  deletedBy = userId,
) {
  const detail = await getRenderDetail(userId, renderId);
  if (!detail) return false;

  const now = new Date();
  await Promise.all(
    detail.assets.map((asset) => storage().deleteObject(asset.fileKey)),
  );
  await db
    .update(renderAssets)
    .set({ deletedAt: now })
    .where(and(eq(renderAssets.renderId, renderId), isNull(renderAssets.deletedAt)));
  await db
    .update(renderJobs)
    .set({
      status: "failed",
      failedAt: now,
      errorMessage: "Render dihapus permanen",
      updatedAt: now,
    })
    .where(and(eq(renderJobs.renderId, renderId), eq(renderJobs.status, "queued")));
  await db
    .update(renders)
    .set({ deletedAt: now, deletedBy })
    .where(and(eq(renders.id, renderId), eq(renders.userId, userId)));
  return true;
}

export async function getResultAssetForDownload(userId: string, renderId: string) {
  const render = await db.query.renders.findFirst({
    where: and(
      eq(renders.id, renderId),
      eq(renders.userId, userId),
      eq(renders.status, "success"),
      isNull(renders.deletedAt),
    ),
  });
  if (!render) return null;

  const asset = await db.query.renderAssets.findFirst({
    where: and(
      eq(renderAssets.renderId, render.id),
      eq(renderAssets.type, "result"),
      isNull(renderAssets.deletedAt),
    ),
  });
  return asset ?? null;
}

export { isFinal as isFinalRenderStatus };
