import { NextResponse } from "next/server";

import { consumeToken, verifyToken } from "@/lib/jwt";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { getResultAssetForDownload } from "@/lib/renders/service";
import { storage } from "@/lib/storage";
import { renderIdSchema } from "@/lib/validations/api";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = renderIdSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: "ID render tidak valid" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  try {
    await assertRateLimit("public_api", `download:${ip}`);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 429 },
      );
    }
    throw err;
  }

  const renderId = parsed.data;
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ error: "Token wajib diisi" }, { status: 400 });
  }

  const payload = await verifyToken(token, "signed_download").catch(() => null);
  if (!payload || payload.renderId !== renderId || !payload.sub || !payload.jti) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 403 });
  }

  const asset = await getResultAssetForDownload(String(payload.sub), renderId);
  if (!asset || asset.fileKey !== payload.fileKey) {
    return NextResponse.json(
      { error: "Hasil render tidak ditemukan" },
      { status: 404 },
    );
  }

  await consumeToken(payload.jti);
  const signedUrl = await storage().getSignedDownloadUrl(asset.fileKey, 600);
  return NextResponse.redirect(signedUrl);
}
