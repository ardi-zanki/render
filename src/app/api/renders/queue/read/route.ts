import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { markRenderQueueSeen } from "@/lib/renders/jobs";
import { renderQueueReadSchema } from "@/lib/validations/api";

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

  const parsed = renderQueueReadSchema.safeParse(
    await req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Render ID tidak valid" }, { status: 400 });
  }

  await markRenderQueueSeen(session.user.id, parsed.data.renderId);
  return NextResponse.json({ ok: true });
}
