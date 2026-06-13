import { NextResponse } from "next/server";

import { env } from "@/env";
import { errorResponse } from "@/lib/api/errors";
import { auth } from "@/lib/auth";
import { getDefaultProject, getProject } from "@/lib/projects/service";
import { buildPrompt } from "@/lib/renders/prompt";
import { createRender } from "@/lib/renders/service";
import { assertRateLimit } from "@/lib/rate-limit";
import { validateImageFile } from "@/lib/uploads/images";
import { createRenderSchema } from "@/lib/validations/render";

export const runtime = "nodejs";
export const maxDuration = 10;

function startInlineRenderProcessing(renderId: string, userId: string) {
  if (env.RENDER_PROCESSING_MODE !== "inline") return;

  setTimeout(() => {
    void import("@/lib/renders/processor")
      .then(({ processRenderJob }) => processRenderJob(renderId, `api-${userId}`))
      .catch((err) => {
        console.error("Background render job gagal:", err);
      });
  }, 0);
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
    await assertRateLimit("upload_image", userId);
  } catch (err) {
    const mapped = errorResponse(err);
    if (mapped) return mapped;
    throw err;
  }

  const form = await req.formData();

  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Gambar desain wajib diunggah" },
      { status: 400 },
    );
  }

  let original;
  try {
    original = await validateImageFile(file);
  } catch (err) {
    return (
      errorResponse(err) ??
      NextResponse.json(
        { error: "File gambar tidak dapat dibaca" },
        { status: 400 },
      )
    );
  }

  const rawFields = Object.fromEntries(
    [
      "mode",
      "name",
      "style",
      "location",
      "surrounding",
      "lightsOn",
      "time",
      "weather",
      "instruction",
      "outputFormat",
      "negativePrompt",
      "styleTransferStrength",
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

  let reference;
  const refFile = form.get("reference");
  if (refFile instanceof File && refFile.size > 0) {
    if (input.mode !== "style_transfer") {
      return NextResponse.json(
        { error: "Reference image hanya digunakan untuk Style Transfer" },
        { status: 400 },
      );
    }
    try {
      reference = await validateImageFile(refFile);
    } catch (err) {
      return (
        errorResponse(err) ??
        NextResponse.json(
          { error: "File referensi tidak dapat dibaca" },
          { status: 400 },
        )
      );
    }
  }

  if (input.mode === "style_transfer" && !reference) {
    return NextResponse.json(
      { error: "Reference image wajib diunggah untuk Style Transfer" },
      { status: 400 },
    );
  }

  const prompt = buildPrompt(input);
  // Persist the raw studio selections so the render can be reopened pre-filled.
  const config = {
    style: input.style,
    time: input.time,
    weather: input.weather,
    lightsOn: input.lightsOn,
    location: input.location,
    surrounding: input.surrounding,
    instruction: input.instruction,
  };

  try {
    const result = await createRender({
      userId,
      projectId: project.id,
      mode: input.mode,
      name: input.name,
      prompt,
      config,
      outputFormat: input.outputFormat,
      negativePrompt:
        input.mode === "style_transfer" ? input.negativePrompt : undefined,
      styleTransferStrength:
        input.mode === "style_transfer"
          ? input.styleTransferStrength
          : undefined,
      original,
      reference,
    });
    startInlineRenderProcessing(result.renderId, userId);
    return NextResponse.json(result);
  } catch (err) {
    const mapped = errorResponse(err);
    if (mapped) return mapped;
    const msg = err instanceof Error ? err.message : "Render gagal";
    return NextResponse.json(
      { error: msg, code: "RENDER_FAILED" },
      { status: 500 },
    );
  }
}
