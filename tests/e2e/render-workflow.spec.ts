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
    page.getByRole("link", { name: "Render Studio" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Top up" })).toBeVisible();
  // Output format now offers an "Original" (no re-encode) choice.
  await expect(page.locator("#outputFormat")).toContainText("Original");

  // Exterior keeps the richer architectural/environment controls; switching
  // back to Interior restores the reference-prompt lighting-only UI.
  await page.getByRole("button", { name: "Exterior", exact: true }).click();
  await expect(page.locator("#style")).toBeVisible();
  await expect(page.locator("#location")).toBeVisible();
  await expect(page.getByText("Cuaca", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Interior", exact: true }).click();

  await page.locator('input[type="file"]').first().setInputFiles({
    name: "e2e-room.png",
    mimeType: "image/png",
    buffer: await makeRenderImage(),
  });

  // Interior uses the exact reference prompt: only its four lighting modes are
  // configurable, while style/location/free instructions stay out of the UI.
  await expect(page.locator("#style")).toHaveCount(0);
  await expect(page.locator("#location")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pagi" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Siang" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Malam" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Mix", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mix", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");

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

  const detailResponse = await page.request.get(`/api/renders/${renderId}`);
  const createdRender = (await detailResponse.json()) as {
    projectId: string;
    projectName: string;
    config: Record<string, unknown> | null;
    prompt?: unknown;
    enhancedPrompt?: unknown;
    providerResponse?: unknown;
  };
  expect(createdRender.config).toEqual({ time: "mixed" });
  expect(createdRender).not.toHaveProperty("prompt");
  expect(createdRender).not.toHaveProperty("enhancedPrompt");
  expect(createdRender).not.toHaveProperty("providerResponse");

  // Render history carries a safe contextual return target into the detail.
  await page.goto("/renders");
  const historyRenderLink = page.locator(
    `a[href^="/renders/${renderId}?returnTo="]`,
  );
  await expect(historyRenderLink).toHaveCount(1);
  await historyRenderLink.click();
  const allRendersLink = page.getByRole("link", {
    name: "Semua render",
    exact: true,
  });
  await expect(allRendersLink).toHaveAttribute("href", "/renders");
  await allRendersLink.click();
  await expect(page).toHaveURL(/\/renders$/);

  // A render opened from a project returns to that exact project instead.
  await page.goto(`/projects/${createdRender.projectId}`);
  const projectRenderLink = page.locator(
    `a[href^="/renders/${renderId}?returnTo="]`,
  );
  await expect(projectRenderLink).toHaveCount(1);
  await projectRenderLink.click();
  const projectBackLink = page.getByRole("link", {
    name: createdRender.projectName,
    exact: true,
  });
  await expect(projectBackLink).toHaveAttribute(
    "href",
    `/projects/${createdRender.projectId}`,
  );

  await expect(page.getByRole("heading", { name: "Interior" })).toBeVisible();
  // Secondary actions are grouped under the ⋮ menu; Open Studio is the primary.
  await page.getByRole("button", { name: "Aksi lainnya" }).click();
  await expect(page.getByRole("button", { name: "Unduh" })).toBeVisible();
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
    page.getByRole("link", { name: "Render Studio" }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Komparasi" })).toBeVisible();
  await expect(page.locator("#style")).toHaveCount(0);
  await expect(page.locator("#location")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Mix", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const name of ["Asli", "Komparasi", "Hasil"]) {
    await expect(
      page.getByRole("tab", { name, exact: true }),
    ).not.toHaveAttribute("aria-disabled", "true");
  }

  // Texture editor is available for a completed render and exposes all three
  // supported material sources without exposing its composed prompt.
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Edit Texture", exact: true }),
  ).toBeVisible();
  for (const source of ["Library", "Upload", "Deskripsi"]) {
    await expect(page.getByRole("tab", { name: source, exact: true })).toBeVisible();
  }
  await page.getByRole("tab", { name: "Hasil", exact: true }).click();

  // Edit-in-place: changing config and rendering adds a NEW version to the SAME
  // render (no new record) and charges a credit.
  await page.getByRole("button", { name: "Malam", exact: true }).click();
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

  await expect
    .poll(
      async () => {
        const response = await page.request.get(`/api/renders/${renderId}`);
        const render = (await response.json()) as { status: string };
        return render.status;
      },
      { timeout: 30_000, intervals: [1_000, 2_000] },
    )
    .toBe("success");

  // Dashboard recent renders are navigable just like project cards.
  await page.goto("/dashboard");
  const dashboardRenderLink = page.locator(`a[href="/renders/${renderId}"]`).first();
  await expect(dashboardRenderLink).toBeVisible();
  await dashboardRenderLink.click();
  await expect(page).toHaveURL(new RegExp(`/renders/${renderId}$`));

  // Sidebar search opens a command menu with recent renders and navigates to a
  // selected render. Filtering is automatic through the debounced input.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Cari render", exact: true }).click();
  await expect(page.getByText("Render terbaru", { exact: true })).toBeVisible();
  await page.getByPlaceholder("Cari render...").fill("Interior");
  const commandResult = page.getByRole("button", {
    name: /Render Interior/,
  });
  await expect(commandResult).toBeVisible();
  await commandResult.click();
  await expect(page).toHaveURL(new RegExp(`/renders/${renderId}$`));

  // Bantuan is now an internal app page with clear contact channels.
  await page.goto("/support");
  await expect(page.getByRole("heading", { name: "Bantuan" })).toBeVisible();
  await expect(
    page.locator('a[href="mailto:support@renderai.app"]'),
  ).toContainText("Email");
  await expect(page.locator('a[href^="https://wa.me/"]')).toContainText(
    "WhatsApp",
  );
  await expect(
    page.locator('a[href^="https://www.instagram.com/"]'),
  ).toContainText("Instagram");

  // A logged-in visitor on the public share page should see creator metadata
  // and land in a fully hydrated studio when choosing Open Studio.
  const shareResponse = await page.request.post("/api/renders/share", {
    data: { renderId },
  });
  expect(shareResponse.ok()).toBe(true);
  const share = (await shareResponse.json()) as { slug: string };
  await page.goto(`/s/${share.slug}`);
  await expect(page.getByText(/E2E Render User ·/)).toBeVisible();
  const shareStudioLink = page
    .getByRole("link", { name: "Open Studio", exact: true })
    .first();
  await expect(shareStudioLink).toBeVisible();
  await shareStudioLink.click();
  await expect(page).toHaveURL(/\/renders\/new$/);
  await expect(
    page.getByRole("link", { name: "Render Studio" }),
  ).toBeVisible();
});
