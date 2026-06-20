/**
 * Select the contiguous pixels whose RGB distance from the clicked pixel is
 * within the user-facing tolerance. The tolerance maps directly to RGB
 * distance; it is intentionally not amplified, which keeps selections from
 * leaking through soft architectural shadows and similarly coloured surfaces.
 */
export function floodFillSelection(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  tolerance: number,
): Uint8Array {
  const selected = new Uint8Array(width * height);
  if (
    width <= 0 ||
    height <= 0 ||
    startX < 0 ||
    startY < 0 ||
    startX >= width ||
    startY >= height
  ) {
    return selected;
  }

  const start = (startY * width + startX) * 4;
  const red = pixels[start];
  const green = pixels[start + 1];
  const blue = pixels[start + 2];
  const thresholdSquared = Math.max(0, tolerance) ** 2;
  const visited = new Uint8Array(width * height);
  const stack = [startY * width + startX];

  while (stack.length > 0) {
    const point = stack.pop() as number;
    if (visited[point]) continue;
    visited[point] = 1;

    const offset = point * 4;
    const deltaRed = pixels[offset] - red;
    const deltaGreen = pixels[offset + 1] - green;
    const deltaBlue = pixels[offset + 2] - blue;
    const distanceSquared =
      deltaRed * deltaRed +
      deltaGreen * deltaGreen +
      deltaBlue * deltaBlue;
    if (distanceSquared > thresholdSquared) continue;

    selected[point] = 1;
    const x = point % width;
    const y = Math.floor(point / width);
    if (x > 0) stack.push(point - 1);
    if (x < width - 1) stack.push(point + 1);
    if (y > 0) stack.push(point - width);
    if (y < height - 1) stack.push(point + width);
  }

  return selected;
}
