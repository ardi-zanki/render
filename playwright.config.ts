import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", override: false });

const e2eEnvOverrides = {
  AI_PROVIDER: "mock",
  APP_URL: "http://localhost:3210",
  BETTER_AUTH_URL: "http://localhost:3210",
  PAYMENT_PROVIDER: "mock",
  RATE_LIMIT_ENABLED: "false",
  RENDER_PROCESSING_MODE: "inline",
  STORAGE_PROVIDER: "local",
};

Object.assign(process.env, e2eEnvOverrides);

const webServerEnv = {
  ...Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  ),
  ...e2eEnvOverrides,
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  globalSetup: "./tests/e2e/global-setup.ts",
  reporter: [["html"], ["list"]],
  use: {
    baseURL: "http://localhost:3210",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    env: webServerEnv,
    url: "http://localhost:3210",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
