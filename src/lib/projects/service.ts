import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { projects } from "@/db/schema";

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

export async function listProjects(userId: string) {
  return db.query.projects.findMany({
    where: and(eq(projects.userId, userId), isNull(projects.deletedAt)),
    orderBy: desc(projects.updatedAt),
  });
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

export async function createProject(userId: string, name: string) {
  const [created] = await db
    .insert(projects)
    .values({ userId, name })
    .returning();
  return created;
}
