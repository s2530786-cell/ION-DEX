import { expect, test, type APIRequestContext } from "@playwright/test";
import { domClick, fillControlledInput, playwrightAppOrigin } from "./helpers";

async function resetCopySession(request: APIRequestContext) {
  const base = playwrightAppOrigin();
  await request.post(`${base}/api/copy-trade/stop`, { data: {} }).catch(() => undefined);
}

test.describe("Copy Trade", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60_000);

  test.beforeEach(async ({ page, request }) => {
    page.setDefaultTimeout(10_000);
    await resetCopySession(request);
    await page.goto("/#/copy-trade");
    await expect(page.getByTestId("page-copy-trade")).toBeVisible({ timeout: 15_000 });
  });

  test("loads and shows stats cards", async ({ page }) => {
    await expect(page.getByTestId("copy-trade-stat-online-traders")).toBeVisible();
    await expect(page.getByTestId("copy-trade-stat-today-total")).toBeVisible();
    await expect(page.getByTestId("copy-trade-stat-avg-return")).toBeVisible();
    await expect(page.getByTestId("copy-trade-stat-my-count")).toBeVisible();
  });

  test("can toggle copy trading on/off", async ({ page }) => {
    await fillControlledInput(page, "copy-trade-leader-address", "0x1111111111111111111111111111111111111111");
    await fillControlledInput(page, "copy-trade-max-amount", "1000000000000000000");
    await fillControlledInput(page, "copy-trade-min-profit-bps", "50");
    await fillControlledInput(page, "copy-trade-stop-loss-bps", "200");
    await fillControlledInput(page, "copy-trade-slippage-bps", "30");

    await domClick(page, "copy-trade-start-btn");
    await expect(page.getByTestId("copy-trade-confirmation")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("copy-trade-toggle-active")).toHaveAttribute("data-active", "true");

    await domClick(page, "copy-trade-stop-btn");
    await expect(page.getByTestId("copy-trade-toggle-active")).toHaveAttribute("data-active", "false");
    await expect(page.getByTestId("copy-trade-confirmation")).toHaveCount(0);
  });
});
