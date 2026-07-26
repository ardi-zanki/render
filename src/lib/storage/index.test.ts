import { describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
  env: { STORAGE_PROVIDER: "r2", R2_PUBLIC_URL: "https://assets.example.com" },
}));

vi.mock("./r2", () => ({
  createR2Provider: () => ({
    name: "r2",
    getSignedDownloadUrl: vi.fn(async (key: string) => `https://signed.example.com/${key}`),
  }),
}));

import {
  browserAssetUrl,
  browserUserImageUrl,
  privateAssetReference,
} from "./index";

describe("browserAssetUrl", () => {
  it("uses the active browser origin for local assets", async () => {
    await expect(
      browserAssetUrl(
        "http://localhost:3211/uploads/users/user/render.png",
        "users/user/render.png",
        "local",
      ),
    ).resolves.toBe("/uploads/users/user/render.png");
  });

  it("encodes local path segments", async () => {
    await expect(
      browserAssetUrl(
        "http://localhost:3210/uploads/users/user/my render.png",
        "users/user/my render.png",
        "local",
      ),
    ).resolves.toBe("/uploads/users/user/my%20render.png");
  });

  it("replaces persisted public URLs with a signed URL", async () => {
    const url = "https://assets.example.com/users/user/render.png";
    await expect(browserAssetUrl(url, "users/user/render.png", "r2")).resolves.toBe(
      "https://signed.example.com/users/user/render.png",
    );
  });

  it("resolves private and legacy avatar references", async () => {
    expect(privateAssetReference("users/user/avatar.png")).toBe(
      "storage:users/user/avatar.png",
    );
    await expect(
      browserUserImageUrl("storage:users/user/avatar.png"),
    ).resolves.toBe("https://signed.example.com/users/user/avatar.png");
    await expect(
      browserUserImageUrl("https://assets.example.com/users/user/avatar.png"),
    ).resolves.toBe("https://signed.example.com/users/user/avatar.png");
  });
});
