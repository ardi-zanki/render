import { randomBytes } from "node:crypto";

import { and, count, desc, eq, isNotNull, or } from "drizzle-orm";

import { db } from "@/db";
import { creditTransactions, paymentPackages, payments } from "@/db/schema";
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

export class PaymentNotFoundError extends Error {
  constructor() {
    super("Pembayaran tidak ditemukan");
    this.name = "PaymentNotFoundError";
  }
}

export class PaymentSyncUnsupportedError extends Error {
  constructor() {
    super("Provider pembayaran belum mendukung sinkronisasi status");
    this.name = "PaymentSyncUnsupportedError";
  }
}

export interface CheckoutResult {
  orderId: string;
  provider: string;
  token?: string;
  redirectUrl?: string;
}

type PaymentRow = typeof payments.$inferSelect;

function paymentCreditKey(paymentId: string) {
  return `payment:${paymentId}`;
}

function checkoutResultFromPayment(payment: PaymentRow): CheckoutResult {
  return {
    orderId: payment.providerOrderId,
    provider: payment.provider,
    token: payment.snapToken ?? undefined,
    redirectUrl: payment.paymentUrl ?? undefined,
  };
}

async function ensurePaymentCreditsApplied(payment: PaymentRow) {
  const idempotencyKey = paymentCreditKey(payment.id);
  const existing = await db.query.creditTransactions.findFirst({
    where: eq(creditTransactions.idempotencyKey, idempotencyKey),
  });
  if (existing) {
    return { applied: false, balance: existing.balanceAfter };
  }

  return applyCreditChange({
    userId: payment.userId,
    type: "purchase",
    amount: payment.creditsAdded,
    description: `Pembelian ${payment.creditsAdded} kredit`,
    paymentId: payment.id,
    idempotencyKey,
  });
}

async function notifyPaymentSuccess(payment: PaymentRow) {
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
}

export async function getActivePaymentPackage(slug: string) {
  return db.query.paymentPackages.findFirst({
    where: and(
      eq(paymentPackages.slug, slug),
      eq(paymentPackages.isActive, true),
    ),
  });
}

export async function listActivePaymentPackages() {
  return db.query.paymentPackages.findMany({
    where: eq(paymentPackages.isActive, true),
    orderBy: (pkg, { asc }) => asc(pkg.sortOrder),
  });
}

/** Create a payment for a credit package and a provider checkout (PRD §23.3). */
export async function createCheckout(
  userId: string,
  packageSlug: string,
  customer: { name: string; email: string },
): Promise<CheckoutResult> {
  const pkg = await getActivePaymentPackage(packageSlug);
  if (!pkg) throw new PackageNotFoundError();

  const totalCredits = pkg.credits + pkg.bonusCredits;
  const reusablePayment = await db.query.payments.findFirst({
    where: and(
      eq(payments.userId, userId),
      eq(payments.packageId, pkg.id),
      eq(payments.provider, env.PAYMENT_PROVIDER),
      eq(payments.amount, pkg.price),
      eq(payments.currency, pkg.currency),
      eq(payments.creditsAdded, totalCredits),
      eq(payments.status, "pending"),
      or(isNotNull(payments.snapToken), isNotNull(payments.paymentUrl)),
    ),
    orderBy: desc(payments.createdAt),
  });
  if (reusablePayment) return checkoutResultFromPayment(reusablePayment);

  const orderId = generateOrderId();

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
 * already marked paid is usually a no-op, but the credit top-up is verified
 * first so a retry can recover if the previous request saved `paid` before
 * credits were applied. The credit mutation uses a fixed idempotency key so
 * duplicate webhooks never double-credit.
 */
export async function handlePaymentNotification(webhook: NormalizedWebhook) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.providerOrderId, webhook.providerOrderId),
  });
  if (!payment) return { handled: false, reason: "payment_not_found" as const };

  if (payment.status === "paid") {
    const credit = await ensurePaymentCreditsApplied(payment);
    if (credit.applied) {
      await notifyPaymentSuccess(payment);
      return { handled: true, reason: "credited_after_paid" as const };
    }
    return { handled: true, reason: "already_paid" as const };
  }
  if (payment.status === webhook.status) {
    return { handled: true, reason: `already_${webhook.status}` as const };
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

    const credit = await ensurePaymentCreditsApplied(payment);
    if (credit.applied) await notifyPaymentSuccess(payment);

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
  if (
    webhook.status === "failed" ||
    webhook.status === "expired" ||
    webhook.status === "cancelled"
  ) {
    await notifyUser({
      userId: payment.userId,
      type: "payment_failed",
      title: "Pembayaran belum berhasil",
      message: "Transaksi tidak berhasil. Silakan pilih paket dan coba lagi.",
      actionUrl: "/payments",
    });
  }
  return { handled: true, reason: webhook.status };
}

export async function syncPaymentStatus(userId: string, orderId: string) {
  const payment = await db.query.payments.findFirst({
    where: and(
      eq(payments.userId, userId),
      eq(payments.providerOrderId, orderId),
    ),
  });
  if (!payment) throw new PaymentNotFoundError();

  const provider = paymentProvider();
  if (!provider.getPaymentStatus) throw new PaymentSyncUnsupportedError();

  const webhook = await provider.getPaymentStatus(orderId);
  const result = await handlePaymentNotification(webhook);
  const updated = await getPaymentForUser(userId, orderId);

  return {
    ...result,
    status: updated?.status ?? payment.status,
  };
}

export async function getPaymentForUser(userId: string, orderId: string) {
  return db.query.payments.findFirst({
    where: and(
      eq(payments.userId, userId),
      eq(payments.providerOrderId, orderId),
    ),
  });
}

export async function getPaymentDetailForUser(userId: string, orderId: string) {
  const payment = await getPaymentForUser(userId, orderId);
  if (!payment) return null;

  const pkg = payment.packageId
    ? await db.query.paymentPackages.findFirst({
        where: eq(paymentPackages.id, payment.packageId),
      })
    : null;

  return {
    id: payment.id,
    orderId: payment.providerOrderId,
    provider: payment.provider,
    packageName: pkg?.name ?? "Paket kredit",
    amount: payment.amount,
    currency: payment.currency,
    credits: payment.creditsAdded,
    status: payment.status,
    paymentType: payment.paymentType,
    snapToken: payment.status === "pending" ? payment.snapToken : null,
    paymentUrl: payment.status === "pending" ? payment.paymentUrl : null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    paidAt: payment.paidAt,
    expiredAt: payment.expiredAt,
    failedAt: payment.failedAt,
  };
}

export async function countPayments(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(payments)
    .where(eq(payments.userId, userId));
  return row.value;
}

export async function listPayments(
  userId: string,
  opts: { limit?: number; offset?: number } = {},
) {
  const rows = await db.query.payments.findMany({
    where: eq(payments.userId, userId),
    orderBy: desc(payments.createdAt),
    limit: opts.limit ?? 50,
    offset: opts.offset,
  });

  const pkgs = await db.query.paymentPackages.findMany();
  const pkgName = new Map(pkgs.map((p) => [p.id, p.name]));

  return rows.map((r) => ({
    id: r.id,
    orderId: r.providerOrderId,
    provider: r.provider,
    packageName: r.packageId ? pkgName.get(r.packageId) ?? "—" : "—",
    amount: r.amount,
    credits: r.creditsAdded,
    status: r.status,
    paymentType: r.paymentType,
    snapToken: r.status === "pending" ? r.snapToken : null,
    paymentUrl: r.status === "pending" ? r.paymentUrl : null,
    createdAt: r.createdAt,
    paidAt: r.paidAt,
  }));
}
