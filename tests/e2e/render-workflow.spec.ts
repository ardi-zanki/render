import { expect, test } from "@playwright/test";
import sharp from "sharp";

import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "./test-user";

async function makeRenderImage() {
  return sharp({
    create: {
      width: 768,
      height: 576,
      channels: 3,
      background: { r: 190, g: 205, b: 220 },
    },
  })
    .png()
    .toBuffer();
}

test("user can login and create a mock render", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_USER_EMAIL);
  await page.locator("#password").fill(E2E_USER_PASSWORD);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  await page.goto("/renders/new");
  await expect(
    page.getByRole("heading", { name: "Render Studio" }),
  ).toBeVisible();
  await expect(page.getByText(/sisa\s+3/i)).toBeVisible();
  // Output format now offers an "Original" (no re-encode) choice.
  await expect(page.locator("#outputFormat")).toContainText("Original");

  await page.locator('input[type="file"]').first().setInputFiles({
    name: "e2e-room.png",
    mimeType: "image/png",
    buffer: await makeRenderImage(),
  });

  // Pick a couple of controls so the persisted config can be asserted later.
  await page.locator("#style").selectOption("modern");
  await page.locator("#location").fill("Bandung E2E");

  await expect(page.getByRole("tab", { name: "Asli" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Render", exact: true }),
  ).toBeEnabled();

  const createResp = page.waitForResponse(
    (r) => r.url().endsWith("/api/renders") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Render", exact: true }).click();
  await expect(page.getByText("Render masuk antrean", { exact: true })).toBeVisible();

  const renderId = ((await (await createResp).json()) as { renderId: string })
    .renderId;
  expect(renderId).toBeTruthy();

  await expect
    .poll(
      async () => {
        const response = await page.request.get(`/api/renders/${renderId}`);
        expect(response.ok()).toBe(true);
        const render = (await response.json()) as {
          status: string;
          resultUrl: string | null;
        };
        return render.status === "success" && render.resultUrl
          ? "success"
          : render.status;
      },
      { timeout: 30_000, intervals: [1_000, 2_000] },
    )
    .toBe("success");

  await page.goto(`/renders/${renderId}`);
  await expect(page.getByRole("heading", { name: "Interior" })).toBeVisible();
  // Secondary actions are grouped under the ⋮ menu; Open Studio is the primary.
  await page.getByRole("button", { name: "Aksi lainnya" }).click();
  await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Bagikan" })).toBeVisible();
  await page.keyboard.press("Escape");
  // Detail page reopens in the studio (renamed from "Reuse prompt") and no
  // longer surfaces the prompt (treated as a company secret).
  await expect(
    page.getByRole("link", { name: "Open Studio" }),
  ).toBeVisible();
  await expect(page.getByText("Prompt", { exact: true })).toHaveCount(0);

  // Clicking the original image opens a zoomable lightbox.
  await page.getByRole("button", { name: /Perbesar Gambar asli/ }).click();
  await expect(
    page.getByRole("button", { name: "Perbesar", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tutup" }).click();

  // Open Studio: reopens with config pre-filled and the original + previous
  // result loaded, so all three viewer tabs are available.
  await page.getByRole("link", { name: "Open Studio" }).click();
  await expect(
    page.getByRole("heading", { name: "Render Studio" }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Komparasi" })).toBeVisible();
  await expect(page.locator("#style")).toHaveValue("modern");
  await expect(page.locator("#location")).toHaveValue("Bandung E2E");
  for (const name of ["Asli", "Komparasi", "Hasil"]) {
    await expect(
      page.getByRole("tab", { name, exact: true }),
    ).not.toHaveAttribute("aria-disabled", "true");
  }

  // Edit-in-place: changing config and rendering adds a NEW version to the SAME
  // render (no new record) and charges a credit.
  await page.locator("#style").selectOption("industrial");
  await page.getByRole("button", { name: "Render", exact: true }).click();
  await expect(
    page.getByText("Edit masuk antrean", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(
      async () => {
        const response = await page.request.get(`/api/renders/${renderId}`);
        const detail = (await response.json()) as {
          assets?: { type: string }[];
        };
        return (detail.assets ?? []).filter((a) => a.type === "edit").length;
      },
      { timeout: 30_000, intervals: [1_000, 2_000] },
    )
    .toBeGreaterThan(0);
});
