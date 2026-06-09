import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {},
}));

vi.mock("@/db/schema", () => ({
  renderAssets: {},
}));

vi.mock("@/lib/storage", () => ({
  renderAssetKey: vi.fn(),
  storage: vi.fn(),
}));

import { normalizeOutputFormat } from "./assets";

describe("normalizeOutputFormat", () => {
  it("keeps supported output formats", () => {
    expect(normalizeOutputFormat("png")).toBe("png");
    expect(normalizeOutputFormat("webp")).toBe("webp");
    expect(normalizeOutputFormat("avif")).toBe("avif");
  });

  it("falls back to jpg for missing or unsupported values", () => {
    expect(normalizeOutputFormat(undefined)).toBe("jpg");
    expect(normalizeOutputFormat(null)).toBe("jpg");
    expect(normalizeOutputFormat("pdf")).toBe("jpg");
  });
});
