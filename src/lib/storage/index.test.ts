import { describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
  env: { STORAGE_PROVIDER: "local" },
}));

import { browserAssetUrl } from "./index";

describe("browserAssetUrl", () => {
  it("uses the active browser origin for local assets", () => {
    expect(
      browserAssetUrl(
        "http://localhost:3211/uploads/users/user/render.png",
        "users/user/render.png",
        "local",
      ),
    ).toBe("/uploads/users/user/render.png");
  });

  it("encodes local path segments", () => {
    expect(
      browserAssetUrl(
        "http://localhost:3210/uploads/users/user/my render.png",
        "users/user/my render.png",
        "local",
      ),
    ).toBe("/uploads/users/user/my%20render.png");
  });

  it("keeps remote provider URLs unchanged", () => {
    const url = "https://assets.example.com/users/user/render.png";
    expect(browserAssetUrl(url, "users/user/render.png", "r2")).toBe(url);
  });
});
