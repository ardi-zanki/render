import { afterEach, describe, expect, it, vi } from "vitest";

import { timeAgo } from "./ui";

describe("timeAgo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats compact Indonesian relative times", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-09T10:00:00.000Z"));

    expect(timeAgo("2026-06-09T09:59:45.000Z")).toBe("baru saja");
    expect(timeAgo("2026-06-09T09:45:00.000Z")).toBe("15 menit lalu");
    expect(timeAgo("2026-06-09T07:00:00.000Z")).toBe("3 jam lalu");
    expect(timeAgo("2026-06-06T10:00:00.000Z")).toBe("3 hari lalu");
  });
});
