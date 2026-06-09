import { count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { creditTransactions, user } from "@/db/schema";
import { applyCreditChange } from "@/lib/credits";
import { writeAuditLog } from "./audit";

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
