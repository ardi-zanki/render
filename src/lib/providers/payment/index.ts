import { env } from "@/env";
import { createMidtransProvider } from "./midtrans";
import { createMockPaymentProvider } from "./mock";
import type { PaymentProvider } from "./types";

let cached: PaymentProvider | null = null;

/** The active payment provider (PRD §6.1). */
export function paymentProvider(): PaymentProvider {
  if (cached) return cached;
  switch (env.PAYMENT_PROVIDER) {
    case "midtrans":
      cached = createMidtransProvider();
      break;
    case "mock":
      cached = createMockPaymentProvider();
      break;
    default:
      throw new Error(`Payment provider tidak didukung: ${env.PAYMENT_PROVIDER}`);
  }
  return cached;
}

export type {
  PaymentProvider,
  CreatePaymentInput,
  NormalizedWebhook,
  WebhookRequest,
} from "./types";
