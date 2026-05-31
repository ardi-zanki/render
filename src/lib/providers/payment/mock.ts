import { env } from "@/env";
import { mapMidtransStatus } from "./status";
import type { PaymentProvider } from "./types";

/**
 * Mock payment provider for local dev (no Midtrans credentials). createPayment
 * returns a link to an in-app simulate page; the webhook is trusted as-is (no
 * signature) so the full checkout → webhook → credit flow can be exercised
 * locally through the real handler.
 */
export function createMockPaymentProvider(): PaymentProvider {
  return {
    name: "mock",

    async createPayment(input) {
      const url = `${env.APP_URL.replace(/\/$/, "")}/payments/simulate?order=${encodeURIComponent(
        input.orderId,
      )}`;
      return {
        providerOrderId: input.orderId,
        snapToken: `MOCK-${input.orderId}`,
        paymentUrl: url,
        raw: { mock: true },
      };
    },

    async verifyAndParseWebhook({ body }) {
      const b = (body ?? {}) as Record<string, string | undefined>;
      return {
        providerOrderId: b.order_id ?? "",
        providerTransactionId: b.transaction_id ?? `mock-${Date.now()}`,
        status: mapMidtransStatus(b.transaction_status ?? "settlement"),
        raw: b,
      };
    },
  };
}
