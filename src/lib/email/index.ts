import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { env } from "@/env";
import { createResendProvider } from "./resend";
import type { EmailProvider } from "./types";

let cached: EmailProvider | null = null;

function getProvider(): EmailProvider {
  if (cached) return cached;
  switch (env.EMAIL_PROVIDER) {
    case "resend":
      cached = createResendProvider();
      break;
    default:
      throw new Error(`Email provider tidak didukung: ${env.EMAIL_PROVIDER}`);
  }
  return cached;
}

export interface TransactionalEmailParams {
  userId?: string;
  type: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Send a transactional email and record it in email_logs (PRD §25.3 —
 * important emails are logged; failures are logged for debugging).
 */
export async function sendTransactionalEmail(p: TransactionalEmailParams) {
  const provider = getProvider();
  try {
    const res = await provider.send({
      to: p.to,
      subject: p.subject,
      html: p.html,
      text: p.text,
    });
    await db.insert(emailLogs).values({
      userId: p.userId,
      type: p.type,
      toEmail: p.to,
      subject: p.subject,
      provider: provider.name,
      providerMessageId: res.id,
      status: "sent",
      metadata: p.metadata,
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.insert(emailLogs).values({
      userId: p.userId,
      type: p.type,
      toEmail: p.to,
      subject: p.subject,
      provider: provider.name,
      status: "failed",
      errorMessage: message,
      metadata: p.metadata,
    });
    throw err;
  }
}

export * from "./templates";
export type { EmailProvider } from "./types";
