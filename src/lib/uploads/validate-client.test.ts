import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  IMAGE_UPLOAD_MESSAGES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_DIMENSION,
  MIN_IMAGE_DIMENSION,
} from "./image-constraints";
import { validateImageFileClient } from "./validate-client";

// Drives the mocked <img> decode: dimensions reported on load, or an error.
let decoded: { width: number; height: number; fail: boolean };

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  set src(_value: string) {
    queueMicrotask(() => {
      if (decoded.fail) {
        this.onerror?.();
        return;
      }
      this.naturalWidth = decoded.width;
      this.naturalHeight = decoded.height;
      this.onload?.();
    });
  }
}

// validateImageFileClient only reads file.type and file.size, so a light stub
// is enough — the mocked Image supplies the dimensions independently.
function fakeFile({
  type = "image/png",
  size = 1024,
}: { type?: string; size?: number } = {}): File {
  return { type, size } as unknown as File;
}

beforeEach(() => {
  decoded = { width: 1024, height: 768, fail: false };
  vi.stubGlobal("Image", MockImage);
  globalThis.URL.createObjectURL = vi.fn(() => "blob:mock");
  globalThis.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("validateImageFileClient", () => {
  it("rejects an unsupported type before decoding", async () => {
    expect(await validateImageFileClient(fakeFile({ type: "application/pdf" }))).toBe(
      IMAGE_UPLOAD_MESSAGES.badType,
    );
  });

  it("rejects an empty file", async () => {
    expect(await validateImageFileClient(fakeFile({ size: 0 }))).toBe(
      IMAGE_UPLOAD_MESSAGES.required,
    );
  });

  it("rejects a file larger than 10 MB", async () => {
    expect(
      await validateImageFileClient(fakeFile({ size: MAX_IMAGE_BYTES + 1 })),
    ).toBe(IMAGE_UPLOAD_MESSAGES.tooLarge);
  });

  it("rejects an image below the minimum dimension", async () => {
    decoded = { width: MIN_IMAGE_DIMENSION - 1, height: 400, fail: false };
    expect(await validateImageFileClient(fakeFile())).toBe(
      IMAGE_UPLOAD_MESSAGES.tooSmall,
    );
  });

  it("rejects an image above the maximum dimension", async () => {
    decoded = { width: MAX_IMAGE_DIMENSION + 1, height: 800, fail: false };
    expect(await validateImageFileClient(fakeFile())).toBe(
      IMAGE_UPLOAD_MESSAGES.tooBig,
    );
  });

  it("rejects a file the browser cannot decode", async () => {
    decoded = { width: 0, height: 0, fail: true };
    expect(await validateImageFileClient(fakeFile())).toBe(
      IMAGE_UPLOAD_MESSAGES.unreadable,
    );
  });

  it("accepts a valid in-range image", async () => {
    decoded = { width: 1280, height: 720, fail: false };
    expect(await validateImageFileClient(fakeFile())).toBeNull();
  });
});
