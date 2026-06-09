import { describe, expect, it } from "vitest";

import { formatCredits, formatPrice, packageCopy } from "./pricing";

describe("pricing helpers", () => {
  it("formats Indonesian Rupiah and credit totals", () => {
    expect(formatPrice(249000)).toBe("Rp249.000");
    expect(formatCredits(100, 10)).toBe("110 kredit");
  });

  it("returns known marketing copy and a safe fallback", () => {
    expect(packageCopy("creator")).toMatchObject({
      highlighted: true,
      note: "Untuk presentasi dan revisi rutin",
    });
    expect(packageCopy("unknown")).toEqual({ note: "", features: [] });
  });
});
