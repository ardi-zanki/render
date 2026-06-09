import { describe, expect, it } from "vitest";

import {
  checkoutSchema,
  midtransWebhookSchema,
  mockPaymentWebhookSchema,
} from "./payment";

describe("checkoutSchema", () => {
  it("requires a selected credit package", () => {
    const result = checkoutSchema.safeParse({ packageSlug: "" });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.packageSlug).toEqual([
      "Paket wajib dipilih",
    ]);
  });
});

describe("midtransWebhookSchema", () => {
  it("accepts required Midtrans fields and preserves additional payload", () => {
    const result = midtransWebhookSchema.safeParse({
      order_id: "order-1",
      status_code: "200",
      gross_amount: "10000.00",
      signature_key: "signature",
      transaction_id: "trx-1",
      transaction_status: "settlement",
      custom_field1: "kept",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.custom_field1).toBe("kept");
  });

  it("rejects missing signature data", () => {
    const result = midtransWebhookSchema.safeParse({
      order_id: "order-1",
      status_code: "200",
      gross_amount: "10000.00",
      transaction_status: "settlement",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.signature_key).toEqual(
      expect.any(Array),
    );
  });
});

describe("mockPaymentWebhookSchema", () => {
  it("keeps mock payment callbacks lightweight for local development", () => {
    const result = mockPaymentWebhookSchema.safeParse({
      order_id: "mock-order-1",
    });

    expect(result.success).toBe(true);
  });
});
