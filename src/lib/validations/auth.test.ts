import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema, resetPasswordSchema } from "./auth";

describe("auth validation", () => {
  it("validates registration with explicit terms agreement", () => {
    const result = registerSchema.safeParse({
      name: "Ardi Demo",
      email: "ardi@example.com",
      password: "password123",
      agreeTerms: true,
    });

    expect(result.success).toBe(true);
  });

  it("trims the name and trims+lowercases the email", () => {
    const result = registerSchema.safeParse({
      name: "  Ardi Demo  ",
      email: "  Ardi@Example.COM ",
      password: "password123",
      agreeTerms: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.name).toBe("Ardi Demo");
    expect(result.data.email).toBe("ardi@example.com");
  });

  it("rejects a name shorter than 2 characters (after trim)", () => {
    const result = registerSchema.safeParse({
      name: " A ",
      email: "ardi@example.com",
      password: "password123",
      agreeTerms: true,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.name).toEqual([
      "Nama minimal 2 karakter",
    ]);
  });

  it("rejects disposable email providers", () => {
    const result = registerSchema.safeParse({
      name: "Ardi Demo",
      email: "throwaway@mailinator.com",
      password: "password123",
      agreeTerms: true,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.email).toEqual([
      "Gunakan email permanen, bukan email sementara.",
    ]);
  });

  it("rejects registration without terms agreement", () => {
    const result = registerSchema.safeParse({
      name: "Ardi Demo",
      email: "ardi@example.com",
      password: "password123",
      agreeTerms: false,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.agreeTerms).toEqual([
      "Anda harus menyetujui syarat & ketentuan",
    ]);
  });

  it("defaults login rememberMe to false", () => {
    const result = loginSchema.safeParse({
      email: "ardi@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rememberMe).toBe(false);
  });

  it("rejects reset password confirmation mismatch", () => {
    const result = resetPasswordSchema.safeParse({
      token: "token",
      password: "password123",
      confirmPassword: "different",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.confirmPassword).toEqual([
      "Konfirmasi password tidak cocok",
    ]);
  });
});
