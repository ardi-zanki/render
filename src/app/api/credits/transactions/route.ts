import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listCreditTransactions } from "@/lib/credits";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    await assertRateLimit("public_api", session.user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 429 },
      );
    }
    throw err;
  }

  const rows = await listCreditTransactions(session.user.id, 100);

  return NextResponse.json({ transactions: rows });
}
