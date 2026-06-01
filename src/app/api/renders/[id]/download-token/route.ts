import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { issueToken } from "@/lib/jwt";
import { getResultAssetForDownload } from "@/lib/renders/service";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { id } = await params;
  const asset = await getResultAssetForDownload(session.user.id, id);
  if (!asset) {
    return NextResponse.json(
      { error: "Hasil render belum tersedia" },
      { status: 404 },
    );
  }

  const { token } = await issueToken({
    type: "signed_download",
    userId: session.user.id,
    claims: { renderId: id, fileKey: asset.fileKey },
  });

  return NextResponse.json({
    token,
    url: `/api/renders/${id}/download?token=${encodeURIComponent(token)}`,
  });
}
