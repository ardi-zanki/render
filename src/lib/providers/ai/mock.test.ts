import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { createMockAiProvider } from "./mock";

async function inputImage() {
  return sharp({
    create: {
      width: 64,
      height: 64,
      channels: 3,
      background: { r: 180, g: 190, b: 200 },
    },
  })
    .png()
    .toBuffer();
}

describe("mock provider output format", () => {
  it.each([
    ["original", "image/png"],
    ["png", "image/png"],
    ["webp", "image/webp"],
    ["avif", "image/avif"],
    [undefined, "image/jpeg"],
  ])("maps outputFormat %s to %s", async (outputFormat, expected) => {
    const result = await createMockAiProvider().createRender({
      mode: "interior",
      imageUrl: "",
      imageBuffer: await inputImage(),
      outputFormat: outputFormat as never,
    });

    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0].contentType).toBe(expected);
  });
});
