import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/errors";
import { auth } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import {
  buildTexturePrompt,
  createRenderTextureEdit,
  findLibraryTexture,
  startInlineRenderProcessing,
} from "@/lib/renders/service";
import { validateImageFile } from "@/lib/uploads/images";
import { renderIdSchema } from "@/lib/validations/api";
import { textureEditSchema } from "@/lib/validations/render";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * Region/texture edit: inpaint a masked area of an existing successful render
 * with a chosen texture (Library item or uploaded reference) + optional
 * instruction. Produces a new version on the same render (1 credit).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    await assertRateLimit("create_render", userId);
  } catch (err) {
    const mapped = errorResponse(err);
    if (mapped) return mapped;
    throw err;
  }

  const { id } = await params;
  const parsedId = renderIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "ID render tidak valid" }, { status: 400 });
  }

  const form = await req.formData();

  const maskFile = form.get("mask");
  if (!(maskFile instanceof File)) {
    return NextResponse.json(
      { error: "Mask seleksi wajib disertakan" },
      { status: 400 },
    );
  }
  let mask;
  try {
    mask = await validateImageFile(maskFile);
  } catch (err) {
    return (
      errorResponse(err) ??
      NextResponse.json({ error: "Mask tidak dapat dibaca" }, { status: 400 })
    );
  }

  let texture;
  const textureFile = form.get("texture");
  if (textureFile instanceof File && textureFile.size > 0) {
    try {
      texture = await validateImageFile(textureFile);
    } catch (err) {
      return (
        errorResponse(err) ??
        NextResponse.json(
          { error: "File tekstur tidak dapat dibaca" },
          { status: 400 },
        )
      );
    }
  }

  const rawFields = Object.fromEntries(
    ["libraryTextureId", "textureDescription", "instruction", "baseAssetId"]
      .map((k) => [k, form.get(k)] as const)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => [k, String(v)]),
  );
  const parsed = textureEditSchema.safeParse(rawFields);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Input tidak valid", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // Resolve the texture source → (UI label, English prompt description).
  let textureLabel: string;
  let textureDescription: string | undefined;
  if (input.libraryTextureId) {
    const lib = findLibraryTexture(input.libraryTextureId);
    if (!lib) {
      return NextResponse.json(
        { error: "Tekstur library tidak ditemukan" },
        { status: 400 },
      );
    }
    textureLabel = lib.name;
    textureDescription = lib.prompt;
  } else if (texture) {
    textureLabel = "Tekstur diunggah";
    textureDescription = "the uploaded reference texture";
  } else if (input.textureDescription?.trim()) {
    textureLabel = "Deskripsi tekstur";
    textureDescription = input.textureDescription.trim();
  } else {
    return NextResponse.json(
      { error: "Pilih tekstur dari Library, unggah referensi, atau isi deskripsi" },
      { status: 400 },
    );
  }

  const texturePrompt = buildTexturePrompt({
    textureLabel,
    textureDescription,
    instruction: input.instruction,
    referenceImage: Boolean(texture),
  });

  try {
    const result = await createRenderTextureEdit({
      userId,
      renderId: parsedId.data,
      mask,
      texture,
      texturePrompt,
      textureLabel,
      baseAssetId: input.baseAssetId,
    });
    startInlineRenderProcessing(
      result.renderId,
      userId,
      "Background texture-edit job gagal:",
    );
    return NextResponse.json(result);
  } catch (err) {
    const mapped = errorResponse(err, { aiPrefix: "Edit tekstur gagal" });
    if (mapped) return mapped;
    const msg = err instanceof Error ? err.message : "Edit tekstur gagal";
    return NextResponse.json(
      { error: msg, code: "TEXTURE_EDIT_FAILED" },
      { status: 500 },
    );
  }
}
