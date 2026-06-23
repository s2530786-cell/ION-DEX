import { test, expect } from "@playwright/test";
import { dismissBootSplashIfPresent } from "./boot-splash";
import { installE2eSessionFlags } from "./helpers";

const VIEWPORTS = [
  { width: 375, height: 844, label: "375" },
  { width: 768, height: 900, label: "768" },
  { width: 1440, height: 900, label: "1440" },
] as const;

const signoffEnabled = process.env.ION_UI_SIGNOFF === "1";

test.describe("Splash visual signoff captures", () => {
  test.skip(!signoffEnabled, "set ION_UI_SIGNOFF=1 to capture signoff screenshots");
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(25_000);
    await installE2eSessionFlags(page);
  });

  test("capture splash at 375/768/1440", async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const splash = page.getByTestId("boot-splash-screen");
      await expect(splash).toBeVisible();
      await expect(page.getByText("ION DEX", { exact: true }).first()).toBeVisible();
      await expect(page.getByText(/GALAXY LIQUIDITY GATEWAY/i).first()).toBeVisible();
      await expect(page.getByText(/CYBER AURORA|NEBULA MATRIX|GALAXY SPIRAL/).first()).toBeVisible();
      await page.screenshot({
        path: `test-results/ui-signoff/splash-${viewport.label}.png`,
        fullPage: false,
      });
      await dismissBootSplashIfPresent(page);
      await expect(page.getByTestId("main-content")).toBeVisible({ timeout: 30_000 });
    }
  });
});
