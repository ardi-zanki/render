import { describe, expect, it } from "vitest";

import { mapMidtransStatus } from "./status";

describe("mapMidtransStatus", () => {
  it.each([
    ["capture", undefined, "paid"],
    ["capture", "challenge", "pending"],
    ["settlement", undefined, "paid"],
    ["pending", undefined, "pending"],
    ["deny", undefined, "failed"],
    ["failure", undefined, "failed"],
    ["cancel", undefined, "cancelled"],
    ["expire", undefined, "expired"],
    ["refund", undefined, "refunded"],
    ["partial_refund", undefined, "refunded"],
    ["unknown", undefined, "pending"],
  ] as const)(
    "maps %s/%s to %s",
    (transactionStatus, fraudStatus, expected) => {
      expect(mapMidtransStatus(transactionStatus, fraudStatus)).toBe(expected);
    },
  );
});
