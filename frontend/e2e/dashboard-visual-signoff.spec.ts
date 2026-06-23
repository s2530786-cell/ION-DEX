import { test, expect } from "@playwright/test";
import { ensureAppShell, installE2eSessionFlags } from "./helpers";

const VIEWPORTS = [
  { width: 375, height: 844, label: "375" },
  { width: 768, height: 900, label: "768" },
  { width: 1440, height: 900, label: "1440" },
] as const;

const signoffEnabled = process.env.ION_UI_SIGNOFF === "1";

test.describe("Dashboard visual signoff captures", () => {
  test.skip(!signoffEnabled, "set ION_UI_SIGNOFF=1 to capture signoff screenshots");
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(25_000);
    await installE2eSessionFlags(page);
  });

  test("capture dashboard at 375/768/1440", async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await ensureAppShell(page);
      await expect(page.getByTestId("page-dashboard")).toBeVisible();
      await expect(page.getByTestId("dashboard-main-stage")).toBeVisible();
      await expect(page.getByTestId("dashboard-feature-grid")).toBeVisible();
      await page.screenshot({
        path: `test-results/ui-signoff/dashboard-${viewport.label}.png`,
        fullPage: false,
      });
    }
  });
});
