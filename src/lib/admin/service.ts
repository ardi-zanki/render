import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
  sum,
} from "drizzle-orm";

import { db } from "@/db";
import {
  adminAuditLogs,
  creditBalances,
  creditTransactions,
  notifications,
  paymentPackages,
  payments,
  projects,
  renderJobs,
  renders,
  session,
  user,
  type RenderMode,
  type RenderStatus,
} from "@/db/schema";
import { applyCreditChange } from "@/lib/credits";
import { writeAuditLog } from "./audit";

export async function getAdminStats() {
  const [users] = await db.select({ v: count() }).from(user);
  const [verifiedUsers] = await db
    .select({ v: count() })
    .from(user)
    .where(eq(user.emailVerified, true));
  const [rendersTotal] = await db.select({ v: count() }).from(renders);
  const [rendersSuccess] = await db
    .select({ v: count() })
    .from(renders)
    .where(eq(renders.status, "success"));
  const [rendersFailed] = await db
    .select({ v: count() })
    .from(renders)
    .where(eq(renders.status, "failed"));
  const [revenue] = await db
    .select({ v: sum(payments.amount) })
    .from(payments)
    .where(eq(payments.status, "paid"));
  const [paidCount] = await db
    .select({ v: count() })
    .from(payments)
    .where(eq(payments.status, "paid"));
  const [creditSold] = await db
    .select({ v: sum(payments.creditsAdded) })
    .from(payments)
    .where(eq(payments.status, "paid"));
  const [pendingPayments] = await db
    .select({ v: count() })
    .from(payments)
    .where(eq(payments.status, "pending"));
  const [webhookReceived] = await db
    .select({ v: count() })
    .from(payments)
    .where(isNotNull(payments.rawWebhook));

  return {
    users: users.v,
    verifiedUsers: verifiedUsers.v,
    renders: rendersTotal.v,
    rendersSuccess: rendersSuccess.v,
    rendersFailed: rendersFailed.v,
    revenue: Number(revenue.v ?? 0),
    paidCount: paidCount.v,
    creditSold: Number(creditSold.v ?? 0),
    aiProviderErrorRate:
      rendersTotal.v > 0 ? Math.round((rendersFailed.v / rendersTotal.v) * 100) : 0,
    pendingPayments: pendingPayments.v,
    webhookReceived: webhookReceived.v,
  };
}

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

export interface AdminRenderRow {
  id: string;
  mode: RenderMode;
  status: string;
  userName: string;
  aiProvider: string | null;
  errorMessage: string | null;
  providerRequestId: string | null;
  createdAt: Date;
}

export async function listAllRenders(
  limit = 100,
  filters: { status?: RenderStatus; mode?: RenderMode } = {},
  offset = 0,
): Promise<AdminRenderRow[]> {
  return db
    .select({
      id: renders.id,
      mode: renders.mode,
      status: renders.status,
      userName: user.name,
      aiProvider: renders.aiProvider,
      errorMessage: renders.errorMessage,
      providerRequestId: renders.providerRequestId,
      createdAt: renders.createdAt,
    })
    .from(renders)
    .innerJoin(user, eq(user.id, renders.userId))
    .where(
      and(
        isNull(renders.deletedAt),
        filters.status ? eq(renders.status, filters.status) : undefined,
        filters.mode ? eq(renders.mode, filters.mode) : undefined,
      ),
    )
    .orderBy(desc(renders.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function countAllRenders(
  filters: { status?: RenderStatus; mode?: RenderMode } = {},
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(renders)
    .where(
      and(
        isNull(renders.deletedAt),
        filters.status ? eq(renders.status, filters.status) : undefined,
        filters.mode ? eq(renders.mode, filters.mode) : undefined,
      ),
    );
  return row.value;
}

export async function listAllPayments(limit = 100, offset = 0) {
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
    .limit(limit)
    .offset(offset);
}

export async function countAllPayments(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(payments);
  return row.value;
}

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

export async function listCreditTransactions(limit = 100, offset = 0) {
  return db
    .select({
      id: creditTransactions.id,
      userName: user.name,
      type: creditTransactions.type,
      amount: creditTransactions.amount,
      balanceBefore: creditTransactions.balanceBefore,
      balanceAfter: creditTransactions.balanceAfter,
      description: creditTransactions.description,
      createdAt: creditTransactions.createdAt,
    })
    .from(creditTransactions)
    .innerJoin(user, eq(user.id, creditTransactions.userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function countCreditTransactions(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(creditTransactions);
  return row.value;
}

export async function listPaymentPackages() {
  return db.query.paymentPackages.findMany({
    orderBy: asc(paymentPackages.sortOrder),
  });
}

export async function listAllNotifications(limit = 100, offset = 0) {
  return db
    .select({
      id: notifications.id,
      userName: user.name,
      type: notifications.type,
      title: notifications.title,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .innerJoin(user, eq(user.id, notifications.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function countAllNotifications(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(notifications);
  return row.value;
}

export async function listAuditLogs(limit = 100, offset = 0) {
  const logs = await db.query.adminAuditLogs.findMany({
    orderBy: desc(adminAuditLogs.createdAt),
    limit,
    offset,
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

export async function countAuditLogs(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(adminAuditLogs);
  return row.value;
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

export async function manualCreditAdjustment(params: {
  adminUserId: string;
  targetUserId: string;
  amount: number;
  description?: string;
}) {
  const result = await applyCreditChange({
    userId: params.targetUserId,
    type: "adjustment",
    amount: params.amount,
    description: params.description ?? "Manual credit adjustment",
    idempotencyKey: `admin-adjustment:${params.adminUserId}:${params.targetUserId}:${Date.now()}`,
  });

  await writeAuditLog({
    adminUserId: params.adminUserId,
    targetUserId: params.targetUserId,
    action: "credit.adjustment",
    entityType: "credit_transaction",
    metadata: {
      amount: params.amount,
      balance: result.balance,
      description: params.description,
    },
  });

  return result;
}

/** Re-queue a failed render for another attempt (PRD §27.4). */
export async function retryRender(adminUserId: string, renderId: string) {
  const render = await db.query.renders.findFirst({
    where: eq(renders.id, renderId),
  });
  if (!render || render.deletedAt || render.status !== "failed") return false;

  const now = new Date();
  await db
    .update(renders)
    .set({
      status: "queued",
      errorCode: null,
      errorMessage: null,
      failedAt: null,
      startedAt: null,
    })
    .where(eq(renders.id, renderId));

  const existing = await db.query.renderJobs.findFirst({
    where: eq(renderJobs.renderId, renderId),
  });
  if (existing) {
    await db
      .update(renderJobs)
      .set({
        status: "queued",
        attempts: 0,
        lockedAt: null,
        lockedBy: null,
        availableAt: now,
        startedAt: null,
        completedAt: null,
        failedAt: null,
        errorMessage: null,
        updatedAt: now,
      })
      .where(eq(renderJobs.id, existing.id));
  } else {
    await db.insert(renderJobs).values({
      renderId,
      userId: render.userId,
      status: "queued",
      attempts: 0,
      maxAttempts: 3,
      availableAt: now,
    });
  }

  await writeAuditLog({
    adminUserId,
    targetUserId: render.userId,
    action: "render.retry",
    entityType: "render",
    metadata: { renderId },
  });
  return true;
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
