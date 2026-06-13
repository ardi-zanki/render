import { Building2, Sofa, type LucideIcon } from "lucide-react";

import type { RenderMode, RenderOutputFormat } from "@/db/schema";

export const MODES: {
  value: RenderMode;
  label: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}[] = [
  { value: "interior", label: "Interior", icon: Sofa },
  { value: "exterior", label: "Exterior", icon: Building2, comingSoon: true },
];

export const STYLES = [
  ["auto", "Deteksi Otomatis"],
  ["modern", "Modern"],
  ["minimalist", "Minimalis"],
  ["industrial", "Industrial"],
  ["scandinavian", "Skandinavia"],
  ["classic", "Klasik"],
  ["tropical", "Tropis"],
  ["contemporary", "Kontemporer"],
];

export const TIMES = ["auto", "morning", "midday", "evening", "night"];
export const WEATHERS = ["auto", "clear", "cloudy", "overcast", "rain", "fog"];

export const SURROUNDINGS = {
  exterior: [
    { value: "auto", label: "Otomatis" },
    {
      value: "urban street context with neighboring buildings",
      label: "Kawasan Urban",
    },
    {
      value: "quiet residential neighborhood context",
      label: "Perumahan",
    },
    {
      value: "tropical garden and lush greenery around the building",
      label: "Taman Tropis",
    },
    {
      value: "commercial streetscape context",
      label: "Area Komersial",
    },
  ],
  interior: [
    { value: "auto", label: "Otomatis" },
    {
      value: "large window view with natural daylight",
      label: "Jendela Besar",
    },
    {
      value: "city view through the window",
      label: "View Kota",
    },
    {
      value: "garden view through the window",
      label: "View Taman",
    },
    {
      value: "no visible window, controlled interior lighting",
      label: "Tanpa Jendela",
    },
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
  rain: "Hujan",
  fog: "Berkabut",
};

export const cap = (s: string) =>
  CHIP_LABEL[s] ?? s[0].toUpperCase() + s.slice(1);
