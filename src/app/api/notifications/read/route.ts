import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { markAllRead, markRead } from "@/lib/notifications/service";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    await assertRateLimit("public_api", session.user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { success: false, code: err.code, message: err.message },
        { status: 429 },
      );
    }
    throw err;
  }

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    all?: boolean;
  };

  if (body.all) {
    await markAllRead(session.user.id);
  } else if (typeof body.id === "string") {
    await markRead(session.user.id, body.id);
  } else {
    return NextResponse.json({ error: "id atau all wajib" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
