import { z } from "zod";

export const checkoutSchema = z.object({
  packageSlug: z.string().min(1, "Paket wajib dipilih"),
});

export const paymentSyncSchema = z.object({
  orderId: z.string().min(1, "Order wajib diisi").max(128),
});

export const midtransWebhookSchema = z
  .object({
    order_id: z.string().min(1),
    status_code: z.string().min(1),
    gross_amount: z.string().min(1),
    signature_key: z.string().min(1),
    transaction_id: z.string().optional(),
    transaction_status: z.string().min(1),
    fraud_status: z.string().optional(),
  })
  .passthrough();

export const midtransTransactionStatusSchema = z
  .object({
    order_id: z.string().min(1),
    transaction_id: z.string().optional(),
    transaction_status: z.string().min(1),
    fraud_status: z.string().optional(),
  })
  .passthrough();

export const mockPaymentWebhookSchema = z
  .object({
    order_id: z.string().min(1),
    status_code: z.string().optional(),
    gross_amount: z.string().optional(),
    transaction_id: z.string().optional(),
    transaction_status: z.string().optional(),
    fraud_status: z.string().optional(),
  })
  .passthrough();

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type PaymentSyncInput = z.infer<typeof paymentSyncSchema>;
export type MidtransWebhookInput = z.infer<typeof midtransWebhookSchema>;
export type MidtransTransactionStatusInput = z.infer<
  typeof midtransTransactionStatusSchema
>;
export type MockPaymentWebhookInput = z.infer<typeof mockPaymentWebhookSchema>;
