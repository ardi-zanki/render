import { describe, expect, it } from "vitest";

import { initialStudioView } from "./use-render-studio-state";

describe("initialStudioView", () => {
  it("opens an existing result on the Result tab", () => {
    expect(initialStudioView("/uploads/result.png")).toBe("result");
  });

  it("keeps a new upload on the Original tab", () => {
    expect(initialStudioView(null)).toBe("original");
  });
});
