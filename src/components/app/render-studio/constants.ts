import {
  Building2,
  Maximize2,
  Palette,
  Sofa,
  type LucideIcon,
} from "lucide-react";

import type { RenderMode, RenderOutputFormat } from "@/db/schema";

export const MODES: { value: RenderMode; label: string; icon: LucideIcon }[] = [
  { value: "interior", label: "Interior", icon: Sofa },
  { value: "exterior", label: "Exterior", icon: Building2 },
  { value: "style_transfer", label: "Style", icon: Palette },
  { value: "upscale", label: "Upscale", icon: Maximize2 },
];

export const STYLES = [
  ["auto", "Deteksi Otomatis"],
  ["modern", "Modern"],
  ["minimalis", "Minimalis"],
  ["industrial", "Industrial"],
  ["skandinavia", "Skandinavia"],
  ["klasik", "Klasik"],
  ["tropis", "Tropis"],
  ["kontemporer", "Kontemporer"],
];

export const TIMES = ["auto", "pagi", "siang", "sore", "malam"];
export const WEATHERS = ["auto", "cerah", "berawan", "mendung", "hujan", "berkabut"];

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
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
];

export const cap = (s: string) =>
  s === "auto" ? "Otomatis" : s[0].toUpperCase() + s.slice(1);
