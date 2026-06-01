import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/db";
import { projects, renders } from "@/db/schema";

export async function getDefaultProject(userId: string) {
  const existing = await db.query.projects.findFirst({
    where: and(
      eq(projects.userId, userId),
      eq(projects.isDefault, true),
      isNull(projects.deletedAt),
    ),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(projects)
    .values({ userId, name: "Project Saya", isDefault: true })
    .returning();
  return created;
}

export async function listProjects(
  userId: string,
  opts: { archived?: boolean } = {},
) {
  return db.query.projects.findMany({
    where: and(
      eq(projects.userId, userId),
      isNull(projects.deletedAt),
      opts.archived
        ? isNotNull(projects.archivedAt)
        : isNull(projects.archivedAt),
    ),
    orderBy: desc(projects.updatedAt),
  });
}

export const MAX_PROJECTS = 10;

/** Count a user's non-deleted projects (active + archived). */
export async function countProjects(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(projects)
    .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)));
  return row.value;
}

export async function getProject(userId: string, projectId: string) {
  return db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.userId, userId),
      isNull(projects.deletedAt),
    ),
  });
}

export async function createProject(
  userId: string,
  name: string,
  description?: string,
) {
  const [created] = await db
    .insert(projects)
    .values({ userId, name, description })
    .returning();
  return created;
}

export async function updateProject(
  userId: string,
  projectId: string,
  name: string,
  description?: string,
) {
  await db
    .update(projects)
    .set({ name, description: description ?? null, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

/** Archive a project (hidden from the active list). The default can't be archived. */
export async function archiveProject(userId: string, projectId: string) {
  const p = await getProject(userId, projectId);
  if (!p || p.isDefault) return false;
  await db
    .update(projects)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  return true;
}

export async function unarchiveProject(userId: string, projectId: string) {
  await db
    .update(projects)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

export type DeleteProjectResult =
  | { deleted: true }
  | { deleted: false; reason: "default" | "has_renders" | "not_found" };

/** Soft-delete a project. Only allowed when it has no renders and isn't default. */
export async function deleteProject(
  userId: string,
  projectId: string,
): Promise<DeleteProjectResult> {
  const p = await getProject(userId, projectId);
  if (!p) return { deleted: false, reason: "not_found" };
  if (p.isDefault) return { deleted: false, reason: "default" };

  const [{ value }] = await db
    .select({ value: count() })
    .from(renders)
    .where(and(eq(renders.projectId, projectId), isNull(renders.deletedAt)));
  if (value > 0) return { deleted: false, reason: "has_renders" };

  await db
    .update(projects)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  return { deleted: true };
}

/** Render counts per project for the given user (active renders). */
export async function renderCountsByProject(userId: string) {
  const rows = await db
    .select({ projectId: renders.projectId, value: count() })
    .from(renders)
    .where(and(eq(renders.userId, userId), isNull(renders.deletedAt)))
    .groupBy(renders.projectId);
  return new Map(rows.map((r) => [r.projectId, r.value]));
}
