import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiClientError,
  apiErrorMessage,
  apiFieldErrors,
  apiJson,
  postJson,
} from "./client-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiJson", () => {
  it("returns parsed JSON for successful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ ok: true, value: 12 })),
    );

    await expect(apiJson("/api/test")).resolves.toEqual({
      ok: true,
      value: 12,
    });
  });

  it("throws ApiClientError with server message and code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { error: "Tidak boleh", code: "FORBIDDEN" },
          { status: 403 },
        ),
      ),
    );

    await expect(apiJson("/api/test")).rejects.toMatchObject({
      name: "ApiClientError",
      message: "Tidak boleh",
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("uses a fallback message when error payload is not structured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("plain failure", { status: 500 })),
    );

    await expect(apiJson("/api/test")).rejects.toThrow("Request gagal");
  });
});

describe("postJson", () => {
  it("sends JSON body using POST by default", async () => {
    const fetchMock = vi.fn(async () => Response.json({ saved: true }));
    vi.stubGlobal("fetch", fetchMock);

    await postJson("/api/test", { name: "RenderAI" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        body: JSON.stringify({ name: "RenderAI" }),
        method: "POST",
      }),
    );

    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect((init?.headers as Headers).get("Content-Type")).toBe(
      "application/json",
    );
  });
});

describe("api error helpers", () => {
  it("extracts messages and field errors from ApiClientError", () => {
    const error = new ApiClientError("Validasi gagal", 400, {
      fieldErrors: {
        name: "Nama wajib diisi",
        ignored: ["array is ignored"],
      },
    });

    expect(apiErrorMessage(error, "Fallback")).toBe("Validasi gagal");
    expect(apiFieldErrors(error)).toEqual({ name: "Nama wajib diisi" });
  });
});
