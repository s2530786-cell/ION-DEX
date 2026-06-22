// ION DEX Visual Regression Testing Configuration
// Based on Playwright + pixelmatch (lightweight, zero external service needed)

import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './tests/visual-regression',
  timeout: 30000,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'off',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
