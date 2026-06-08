import { NextResponse } from "next/server";

import {
  clearUserRenderStorage,
  getUserStorageUsage,
} from "@/lib/storage/usage";
import { auth } from "@/lib/auth";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export const runtime = "nodejs";

async function requireApiUser(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  if (!session.user.emailVerified) return null;
  return session.user;
}

export async function GET(req: Request) {
  const user = await requireApiUser(req);
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    await assertRateLimit("public_api", user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 429 },
      );
    }
    throw err;
  }

  return NextResponse.json(await getUserStorageUsage(user.id));
}

export async function DELETE(req: Request) {
  const user = await requireApiUser(req);
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    await assertRateLimit("public_api", user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 429 },
      );
    }
    throw err;
  }

  const result = await clearUserRenderStorage(user.id);
  return NextResponse.json({
    ...result,
    usage: await getUserStorageUsage(user.id),
  });
}
