import { expect, test } from "@playwright/test";
import { domClick, fillControlledInput, installE2eSessionFlags } from "./helpers";

test.describe("Domain Manage", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(10_000);
    await installE2eSessionFlags(page);
    await page.goto("/#/domain");
    await expect(page.getByTestId("page-domain")).toBeVisible({ timeout: 15_000 });
  });

  test("loads portfolio stats and owned list", async ({ page }) => {
    await expect(page.getByTestId("domain-manage-stat-owned")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("domain-manage-owned-list")).toBeVisible();
    await expect(page.getByTestId("domain-manage-owned-row-demo.ion")).toBeVisible();
  });

  test("can lookup and register a domain", async ({ page }) => {
    const label = `e2e${Date.now().toString(36).slice(-8)}.ion`;
    await fillControlledInput(page, "domain-query", label);
    await domClick(page, "domain-submit");
    await expect(page.getByTestId("domain-preview")).toContainText(label);
    await domClick(page, "domain-manage-register-btn");
    await expect(page.getByTestId("domain-confirmation")).toContainText("Register intent recorded", {
      timeout: 10_000,
    });
    await expect(page.getByTestId(`domain-manage-owned-row-${label}`)).toBeVisible({ timeout: 15_000 });
  });
});
