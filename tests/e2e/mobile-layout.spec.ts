import { expect, test } from "@playwright/test";

import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "./test-user";

test.use({ viewport: { width: 390, height: 844 } });

test("public footer keeps the theme toggle beside the copyright", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await footer.scrollIntoViewIfNeeded();

  const copyright = footer.getByText(/Seluruh hak cipta dilindungi/);
  const themeToggle = footer.getByRole("button", {
    name: "Ganti tema terang/gelap",
  });
  const [copyrightBox, toggleBox] = await Promise.all([
    copyright.boundingBox(),
    themeToggle.boundingBox(),
  ]);

  expect(copyrightBox).not.toBeNull();
  expect(toggleBox).not.toBeNull();
  expect(toggleBox!.x).toBeGreaterThan(
    copyrightBox!.x + copyrightBox!.width,
  );
  expect(toggleBox!.y).toBeLessThan(copyrightBox!.y + copyrightBox!.height);
  expect(toggleBox!.y + toggleBox!.height).toBeGreaterThan(copyrightBox!.y);
});

test("logout feedback covers the full mobile viewport", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_USER_EMAIL);
  await page.locator("#password").fill(E2E_USER_PASSWORD);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  await page.getByRole("button", { name: "Buka menu" }).click();
  await page
    .getByRole("button", { name: "Buka menu akun E2E Render User" })
    .click();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();

  const feedback = page.getByRole("status");
  await expect(feedback).toBeVisible();
  const box = await feedback.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBe(0);
  expect(box!.y).toBe(0);
  expect(box!.width).toBe(390);
  expect(box!.height).toBe(844);
  await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });
});
