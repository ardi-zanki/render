import { describe, expect, it } from "vitest";

import { renderResolvedDisplayName } from "./labels";

describe("renderResolvedDisplayName", () => {
  it("uses a renamed render name after trimming whitespace", () => {
    expect(renderResolvedDisplayName("  Dapur Utama  ", "interior")).toBe(
      "Dapur Utama",
    );
  });

  it("falls back to the default render display name", () => {
    expect(renderResolvedDisplayName(null, "exterior")).toBe("Render Exterior");
  });
});
