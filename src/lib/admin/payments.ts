import { asc, count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { paymentPackages, payments, user } from "@/db/schema";

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

export async function listPaymentPackages() {
  return db.query.paymentPackages.findMany({
    orderBy: asc(paymentPackages.sortOrder),
  });
}
