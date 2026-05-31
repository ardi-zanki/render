import { z } from "zod";

export const renderModeEnum = z.enum([
  "interior",
  "exterior",
  "style_transfer",
  "upscale",
]);

export const createRenderSchema = z.object({
  projectId: z.uuid().optional(),
  mode: renderModeEnum,
  style: z.string().max(40).optional(),
  location: z.string().max(120).optional(),
  surrounding: z.string().max(120).optional(),
  time: z.enum(["auto", "pagi", "siang", "sore", "malam"]).optional(),
  weather: z
    .enum(["auto", "cerah", "berawan", "mendung", "hujan", "berkabut"])
    .optional(),
  instruction: z.string().max(500).optional(),
  outputFormat: z.enum(["jpg", "png"]).optional(),
});

export type CreateRenderInput = z.infer<typeof createRenderSchema>;

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nama project wajib diisi").max(80),
});
