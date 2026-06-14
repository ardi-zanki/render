import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { MODE_LABEL } from "@/lib/renders/labels";
import { listRenders } from "@/lib/renders/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q")?.trim().slice(0, 120) ?? "";
  const rows = await listRenders(session.user.id, {
    limit: 6,
    search: query,
  });

  return NextResponse.json({
    items: rows.map((render) => ({
      id: render.id,
      title: render.name?.trim() || MODE_LABEL[render.mode],
      mode: MODE_LABEL[render.mode],
      projectName: render.projectName,
      createdAt: render.createdAt.toISOString(),
      thumbnailUrl: render.resultUrl ?? render.originalUrl,
    })),
  });
}
