import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { renameRender } from "@/lib/renders/service";
import { renderIdSchema } from "@/lib/validations/api";
import { renderNameSchema } from "@/lib/validations/render";

export const runtime = "nodejs";

export async function POST(
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

  const { id } = await params;
  const parsedId = renderIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "ID render tidak valid" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = renderNameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nama tidak valid", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ok = await renameRender(session.user.id, parsedId.data, parsed.data.name);
  if (!ok) {
    return NextResponse.json({ error: "Render tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, name: parsed.data.name });
}
