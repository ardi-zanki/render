import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { deleteRenderPermanently } from "@/lib/renders/archive-delete";
import { renderResolvedDisplayName } from "@/lib/renders/labels";
import { getRenderDetail } from "@/lib/renders/queries";
import { moveRenderToProject } from "@/lib/renders/update";
import {
  renderDeleteSchema,
  renderIdSchema,
  renderMoveProjectSchema,
} from "@/lib/validations/api";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = renderIdSchema.safeParse(id);
  if (!parsedId.success) {
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

  const render = await getRenderDetail(session.user.id, parsedId.data);
  if (!render) {
    return NextResponse.json({ error: "Render tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(render);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
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

  const { id } = await params;
  const parsedId = renderIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "ID render tidak valid" }, { status: 400 });
  }

  const parsed = renderDeleteSchema.safeParse(
    await req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nama render wajib diisi sebelum menghapus render" },
      { status: 400 },
    );
  }

  const render = await getRenderDetail(session.user.id, parsedId.data);
  if (!render) {
    return NextResponse.json({ error: "Render tidak ditemukan" }, { status: 404 });
  }

  const expectedName = renderResolvedDisplayName(render.name, render.mode);
  if (parsed.data.confirmationName !== expectedName) {
    return NextResponse.json(
      { error: `Ketik "${expectedName}" untuk menghapus render` },
      { status: 400 },
    );
  }

  const ok = await deleteRenderPermanently(session.user.id, parsedId.data);
  if (!ok) {
    return NextResponse.json({ error: "Render tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
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

  const { id } = await params;
  const parsedId = renderIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "ID render tidak valid" }, { status: 400 });
  }

  const parsed = renderMoveProjectSchema.safeParse(
    await req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Project tujuan tidak valid" },
      { status: 400 },
    );
  }

  const result = await moveRenderToProject(
    session.user.id,
    parsedId.data,
    parsed.data.targetProjectId,
  );

  if (!result.ok) {
    if (result.reason === "render_not_found") {
      return NextResponse.json(
        { error: "Render tidak ditemukan" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Project tujuan tidak ditemukan atau sudah diarsipkan" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    projectId: parsed.data.targetProjectId,
    projectName: result.projectName,
  });
}
