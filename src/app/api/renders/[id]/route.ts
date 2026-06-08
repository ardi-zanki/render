import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  deleteRenderPermanently,
  getRenderDetail,
} from "@/lib/renders/service";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { id } = await params;
  const render = await getRenderDetail(session.user.id, id);
  if (!render) {
    return NextResponse.json({ error: "Render tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(render);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  if (!note) {
    return NextResponse.json(
      { error: "Catatan wajib diisi sebelum menghapus render" },
      { status: 400 },
    );
  }

  const { id } = await params;
  const ok = await deleteRenderPermanently(session.user.id, id);
  if (!ok) {
    return NextResponse.json({ error: "Render tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
