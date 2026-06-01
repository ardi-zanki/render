import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    await assertRateLimit("public_api", session.user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { success: false, code: err.code, message: err.message },
        { status: 429 },
      );
    }
    throw err;
  }

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!name || name.length > 120) {
    return NextResponse.json({ error: "Nama tidak valid" }, { status: 400 });
  }

  let imageUrl: string | undefined;
  const file = form.get("avatar");
  if (file instanceof File && file.size > 0) {
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Avatar harus JPG, PNG, atau WebP" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Ukuran avatar maksimal 5MB" },
        { status: 400 },
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `users/${session.user.id}/avatar-${Date.now()}.${ext}`;
    const stored = await storage().putObject({
      key,
      body: buffer,
      contentType: file.type,
    });
    imageUrl = stored.url;
  }

  await auth.api.updateUser({
    body: { name, ...(imageUrl ? { image: imageUrl } : {}) },
    headers: req.headers,
  });

  return NextResponse.json({ ok: true, name, image: imageUrl ?? null });
}
