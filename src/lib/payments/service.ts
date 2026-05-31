import { randomBytes } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { paymentPackages, payments } from "@/db/schema";
import { env } from "@/env";
import { applyCreditChange } from "@/lib/credits";
import { paymentSuccessEmail } from "@/lib/email";
import { notifyUser } from "@/lib/notifications/service";
import {
  paymentProvider,
  type NormalizedWebhook,
} from "@/lib/providers/payment";

function generateOrderId() {
  return `RAI-${Date.now().toString(36).toUpperCase()}-${randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
}

export class PackageNotFoundError extends Error {
  constructor() {
    super("Paket tidak ditemukan");
    this.name = "PackageNotFoundError";
  }
}

export interface CheckoutResult {
  orderId: string;
  provider: string;
  token?: string;
  redirectUrl?: string;
}

/** Create a payment for a credit package and a provider checkout (PRD §23.3). */
export async function createCheckout(
  userId: string,
  packageSlug: string,
  customer: { name: string; email: string },
): Promise<CheckoutResult> {
  const pkg = await db.query.paymentPackages.findFirst({
    where: and(
      eq(paymentPackages.slug, packageSlug),
      eq(paymentPackages.isActive, true),
    ),
  });
  if (!pkg) throw new PackageNotFoundError();

  const orderId = generateOrderId();
  const totalCredits = pkg.credits + pkg.bonusCredits;

  const [payment] = await db
    .insert(payments)
    .values({
      userId,
      packageId: pkg.id,
      provider: env.PAYMENT_PROVIDER,
      providerOrderId: orderId,
      amount: pkg.price,
      currency: pkg.currency,
      creditsAdded: totalCredits,
      status: "pending",
    })
    .returning();

  const checkout = await paymentProvider().createPayment({
    orderId,
    amount: pkg.price,
    currency: pkg.currency,
    packageName: pkg.name,
    customer,
  });

  await db
    .update(payments)
    .set({
      snapToken: checkout.snapToken,
      paymentUrl: checkout.paymentUrl,
      rawResponse: checkout.raw as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  return {
    orderId,
    provider: env.PAYMENT_PROVIDER,
    token: checkout.snapToken,
    redirectUrl: checkout.paymentUrl,
  };
}

/**
 * Apply a normalized provider notification (PRD §23.4). Idempotent: a payment
 * already marked paid is a no-op, and the credit top-up uses a fixed
 * idempotency key so duplicate webhooks never double-credit.
 */
export async function handlePaymentNotification(webhook: NormalizedWebhook) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.providerOrderId, webhook.providerOrderId),
  });
  if (!payment) return { handled: false, reason: "payment_not_found" as const };

  if (payment.status === "paid") {
    return { handled: true, reason: "already_paid" as const };
  }

  const now = new Date();

  if (webhook.status === "paid") {
    await db
      .update(payments)
      .set({
        status: "paid",
        paidAt: now,
        providerTransactionId: webhook.providerTransactionId,
        rawWebhook: webhook.raw as Record<string, unknown>,
        updatedAt: now,
      })
      .where(eq(payments.id, payment.id));

    await applyCreditChange({
      userId: payment.userId,
      type: "purchase",
      amount: payment.creditsAdded,
      description: `Pembelian ${payment.creditsAdded} kredit`,
      paymentId: payment.id,
      idempotencyKey: `payment:${payment.id}`,
    });

    await notifyUser({
      userId: payment.userId,
      type: "payment_success",
      title: "Pembayaran berhasil 🎉",
      message: `${payment.creditsAdded} kredit sudah ditambahkan ke akunmu.`,
      actionUrl: "/payments",
      email: paymentSuccessEmail({
        credits: payment.creditsAdded,
        url: `${env.APP_URL.replace(/\/$/, "")}/renders/new`,
      }),
    });

    return { handled: true, reason: "paid" as const };
  }

  // Non-success outcomes.
  const patch: Partial<typeof payments.$inferInsert> = {
    status: webhook.status,
    providerTransactionId: webhook.providerTransactionId,
    rawWebhook: webhook.raw as Record<string, unknown>,
    updatedAt: now,
  };
  if (webhook.status === "failed") patch.failedAt = now;
  if (webhook.status === "expired") patch.expiredAt = now;

  await db.update(payments).set(patch).where(eq(payments.id, payment.id));
  return { handled: true, reason: webhook.status };
}

export async function listPayments(userId: string) {
  const rows = await db.query.payments.findMany({
    where: eq(payments.userId, userId),
    orderBy: desc(payments.createdAt),
    limit: 50,
  });

  const pkgs = await db.query.paymentPackages.findMany();
  const pkgName = new Map(pkgs.map((p) => [p.id, p.name]));

  return rows.map((r) => ({
    id: r.id,
    orderId: r.providerOrderId,
    packageName: r.packageId ? pkgName.get(r.packageId) ?? "—" : "—",
    amount: r.amount,
    credits: r.creditsAdded,
    status: r.status,
    createdAt: r.createdAt,
    paidAt: r.paidAt,
  }));
}
