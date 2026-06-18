import type { RenderMode } from "@/db/schema";

export interface RenderOptions {
  mode: RenderMode;
  style?: string;
  location?: string;
  surrounding?: string;
  lightsOn?: boolean;
  time?: string;
  weather?: string;
  instruction?: string;
}

const isAuto = (v?: string) => !v || v === "auto" || v === "otomatis";

/**
 * Interior/Exterior prompts target FLUX.2 [pro] edit, which differs sharply
 * from Gemini/SD-style models (BFL guidance, 2026):
 *   1. No negative prompts — describe what you want, not what to avoid.
 *   2. Editing = concise positive instructions: state the transformation plus
 *      what to preserve; the model keeps composition by default.
 *   3. Colors stay accurate when tied to the object ("true to original color").
 * So we emit a short, positive, instruction-style prompt rather than a long
 * comma-separated keyword list. Style Transfer / Upscale keep the lightweight
 * keyword form since they run on different endpoints (USO / Aura-SR).
 */

// Bare style adjectives, woven in as gentle reinforcement of the existing design.
const STYLE: Record<string, string> = {
  modern: "modern",
  minimalist: "minimalist",
  industrial: "industrial",
  scandinavian: "Scandinavian",
  classic: "classic",
  tropical: "tropical",
  contemporary: "contemporary",
  tropical_modern: "tropical modern",
  japandi: "Japandi minimalist",
  brutalist: "brutalist",
  futuristic: "futuristic",
};

// Positive daylight descriptions per time of day (FLUX.2 processes no negation).
const INTERIOR_DAYLIGHT: Record<string, string> = {
  morning:
    "Soft early-morning daylight enters low through the windows at about 4000K, gently warm and natural, casting long soft shadows.",
  midday:
    "Bright, cool midday daylight at about 5500K fills the room evenly through the windows.",
  evening:
    "Warm golden-hour light at about 3200K rakes in low through the windows, giving the room a soft amber glow.",
  night:
    "Night outside the windows with a dark sky, the room reading clearly as a home at evening.",
};

const EXTERIOR_DAYLIGHT: Record<string, string> = {
  morning:
    "Soft early-morning sunlight at a low angle, warm and gentle, with long soft shadows.",
  midday: "Bright midday sun with clear, strong natural daylight.",
  evening:
    "Warm golden-hour sunset light with long shadows and an amber glow across the sky.",
  night: "A deep blue dusk-to-night sky behind the building.",
};

const WEATHER_SKY: Record<string, string> = {
  clear: "a clear blue sky",
  cloudy: "a partly cloudy sky",
  overcast: "a soft overcast sky with even, diffuse light",
  drizzle: "a light drizzle with subtly wet, reflective surfaces",
  rain: "a rainy atmosphere with wet, reflective surfaces",
  fog: "a soft, hazy foggy atmosphere",
};

const REALISM_CLOSER =
  "Add only photographic realism — lifelike textures, soft natural shadows and reflections that match each surface's existing finish in the image. Photorealistic, sharp focus, true to the original image.";

function styleWord(o: RenderOptions) {
  return !isAuto(o.style) && o.style ? STYLE[o.style] : undefined;
}

function interiorLighting(o: RenderOptions): string {
  const daylight = !isAuto(o.time) && o.time ? INTERIOR_DAYLIGHT[o.time] : undefined;
  // A dark interior photo is never useful, so night always reads with lamps on.
  const lampsOn = Boolean(o.lightsOn) || o.time === "night";

  const sentences: string[] = [];
  if (daylight) sentences.push(daylight);
  else if (!lampsOn) sentences.push("Even, natural daylight fills the room through the windows.");

  if (lampsOn) {
    sentences.push(
      "Warm interior lighting is on at about 2700K — recessed downlights and LED cove strips glow gently, filling the whole room with even, warm, comfortable brightness while every material keeps its own true color.",
    );
  } else {
    sentences.push("All interior lamps stay off, the room lit only by the natural daylight.");
  }
  return sentences.join(" ");
}

function exteriorLighting(o: RenderOptions): string | undefined {
  const daylight = !isAuto(o.time) && o.time ? EXTERIOR_DAYLIGHT[o.time] : undefined;
  const sky = !isAuto(o.weather) && o.weather ? WEATHER_SKY[o.weather] : undefined;
  const lampsOn = Boolean(o.lightsOn) || o.time === "night";

  const sentences: string[] = [];
  if (daylight && sky) sentences.push(`${daylight} The scene sits under ${sky}.`);
  else if (daylight) sentences.push(daylight);
  else if (sky) sentences.push(`The building sits under ${sky}.`);

  if (lampsOn) {
    sentences.push(
      "The building's lights glow warmly, visible through the windows and along the facade.",
    );
  }
  return sentences.length ? sentences.join(" ") : undefined;
}

function buildInterior(o: RenderOptions, base: PromptBase): string {
  const style = styleWord(o);
  const parts: (string | undefined)[] = [
    base === "photo"
      ? "Edit this realistic interior photograph to match the requested settings, keeping everything else exactly as it appears — the same layout, furniture, materials, colors, framing and camera angle."
      : "Convert this architectural interior screenshot into a realistic photograph, keeping everything exactly as it already appears in the image.",
    "Reproduce every surface faithfully — each material, color, tone and texture stays exactly as shown: each wood keeps its own real tone, grey stays grey, white stays white, marble stays marble, concrete stays concrete, fabric stays fabric and metal stays metal, every surface keeping its own original color and finish straight from the image.",
    "Keep the exact same layout, camera angle, framing and every object and piece of furniture in the same position and quantity as the image; surfaces that are empty stay empty.",
    "Any glass-door wardrobe, cabinet or display unit keeps its own interior contents — the shelves, hanging clothes and items inside — clearly visible behind its glass doors.",
    style ? `The interior keeps its ${style} aesthetic.` : undefined,
    interiorLighting(o),
    o.surrounding && !isAuto(o.surrounding) ? `Through the windows there is ${o.surrounding}.` : undefined,
    o.location ? `The setting is ${o.location}.` : undefined,
    o.instruction?.trim() || undefined,
    REALISM_CLOSER,
  ];
  return parts.filter(Boolean).join(" ");
}

function buildExterior(o: RenderOptions, base: PromptBase): string {
  const style = styleWord(o);
  const parts: (string | undefined)[] = [
    base === "photo"
      ? "Edit this realistic exterior photograph to match the requested settings, keeping the building's exact form, proportions, materials, openings, framing and camera as they appear."
      : "Convert this architectural exterior screenshot into a realistic photograph, keeping the building's exact form, proportions, materials, openings and layout as in the image.",
    "Reproduce every surface faithfully — each material, color, tone and texture stays exactly as shown, every facade element keeping its own original color and finish straight from the image.",
    "Keep the exact same camera angle, framing and composition as the image.",
    style ? `The architecture keeps its ${style} character.` : undefined,
    exteriorLighting(o),
    o.surrounding && !isAuto(o.surrounding) ? `The building is set in ${o.surrounding}.` : undefined,
    o.location ? `The setting is ${o.location}.` : undefined,
    o.instruction?.trim() || undefined,
    REALISM_CLOSER,
  ];
  return parts.filter(Boolean).join(" ");
}

// Style Transfer (USO) and Upscale (Aura-SR) keep a concise keyword prompt.
const MODE_BASE: Record<"style_transfer" | "upscale", string> = {
  style_transfer:
    "architectural rendering applying the reference image style, photorealistic",
  upscale: "high-resolution detailed architectural render",
};

function buildStyleOrUpscale(o: RenderOptions): string {
  const parts: string[] = [MODE_BASE[o.mode as "style_transfer" | "upscale"]];
  const style = styleWord(o);
  if (style) parts.push(`${style} style`);
  if (o.instruction?.trim()) parts.push(o.instruction.trim());
  parts.push("high detail, professional photography");
  return parts.join(", ");
}

/**
 * Whether the prompt edits an existing rendered photo ("photo") or converts the
 * uploaded sketch/screenshot into a photo ("sketch", the default).
 */
export type PromptBase = "sketch" | "photo";

/** Compose render controls (English values) into an English prompt. */
export function buildPrompt(o: RenderOptions, base: PromptBase = "sketch"): string {
  if (o.mode === "interior") return buildInterior(o, base);
  if (o.mode === "exterior") return buildExterior(o, base);
  return buildStyleOrUpscale(o);
}

export interface TexturePromptOptions {
  /** Library item name or "uploaded reference" — used when no description. */
  textureLabel?: string;
  /** Descriptive material phrase (library catalog prompt). */
  textureDescription?: string;
  /** Free-text user instruction for the edit. */
  instruction?: string;
}

/**
 * Build the inpaint prompt for the region/texture editor. The masked region is
 * regenerated with the chosen material while the rest of the image is kept; the
 * surrounding lighting/perspective is matched for a seamless blend. This
 * OVERRIDES the studio config prompt — texture edits don't reuse render controls.
 */
export function buildTexturePrompt(o: TexturePromptOptions): string {
  const texture = o.textureDescription?.trim() || o.textureLabel?.trim();
  const parts: string[] = [
    texture
      ? `Replace the selected region with ${texture}.`
      : "Replace the selected region with the requested material.",
  ];
  const instruction = o.instruction?.trim();
  if (instruction) parts.push(instruction);
  parts.push(
    "Apply the new material only inside the masked area, matching the surrounding lighting, shadows, reflections and perspective, and keeping the region's original edges and geometry. Photorealistic, seamless blend with the rest of the image.",
  );
  return parts.join(" ");
}
