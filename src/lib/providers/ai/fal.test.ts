import sharp from "sharp";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  subscribeCalls: [] as Array<{
    endpoint: string;
    input: Record<string, unknown>;
  }>,
  uploadUrl: "https://fake.fal/in.png",
  responseDataUrl: "",
  responseBytes: Buffer.alloc(0),
}));

vi.mock("@/env", () => ({
  env: {
    FAL_KEY: "id:secret",
    FAL_KEY_ID: undefined,
    FAL_KEY_SECRET: undefined,
    FAL_RENDER_MODEL: "fal-ai/flux-2-pro/edit",
    FAL_STYLE_TRANSFER_MODEL: "fal-ai/uso",
    FAL_UPSCALE_MODEL: "fal-ai/aura-sr",
    FAL_INPAINT_MODEL: "fal-ai/flux-pro/v1/fill",
    FAL_RENDER_MAX_EDGE: 2048,
    FAL_RENDER_SAFETY_TOLERANCE: "2",
    FAL_RENDER_SEED: undefined,
    FAL_START_TIMEOUT_SECONDS: 300,
  },
}));

vi.mock("@fal-ai/client", () => ({
  ApiError: class ApiError extends Error {},
  createFalClient: () => ({
    storage: { upload: vi.fn(async () => hoisted.uploadUrl) },
    subscribe: vi.fn(
      async (endpoint: string, opts: { input: Record<string, unknown> }) => {
        hoisted.subscribeCalls.push({ endpoint, input: opts.input });
        return {
          requestId: "req-1",
          data: {
            images: [
              { url: hoisted.responseDataUrl, content_type: "image/png" },
            ],
          },
        };
      },
    ),
  }),
}));

import { createFalAiProvider } from "./fal";

beforeAll(async () => {
  const png = await sharp({
    create: { width: 1, height: 1, channels: 3, background: { r: 5, g: 6, b: 7 } },
  })
    .png()
    .toBuffer();
  hoisted.responseBytes = Buffer.from(png);
  hoisted.responseDataUrl = `data:image/png;base64,${png.toString("base64")}`;
});

beforeEach(() => {
  hoisted.subscribeCalls.length = 0;
});

async function inputImage(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 3, background: { r: 1, g: 2, b: 3 } },
  })
    .png()
    .toBuffer();
}

describe("fal provider (flux-2-pro/edit)", () => {
  it('pins image_size (~2K, /32), requests png, and passes bytes through for "original"', async () => {
    const result = await createFalAiProvider().createRender({
      mode: "interior",
      imageUrl: "",
      imageBuffer: await inputImage(1000, 500),
      outputFormat: "original",
      prompt: "make it photoreal",
    });

    expect(hoisted.subscribeCalls).toHaveLength(1);
    const { endpoint, input } = hoisted.subscribeCalls[0];
    expect(endpoint).toBe("fal-ai/flux-2-pro/edit");
    expect(input.image_urls).toEqual([hoisted.uploadUrl]);
    expect(input.image_size).toEqual({ width: 2048, height: 1024 });
    expect(input.output_format).toBe("png");
    expect(input.safety_tolerance).toBe("2");

    // keepOriginal: the provider's bytes are returned untouched (no re-encode).
    expect(result.outputs[0].contentType).toBe("image/png");
    expect(result.outputs[0].data).toEqual(hoisted.responseBytes);
  });

  it("uses FLUX.1 Fill for text-guided masked texture edits", async () => {
    await createFalAiProvider().createRender({
      mode: "interior",
      operation: "inpaint",
      imageUrl: "https://fake.fal/base.png",
      imageBuffer: await inputImage(800, 600),
      maskUrl: "https://fake.fal/mask.png",
      maskBuffer: await inputImage(800, 600),
      prompt: "replace the masked surface with oak",
    });

    const { endpoint, input } = hoisted.subscribeCalls[0];
    expect(endpoint).toBe("fal-ai/flux-pro/v1/fill");
    expect(input.mask_url).toBe(hoisted.uploadUrl);
    expect(input.image_url).toBe(hoisted.uploadUrl);
  });

  it("uses FLUX.2 multi-reference editing for an uploaded texture", async () => {
    await createFalAiProvider().createRender({
      mode: "interior",
      operation: "inpaint",
      imageUrl: "https://fake.fal/base.png",
      imageBuffer: await inputImage(800, 600),
      maskUrl: "https://fake.fal/mask.png",
      maskBuffer: await inputImage(800, 600),
      referenceUrl: "https://fake.fal/texture.png",
      referenceBuffer: await inputImage(200, 200),
      prompt: "use the uploaded material reference",
    });

    const { endpoint, input } = hoisted.subscribeCalls[0];
    expect(endpoint).toBe("fal-ai/flux-2-pro/edit");
    expect(input.image_urls).toEqual([
      hoisted.uploadUrl,
      hoisted.uploadUrl,
      hoisted.uploadUrl,
    ]);
    expect(input.prompt).toContain("Image 2 is the material reference");
    expect(input.image_size).toEqual({ width: 2048, height: 1536 });
  });

  it("re-encodes to the requested format when not original", async () => {
    const result = await createFalAiProvider().createRender({
      mode: "interior",
      imageUrl: "",
      imageBuffer: await inputImage(800, 600),
      outputFormat: "webp",
      prompt: "make it photoreal",
    });

    const { input } = hoisted.subscribeCalls[0];
    // webp isn't a fal output, so we ask fal for jpeg then convert ourselves.
    expect(input.output_format).toBe("jpeg");
    expect(result.outputs[0].contentType).toBe("image/webp");
  });
});
