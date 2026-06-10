import { describe, expect, it } from "vitest";

import { emailDomain, isDisposableEmail } from "./disposable-email";

describe("isDisposableEmail", () => {
  it("flags known disposable domains (case-insensitive)", () => {
    expect(isDisposableEmail("a@mailinator.com")).toBe(true);
    expect(isDisposableEmail("A@Mailinator.COM")).toBe(true);
    expect(isDisposableEmail("x@yopmail.com")).toBe(true);
  });

  it("flags subdomains of disposable providers", () => {
    expect(isDisposableEmail("a@inbox.mailinator.com")).toBe(true);
  });

  it("allows normal providers", () => {
    expect(isDisposableEmail("a@gmail.com")).toBe(false);
    expect(isDisposableEmail("a@company.co.id")).toBe(false);
  });

  it("does not throw on malformed input", () => {
    expect(isDisposableEmail("not-an-email")).toBe(false);
    expect(emailDomain("missing-at")).toBeNull();
    expect(emailDomain("trailing@")).toBeNull();
  });
});
