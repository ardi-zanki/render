import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { creditBalances, session, user } from "@/db/schema";
import { writeAuditLog } from "./audit";

export type AdminUserFilters = {
  q?: string;
  role?: "admin" | "user";
  status?: "active" | "disabled" | "unverified";
};

function userWhere(filters: AdminUserFilters = {}) {
  const search = filters.q?.trim();
  return and(
    search
      ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
      : undefined,
    filters.role ? eq(user.role, filters.role) : undefined,
    filters.status === "disabled" ? eq(user.isDisabled, true) : undefined,
    filters.status === "active" ? eq(user.isDisabled, false) : undefined,
    filters.status === "unverified" ? eq(user.emailVerified, false) : undefined,
  );
}

export async function listUsers(
  limit = 100,
  offset = 0,
  filters: AdminUserFilters = {},
) {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDisabled: user.isDisabled,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      balance: creditBalances.balance,
    })
    .from(user)
    .leftJoin(creditBalances, eq(creditBalances.userId, user.id))
    .where(userWhere(filters))
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function countUsers(filters: AdminUserFilters = {}): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(user)
    .where(userWhere(filters));
  return row.value;
}

export async function getUserLabel(targetUserId: string) {
  const [row] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, targetUserId))
    .limit(1);
  if (!row) return null;
  return row.name || row.email;
}

export async function setUserDisabled(
  adminUserId: string,
  targetUserId: string,
  disabled: boolean,
) {
  await db
    .update(user)
    .set({ isDisabled: disabled, updatedAt: new Date() })
    .where(eq(user.id, targetUserId));

  // Revoke active sessions so a disabled user is logged out immediately.
  if (disabled) {
    await db.delete(session).where(eq(session.userId, targetUserId));
  }

  await writeAuditLog({
    adminUserId,
    targetUserId,
    action: disabled ? "user.disable" : "user.enable",
    entityType: "user",
  });
}

export async function setUserRole(
  adminUserId: string,
  targetUserId: string,
  role: "user" | "admin",
) {
  await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, targetUserId));

  await writeAuditLog({
    adminUserId,
    targetUserId,
    action: "user.set_role",
    entityType: "user",
    metadata: { role },
  });
}

export async function countDisabled() {
  const [row] = await db
    .select({ v: count() })
    .from(user)
    .where(and(eq(user.isDisabled, true)));
  return row.v;
}
