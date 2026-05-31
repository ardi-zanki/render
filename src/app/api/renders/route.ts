import { NextResponse } from "next/server";

import { InsufficientCreditsError } from "@/lib/credits";
import { auth } from "@/lib/auth";
import { getDefaultProject, getProject } from "@/lib/projects/service";
import { AiProviderError } from "@/lib/providers/ai";
import { buildPrompt } from "@/lib/renders/prompt";
import { createRender, type UploadedFile } from "@/lib/renders/service";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { createRenderSchema } from "@/lib/validations/render";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function fileToUpload(file: File): Promise<UploadedFile | null> {
  const ext = ALLOWED[file.type];
  if (!ext) return null;
  return {
    data: Buffer.from(await file.arrayBuffer()),
    contentType: file.type,
    ext,
    fileName: file.name,
  };
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  if (!session.user.emailVerified) {
    return NextResponse.json(
      { error: "Email belum diverifikasi" },
      { status: 403 },
    );
  }
  const userId = session.user.id;

  try {
    await assertRateLimit("create_render", userId);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }

  const form = await req.formData();

  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Gambar desain wajib diunggah" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Ukuran gambar maksimal 10MB" },
      { status: 400 },
    );
  }
  const original = await fileToUpload(file);
  if (!original) {
    return NextResponse.json(
      { error: "Format gambar harus JPG, PNG, atau WebP" },
      { status: 400 },
    );
  }

  const rawFields = Object.fromEntries(
    [
      "mode",
      "style",
      "location",
      "surrounding",
      "time",
      "weather",
      "instruction",
      "outputFormat",
      "projectId",
    ]
      .map((k) => [k, form.get(k)] as const)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => [k, String(v)]),
  );

  const parsed = createRenderSchema.safeParse(rawFields);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Input tidak valid", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const project = input.projectId
    ? await getProject(userId, input.projectId)
    : await getDefaultProject(userId);
  if (!project) {
    return NextResponse.json(
      { error: "Project tidak ditemukan" },
      { status: 404 },
    );
  }

  let reference: UploadedFile | undefined;
  const refFile = form.get("reference");
  if (refFile instanceof File && refFile.size > 0) {
    reference = (await fileToUpload(refFile)) ?? undefined;
  }

  const prompt = buildPrompt(input);

  try {
    const result = await createRender({
      userId,
      projectId: project.id,
      mode: input.mode,
      prompt,
      outputFormat: input.outputFormat,
      original,
      reference,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: err.message, code: "INSUFFICIENT_CREDITS" },
        { status: 402 },
      );
    }
    if (err instanceof AiProviderError) {
      return NextResponse.json(
        { error: `Render gagal: ${err.message}`, code: err.code },
        { status: 502 },
      );
    }
    const msg = err instanceof Error ? err.message : "Render gagal";
    return NextResponse.json(
      { error: msg, code: "RENDER_FAILED" },
      { status: 500 },
    );
  }
}
