import { expect, test } from "@playwright/test";
import { domClick, fillControlledInput, installE2eSessionFlags } from "./helpers";
import { getSettingsNotifyStateLabel } from "../src/i18n/settingsCopy";

test.describe("Settings page", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(10_000);
    await installE2eSessionFlags(page);
    await page.addInitScript(() => {
      window.localStorage.removeItem("ion-dex-app-settings");
    });
    await page.goto("/#/settings");
    await expect(page.getByTestId("page-settings")).toBeVisible({ timeout: 15_000 });
  });

  test("loads preference rows and summary tiles", async ({ page }) => {
    await expect(page.getByTestId("page-title")).toHaveText(/^(System settings|绯荤粺璁剧疆)$/);
    await expect(page.getByTestId("settings-dark-toggle")).toBeVisible();
    await expect(page.getByTestId("settings-slippage-value")).toContainText("0.5%");
    await expect(page.getByTestId("settings-notify-toggle")).toBeVisible();
    await expect(page.getByTestId("settings-summary-theme")).toBeVisible();
    await expect(page.getByTestId("settings-sentinel-alert-test")).toBeVisible();
  });

  test("runs sentinel alert self-test from settings", async ({ page }) => {
    await page.getByTestId("settings-sentinel-alert-test-btn").click();
    await expect(page.getByTestId("settings-sentinel-alert-test-result")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("updates slippage and clears removable cache entries", async ({ page }) => {
    await domClick(page, "settings-slippage-edit");
    await fillControlledInput(page, "settings-slippage-input", "1.2");
    await domClick(page, "settings-slippage-save");
    await expect(page.getByTestId("settings-slippage-value")).toHaveText("1.2%");
    await expect(page.getByTestId("settings-saved-banner")).toContainText("1.2%");

    await page.getByTestId("settings-language-select").selectOption("en-US");
    await expect(page.getByTestId("settings-summary-notify")).toHaveText(
      getSettingsNotifyStateLabel("en-US", true),
    );

    await domClick(page, "settings-notify-toggle");
    await expect(page.getByTestId("settings-summary-notify")).toHaveText(
      getSettingsNotifyStateLabel("en-US", false),
    );

    await page.evaluate(() => {
      window.localStorage.setItem("ion-dex-cache-demo-panel", JSON.stringify({ ts: Date.now() }));
    });
    await domClick(page, "settings-clear-cache");
    await expect(page.getByTestId("settings-saved-banner")).toContainText(/Cleared \d+ cached entries/);
  });

  test("switches locale across navigation and trade page copy", async ({ page }) => {
    await expect(page.getByTestId("page-title")).toHaveText("System settings");
    await expect(page.getByTestId("nav-trade")).toContainText("Trade");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await expect(page.getByTestId("settings-summary-notify")).toHaveText(
      getSettingsNotifyStateLabel("en-US", true),
    );

    await page.getByTestId("settings-language-select").selectOption("zh-CN");

    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.getByTestId("page-title")).toHaveText("系统设置");
    await expect(page.getByTestId("nav-trade")).toContainText("交易");
    await expect(page.getByTestId("settings-summary-notify")).toHaveText(
      getSettingsNotifyStateLabel("zh-CN", true),
    );

    await domClick(page, "nav-trade");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.getByTestId("page-title")).toHaveText("ION 现货订单台");
    await expect(page.getByTestId("trade-submit")).toHaveText("预览订单（不提交链上）");
  });
});
