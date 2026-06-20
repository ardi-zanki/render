import { describe, expect, it } from "vitest";

import { floodFillSelection } from "./magic-wand";

function pixels(colors: Array<[number, number, number]>) {
  return new Uint8ClampedArray(colors.flatMap(([r, g, b]) => [r, g, b, 255]));
}

describe("floodFillSelection", () => {
  it("keeps a selection inside a similar contiguous region", () => {
    const selection = floodFillSelection(
      pixels([
        [100, 100, 100],
        [112, 112, 112],
        [155, 155, 155],
        [101, 101, 101],
        [113, 113, 113],
        [156, 156, 156],
      ]),
      3,
      2,
      0,
      0,
      30,
    );

    expect([...selection]).toEqual([1, 1, 0, 1, 1, 0]);
  });

  it("does not jump to a disconnected area with the same colour", () => {
    const selection = floodFillSelection(
      pixels([
        [90, 90, 90],
        [180, 180, 180],
        [90, 90, 90],
      ]),
      3,
      1,
      0,
      0,
      20,
    );

    expect([...selection]).toEqual([1, 0, 0]);
  });

  it("returns an empty selection for coordinates outside the image", () => {
    expect(
      [...floodFillSelection(pixels([[0, 0, 0]]), 1, 1, 2, 0, 20)],
    ).toEqual([0]);
  });
});
