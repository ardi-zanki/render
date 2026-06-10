import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  ImageUploadError,
  MIN_IMAGE_DIMENSION,
  validateImageFile,
} from "./images";

async function jpegFile(width: number, height: number, name = "x.jpg") {
  const data = await sharp({
    create: { width, height, channels: 3, background: { r: 180, g: 180, b: 180 } },
  })
    .jpeg()
    .toBuffer();
  return new File([new Uint8Array(data)], name, { type: "image/jpeg" });
}

describe("validateImageFile", () => {
  it("accepts a 640x480 image (below the old 512 floor)", async () => {
    const result = await validateImageFile(await jpegFile(640, 480));
    expect(result.width).toBe(640);
    expect(result.height).toBe(480);
    expect(result.ext).toBe("jpg");
  });

  it("accepts an image exactly at the minimum dimension", async () => {
    const result = await validateImageFile(
      await jpegFile(MIN_IMAGE_DIMENSION, MIN_IMAGE_DIMENSION),
    );
    expect(result.width).toBe(MIN_IMAGE_DIMENSION);
  });

  it("rejects an image with a side below the minimum", async () => {
    await expect(
      validateImageFile(await jpegFile(MIN_IMAGE_DIMENSION - 1, 400)),
    ).rejects.toThrowError(
      new ImageUploadError(
        `Resolusi gambar minimal ${MIN_IMAGE_DIMENSION} x ${MIN_IMAGE_DIMENSION} px`,
      ),
    );
  });

  it("rejects an unsupported file type", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "x.gif", {
      type: "image/gif",
    });
    await expect(validateImageFile(file)).rejects.toThrow(
      "Format gambar harus JPG, PNG, atau WebP",
    );
  });

  it("rejects an empty file", async () => {
    const file = new File([], "empty.jpg", { type: "image/jpeg" });
    await expect(validateImageFile(file)).rejects.toThrow(
      "Gambar desain wajib diunggah",
    );
  });
});
