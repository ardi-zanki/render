import { describe, expect, it } from "vitest";

import { getLatestRenderableAsset, isFinalRenderStatus } from "./types";

describe("isFinalRenderStatus", () => {
  it.each(["success", "failed", "cancelled", "refunded"])(
    "treats %s as final",
    (status) => {
      expect(isFinalRenderStatus(status)).toBe(true);
    },
  );

  it.each(["queued", "processing", "retrying"])(
    "treats %s as non-final",
    (status) => {
      expect(isFinalRenderStatus(status)).toBe(false);
    },
  );
});

describe("getLatestRenderableAsset", () => {
  it("picks the newest result or edit asset", () => {
    const assets = [
      {
        id: "original",
        type: "original" as const,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "result-v1",
        type: "result" as const,
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        id: "edit-v2",
        type: "edit" as const,
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      },
    ];

    expect(getLatestRenderableAsset(assets)?.id).toBe("edit-v2");
  });

  it("ignores non-renderable assets", () => {
    const assets = [
      {
        id: "original",
        type: "original" as const,
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      },
      {
        id: "reference",
        type: "reference" as const,
        createdAt: new Date("2026-01-04T00:00:00.000Z"),
      },
      {
        id: "result",
        type: "result" as const,
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ];

    expect(getLatestRenderableAsset(assets)?.id).toBe("result");
  });

  it("returns null when a render has no result or edit asset", () => {
    expect(
      getLatestRenderableAsset([
        {
          id: "original",
          type: "original" as const,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ]),
    ).toBeNull();
  });
});
