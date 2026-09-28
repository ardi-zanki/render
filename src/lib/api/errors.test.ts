import { describe, expect, it, vi } from "vitest";
import {
  AiProviderError,
  ImageUploadError,
  InsufficientCreditsError,
  RateLimitError,
  StorageQuotaExceededError,
} from "@/domain/errors";

// Mapping HTTP failures must not initialize database connections or providers.
vi.mock("@/db", () => { throw new Error("Unexpected database dependency"); });
vi.mock("@/env", () => { throw new Error("Unexpected runtime configuration dependency"); });

import { errorResponse } from "./errors";

describe("domain error HTTP mapping", () => {
  it.each([
    [new InsufficientCreditsError(), 402, "INSUFFICIENT_CREDITS"],
    [new RateLimitError(new Date()), 429, "RATE_LIMIT_EXCEEDED"],
    [new StorageQuotaExceededError(), 413, "STORAGE_QUOTA_EXCEEDED"],
    [new AiProviderError("Provider unavailable", "UPSTREAM_TIMEOUT"), 502, "UPSTREAM_TIMEOUT"],
  ])("maps %s to HTTP %s without infrastructure", async (error, status, code) => {
    const response = errorResponse(error);
    expect(response?.status).toBe(status);
    expect(await response?.json()).toMatchObject({ code });
  });

  it("preserves upload status and public message", async () => {
    const response = errorResponse(new ImageUploadError("Image is too large", 413));
    expect(response?.status).toBe(413);
    expect(await response?.json()).toEqual({ error: "Image is too large" });
  });

  it("preserves the operation-specific AI prefix", async () => {
    const response = errorResponse(new AiProviderError("Timed out"), { aiPrefix: "Edit gagal" });
    expect(await response?.json()).toEqual({ error: "Edit gagal: Timed out", code: "AI_PROVIDER_ERROR" });
  });

  it("leaves unexpected errors to the route's fallback response", () => {
    expect(errorResponse(new Error("Internal detail"))).toBeNull();
  });
});
