import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  preferencesSchema,
  profileSchema,
} from "./account";

describe("account validation", () => {
  it("validates editable profile fields", () => {
    const result = profileSchema.safeParse({
      name: "Ardi Demo",
      displayName: "Ardi",
    });

    expect(result.success).toBe(true);
  });

  it("rejects password confirmation mismatch", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "new-password",
      confirmPassword: "different",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.confirmPassword).toEqual([
      "Konfirmasi password tidak cocok",
    ]);
  });

  it("validates preference enums", () => {
    const result = preferencesSchema.safeParse({
      defaultRenderMode: "interior",
      defaultOutputFormat: "png",
    });

    expect(result.success).toBe(true);
  });
});
