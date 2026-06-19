import { describe, expect, it } from "vitest";

import { buildPrompt } from "./prompt";

describe("buildPrompt", () => {
  const interiorPrefix =
    "Convert this architectural interior screenshot into a realistic photograph, keeping everything exactly as it already appears in the image. " +
    "Reproduce every surface faithfully from the image — each material, color, tone and texture stays exactly as shown: each wood keeps its own real tone, grey stays grey, white stays white, marble stays marble, concrete stays concrete, fabric stays fabric, metal stays metal, every surface keeping its own original color and finish straight from the image, with their natural variety side by side. " +
    "Plain light-colored walls are smooth, flat, matte painted surfaces that keep their original off-white paint color and a clean, even, untextured finish. " +
    "Keep the exact same layout, camera angle, framing, and every object and piece of furniture in the same position and quantity as the image; surfaces that are empty stay empty. " +
    "Any glass-door wardrobe, cabinet or display unit is a piece of interior furniture that keeps its own interior contents — the shelves, hanging clothes and items inside — clearly visible behind its glass doors, lit from within the room. ";
  const interiorSuffix =
    " Add only photographic realism — lifelike textures, soft natural shadows, and reflections that match each surface's existing finish in the image. Photorealistic, sharp focus, true to the original image.";
  const referenceLighting = {
    morning:
      "Soft early-morning daylight enters low through the windows at about 4000K — gently warm, soft and natural, casting long soft shadows; the room is lit only by this daylight, and all interior lamps, cove strips and downlights stay off and dark, the ceiling plain with no glow.",
    midday:
      "Bright, cool midday daylight at about 5500K fills the room evenly through the windows; the room is lit only by this daylight, and all interior lamps, cove strips and downlights stay off and dark.",
    night:
      "Night outside the windows with a dark sky. The interior is warmly and comfortably well-lit at 2700K, clearly bright and inviting like a home at night with all its lamps on. Warm LED cove strips run softly along the ceiling edges and recessed warm downlights in the ceiling glow gently, together filling the whole room with even, warm, comfortable brightness and a soft glow across the ceiling. Every material keeps its own true color clearly visible under the warm light.",
    mixed:
      "Bright, cool, neutral natural daylight from the windows fills and dominates the room at around 5500K, giving a clean cool daylight look. The ceiling keeps its exact original shape and flat surface as in the image; only the light fixtures that already exist in the original ceiling glow softly and quietly, and the ceiling stays plain wherever the original has no fixture. The scene reads clearly as bright cool daylight, neutral and true to the original colors.",
  } as const;

  for (const [time, lighting] of Object.entries(referenceLighting)) {
    it(`matches the Python interior prompt exactly for ${time}`, () => {
      const prompt = buildPrompt(
        {
          mode: "interior",
          time,
          style: "industrial",
          location: "Bandung",
          surrounding: "forest view",
          instruction: "change the sofa",
        },
        "photo",
      );
      expect(prompt).toBe(interiorPrefix + lighting + interiorSuffix);
    });
  }

  it("builds a positive, instruction-style exterior prompt from controls", () => {
    const prompt = buildPrompt({
      mode: "exterior",
      style: "modern",
      location: "Bandung",
      surrounding: "urban street context with neighboring buildings",
      lightsOn: true,
      time: "evening",
      weather: "rain",
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
      time: "night",
    });

    expect(prompt).toContain(
      "Convert this architectural interior screenshot into a realistic photograph",
    );
    expect(prompt).toContain("comfortably well-lit at 2700K");
    expect(prompt).not.toContain("facade");
  });

  it("turns interior lamps off when not requested during daylight", () => {
    const prompt = buildPrompt({ mode: "interior", time: "midday", lightsOn: false });
    expect(prompt).toContain("cool midday daylight");
    expect(prompt).toContain("all interior lamps, cove strips and downlights stay off");
  });

  it("ignores automatic and unknown optional values", () => {
    const prompt = buildPrompt({
      mode: "interior",
      style: "otomatis",
      time: "auto",
      weather: "auto",
      surrounding: "otomatis",
    });

    expect(prompt).toContain("clean cool daylight look");
    expect(prompt).not.toContain("aesthetic");
  });

  it("keeps the reference interior prompt unchanged for iterative edits", () => {
    const sketch = buildPrompt({ mode: "interior" });
    const photo = buildPrompt({ mode: "interior" }, "photo");
    expect(photo).toBe(sketch);
  });

  it("keeps a concise keyword prompt for style transfer", () => {
    const prompt = buildPrompt({ mode: "style_transfer", style: "industrial" });
    expect(prompt).toContain("applying the reference image style");
    expect(prompt).toContain("industrial style");
  });
});
