import { describe, expect, it } from "vitest";

import { buildPrompt } from "./prompt";

describe("buildPrompt", () => {
  it("builds a positive, instruction-style exterior prompt from controls", () => {
    const prompt = buildPrompt({
      mode: "exterior",
      style: "modern",
      location: "Bandung",
      surrounding: "urban street context with neighboring buildings",
      lightsOn: true,
      time: "sore",
      weather: "hujan",
      instruction: "keep the original facade proportions",
    });

    // FLUX.2-style: starts with a positive editing instruction, no keyword list.
    expect(prompt).toContain(
      "Convert this architectural exterior screenshot into a realistic photograph",
    );
    expect(prompt).toContain("modern character");
    expect(prompt).toContain("golden-hour sunset light");
    expect(prompt).toContain("rainy atmosphere with wet, reflective surfaces");
    expect(prompt).toContain("urban street context with neighboring buildings");
    expect(prompt).toContain("lights glow warmly");
    expect(prompt).toContain("Bandung");
    expect(prompt).toContain("keep the original facade proportions");
    expect(prompt).toContain("true to the original image");
    // FLUX.2 prefers no negation / no "8k" keyword stuffing.
    expect(prompt).not.toContain("8k");
  });

  it("uses interior-specific lighting language", () => {
    const prompt = buildPrompt({
      mode: "interior",
      lightsOn: true,
    });

    expect(prompt).toContain(
      "Convert this architectural interior screenshot into a realistic photograph",
    );
    expect(prompt).toContain("Warm interior lighting is on at about 2700K");
    expect(prompt).not.toContain("facade");
  });

  it("turns interior lamps off when not requested during daylight", () => {
    const prompt = buildPrompt({ mode: "interior", time: "siang", lightsOn: false });
    expect(prompt).toContain("cool midday daylight");
    expect(prompt).toContain("All interior lamps stay off");
  });

  it("ignores automatic and unknown optional values", () => {
    const prompt = buildPrompt({
      mode: "interior",
      style: "otomatis",
      time: "auto",
      weather: "auto",
      surrounding: "otomatis",
    });

    expect(prompt).toContain("Even, natural daylight fills the room");
    expect(prompt).not.toContain("aesthetic");
    expect(prompt).not.toContain("Through the windows there is");
  });

  it("keeps a concise keyword prompt for style transfer", () => {
    const prompt = buildPrompt({ mode: "style_transfer", style: "industrial" });
    expect(prompt).toContain("applying the reference image style");
    expect(prompt).toContain("industrial style");
  });
});
