import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { storage } from "@/lib/storage";
import { profileUploadSchema } from "@/lib/validations/api";

export const runtime = "nodejs";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

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
        { success: false, code: err.code, message: err.message },
        { status: 429 },
      );
    }
    throw err;
  }

  const form = await req.formData();
  const parsed = profileUploadSchema.safeParse({
    name: form.get("name"),
    avatar: form.get("avatar"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Input profil tidak valid" }, { status: 400 });
  }
  const { name, avatar } = parsed.data;

  let imageUrl: string | undefined;
  if (avatar && avatar.size > 0) {
    const ext = ALLOWED[avatar.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Avatar harus JPG, PNG, atau WebP" },
        { status: 400 },
      );
    }
    if (avatar.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Ukuran avatar maksimal 5MB" },
        { status: 400 },
      );
    }
    const buffer = Buffer.from(await avatar.arrayBuffer());
    const key = `users/${session.user.id}/avatar-${Date.now()}.${ext}`;
    const stored = await storage().putObject({
      key,
      body: buffer,
      contentType: avatar.type,
    });
    imageUrl = stored.url;
  }

  await auth.api.updateUser({
    body: { name, ...(imageUrl ? { image: imageUrl } : {}) },
    headers: req.headers,
  });

  return NextResponse.json({ ok: true, name, image: imageUrl ?? null });
}
