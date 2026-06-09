import { describe, expect, it } from "vitest";

import { isFinalRenderStatus } from "./types";

describe("isFinalRenderStatus", () => {
  it.each(["success", "failed", "cancelled", "refunded"])(
    "treats %s as final",
    (status) => {
      expect(isFinalRenderStatus(status)).toBe(true);
    },
  );

  it.each(["queued", "processing", "retrying"])(
    "treats %s as non-final",
    (status) => {
      expect(isFinalRenderStatus(status)).toBe(false);
    },
  );
});
