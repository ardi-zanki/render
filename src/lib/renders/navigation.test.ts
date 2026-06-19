import { describe, expect, it } from "vitest";

import { renderDetailBackLink } from "./navigation";

const PROJECT_ID = "d0048597-e3fd-48ca-9810-696155cdd67b";

describe("renderDetailBackLink", () => {
  it("returns to the originating project with its list state", () => {
    expect(
      renderDetailBackLink(
        `/projects/${PROJECT_ID}?page=2&q=dapur`,
        PROJECT_ID,
        "Rumah Bandung",
      ),
    ).toEqual({
      href: `/projects/${PROJECT_ID}?page=2&q=dapur`,
      label: "Rumah Bandung",
    });
  });

  it("returns to render history with its filters", () => {
    expect(
      renderDetailBackLink(
        "/renders?status=failed&page=3",
        PROJECT_ID,
        "Rumah Bandung",
      ),
    ).toEqual({
      href: "/renders?status=failed&page=3",
      label: "Semua render",
    });
  });

  it("rejects external and unrelated return targets", () => {
    expect(
      renderDetailBackLink("//example.com", PROJECT_ID, "Rumah Bandung"),
    ).toEqual({ href: "/renders", label: "Semua render" });
    expect(
      renderDetailBackLink(
        "/projects/81a446f3-cf90-48a1-8313-52891c806cb4",
        PROJECT_ID,
        "Rumah Bandung",
      ),
    ).toEqual({ href: "/renders", label: "Semua render" });
  });
});
