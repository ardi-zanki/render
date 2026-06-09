import { beforeEach, describe, expect, it, vi } from "vitest";

describe("rate limiter", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("@/env", () => ({
      env: {
        RATE_LIMIT_ENABLED: false,
      },
    }));
    vi.doMock("@/db", () => ({
      db: {
        transaction: vi.fn(),
      },
    }));
    vi.doMock("@/db/schema", () => ({
      rateLimits: {
        key: "key",
      },
    }));
  });

  it("allows requests without touching the database when disabled", async () => {
    const { rateLimit } = await import("./rate-limit");
    const { db } = await import("@/db");

    const result = await rateLimit("login", "127.0.0.1");

    expect(result).toMatchObject({
      success: true,
      limit: 10,
      remaining: 10,
    });
    expect(result.resetAt).toBeInstanceOf(Date);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("exposes a typed error for exceeded limits", async () => {
    const { RateLimitError } = await import("./rate-limit");
    const resetAt = new Date("2026-06-09T10:00:00.000Z");

    const error = new RateLimitError(resetAt);

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(error.resetAt).toBe(resetAt);
    expect(error.message).toBe(
      "Terlalu banyak percobaan. Silakan coba lagi beberapa saat.",
    );
  });
});
