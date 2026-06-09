import { count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects, user } from "@/db/schema";

export async function listAllProjects(limit = 100, offset = 0) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      userName: user.name,
      isDefault: projects.isDefault,
      archivedAt: projects.archivedAt,
      deletedAt: projects.deletedAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .innerJoin(user, eq(user.id, projects.userId))
    .orderBy(desc(projects.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function countAllProjects(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(projects);
  return row.value;
}
