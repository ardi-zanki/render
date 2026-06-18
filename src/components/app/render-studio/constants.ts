import { Building2, Sofa, type LucideIcon } from "lucide-react";

import type { RenderMode, RenderOutputFormat } from "@/db/schema";

export const MODES: {
  value: RenderMode;
  label: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}[] = [
  { value: "interior", label: "Interior", icon: Sofa },
  { value: "exterior", label: "Exterior", icon: Building2 },
];

export const STYLE_OPTIONS = {
  interior: [
    ["auto", "Deteksi Otomatis"],
    ["tropical_modern", "Tropis Modern"],
    ["japandi", "Japandi Minimalis"],
    ["scandinavian", "Skandinavia"],
    ["brutalist", "Brutalisme"],
    ["contemporary", "Kontemporer"],
    ["futuristic", "Futuristik"],
    ["classic", "Klasik"],
  ],
  exterior: [
    ["auto", "Deteksi Otomatis"],
    ["tropical_modern", "Tropis Modern"],
    ["japandi", "Japandi Minimalis"],
    ["scandinavian", "Skandinavia"],
    ["brutalist", "Brutalisme"],
    ["contemporary", "Kontemporer"],
    ["futuristic", "Futuristik"],
    ["classic", "Klasik"],
  ],
} as const satisfies Record<"interior" | "exterior", readonly (readonly [string, string])[]>;

export const STYLES = [
  ["auto", "Deteksi Otomatis"],
  ["tropical_modern", "Tropis Modern"],
  ["japandi", "Japandi Minimalis"],
  ["scandinavian", "Skandinavia"],
  ["brutalist", "Brutalisme"],
  ["contemporary", "Kontemporer"],
  ["futuristic", "Futuristik"],
  ["classic", "Klasik"],
  ["modern", "Modern"],
  ["minimalist", "Minimalis"],
  ["industrial", "Industrial"],
  ["tropical", "Tropis"],
];

export const TIMES = ["auto", "morning", "midday", "evening", "night"];
export const WEATHERS = [
  "auto",
  "clear",
  "cloudy",
  "overcast",
  "drizzle",
  "rain",
  "fog",
];

export const SURROUNDINGS = {
  exterior: [
    { value: "auto", label: "Otomatis" },
    { value: "dense city center context", label: "Tengah Kota" },
    { value: "rural countryside context", label: "Pedesaan" },
    { value: "coastal beachside context", label: "Pinggir Pantai" },
    { value: "hillside terrain context", label: "Perbukitan" },
    { value: "quiet residential neighborhood context", label: "Perumahan" },
    { value: "forest and mature trees context", label: "Hutan" },
  ],
  interior: [
    { value: "auto", label: "Otomatis" },
    { value: "city center view through the windows", label: "Tengah Kota" },
    { value: "rural countryside view through the windows", label: "Pedesaan" },
    { value: "beachside coastal view through the windows", label: "Pinggir Pantai" },
    { value: "hillside view through the windows", label: "Perbukitan" },
    { value: "residential neighborhood view through the windows", label: "Perumahan" },
    { value: "forest view through the windows", label: "Hutan" },
  ],
};

export const OUTPUT_FORMATS: { value: RenderOutputFormat; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
];

// Indonesian display labels for the (English) time/weather chip values, so the
// UI stays Bahasa while the stored values are English. Falls back to a simple
// capitalize for any value not in the map.
const CHIP_LABEL: Record<string, string> = {
  auto: "Otomatis",
  morning: "Pagi",
  midday: "Siang",
  evening: "Sore",
  night: "Malam",
  clear: "Cerah",
  cloudy: "Berawan",
  overcast: "Mendung",
  drizzle: "Gerimis",
  rain: "Hujan",
  fog: "Berkabut",
};

export const cap = (s: string) =>
  CHIP_LABEL[s] ?? s[0].toUpperCase() + s.slice(1);
