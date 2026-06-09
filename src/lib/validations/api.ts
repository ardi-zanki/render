import { z } from "zod";

export const uuidSchema = z.uuid("ID tidak valid");
export const userIdSchema = z.string().min(1, "User wajib diisi").max(128);

const requiredText = (label: string, max = 500) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .max(max, `${label} maksimal ${max} karakter`);

export const notificationReadSchema = z.union([
  z.object({
    all: z.literal(true),
    id: z.undefined().optional(),
  }),
  z.object({
    id: uuidSchema,
    all: z.boolean().optional(),
  }),
]);

export const renderShareSchema = z.object({
  renderId: uuidSchema,
});

export const renderDeleteSchema = z.object({
  confirmationName: requiredText("Nama render", 120),
});

export const renderMoveProjectSchema = z.object({
  targetProjectId: uuidSchema,
});

export const profileUploadSchema = z.object({
  name: requiredText("Nama", 120),
  avatar: z
    .preprocess(
      (value) => (value == null || value === "" ? undefined : value),
      z
        .custom<File>(
          (value) => typeof File !== "undefined" && value instanceof File,
          "Avatar harus berupa file",
        )
        .optional(),
    )
    .optional(),
});

export const adminToggleDisableSchema = z.object({
  userId: userIdSchema,
  disabled: z.preprocess(
    (value) => value === true || value === "true",
    z.boolean(),
  ),
});

export const adminSetRoleSchema = z.object({
  userId: userIdSchema,
  role: z.enum(["admin", "user"]),
});

export const adminCreditAdjustmentSchema = z.object({
  userId: userIdSchema,
  amount: z.coerce
    .number()
    .int("Jumlah kredit harus bilangan bulat")
    .refine((value) => value !== 0, "Jumlah kredit tidak boleh 0"),
  confirmationName: requiredText("Nama pengguna", 160),
});

export const retryRenderSchema = z.object({
  renderId: uuidSchema,
});

export const renderIdSchema = uuidSchema;
export const projectIdSchema = uuidSchema;

export type NotificationReadInput = z.infer<typeof notificationReadSchema>;
export type RenderShareInput = z.infer<typeof renderShareSchema>;
export type RenderDeleteInput = z.infer<typeof renderDeleteSchema>;
export type RenderMoveProjectInput = z.infer<typeof renderMoveProjectSchema>;
export type ProfileUploadInput = z.infer<typeof profileUploadSchema>;
