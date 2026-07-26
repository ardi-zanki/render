import { env } from "@/env";

export const supportContact = {
  email: env.SUPPORT_EMAIL,
  whatsapp: env.SUPPORT_WHATSAPP_URL
    ? {
        href: env.SUPPORT_WHATSAPP_URL,
        label: env.SUPPORT_WHATSAPP_LABEL ?? "Hubungi via WhatsApp",
      }
    : null,
  instagram: env.SUPPORT_INSTAGRAM_URL
    ? {
        href: env.SUPPORT_INSTAGRAM_URL,
        label: env.SUPPORT_INSTAGRAM_LABEL ?? "Buka Instagram",
      }
    : null,
} as const;
