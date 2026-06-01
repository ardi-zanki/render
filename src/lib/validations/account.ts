import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(120),
  displayName: z.string().max(120).optional(),
});

export const preferencesSchema = z.object({
  emailNotificationsEnabled: z.boolean(),
  defaultRenderMode: z.enum([
    "interior",
    "exterior",
    "style_transfer",
    "upscale",
  ]),
  defaultOutputFormat: z.enum(["jpg", "png", "webp", "avif"]),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string().min(8, "Password minimal 8 karakter").max(128),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    error: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type ProfileInput = z.infer<typeof profileSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
