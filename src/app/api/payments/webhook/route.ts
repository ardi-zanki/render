import { NextResponse } from "next/server";

import { handlePaymentNotification } from "@/lib/payments/service";
import { paymentProvider } from "@/lib/providers/payment";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Provider payment notification (Midtrans HTTP notification). Public endpoint —
 * authenticity is established by the provider's signature, verified inside
 * `verifyAndParseWebhook`. Returns 200 once handled so the provider stops
 * retrying; 4xx/5xx triggers a retry.
 */
export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  try {
    await assertRateLimit("payment_webhook", ip);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { success: false, code: err.code, message: err.message },
        { status: 429 },
      );
    }
    throw err;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const headers = Object.fromEntries(req.headers.entries());

  let normalized;
  try {
    normalized = await paymentProvider().verifyAndParseWebhook({
      headers,
      body,
    });
  } catch {
    return NextResponse.json(
      { error: "Signature tidak valid" },
      { status: 403 },
    );
  }

  try {
    const result = await handlePaymentNotification(normalized);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses webhook";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
