import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { issueToken } from "@/lib/jwt";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { getResultAssetForDownload } from "@/lib/renders/queries";
import { renderIdSchema } from "@/lib/validations/api";

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
  const parsed = renderIdSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: "ID render tidak valid" }, { status: 400 });
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

  const renderId = parsed.data;
  const asset = await getResultAssetForDownload(session.user.id, renderId);
  if (!asset) {
    return NextResponse.json(
      { error: "Hasil render belum tersedia" },
      { status: 404 },
    );
  }

  const { token } = await issueToken({
    type: "signed_download",
    userId: session.user.id,
    claims: { renderId, fileKey: asset.fileKey },
  });

  return NextResponse.json({
    token,
    url: `/api/renders/${renderId}/download?token=${encodeURIComponent(token)}`,
  });
}
