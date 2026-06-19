import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertRateLimit: vi.fn(),
  getSession: vi.fn(),
  markRenderQueueSeen: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: mocks.assertRateLimit,
  RateLimitError: class RateLimitError extends Error {
    code = "rate_limited";
  },
}));

vi.mock("@/lib/renders/jobs", () => ({
  markRenderQueueSeen: mocks.markRenderQueueSeen,
}));

import { POST } from "./route";

const renderId = "f75bc311-6ca8-40b8-b5e6-0c57e168873d";

function request(body: unknown) {
  return new Request("http://localhost/api/renders/queue/read", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/renders/queue/read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: "user-1", emailVerified: true },
    });
    mocks.assertRateLimit.mockResolvedValue(undefined);
  });

  it("persists the completed render acknowledgement for its owner", async () => {
    const response = await POST(request({ renderId }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.markRenderQueueSeen).toHaveBeenCalledWith("user-1", renderId);
  });

  it("rejects an invalid render id", async () => {
    const response = await POST(request({ renderId: "invalid" }));

    expect(response.status).toBe(400);
    expect(mocks.markRenderQueueSeen).not.toHaveBeenCalled();
  });
});
