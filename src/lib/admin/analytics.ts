import { count, eq, isNotNull, isNull, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { payments, renders, user, type RenderMode } from "@/db/schema";

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

export interface DayValue {
  day: string;
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
