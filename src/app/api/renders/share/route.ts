import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { enableShare } from "@/lib/renders/share";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { renderId?: string };
  const renderId = typeof body.renderId === "string" ? body.renderId : "";
  if (!renderId) {
    return NextResponse.json({ error: "renderId wajib" }, { status: 400 });
  }

  const result = await enableShare(session.user.id, renderId);
  if (!result) {
    return NextResponse.json(
      { error: "Render tidak ditemukan atau belum selesai" },
      { status: 404 },
    );
  }
  return NextResponse.json(result);
}
