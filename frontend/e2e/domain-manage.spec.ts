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
    await expect(page.getByTestId("domain-submit")).toBeEnabled();
    await Promise.all([
      page.waitForResponse((response) => {
        return (
          response.url().includes("/api/domain-manage/lookup") &&
          response.request().method() === "POST" &&
          response.status() === 200
        );
      }),
      page.getByTestId("domain-submit").click(),
    ]);
    await expect(page.getByTestId("domain-preview")).toContainText(label);
    await expect(page.getByTestId("domain-preview")).toContainText("Available");

    await expect(page.getByTestId("domain-manage-register-btn")).toBeEnabled();
    await Promise.all([
      page.waitForResponse((response) => {
        return (
          response.url().includes("/api/domain-manage/register") &&
          response.request().method() === "POST" &&
          response.status() === 200
        );
      }),
      page.getByTestId("domain-manage-register-btn").click(),
    ]);
    await expect(page.getByTestId("domain-confirmation")).toContainText("Register intent recorded", {
      timeout: 10_000,
    });
    await expect(page.getByTestId(`domain-manage-owned-row-${label}`)).toBeVisible({ timeout: 15_000 });
  });
});
