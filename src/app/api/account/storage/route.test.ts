import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertRateLimit: vi.fn(),
  clearUserRenderStorage: vi.fn(),
  getSession: vi.fn(),
  getUserStorageUsage: vi.fn(),
  hasPasswordAccount: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: { SENSITIVE_ACTION_MAX_AGE: 900 },
}));

vi.mock("@/lib/account/service", () => ({
  hasPasswordAccount: mocks.hasPasswordAccount,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
      verifyPassword: mocks.verifyPassword,
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: mocks.assertRateLimit,
  RateLimitError: class RateLimitError extends Error {
    code = "RATE_LIMIT_EXCEEDED";
  },
}));

vi.mock("@/lib/storage/usage", () => ({
  clearUserRenderStorage: mocks.clearUserRenderStorage,
  getUserStorageUsage: mocks.getUserStorageUsage,
}));

import { DELETE } from "./route";

function deleteRequest(password?: string) {
  return new Request("http://localhost/api/account/storage", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(password ? { password } : {}),
  });
}

describe("DELETE /api/account/storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: "user-1", emailVerified: true },
      session: { createdAt: new Date() },
    });
    mocks.assertRateLimit.mockResolvedValue(undefined);
    mocks.hasPasswordAccount.mockResolvedValue(true);
    mocks.verifyPassword.mockResolvedValue({ status: true });
    mocks.clearUserRenderStorage.mockResolvedValue({
      deletedAssets: 3,
      deletedRenders: 1,
    });
    mocks.getUserStorageUsage.mockResolvedValue({
      usedBytes: 0,
      limitBytes: 1,
      assetCount: 0,
      categories: [],
    });
  });

  it("rejects an old session before deleting assets", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "user-1", emailVerified: true },
      session: { createdAt: new Date(Date.now() - 16 * 60 * 1000) },
    });

    const response = await DELETE(deleteRequest("secret123"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "REAUTH_REQUIRED",
    });
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(mocks.clearUserRenderStorage).not.toHaveBeenCalled();
  });

  it("requires a password for a credential account", async () => {
    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "PASSWORD_REQUIRED",
    });
    expect(mocks.clearUserRenderStorage).not.toHaveBeenCalled();
  });

  it("rejects an invalid password on the server", async () => {
    mocks.verifyPassword.mockRejectedValue(new Error("invalid password"));

    const response = await DELETE(deleteRequest("wrong-password"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_PASSWORD",
    });
    expect(mocks.clearUserRenderStorage).not.toHaveBeenCalled();
  });

  it("deletes storage after recent auth and password verification", async () => {
    const response = await DELETE(deleteRequest("secret123"));

    expect(response.status).toBe(200);
    expect(mocks.verifyPassword).toHaveBeenCalledWith({
      body: { password: "secret123" },
      headers: expect.any(Headers),
    });
    expect(mocks.clearUserRenderStorage).toHaveBeenCalledWith("user-1");
  });

  it("allows a recent OAuth-only session without a password", async () => {
    mocks.hasPasswordAccount.mockResolvedValue(false);

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(200);
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(mocks.clearUserRenderStorage).toHaveBeenCalledWith("user-1");
  });
});
