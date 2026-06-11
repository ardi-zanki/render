import { z } from "zod";

import { isDisposableEmail } from "./disposable-email";

// Length-based, no complexity rules (modern guidance favors length); the only
// character rule is disallowing spaces.
const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(30, "Password maksimal 30 karakter")
  .refine((value) => !/\s/.test(value), {
    error: "Password tidak boleh mengandung spasi",
  });

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(60),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Format email tidak valid"))
    .refine((email) => !isDisposableEmail(email), {
      error: "Gunakan email permanen, bukan email sementara.",
    }),
  password: passwordSchema,
  agreeTerms: z.literal(true, {
    error: "Anda harus menyetujui syarat & ketentuan",
  }),
});

export const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Format email tidak valid"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token tidak valid"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
