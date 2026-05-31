import { z } from "zod";

export const checkoutSchema = z.object({
  packageSlug: z.string().min(1, "Paket wajib dipilih"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
