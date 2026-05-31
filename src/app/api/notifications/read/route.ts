import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { markAllRead, markRead } from "@/lib/notifications/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
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
