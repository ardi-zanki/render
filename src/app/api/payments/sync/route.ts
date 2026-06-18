import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  PaymentNotFoundError,
  PaymentSyncUnsupportedError,
  syncPaymentStatus,
} from "@/lib/payments/service";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { paymentSyncSchema } from "@/lib/validations/payment";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    await assertRateLimit("payment_sync", session.user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }

  const parsed = paymentSyncSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Order tidak valid" }, { status: 400 });
  }

  try {
    const result = await syncPaymentStatus(
      session.user.id,
      parsed.data.orderId,
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof PaymentNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof PaymentSyncUnsupportedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const msg =
      err instanceof Error ? err.message : "Gagal menyinkronkan pembayaran";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
