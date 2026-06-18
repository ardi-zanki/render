import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { enableShare } from "@/lib/renders/share";
import { renderShareSchema } from "@/lib/validations/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

  const parsed = renderShareSchema.safeParse(
    await req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "renderId tidak valid" }, { status: 400 });
  }

  const result = await enableShare(session.user.id, parsed.data.renderId);
  if (!result) {
    return NextResponse.json(
      { error: "Render tidak ditemukan atau belum selesai" },
      { status: 404 },
    );
  }
  return NextResponse.json(result);
}
