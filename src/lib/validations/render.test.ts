import { describe, expect, it } from "vitest";

import { createProjectSchema, createRenderSchema } from "./render";

describe("createRenderSchema", () => {
  it("coerces form values used by render creation", () => {
    const result = createRenderSchema.safeParse({
      projectId: "d0048597-e3fd-48ca-9810-696155cdd67b",
      mode: "interior",
      lightsOn: "true",
      styleTransferStrength: "0.75",
      outputFormat: "png",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.lightsOn).toBe(true);
    expect(result.data.styleTransferStrength).toBe(0.75);
  });

  it('accepts the "original" output format', () => {
    const result = createRenderSchema.safeParse({
      mode: "interior",
      outputFormat: "original",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.outputFormat).toBe("original");
  });

  it("rejects invalid render options", () => {
    const result = createRenderSchema.safeParse({
      mode: "landscape",
      instruction: "x".repeat(1001),
      outputFormat: "pdf",
      styleTransferStrength: 2,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors).toMatchObject({
      mode: expect.any(Array),
      instruction: expect.any(Array),
      outputFormat: expect.any(Array),
      styleTransferStrength: expect.any(Array),
    });
  });
});

describe("createProjectSchema", () => {
  it("requires a project name", () => {
    const result = createProjectSchema.safeParse({
      name: "",
      description: "Project test",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.name).toEqual([
      "Nama project wajib diisi",
    ]);
  });
});
