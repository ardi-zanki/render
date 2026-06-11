import { NextResponse } from "next/server";

import { env } from "@/env";
import { auth } from "@/lib/auth";
import { InsufficientCreditsError } from "@/lib/credits";
import { AiProviderError } from "@/lib/providers/ai";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { buildPrompt } from "@/lib/renders/prompt";
import { createRenderEdit, getRenderDetail } from "@/lib/renders/service";
import { renderIdSchema } from "@/lib/validations/api";
import { createRenderSchema } from "@/lib/validations/render";

export const runtime = "nodejs";
export const maxDuration = 10;

function startInlineRenderProcessing(renderId: string, userId: string) {
  if (env.RENDER_PROCESSING_MODE !== "inline") return;
  setTimeout(() => {
    void import("@/lib/renders/processor")
      .then(({ processRenderJob }) => processRenderJob(renderId, `api-${userId}`))
      .catch((err) => console.error("Background edit job gagal:", err));
  }, 0);
}

/**
 * Re-render ("edit") an existing render in place: a new version on the SAME
 * render, charging 1 credit. The mode and original image are fixed; only the
 * studio config + prompt change.
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

  const render = await getRenderDetail(userId, parsedId.data);
  if (!render) {
    return NextResponse.json({ error: "Render tidak ditemukan" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  // Mode is fixed to the render's; validate the rest with the create schema.
  const parsed = createRenderSchema.safeParse({ ...body, mode: render.mode });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Input tidak valid", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // Iterative base: the chosen version, or the latest one by default. Editing a
  // rendered photo uses a "photo" prompt; the original sketch uses "sketch".
  const baseAssetId =
    typeof body.baseAssetId === "string" ? body.baseAssetId : undefined;
  const baseAsset = baseAssetId
    ? render.assets.find((a) => a.id === baseAssetId)
    : [...render.assets]
        .reverse()
        .find((a) => a.type === "result" || a.type === "edit");
  const promptBase = baseAsset?.type === "original" ? "sketch" : "photo";

  const prompt = buildPrompt(input, promptBase);
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
    const result = await createRenderEdit({
      userId,
      renderId: parsedId.data,
      config,
      prompt,
      baseAssetId,
    });
    startInlineRenderProcessing(result.renderId, userId);
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
        { error: `Edit gagal: ${err.message}`, code: err.code },
        { status: 502 },
      );
    }
    const msg = err instanceof Error ? err.message : "Edit gagal";
    return NextResponse.json({ error: msg, code: "EDIT_FAILED" }, { status: 500 });
  }
}
