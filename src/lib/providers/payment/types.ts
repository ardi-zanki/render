import type { PaymentStatus } from "@/db/schema";

export interface CreatePaymentInput {
  /** Our internal order id, sent to the provider as the order reference. */
  orderId: string;
  amount: number;
  currency: string;
  packageName: string;
  customer: { name: string; email: string };
}

export interface CreatePaymentResult {
  providerOrderId: string;
  paymentUrl?: string;
  snapToken?: string;
  raw?: unknown;
}

/** Provider webhook normalized to our internal shape (PRD §23.4). */
export interface NormalizedWebhook {
  providerOrderId: string;
  providerTransactionId?: string;
  status: PaymentStatus;
  raw: unknown;
}

/** Pluggable payment provider (PRD §6.1). Midtrans is the MVP provider. */
export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /** Verify a webhook signature and normalize it; throws if invalid. */
  verifyAndParseWebhook(
    headers: Record<string, string | undefined>,
    body: unknown,
  ): Promise<NormalizedWebhook>;
}
