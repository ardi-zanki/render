import { and, count, desc, eq, inArray, isNull, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import {
  adminAuditLogs,
  creditBalances,
  payments,
  renders,
  session,
  user,
  type RenderMode,
} from "@/db/schema";
import { writeAuditLog } from "./audit";

export async function getAdminStats() {
  const [users] = await db.select({ v: count() }).from(user);
  const [rendersTotal] = await db.select({ v: count() }).from(renders);
  const [rendersSuccess] = await db
    .select({ v: count() })
    .from(renders)
    .where(eq(renders.status, "success"));
  const [revenue] = await db
    .select({ v: sum(payments.amount) })
    .from(payments)
    .where(eq(payments.status, "paid"));
  const [paidCount] = await db
    .select({ v: count() })
    .from(payments)
    .where(eq(payments.status, "paid"));

  return {
    users: users.v,
    renders: rendersTotal.v,
    rendersSuccess: rendersSuccess.v,
    revenue: Number(revenue.v ?? 0),
    paidCount: paidCount.v,
  };
}

export async function listUsers(limit = 100) {
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
    .limit(limit);
}

export interface AdminRenderRow {
  id: string;
  mode: RenderMode;
  status: string;
  userName: string;
  createdAt: Date;
}

export async function listAllRenders(limit = 100): Promise<AdminRenderRow[]> {
  return db
    .select({
      id: renders.id,
      mode: renders.mode,
      status: renders.status,
      userName: user.name,
      createdAt: renders.createdAt,
    })
    .from(renders)
    .innerJoin(user, eq(user.id, renders.userId))
    .orderBy(desc(renders.createdAt))
    .limit(limit);
}

export async function listAllPayments(limit = 100) {
  return db
    .select({
      id: payments.id,
      orderId: payments.providerOrderId,
      userName: user.name,
      amount: payments.amount,
      credits: payments.creditsAdded,
      status: payments.status,
      provider: payments.provider,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(user, eq(user.id, payments.userId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

export async function listAuditLogs(limit = 100) {
  const logs = await db.query.adminAuditLogs.findMany({
    orderBy: desc(adminAuditLogs.createdAt),
    limit,
  });
  if (logs.length === 0) return [];

  const ids = Array.from(
    new Set(
      logs.flatMap((l) =>
        [l.adminUserId, l.targetUserId].filter((x): x is string => !!x),
      ),
    ),
  );
  const users = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(inArray(user.id, ids));
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    adminName: nameById.get(l.adminUserId) ?? "—",
    targetName: l.targetUserId ? nameById.get(l.targetUserId) ?? "—" : null,
    metadata: l.metadata as Record<string, unknown> | null,
    createdAt: l.createdAt,
  }));
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

export interface DayValue {
  day: string; // YYYY-MM-DD
  value: number;
}

function last14Days(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function fillSeries(rows: { day: string; value: number }[]): DayValue[] {
  const map = new Map(rows.map((r) => [r.day, Number(r.value)]));
  return last14Days().map((day) => ({ day, value: map.get(day) ?? 0 }));
}

export interface AdminAnalytics {
  rendersByDay: DayValue[];
  revenueByDay: DayValue[];
  modeBreakdown: { mode: RenderMode; value: number }[];
  statusBreakdown: { status: string; value: number }[];
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const renderRows = (await db.execute(
    sql`select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, count(*)::int as value
        from renders
        where created_at >= now() - interval '13 days' and deleted_at is null
        group by 1`,
  )) as unknown as { day: string; value: number }[];

  const revenueRows = (await db.execute(
    sql`select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, coalesce(sum(amount),0)::int as value
        from payments
        where status = 'paid' and created_at >= now() - interval '13 days'
        group by 1`,
  )) as unknown as { day: string; value: number }[];

  const modeRows = await db
    .select({ mode: renders.mode, value: count() })
    .from(renders)
    .where(isNull(renders.deletedAt))
    .groupBy(renders.mode);

  const statusRows = await db
    .select({ status: renders.status, value: count() })
    .from(renders)
    .where(isNull(renders.deletedAt))
    .groupBy(renders.status);

  return {
    rendersByDay: fillSeries(renderRows),
    revenueByDay: fillSeries(revenueRows),
    modeBreakdown: modeRows.map((r) => ({ mode: r.mode, value: r.value })),
    statusBreakdown: statusRows.map((r) => ({
      status: r.status,
      value: r.value,
    })),
  };
}
