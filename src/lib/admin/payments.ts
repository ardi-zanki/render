import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import {
  paymentPackages,
  payments,
  user,
  type PaymentStatus,
} from "@/db/schema";

export type AdminPaymentFilters = {
  q?: string;
  status?: PaymentStatus;
  provider?: string;
};

function paymentWhere(filters: AdminPaymentFilters = {}) {
  const search = filters.q?.trim();
  return and(
    filters.status ? eq(payments.status, filters.status) : undefined,
    filters.provider ? eq(payments.provider, filters.provider) : undefined,
    search
      ? or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`),
          ilike(payments.providerOrderId, `%${search}%`),
          ilike(payments.providerTransactionId, `%${search}%`),
        )
      : undefined,
  );
}

export async function listAllPayments(
  limit = 100,
  offset = 0,
  filters: AdminPaymentFilters = {},
) {
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
    .where(paymentWhere(filters))
    .orderBy(desc(payments.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function countAllPayments(
  filters: AdminPaymentFilters = {},
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(payments)
    .innerJoin(user, eq(user.id, payments.userId))
    .where(paymentWhere(filters));
  return row.value;
}

export type AdminPackageFilters = {
  q?: string;
  status?: "active" | "inactive";
};

function packageWhere(filters: AdminPackageFilters = {}) {
  const search = filters.q?.trim();
  return and(
    search
      ? or(
          ilike(paymentPackages.name, `%${search}%`),
          ilike(paymentPackages.slug, `%${search}%`),
        )
      : undefined,
    filters.status === "active" ? eq(paymentPackages.isActive, true) : undefined,
    filters.status === "inactive"
      ? eq(paymentPackages.isActive, false)
      : undefined,
  );
}

export async function listPaymentPackages(
  limit = 100,
  offset = 0,
  filters: AdminPackageFilters = {},
) {
  return db
    .select()
    .from(paymentPackages)
    .where(packageWhere(filters))
    .orderBy(asc(paymentPackages.sortOrder))
    .limit(limit)
    .offset(offset);
}

export async function countPaymentPackages(
  filters: AdminPackageFilters = {},
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(paymentPackages)
    .where(packageWhere(filters));
  return row.value;
}
