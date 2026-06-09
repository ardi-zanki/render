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

  await page.locator('input[type="file"]').first().setInputFiles({
    name: "e2e-room.png",
    mimeType: "image/png",
    buffer: await makeRenderImage(),
  });

  await expect(page.getByRole("tab", { name: "Asli" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Render", exact: true }),
  ).toBeEnabled();

  await page.getByRole("button", { name: "Render", exact: true }).click();
  await expect(page.getByText("Render masuk antrean", { exact: true })).toBeVisible();

  const detailLink = page.getByRole("link", { name: "Detail" });
  await expect(detailLink).toBeVisible();

  const href = await detailLink.getAttribute("href");
  const renderId = href?.split("/").pop();
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
  await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
});
