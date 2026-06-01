import sharp from "sharp";

import { AiProviderError, type AiProvider } from "./types";

const CONTENT_TYPE_BY_FORMAT = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
} as const;

/**
 * Mock AI provider for local dev (no API key / external reachability needed).
 * Fetches the input image and applies a light "enhancement" with sharp so the
 * output visibly differs from the input — enough to exercise the full render
 * pipeline (upload → provider → persist → credit) end-to-end.
 */
export function createMockAiProvider(): AiProvider {
  return {
    name: "mock",
    async createRender(input) {
      let inputBuf: Buffer;
      if (input.imageBuffer) {
        inputBuf = input.imageBuffer;
      } else {
        const res = await fetch(input.imageUrl);
        if (!res.ok) {
          throw new AiProviderError(
            "Mock: gagal membaca gambar input",
            "FETCH_INPUT_FAILED",
          );
        }
        inputBuf = Buffer.from(await res.arrayBuffer());
      }

      const isUpscale = input.mode === "upscale";
      const format = input.outputFormat ?? "jpg";
      const image = sharp(inputBuf)
        .resize(isUpscale ? 2048 : 1024, isUpscale ? 2048 : 1024, {
          fit: "inside",
          withoutEnlargement: false,
        })
        .modulate({ saturation: 1.22, brightness: 1.04 })
        .sharpen();
      const data =
        format === "png"
          ? await image.png().toBuffer()
          : format === "webp"
            ? await image.webp({ quality: 88 }).toBuffer()
            : format === "avif"
              ? await image.avif({ quality: 60 }).toBuffer()
              : await image.jpeg({ quality: 88 }).toBuffer();

      // Simulate provider latency.
      await new Promise((r) => setTimeout(r, 1200));

      return {
        outputs: [{ data, contentType: CONTENT_TYPE_BY_FORMAT[format] }],
        raw: { provider: "mock", mode: input.mode },
      };
    },
  };
}
