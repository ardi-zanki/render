import { env } from "@/env";
import type { PaymentProvider } from "./types";

/**
 * Midtrans provider stub. Snap transaction + webhook verification are wired in
 * Phase 4. Interface and env are in place so the payment flow can drop in.
 */
function createMidtransProvider(): PaymentProvider {
  return {
    name: "midtrans",
    async createPayment() {
      if (!env.MIDTRANS_SERVER_KEY) {
        throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi");
      }
      throw new Error("Midtrans createPayment belum diimplementasi (Phase 4).");
    },
    async verifyAndParseWebhook() {
      throw new Error("Midtrans webhook belum diimplementasi (Phase 4).");
    },
  };
}

let cached: PaymentProvider | null = null;

/** The active payment provider (PRD §6.1). */
export function paymentProvider(): PaymentProvider {
  if (cached) return cached;
  switch (env.PAYMENT_PROVIDER) {
    case "midtrans":
      cached = createMidtransProvider();
      break;
    case "doku":
      throw new Error("DOKU provider belum diimplementasi (Phase 7).");
    default:
      throw new Error(`Payment provider tidak didukung: ${env.PAYMENT_PROVIDER}`);
  }
  return cached;
}

export type {
  PaymentProvider,
  CreatePaymentInput,
  NormalizedWebhook,
} from "./types";
