import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
} from "drizzle-orm";

import { db } from "@/db";
import {
  projects,
  renderAssets,
  renders,
  type RenderStatus,
} from "@/db/schema";
import type { RenderDetail, RenderListItem } from "./types";

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
    config: render.config ?? null,
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

/** Total non-deleted renders for a user's dashboard-level statistics. */
export async function countUserRenders(
  userId: string,
  opts: { status?: RenderStatus } = {},
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(renders)
    .where(
      and(
        eq(renders.userId, userId),
        isNull(renders.deletedAt),
        opts.status ? eq(renders.status, opts.status) : undefined,
      ),
    );
  return row.value;
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
