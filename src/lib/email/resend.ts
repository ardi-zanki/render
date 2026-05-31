import { Resend } from "resend";

import { env } from "@/env";
import type { EmailProvider } from "./types";

/**
 * Resend email provider. In local dev without RESEND_API_KEY, emails are
 * logged to the console (incl. any action link) instead of failing — so the
 * auth flow works without credentials. In production a missing key throws.
 */
export function createResendProvider(): EmailProvider {
  return {
    name: "resend",
    async send({ to, subject, html, text, from }) {
      if (!env.RESEND_API_KEY) {
        if (env.NODE_ENV === "production") {
          throw new Error("RESEND_API_KEY belum dikonfigurasi");
        }
        const link = html.match(/href="([^"]+)"/)?.[1];
        console.warn(
          `\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}` +
            (link ? `\n[email:dev] Link: ${link}` : "") +
            "\n[email:dev] (set RESEND_API_KEY untuk mengirim email asli)\n",
        );
        return { id: `dev-${Date.now()}` };
      }

      const resend = new Resend(env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: from ?? env.EMAIL_FROM,
        to,
        subject,
        html,
        ...(text ? { text } : {}),
      });
      if (error) {
        throw new Error(error.message);
      }
      return { id: data?.id };
    },
  };
}
