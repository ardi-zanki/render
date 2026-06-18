import { createHash } from "node:crypto";

import { env } from "@/env";
import {
  midtransTransactionStatusSchema,
  midtransWebhookSchema,
} from "@/lib/validations/payment";
import { mapMidtransStatus } from "./status";
import type { PaymentProvider } from "./types";

function snapBase() {
  return env.MIDTRANS_IS_PRODUCTION
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

function apiBase() {
  return env.MIDTRANS_IS_PRODUCTION
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
}

function authHeader() {
  if (!env.MIDTRANS_SERVER_KEY) {
    throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi");
  }
  const auth = Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString("base64");
  return `Basic ${auth}`;
}

/**
 * Midtrans Snap provider (https://docs.midtrans.com/docs/snap-snap-integration-guide).
 * createPayment → Snap token + redirect URL. Webhook verified via
 * sha512(order_id + status_code + gross_amount + serverKey).
 */
export function createMidtransProvider(): PaymentProvider {
  return {
    name: "midtrans",

    async createPayment(input) {
      const finishUrl = `${env.APP_URL.replace(/\/$/, "")}/payments/finish`;

      const res = await fetch(`${snapBase()}/snap/v1/transactions`, {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: input.orderId,
            gross_amount: input.amount,
          },
          item_details: [
            {
              id: input.orderId,
              price: input.amount,
              quantity: 1,
              name: input.packageName,
            },
          ],
          customer_details: {
            first_name: input.customer.name,
            email: input.customer.email,
          },
          callbacks: { finish: finishUrl },
        }),
      });

      const json = (await res.json()) as {
        token?: string;
        redirect_url?: string;
      };
      if (!res.ok || !json.token) {
        throw new Error(
          `Midtrans error: ${JSON.stringify(json).slice(0, 200)}`,
        );
      }

      return {
        providerOrderId: input.orderId,
        snapToken: json.token,
        paymentUrl: json.redirect_url,
        raw: json,
      };
    },

    async getPaymentStatus(providerOrderId) {
      const res = await fetch(
        `${apiBase()}/v2/${encodeURIComponent(providerOrderId)}/status`,
        {
          headers: {
            Authorization: authHeader(),
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );
      const json = (await res.json()) as unknown;
      if (!res.ok) {
        throw new Error(
          `Midtrans status error: ${JSON.stringify(json).slice(0, 200)}`,
        );
      }

      const parsed = midtransTransactionStatusSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error("Status transaksi Midtrans tidak valid");
      }
      const b = parsed.data;

      return {
        providerOrderId: b.order_id,
        providerTransactionId: b.transaction_id,
        status: mapMidtransStatus(b.transaction_status, b.fraud_status),
        raw: b,
      };
    },

    async verifyAndParseWebhook({ body }) {
      const parsed = midtransWebhookSchema.safeParse(body ?? {});
      if (!parsed.success) {
        throw new Error("Payload webhook Midtrans tidak valid");
      }
      const b = parsed.data;
      const expected = createHash("sha512")
        .update(
          `${b.order_id}${b.status_code}${b.gross_amount}${
            env.MIDTRANS_SERVER_KEY ?? ""
          }`,
        )
        .digest("hex");

      if (!b.signature_key || b.signature_key !== expected) {
        throw new Error("Signature webhook Midtrans tidak valid");
      }

      return {
        providerOrderId: b.order_id,
        providerTransactionId: b.transaction_id,
        status: mapMidtransStatus(b.transaction_status, b.fraud_status),
        raw: b,
      };
    },
  };
}
