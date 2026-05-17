import { defineConfig, devices } from "@playwright/test";

const previewHost = "127.0.0.1";
/** Must match `frontend/package.json` → `preview:test` (start-server-and-test waits on TCP, not HTTP — avoids broken HTTP 200 probes on this host). */
const previewPort = 59333;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://${previewHost}:${previewPort}`,
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
