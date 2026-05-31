import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createCheckout, PackageNotFoundError } from "@/lib/payments/service";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validations/payment";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  if (!session.user.emailVerified) {
    return NextResponse.json(
      { error: "Email belum diverifikasi" },
      { status: 403 },
    );
  }

  try {
    await assertRateLimit("create_payment", session.user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 });
  }

  try {
    const result = await createCheckout(
      session.user.id,
      parsed.data.packageSlug,
      { name: session.user.name, email: session.user.email },
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PackageNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const msg = err instanceof Error ? err.message : "Gagal membuat pembayaran";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
