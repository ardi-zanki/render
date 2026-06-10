import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { listActiveRenderQueue } from "@/lib/renders/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    await assertRateLimit("public_api", userId);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 429 },
      );
    }
    throw err;
  }

  const queue = await listActiveRenderQueue(userId, 20);

  return NextResponse.json({
    count: queue.count,
    items: queue.items.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      startedAt: row.startedAt?.toISOString() ?? null,
    })),
  });
}
