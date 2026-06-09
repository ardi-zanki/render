import { describe, expect, it } from "vitest";

import { authErrorMessage, isEmailNotVerified } from "./auth-errors";

describe("auth error helpers", () => {
  it("maps known auth error codes to Indonesian messages", () => {
    expect(authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      "Email atau password salah.",
    );
  });

  it("uses provider messages for unknown error codes", () => {
    expect(
      authErrorMessage({
        code: "UNKNOWN",
        message: "Provider detail",
      }),
    ).toBe("Provider detail");
  });

  it("falls back when no structured error exists", () => {
    expect(authErrorMessage(null, "Fallback")).toBe("Fallback");
  });

  it("detects unverified email errors", () => {
    expect(isEmailNotVerified({ code: "EMAIL_NOT_VERIFIED" })).toBe(true);
    expect(isEmailNotVerified({ code: "INVALID_TOKEN" })).toBe(false);
  });
});
