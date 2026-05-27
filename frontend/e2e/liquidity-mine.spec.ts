import { expect, test } from "@playwright/test";
import { domClick, fillControlledInput } from "./helpers";

test.describe("Liquidity Mine", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(10_000);
    await page.goto("/#/liquidity-mine");
    await expect(page.getByTestId("page-liquidity-mine")).toBeVisible({ timeout: 15_000 });
  });

  test("loads summary tiles and pool rows", async ({ page }) => {
    await expect(page.getByTestId("liquidity-mine-stat-lp-shares")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("liquidity-mine-stat-pending-reward")).toBeVisible();
    await expect(page.getByTestId("liquidity-mine-pool-row-0")).toBeVisible();
    await expect(page.getByTestId("liquidity-mine-pool-row-1")).toBeVisible();
  });

  test("can submit stake intent from first pool", async ({ page }) => {
    await fillControlledInput(page, "liquidity-mine-stake-amount-0", "10");
    await domClick(page, "liquidity-mine-stake-btn-0");
    await expect(page.getByTestId("liquidity-mine-confirmation")).toBeVisible({ timeout: 10_000 });
  });
});
