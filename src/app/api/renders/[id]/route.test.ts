import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertRateLimit: vi.fn(),
  deleteRenderPermanently: vi.fn(),
  getRenderDetail: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: mocks.assertRateLimit,
  RateLimitError: class RateLimitError extends Error {
    code = "rate_limited";
  },
}));

vi.mock("@/lib/renders/archive-delete", () => ({
  deleteRenderPermanently: mocks.deleteRenderPermanently,
}));

vi.mock("@/lib/renders/queries", () => ({
  getRenderDetail: mocks.getRenderDetail,
}));

vi.mock("@/lib/renders/update", () => ({
  moveRenderToProject: vi.fn(),
}));

import { DELETE } from "./route";

const renderId = "f75bc311-6ca8-40b8-b5e6-0c57e168873d";

function deleteRequest(confirmationName: string) {
  return new Request(`http://localhost/api/renders/${renderId}`, {
    method: "DELETE",
    body: JSON.stringify({ confirmationName }),
  });
}

describe("DELETE /api/renders/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: "user-1", emailVerified: true },
    });
    mocks.assertRateLimit.mockResolvedValue(undefined);
    mocks.deleteRenderPermanently.mockResolvedValue(true);
    mocks.getRenderDetail.mockResolvedValue({
      id: renderId,
      mode: "interior",
      name: "Dapur Utama",
    });
  });

  it("accepts the renamed render name as delete confirmation", async () => {
    const response = await DELETE(deleteRequest("Dapur Utama"), {
      params: Promise.resolve({ id: renderId }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.deleteRenderPermanently).toHaveBeenCalledWith(
      "user-1",
      renderId,
    );
  });

  it("rejects the default mode name after a render has been renamed", async () => {
    const response = await DELETE(deleteRequest("Render Interior"), {
      params: Promise.resolve({ id: renderId }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Ketik "Dapur Utama" untuk menghapus render',
    });
    expect(mocks.deleteRenderPermanently).not.toHaveBeenCalled();
  });
});
