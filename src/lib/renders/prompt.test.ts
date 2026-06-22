import { describe, expect, it } from "vitest";

import { buildPrompt } from "./prompt";

describe("buildPrompt", () => {
  const interiorPrefix =
    "Convert this architectural interior screenshot into a realistic photograph, keeping everything exactly as it already appears in the image. " +
    "Reproduce every surface faithfully from the image — each material, color, tone and texture stays exactly as shown: each wood keeps its own real tone, grey stays grey, white stays white, marble stays marble, concrete stays concrete, fabric stays fabric, metal stays metal, every surface keeping its own original color and finish straight from the image, with their natural variety side by side. " +
    "Any white or light marble or natural-stone surface shows its real veining clearly, staying patterned stone rather than a plain flat colour; every marble and stone surface keeps its own base tone exactly as in the image — light stays light, dark stays dark. " +
    "Upholstered furniture keeps the exact same fabric colour it already has in the image — each sofa, chair and seat stays its own original colour. " +
    "Plain light-colored walls are smooth, flat, matte painted surfaces that keep their original off-white paint color and a clean, even, untextured finish. " +
    "Keep the exact same layout, camera angle, framing, and every object and piece of furniture in the same position and quantity as the image; surfaces that are empty stay empty. ";
  const interiorSuffix =
    " Add only photographic realism — lifelike textures, soft natural shadows, and reflections that match each surface's existing finish in the image. Photorealistic, sharp focus, true to the original image.";
  const referenceLighting = {
    morning:
      "Soft, gently warm mid-morning daylight from the windows fills and dominates the room at around 4500K — bright, diffused and even, only slightly warm, calm and fresh like mid-morning. The ceiling keeps its exact original shape and flat surface as in the image; only the light fixtures that already exist in the original ceiling glow softly and quietly, and the ceiling stays plain wherever the original has no fixture. The scene reads as soft, lightly warm morning daylight, bright and true to the original colors.",
    midday:
      "Bright, cool, neutral natural daylight from the windows fills and dominates the room at around 5500K, giving a clean cool daylight look. The ceiling keeps its exact original shape and flat surface as in the image; only the light fixtures that already exist in the original ceiling glow softly and quietly, and the ceiling stays plain wherever the original has no fixture. The scene reads clearly as bright cool daylight, neutral and true to the original colors.",
    night:
      "Any glass-door wardrobe, cabinet or display unit keeps its own interior contents — the shelves and items inside — visible behind its glass doors, lit from within. Night scene — outside the windows is dark (night sky, no daylight), but inside the room is brightly and evenly lit: all the interior light fixtures that already exist in the room are turned on, giving a clean, neutral 5000K residential ambiance. The interior stays bright and clearly lit, so every object, surface and detail remains fully visible and sharp — just as clear and detailed as in daylight, only at night, not dim or moody. The lighting affects only the atmosphere and colour temperature, never the material identity — every material keeps its own TRUE base colour, clearly visible, neither bleached nor darkened.",
    mixed:
      "Bright, cool, neutral natural daylight from the windows fills and stays dominant in the room at around 5500K, keeping the space bright and clean. In addition, soft warm-white 4000K LED accent lighting is gently switched on where it naturally suits this room, adding a subtle, tasteful warm glow that complements the daylight without overpowering it. The room stays bright and daylight-led, with only a gentle LED accent falling naturally on the surfaces that suit it.",
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
        },
        "photo",
      );
      expect(prompt).toBe(interiorPrefix + lighting + interiorSuffix);
    });
  }

  it("appends the instruction as an EXTRA_NOTE sentence for interiors", () => {
    const prompt = buildPrompt({
      mode: "interior",
      time: "midday",
      instruction: "  the dark recess is a wooden shelf niche.  ",
    });
    expect(prompt).toBe(
      interiorPrefix +
        referenceLighting.midday +
        interiorSuffix +
        " the dark recess is a wooden shelf niche.",
    );
  });

  it("adds nothing when the interior instruction is empty", () => {
    const withNote = buildPrompt({ mode: "interior", time: "midday", instruction: "   " });
    const without = buildPrompt({ mode: "interior", time: "midday" });
    expect(withNote).toBe(without);
  });

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
    expect(prompt).toContain("clean, neutral 5000K residential ambiance");
    expect(prompt).not.toContain("facade");
  });

  it("turns interior lamps off when not requested during daylight", () => {
    const prompt = buildPrompt({ mode: "interior", time: "midday", lightsOn: false });
    expect(prompt).toContain("clean cool daylight look");
    expect(prompt).toContain(
      "only the light fixtures that already exist in the original ceiling glow softly",
    );
    expect(prompt).not.toContain("glass-door wardrobe");
  });

  it("applies the glass wardrobe clause only at night", () => {
    const night = buildPrompt({ mode: "interior", time: "night" });
    const mixed = buildPrompt({ mode: "interior", time: "mixed" });

    expect(night).toContain("Any glass-door wardrobe, cabinet or display unit");
    expect(mixed).not.toContain("glass-door wardrobe");
  });

  it("ignores automatic and unknown optional values", () => {
    const prompt = buildPrompt({
      mode: "interior",
      style: "otomatis",
      time: "auto",
      weather: "auto",
      surrounding: "otomatis",
    });

    expect(prompt).toContain("soft warm-white 4000K LED accent lighting");
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
