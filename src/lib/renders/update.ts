import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { projects, renderAssets, renders } from "@/db/schema";

export type MoveRenderProjectResult =
  | { ok: true; projectName: string }
  | { ok: false; reason: "render_not_found" | "project_not_found" };

export async function moveRenderToProject(
  userId: string,
  renderId: string,
  targetProjectId: string,
): Promise<MoveRenderProjectResult> {
  const [render, targetProject] = await Promise.all([
    db.query.renders.findFirst({
      where: and(
        eq(renders.id, renderId),
        eq(renders.userId, userId),
        isNull(renders.deletedAt),
      ),
    }),
    db.query.projects.findFirst({
      where: and(
        eq(projects.id, targetProjectId),
        eq(projects.userId, userId),
        isNull(projects.archivedAt),
        isNull(projects.deletedAt),
      ),
    }),
  ]);

  if (!render) return { ok: false, reason: "render_not_found" };
  if (!targetProject) return { ok: false, reason: "project_not_found" };
  if (render.projectId === targetProjectId) {
    return { ok: true, projectName: targetProject.name };
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(renders)
      .set({ projectId: targetProjectId })
      .where(
        and(
          eq(renders.id, renderId),
          eq(renders.userId, userId),
          isNull(renders.deletedAt),
        ),
      );

    await tx
      .update(renderAssets)
      .set({ projectId: targetProjectId })
      .where(
        and(
          eq(renderAssets.renderId, renderId),
          eq(renderAssets.userId, userId),
          isNull(renderAssets.deletedAt),
        ),
      );

    await tx
      .update(projects)
      .set({ updatedAt: now })
      .where(inArray(projects.id, [render.projectId, targetProjectId]));
  });

  return { ok: true, projectName: targetProject.name };
}

/** Rename a render. Returns false if it does not belong to the user. */
export async function renameRender(
  userId: string,
  renderId: string,
  name: string,
): Promise<boolean> {
  const result = await db
    .update(renders)
    .set({ name })
    .where(
      and(
        eq(renders.id, renderId),
        eq(renders.userId, userId),
        isNull(renders.deletedAt),
      ),
    )
    .returning({ id: renders.id });
  return result.length > 0;
}
