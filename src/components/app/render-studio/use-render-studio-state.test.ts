import { describe, expect, it } from "vitest";

import {
  initialStudioPreview,
  initialStudioView,
} from "./use-render-studio-state";

describe("initialStudioView", () => {
  it("opens an existing result on the Result tab", () => {
    expect(initialStudioView("/uploads/result.png")).toBe("result");
  });

  it("keeps a new upload on the Original tab", () => {
    expect(initialStudioView(null)).toBe("original");
  });
});

describe("initialStudioPreview", () => {
  it("uses an existing original URL without fetching it into a File", () => {
    const originalUrl = "https://assets.example.com/original.jpg";
    expect(initialStudioPreview(originalUrl)).toBe(originalUrl);
  });

  it("keeps a new Studio empty until the user uploads an image", () => {
    expect(initialStudioPreview(null)).toBeNull();
  });
});
