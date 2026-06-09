import { describe, expect, it } from "vitest";

import {
  adminCreditAdjustmentSchema,
  adminToggleDisableSchema,
  notificationReadSchema,
  renderDeleteSchema,
  renderMoveProjectSchema,
} from "./api";

describe("api validation", () => {
  it("accepts mark-all and single notification read payloads", () => {
    expect(notificationReadSchema.safeParse({ all: true }).success).toBe(true);
    expect(
      notificationReadSchema.safeParse({
        id: "f75bc311-6ca8-40b8-b5e6-0c57e168873d",
      }).success,
    ).toBe(true);
  });

  it("requires a render deletion confirmation name and trims it", () => {
    const result = renderDeleteSchema.safeParse({
      confirmationName: "  Render Interior  ",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.confirmationName).toBe("Render Interior");

    const blank = renderDeleteSchema.safeParse({ confirmationName: "   " });
    expect(blank.success).toBe(false);
  });

  it("accepts a render move project payload", () => {
    const result = renderMoveProjectSchema.safeParse({
      targetProjectId: "f75bc311-6ca8-40b8-b5e6-0c57e168873d",
    });

    expect(result.success).toBe(true);
  });

  it("coerces admin toggle values from form payloads", () => {
    const result = adminToggleDisableSchema.safeParse({
      userId: "user-1",
      disabled: "true",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.disabled).toBe(true);
  });

  it("coerces credit adjustment amount and rejects zero", () => {
    const valid = adminCreditAdjustmentSchema.safeParse({
      userId: "user-1",
      amount: "3",
      confirmationName: "Ardi Demo",
    });

    expect(valid.success).toBe(true);
    if (!valid.success) return;
    expect(valid.data.amount).toBe(3);

    const invalid = adminCreditAdjustmentSchema.safeParse({
      userId: "user-1",
      amount: "0",
      confirmationName: "Ardi Demo",
    });
    expect(invalid.success).toBe(false);
  });
});
