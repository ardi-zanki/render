import { z } from "zod";

import { RENDER_MODES, RENDER_OUTPUT_FORMATS } from "@/domain/types";

export const outputFormatEnum = z.enum(RENDER_OUTPUT_FORMATS);
export const renderModeEnum = z.enum(RENDER_MODES);

export const createRenderSchema = z.object({
  projectId: z.uuid().optional(),
  mode: renderModeEnum,
  name: z.string().trim().max(80).optional(),
  style: z.string().max(40).optional(),
  location: z.string().max(120).optional(),
  surrounding: z.string().max(120).optional(),
  lightsOn: z
    .preprocess((value) => value === true || value === "true", z.boolean())
    .optional(),
  time: z
    .enum(["auto", "morning", "midday", "evening", "night", "mixed"])
    .optional(),
  weather: z
    .enum(["auto", "clear", "cloudy", "overcast", "drizzle", "rain", "fog"])
    .optional(),
  instruction: z
    .string()
    .max(1000, "Instruksi maksimal 1.000 karakter")
    .optional(),
  outputFormat: outputFormatEnum.optional(),
  negativePrompt: z
    .string()
    .max(1000, "Negative prompt maksimal 1.000 karakter")
    .optional(),
  styleTransferStrength: z.coerce.number().min(0).max(1).optional(),
});

export type CreateRenderInput = z.infer<typeof createRenderSchema>;

export const renderNameSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(80),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Nama project wajib diisi").max(80),
  description: z.string().max(500).optional(),
});

export const textureEditSchema = z.object({
  /** Library texture id; resolved to a material prompt server-side. */
  libraryTextureId: z.string().max(80).optional(),
  textureDescription: z
    .string()
    .max(1000, "Deskripsi maksimal 1.000 karakter")
    .optional(),
  instruction: z
    .string()
    .max(1000, "Instruksi maksimal 1.000 karakter")
    .optional(),
  /** Version (render_assets.id) to edit from; defaults to the latest. */
  baseAssetId: z.uuid().optional(),
});

export type TextureEditInput = z.infer<typeof textureEditSchema>;
