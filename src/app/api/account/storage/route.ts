import { NextResponse } from "next/server";

import {
  clearUserRenderStorage,
  getUserStorageUsage,
} from "@/lib/storage/usage";
import { hasPasswordAccount } from "@/lib/account/service";
import { auth } from "@/lib/auth";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { isRecentAuthentication } from "@/lib/session";
import { storageDeleteSchema } from "@/lib/validations/api";

export const runtime = "nodejs";

async function requireApiSession(req: Request, authoritative = false) {
  const session = await auth.api.getSession({
    headers: req.headers,
    ...(authoritative ? { query: { disableCookieCache: true } } : {}),
  });
  if (!session) return null;
  if (!session.user.emailVerified) return null;
  return session;
}

export async function GET(req: Request) {
  const session = await requireApiSession(req);
  if (!session) {
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

  return NextResponse.json(await getUserStorageUsage(session.user.id));
}

export async function DELETE(req: Request) {
  const session = await requireApiSession(req, true);
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    await assertRateLimit("sensitive_action", session.user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 429 },
      );
    }
    throw err;
  }

  if (!isRecentAuthentication(session.session.createdAt)) {
    return NextResponse.json(
      {
        error: "Masuk kembali sebelum menghapus seluruh penyimpanan.",
        code: "REAUTH_REQUIRED",
      },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = storageDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Konfirmasi penghapusan tidak valid" },
      { status: 400 },
    );
  }

  if (await hasPasswordAccount(session.user.id)) {
    if (!parsed.data.password) {
      return NextResponse.json(
        { error: "Password wajib diisi", code: "PASSWORD_REQUIRED" },
        { status: 400 },
      );
    }
    try {
      await auth.api.verifyPassword({
        body: { password: parsed.data.password },
        headers: req.headers,
      });
    } catch {
      return NextResponse.json(
        { error: "Password tidak valid", code: "INVALID_PASSWORD" },
        { status: 403 },
      );
    }
  }

  const result = await clearUserRenderStorage(session.user.id);
  return NextResponse.json({
    ...result,
    usage: await getUserStorageUsage(session.user.id),
  });
}
