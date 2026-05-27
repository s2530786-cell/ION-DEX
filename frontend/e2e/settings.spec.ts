import { expect, test } from "@playwright/test";
import { domClick, fillControlledInput } from "./helpers";

test.describe("Settings page", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(10_000);
    await page.addInitScript(() => {
      window.localStorage.removeItem("ion-dex-app-settings");
    });
    await page.goto("/#/settings");
    await expect(page.getByTestId("page-settings")).toBeVisible({ timeout: 15_000 });
  });

  test("loads preference rows and summary tiles", async ({ page }) => {
    await expect(page.getByTestId("page-title")).toHaveText("System settings");
    await expect(page.getByTestId("settings-dark-toggle")).toBeVisible();
    await expect(page.getByTestId("settings-slippage-value")).toContainText("0.5%");
    await expect(page.getByTestId("settings-notify-toggle")).toBeVisible();
    await expect(page.getByTestId("settings-summary-theme")).toBeVisible();
  });

  test("updates slippage and clears removable cache entries", async ({ page }) => {
    await domClick(page, "settings-slippage-edit");
    await fillControlledInput(page, "settings-slippage-input", "1.2");
    await domClick(page, "settings-slippage-save");
    await expect(page.getByTestId("settings-slippage-value")).toHaveText("1.2%");
    await expect(page.getByTestId("settings-saved-banner")).toContainText("1.2%");

    await domClick(page, "settings-notify-toggle");
    await expect(page.getByTestId("settings-summary-notify")).toHaveText("Muted");

    await page.evaluate(() => {
      window.localStorage.setItem("ion-dex-cache-demo-panel", JSON.stringify({ ts: Date.now() }));
    });
    await domClick(page, "settings-clear-cache");
    await expect(page.getByTestId("settings-saved-banner")).toContainText(/Cleared \d+ cached entries/);
  });
});
