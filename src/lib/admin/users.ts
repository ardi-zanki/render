import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { creditBalances, session, user } from "@/db/schema";
import { writeAuditLog } from "./audit";

export async function listUsers(limit = 100, offset = 0) {
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
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function countUsers(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(user);
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
