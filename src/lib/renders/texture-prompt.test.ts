import { describe, expect, it } from "vitest";

import { buildTexturePrompt } from "./prompt";

describe("buildTexturePrompt", () => {
  it("uses the texture description when provided", () => {
    const prompt = buildTexturePrompt({
      textureLabel: "White Marble",
      textureDescription: "polished white marble with subtle grey veining",
    });
    expect(prompt).toContain(
      "Replace the selected region with polished white marble with subtle grey veining.",
    );
    // Always blends with surroundings.
    expect(prompt).toContain("matching the surrounding lighting");
  });

  it("falls back to the label when there is no description", () => {
    const prompt = buildTexturePrompt({ textureLabel: "uploaded reference" });
    expect(prompt).toContain("Replace the selected region with uploaded reference.");
  });

  it("includes the user instruction when present", () => {
    const prompt = buildTexturePrompt({
      textureDescription: "oak wood",
      instruction: "make the grain run horizontally",
    });
    expect(prompt).toContain("make the grain run horizontally");
  });

  it("works with no texture and no instruction", () => {
    const prompt = buildTexturePrompt({});
    expect(prompt).toContain("Replace the selected region with the requested material.");
    expect(prompt.trim().length).toBeGreaterThan(0);
  });

  it("ignores blank/whitespace instruction", () => {
    const prompt = buildTexturePrompt({
      textureDescription: "concrete",
      instruction: "   ",
    });
    expect(prompt).not.toMatch(/\s{2,}\./);
    expect(prompt).toContain("Replace the selected region with concrete.");
  });
});
