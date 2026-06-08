import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  deleteRenderPermanently,
  getRenderDetail,
} from "@/lib/renders/service";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { renderDeleteSchema, renderIdSchema } from "@/lib/validations/api";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = renderIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "ID render tidak valid" }, { status: 400 });
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

  const render = await getRenderDetail(session.user.id, parsedId.data);
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

  const parsed = renderDeleteSchema.safeParse(
    await req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Catatan wajib diisi sebelum menghapus render" },
      { status: 400 },
    );
  }

  const { id } = await params;
  const parsedId = renderIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "ID render tidak valid" }, { status: 400 });
  }

  const ok = await deleteRenderPermanently(session.user.id, parsedId.data);
  if (!ok) {
    return NextResponse.json({ error: "Render tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
