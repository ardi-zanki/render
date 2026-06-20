import { describe, expect, it } from "vitest";

import { sceneTileVariant, visibleScenes } from "./scene-status";
import type { Scene } from "./types";

function scene(partial: Partial<Scene> & Pick<Scene, "status">): Scene {
  return {
    id: partial.id ?? `id-${partial.status}`,
    mode: partial.mode ?? "interior",
    status: partial.status,
    resultUrl: partial.resultUrl ?? null,
  };
}

describe("visibleScenes", () => {
  it("drops cancelled and refunded renders, keeps the rest", () => {
    const scenes: Scene[] = [
      scene({ status: "success", resultUrl: "https://x/y.jpg" }),
      scene({ status: "processing" }),
      scene({ status: "queued" }),
      scene({ status: "failed" }),
      scene({ status: "cancelled" }),
      scene({ status: "refunded" }),
    ];

    const result = visibleScenes(scenes);

    expect(result.map((s) => s.status)).toEqual([
      "success",
      "processing",
      "queued",
      "failed",
    ]);
  });

  it("returns an empty list when every render was cancelled or refunded", () => {
    const scenes: Scene[] = [
      scene({ status: "cancelled" }),
      scene({ status: "refunded" }),
    ];
    expect(visibleScenes(scenes)).toHaveLength(0);
  });
});

describe("sceneTileVariant", () => {
  it("shows the image whenever a result URL exists", () => {
    expect(
      sceneTileVariant(scene({ status: "success", resultUrl: "https://x/y.jpg" })),
    ).toBe("image");
  });

  it("maps queued and processing to the processing placeholder", () => {
    expect(sceneTileVariant(scene({ status: "queued" }))).toBe("processing");
    expect(sceneTileVariant(scene({ status: "processing" }))).toBe("processing");
  });

  it("maps a failed render without a result to the failed placeholder", () => {
    expect(sceneTileVariant(scene({ status: "failed" }))).toBe("failed");
  });

  it("falls back to a neutral placeholder for an unexpected no-result state", () => {
    // success without a URL should never happen, but must not show a label.
    expect(sceneTileVariant(scene({ status: "success" }))).toBe("placeholder");
  });
});
