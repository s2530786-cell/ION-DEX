import { expect, test, type Page } from "@playwright/test";
import { domClick, fillControlledInput, installE2eSessionFlags } from "./helpers";

const sampleCsv = `0x1111111111111111111111111111111111111111,1.25
0x2222222222222222222222222222222222222222,2.5`;

async function loadBatchTransferPage(page: Page) {
  await expect(async () => {
    await page.goto("/#/batch-transfer", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("page-batch-transfer")).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
  await expect(page.getByTestId("batch-transfer-stat-max-recipients")).toBeVisible({ timeout: 15_000 });
}

async function parseTransferRecipients(page: Page) {
  await expect(async () => {
    await fillControlledInput(page, "batch-transfer-csv-input", sampleCsv);
    await domClick(page, "batch-transfer-parse-btn");
    await expect(page.getByTestId("batch-transfer-recipient-row-0")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-recipient-row-1")).toBeVisible();
  }).toPass({ timeout: 20_000 });
}

test.describe("Batch Transfer", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(10_000);
    await installE2eSessionFlags(page);
    await loadBatchTransferPage(page);
  });

  test("loads and shows config tiles", async ({ page }) => {
    await expect(page.getByTestId("batch-transfer-stat-max-recipients")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-stat-fee")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-stat-contract")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-stat-token")).toBeVisible();
  });

  test("parses CSV recipients into the list", async ({ page }) => {
    await domClick(page, "batch-transfer-paste-sample");
    await domClick(page, "batch-transfer-parse-btn");
    await expect(page.getByTestId("batch-transfer-recipient-row-0")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-recipient-row-1")).toBeVisible();
  });

  test("can remove a recipient from the list", async ({ page }) => {
    await fillControlledInput(page, "batch-transfer-csv-input", sampleCsv);
    await domClick(page, "batch-transfer-parse-btn");
    await expect(page.getByTestId("batch-transfer-recipient-row-1")).toBeVisible();
    await domClick(page, "batch-transfer-remove-row-0");
    await expect(page.getByTestId("batch-transfer-recipient-row-0")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-recipient-row-1")).toHaveCount(0);
  });

  test("validates transfer payload via gateway", async ({ page }) => {
    await parseTransferRecipients(page);

    const validateBtn = page.getByTestId("batch-transfer-validate");
    await expect(validateBtn).toBeEnabled();
    await expect(validateBtn).toHaveText(/Validate batch send/i);

    const validateResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/batch-transfer/validate-transfer") &&
        res.request().method() === "POST" &&
        res.status() === 200,
      { timeout: 30_000 },
    );
    await validateBtn.evaluate((el) => {
      (el as HTMLElement).click();
    });
    const response = await validateResponse;
    const body = (await response.json()) as { data?: { recipientCount?: number } };
    expect(body.data?.recipientCount).toBe(2);

    await expect(validateBtn).not.toHaveText(/Validating/i, { timeout: 20_000 });

    await expect(async () => {
      const actionError = page.getByTestId("batch-transfer-action-error");
      if (await actionError.isVisible()) {
        throw new Error(`Validation failed: ${await actionError.textContent()}`);
      }
      await expect(page.getByTestId("batch-transfer-result")).toBeVisible();
      await expect(page.getByTestId("batch-transfer-result")).toContainText(/Validated 2 recipients/i);
    }).toPass({ timeout: 25_000 });
  });

  test("can switch to collect tab", async ({ page }) => {
    await domClick(page, "batch-transfer-tab-collect");
    await expect(page.getByTestId("batch-transfer-main-address")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-collect-input")).toBeVisible();
  });
});
