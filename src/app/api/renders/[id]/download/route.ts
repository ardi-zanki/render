import { NextResponse } from "next/server";

import { consumeToken, verifyToken } from "@/lib/jwt";
import { getResultAssetForDownload } from "@/lib/renders/service";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ error: "Token wajib diisi" }, { status: 400 });
  }

  const payload = await verifyToken(token, "signed_download").catch(() => null);
  if (!payload || payload.renderId !== id || !payload.sub || !payload.jti) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 403 });
  }

  const asset = await getResultAssetForDownload(String(payload.sub), id);
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
