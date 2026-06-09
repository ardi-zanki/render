import { describe, expect, it } from "vitest";

import {
  adminCreditAdjustmentSchema,
  adminToggleDisableSchema,
  notificationReadSchema,
  renderDeleteSchema,
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

  it("requires a deletion note and trims it", () => {
    const result = renderDeleteSchema.safeParse({
      note: "  duplikat render  ",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.note).toBe("duplikat render");

    const blank = renderDeleteSchema.safeParse({ note: "   " });
    expect(blank.success).toBe(false);
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
      description: "Top up manual",
    });

    expect(valid.success).toBe(true);
    if (!valid.success) return;
    expect(valid.data.amount).toBe(3);

    const invalid = adminCreditAdjustmentSchema.safeParse({
      userId: "user-1",
      amount: "0",
      description: "Noop",
    });
    expect(invalid.success).toBe(false);
  });
});
