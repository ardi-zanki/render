import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  creditBalances,
  creditTransactions,
  type CreditTxType,
} from "@/db/schema";

export async function getBalance(userId: string): Promise<number> {
  const row = await db.query.creditBalances.findFirst({
    where: eq(creditBalances.userId, userId),
  });
  return row?.balance ?? 0;
}

export async function listCreditTransactions(userId: string, limit = 100) {
  return db.query.creditTransactions.findMany({
    where: eq(creditTransactions.userId, userId),
    orderBy: desc(creditTransactions.createdAt),
    limit,
  });
}

export interface ApplyCreditParams {
  userId: string;
  type: CreditTxType;
  /** Positive to add, negative to deduct. */
  amount: number;
  description?: string;
  renderId?: string;
  paymentId?: string;
  /** Set to make the change idempotent (PRD §22.3, §23.4). */
  idempotencyKey?: string;
}

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Credit Anda tidak cukup untuk membuat render");
    this.name = "InsufficientCreditsError";
  }
}

/**
 * Atomically apply a credit change and record the transaction. Balance is
 * row-locked; never goes negative. If `idempotencyKey` was already used, this
 * is a no-op that returns the existing balance.
 */
export async function applyCreditChange(p: ApplyCreditParams) {
  return db.transaction(async (tx) => {
    if (p.idempotencyKey) {
      const existing = await tx.query.creditTransactions.findFirst({
        where: eq(creditTransactions.idempotencyKey, p.idempotencyKey),
      });
      if (existing) {
        return { applied: false, balance: existing.balanceAfter };
      }
    }

    const locked = await tx
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.userId, p.userId))
      .for("update");

    let balanceBefore = locked[0]?.balance ?? 0;
    if (locked.length === 0) {
      await tx.insert(creditBalances).values({ userId: p.userId, balance: 0 });
      balanceBefore = 0;
    }

    const balanceAfter = balanceBefore + p.amount;
    if (balanceAfter < 0) {
      throw new InsufficientCreditsError();
    }

    await tx
      .update(creditBalances)
      .set({ balance: balanceAfter, updatedAt: new Date() })
      .where(eq(creditBalances.userId, p.userId));

    await tx.insert(creditTransactions).values({
      userId: p.userId,
      type: p.type,
      amount: p.amount,
      balanceBefore,
      balanceAfter,
      description: p.description,
      renderId: p.renderId,
      paymentId: p.paymentId,
      idempotencyKey: p.idempotencyKey,
    });

    return { applied: true, balance: balanceAfter };
  });
}
