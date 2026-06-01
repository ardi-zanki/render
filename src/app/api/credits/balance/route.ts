import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getBalance } from "@/lib/credits";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  return NextResponse.json({ balance: await getBalance(session.user.id) });
}
