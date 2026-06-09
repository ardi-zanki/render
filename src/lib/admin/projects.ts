import { and, count, desc, eq, ilike, isNotNull, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { projects, user } from "@/db/schema";

export type AdminProjectFilters = {
  q?: string;
  status?: "active" | "archived" | "deleted" | "default";
};

function projectWhere(filters: AdminProjectFilters = {}) {
  const search = filters.q?.trim();
  return and(
    search
      ? or(
          ilike(projects.name, `%${search}%`),
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`),
        )
      : undefined,
    filters.status === "active"
      ? and(isNull(projects.archivedAt), isNull(projects.deletedAt))
      : undefined,
    filters.status === "archived" ? isNotNull(projects.archivedAt) : undefined,
    filters.status === "deleted" ? isNotNull(projects.deletedAt) : undefined,
    filters.status === "default" ? eq(projects.isDefault, true) : undefined,
  );
}

export async function listAllProjects(
  limit = 100,
  offset = 0,
  filters: AdminProjectFilters = {},
) {
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
    .where(projectWhere(filters))
    .orderBy(desc(projects.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function countAllProjects(
  filters: AdminProjectFilters = {},
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(projects)
    .innerJoin(user, eq(user.id, projects.userId))
    .where(projectWhere(filters));
  return row.value;
}
