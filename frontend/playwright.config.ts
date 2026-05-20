import { defineConfig, devices } from "@playwright/test";

const previewHost = "127.0.0.1";
const previewBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://${previewHost}:59333`;

export default defineConfig({
  testDir: "./e2e",
  workers: process.env.PLAYWRIGHT_BASE_URL ? 1 : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: previewBaseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1536, height: 864 },
      },
    },
  ],
});
