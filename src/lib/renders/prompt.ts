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

const MODE_BASE: Record<RenderMode, string> = {
  interior: "photorealistic interior architectural rendering",
  exterior: "photorealistic exterior architectural rendering",
  style_transfer:
    "architectural rendering applying the reference image style, photorealistic",
  upscale: "high-resolution detailed architectural render",
};

const STYLE: Record<string, string> = {
  modern: "modern style",
  minimalis: "minimalist style",
  industrial: "industrial style",
  skandinavia: "scandinavian style",
  klasik: "classic style",
  tropis: "tropical style",
  kontemporer: "contemporary style",
};

const TIME: Record<string, string> = {
  pagi: "soft morning light",
  siang: "bright midday daylight",
  sore: "warm golden hour sunset light",
  malam: "night scene with warm artificial lighting",
};

const WEATHER: Record<string, string> = {
  cerah: "clear blue sky",
  berawan: "partly cloudy sky",
  mendung: "overcast sky",
  hujan: "rainy atmosphere, wet surfaces",
  berkabut: "soft foggy atmosphere",
};

const isAuto = (v?: string) => !v || v === "auto" || v === "otomatis";

/** Compose render options (Bahasa Indonesia values) into an English prompt. */
export function buildPrompt(o: RenderOptions): string {
  const parts: string[] = [MODE_BASE[o.mode]];

  if (!isAuto(o.style) && o.style && STYLE[o.style]) parts.push(STYLE[o.style]);
  if (!isAuto(o.time) && o.time && TIME[o.time]) parts.push(TIME[o.time]);
  if (!isAuto(o.weather) && o.weather && WEATHER[o.weather])
    parts.push(WEATHER[o.weather]);
  if (o.surrounding && !isAuto(o.surrounding)) parts.push(o.surrounding);
  if (o.lightsOn) {
    parts.push(
      o.mode === "interior"
        ? "interior lights switched on, warm realistic lighting"
        : "building lights switched on, warm architectural lighting visible",
    );
  }
  if (o.location) parts.push(`location context: ${o.location}`);
  if (o.instruction) parts.push(o.instruction);

  parts.push("high detail, professional photography, 8k");
  return parts.join(", ");
}
