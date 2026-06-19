import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { paymentPdf } from "@/lib/payments/pdf";
import { getPaymentDetailForUser } from "@/lib/payments/service";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    await assertRateLimit("public_api", session.user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 429 });
    }
    throw err;
  }

  const { orderId } = await params;
  const payment = await getPaymentDetailForUser(session.user.id, orderId);
  if (!payment) {
    return NextResponse.json({ error: "Pembayaran tidak ditemukan" }, { status: 404 });
  }

  const pdf = paymentPdf("invoice", payment, {
    name: session.user.name,
    email: session.user.email,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Invoice-${payment.orderId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
