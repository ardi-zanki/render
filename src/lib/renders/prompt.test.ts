import { describe, expect, it } from "vitest";

import { buildPrompt } from "./prompt";

describe("buildPrompt", () => {
  it("builds a detailed exterior render prompt from selected controls", () => {
    const prompt = buildPrompt({
      mode: "exterior",
      style: "modern",
      location: "Bandung",
      surrounding: "urban residential context",
      lightsOn: true,
      time: "sore",
      weather: "hujan",
      instruction: "keep the original facade proportions",
    });

    expect(prompt).toContain("photorealistic exterior architectural rendering");
    expect(prompt).toContain("modern style");
    expect(prompt).toContain("warm golden hour sunset light");
    expect(prompt).toContain("rainy atmosphere, wet surfaces");
    expect(prompt).toContain("urban residential context");
    expect(prompt).toContain(
      "building lights switched on, warm architectural lighting visible",
    );
    expect(prompt).toContain("location context: Bandung");
    expect(prompt).toContain("keep the original facade proportions");
    expect(prompt).toContain("high detail, professional photography, 8k");
  });

  it("uses interior-specific lighting language", () => {
    const prompt = buildPrompt({
      mode: "interior",
      lightsOn: true,
    });

    expect(prompt).toContain(
      "interior lights switched on, warm realistic lighting",
    );
    expect(prompt).not.toContain("building lights switched on");
  });

  it("ignores automatic and unknown optional values", () => {
    const prompt = buildPrompt({
      mode: "interior",
      style: "otomatis",
      time: "auto",
      weather: "auto",
      surrounding: "otomatis",
    });

    expect(prompt).toBe(
      [
        "photorealistic interior architectural rendering",
        "high detail, professional photography, 8k",
      ].join(", "),
    );
  });
});
