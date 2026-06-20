import { expect, test } from "@playwright/test";

test.describe("auth pages", () => {
  test("login page renders and validates empty submit", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Masuk ke Render Studio" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Masuk", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("by Glasier Labs")).toHaveCount(0);

    await page.getByRole("button", { name: "Masuk", exact: true }).click();

    await expect(page.getByText("Format email tidak valid")).toBeVisible();
    await expect(page.getByText("Password wajib diisi")).toBeVisible();
  });

  test("register page renders and validates required fields", async ({
    page,
  }) => {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: "Buat akun Render Studio" }),
    ).toBeVisible();
    await expect(page.getByLabel("Nama lengkap")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Daftar", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("by Glasier Labs")).toHaveCount(0);

    await page.getByRole("button", { name: "Daftar", exact: true }).click();

    await expect(page.getByText("Nama minimal 2 karakter")).toBeVisible();
    await expect(page.getByText("Format email tidak valid")).toBeVisible();
    await expect(page.getByText("Password minimal 8 karakter")).toBeVisible();
    await expect(
      page.getByText("Anda harus menyetujui syarat & ketentuan"),
    ).toBeVisible();
  });

  test("forgot password page renders and validates email", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(
      page.getByRole("heading", { name: "Lupa Password" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Kirim tautan reset" }),
    ).toBeVisible();
    await expect(page.getByText("by Glasier Labs")).toHaveCount(0);

    await page.getByLabel("Email").fill("bukan-email");
    await page.getByRole("button", { name: "Kirim tautan reset" }).click();

    await expect(page.getByText("Format email tidak valid")).toBeVisible();
  });

  test("reset password page shows invalid link state without token", async ({
    page,
  }) => {
    await page.goto("/reset-password");

    await expect(
      page.getByRole("heading", { name: "Tautan tidak valid" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Tautan reset sudah kedaluwarsa atau tidak valid. Minta tautan baru untuk melanjutkan.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Minta tautan baru" }),
    ).toHaveAttribute("href", "/forgot-password");
    await expect(page.getByText("by Glasier Labs")).toHaveCount(0);
  });
});
