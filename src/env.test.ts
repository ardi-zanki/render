import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
  vi.stubEnv("BETTER_AUTH_SECRET", "test-auth-secret-at-least-32-characters");
  vi.stubEnv("JWT_SECRET", "test-jwt-secret-at-least-32-characters");
  vi.stubEnv("NODE_ENV", "test");
});

afterEach(() => vi.unstubAllEnvs());

describe("server environment validation", () => {
  it.each(["RATE_LIMIT_ENABLED", "MIDTRANS_IS_PRODUCTION"])(
    "rejects a typo in %s instead of silently disabling it",
    async (key) => {
      vi.stubEnv(key, "tru");
      await expect(import("./env")).rejects.toThrow(key);
    },
  );

  it.each(["true", "false"])("parses explicit boolean %s", async (value) => {
    vi.stubEnv("RATE_LIMIT_ENABLED", value);
    const { env } = await import("./env");
    expect(env.RATE_LIMIT_ENABLED).toBe(value === "true");
  });

  it("keeps the documented defaults for blank booleans", async () => {
    vi.stubEnv("RATE_LIMIT_ENABLED", "");
    vi.stubEnv("MIDTRANS_IS_PRODUCTION", "");
    const { env } = await import("./env");
    expect(env.RATE_LIMIT_ENABLED).toBe(true);
    expect(env.MIDTRANS_IS_PRODUCTION).toBe(false);
  });

  it.each(["SESSION_REMEMBER_ME_MAX_AGE", "ADMIN_SESSION_MAX_AGE", "SENSITIVE_ACTION_MAX_AGE"])(
    "rejects a nonpositive session duration in %s",
    async (key) => {
      vi.stubEnv(key, "-1");
      await expect(import("./env")).rejects.toThrow(key);
    },
  );

  it("treats a blank render seed as unset, not zero", async () => {
    vi.stubEnv("FAL_RENDER_SEED", "");
    const { env } = await import("./env");
    expect(env.FAL_RENDER_SEED).toBeUndefined();
  });

  it("preserves an explicitly configured zero seed", async () => {
    vi.stubEnv("FAL_RENDER_SEED", "0");
    const { env } = await import("./env");
    expect(env.FAL_RENDER_SEED).toBe(0);
  });

  it.each([
    ["test", "inline"],
    ["production", "worker"],
  ])("defaults %s to %s processing", async (nodeEnv, expected) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("RENDER_PROCESSING_MODE", undefined);
    const { env } = await import("./env");
    expect(env.RENDER_PROCESSING_MODE).toBe(expected);
  });

  it("allows an explicit single-instance inline deployment", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RENDER_PROCESSING_MODE", "inline");
    const { env } = await import("./env");
    expect(env.RENDER_PROCESSING_MODE).toBe("inline");
  });
});
