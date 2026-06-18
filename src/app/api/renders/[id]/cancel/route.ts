import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { cancelRenderJob } from "@/lib/renders/service";
import { renderIdSchema } from "@/lib/validations/api";

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

  const result = await cancelRenderJob(session.user.id, parsedId.data);
  if (result.ok) {
    return NextResponse.json({ ok: true, balance: result.balance });
  }

  if (result.reason === "render_not_found") {
    return NextResponse.json({ error: "Render tidak ditemukan" }, { status: 404 });
  }
  if (result.reason === "max_attempts_reached") {
    return NextResponse.json(
      {
        error:
          "Render sudah mencapai batas percobaan maksimal dan sedang difinalisasi.",
      },
      { status: 409 },
    );
  }
  return NextResponse.json(
    { error: "Render sudah tidak aktif di antrean" },
    { status: 409 },
  );
}
