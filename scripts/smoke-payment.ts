/**
 * Runtime smoke test for the Phase 3 payment flow. Run with `pnpm smoke:payment`.
 * Exercises: createCheckout (mock) → webhook (settlement) → idempotent credit
 * top-up → duplicate webhook is a no-op.
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { paymentPackages, payments, user } from "@/db/schema";
import { getBalance } from "@/lib/credits";
import { createCheckout, handlePaymentNotification } from "@/lib/payments/service";
import { paymentProvider } from "@/lib/providers/payment";

const EMAIL = "demo@renderai.test";
const SLUG = "creator";

function assert(cond: unknown, label: string) {
  console.log(`  ${cond ? "✓" : "✗"} ${label}`);
  if (!cond) process.exitCode = 1;
}

async function fakeWebhook(orderId: string, status: string) {
  const normalized = await paymentProvider().verifyAndParseWebhook({
    headers: {},
    body: {
      order_id: orderId,
      transaction_status: status,
      status_code: "200",
      gross_amount: "0",
      transaction_id: `mock-${Date.now()}`,
    },
  });
  return handlePaymentNotification(normalized);
}

async function main() {
  const u = await db.query.user.findFirst({ where: eq(user.email, EMAIL) });
  if (!u) {
    console.error(`User ${EMAIL} tidak ada.`);
    process.exit(1);
  }
  const pkg = await db.query.paymentPackages.findFirst({
    where: eq(paymentPackages.slug, SLUG),
  });
  if (!pkg) {
    console.error("Paket 'creator' belum di-seed. Jalankan pnpm db:seed.");
    process.exit(1);
  }

  const before = await getBalance(u.id);
  const credits = pkg.credits + pkg.bonusCredits;

  console.log(`Checkout paket '${SLUG}' (mock)…`);
  const checkout = await createCheckout(u.id, SLUG, {
    name: u.name,
    email: u.email,
  });
  assert(!!checkout.orderId, "order id dibuat");
  assert(checkout.provider === "mock", "provider = mock");

  const pending = await db.query.payments.findFirst({
    where: eq(payments.providerOrderId, checkout.orderId),
  });
  assert(pending?.status === "pending", "payment row status pending");

  console.log("Webhook: settlement…");
  const r1 = await fakeWebhook(checkout.orderId, "settlement");
  assert(r1.reason === "paid", "webhook handled → paid");

  const afterPaid = await getBalance(u.id);
  assert(afterPaid === before + credits, `kredit +${credits} (${before} → ${afterPaid})`);

  const paid = await db.query.payments.findFirst({
    where: eq(payments.providerOrderId, checkout.orderId),
  });
  assert(paid?.status === "paid", "payment row status paid");
  assert(!!paid?.paidAt, "paidAt terisi");

  console.log("Webhook duplikat (idempotensi)…");
  const r2 = await fakeWebhook(checkout.orderId, "settlement");
  assert(r2.reason === "already_paid", "webhook kedua = already_paid");
  const afterDup = await getBalance(u.id);
  assert(afterDup === afterPaid, "tidak ada kredit ganda");

  console.log("\nDone.");
  process.exit(process.exitCode ?? 0);
}

main().catch((err) => {
  console.error("Smoke payment error:", err);
  process.exit(1);
});
