import { describe, expect, it } from "vitest";
import { z } from "zod";

import { zodFieldErrors } from "./form";

describe("zodFieldErrors", () => {
  it("returns the first message per top-level field", () => {
    const schema = z.object({
      name: z.string().min(1, "Nama wajib").min(3, "Nama terlalu pendek"),
      email: z.email("Email tidak valid"),
    });
    const result = schema.safeParse({ name: "", email: "x" });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(zodFieldErrors(result.error)).toEqual({
      name: "Nama wajib",
      email: "Email tidak valid",
    });
  });
});
