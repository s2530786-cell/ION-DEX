import { expect, test } from "@playwright/test";

test.describe("ION DEX smoke", () => {
  test("home page shows key sections and controls", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("brand-title")).toHaveText("ION DEX");
    await expect(page.getByTestId("ticker-strip")).toBeVisible();
    await expect(page.getByTestId("main-content")).toBeVisible();
    await expect(page.getByText("Professional Chart")).toBeVisible();
    await expect(page.getByTestId("swap-submit")).toBeVisible();
    await expect(page.getByTestId("swap-submit")).toBeEnabled();
    await expect(page.getByRole("button", { name: "Wallet Connect" })).toBeVisible();
  });

  test("375px viewport keeps brand and main content visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto("/");

    await expect(page.getByTestId("brand-title")).toBeVisible();
    await expect(page.getByTestId("main-content")).toBeVisible();
  });

  test("768px and 1440px viewports keep brand visible", async ({ page }) => {
    for (const width of [768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.getByTestId("brand-title")).toBeVisible();
    }
  });

  test("top navigation opens business page shells", async ({ page }) => {
    await page.goto("/");

    const pages = [
      ["trade", "ION spot order desk"],
      ["grid", "On-chain spot grid"],
      ["pool", "ION liquidity pools"],
      ["stake", "DEX staking hub"],
      ["bridge", "BSC <> ION bridge"],
      ["burn", "Dual-chain burn tracker"],
      ["domain", "Domain trading and binding"],
      ["ai", "On-chain AI market analyst"],
    ] as const;

    for (const [key, title] of pages) {
      await page.getByTestId(`nav-${key}`).click();
      await expect(page.getByTestId(`page-${key}`)).toBeVisible();
      await expect(page.getByTestId("page-title")).toHaveText(title);
    }
  });

  test("trade page validates and drafts a limit order", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("nav-trade").click();

    await expect(page.getByTestId("trade-form")).toBeVisible();
    await expect(page.getByTestId("trade-submit")).toBeDisabled();

    await page.getByTestId("trade-amount").fill("1250");
    await page.getByTestId("trade-price").fill("6");
    await page.getByTestId("trade-slippage").fill("0.5");

    await expect(page.getByTestId("trade-preview")).toContainText("Buying 1,250 ION");
    await expect(page.getByTestId("trade-submit")).toBeEnabled();

    await page.getByTestId("trade-submit").click();
    await expect(page.getByTestId("trade-confirmation")).toContainText("Draft order ready");
  });

  test("grid page validates bounds and drafts a strategy", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("nav-grid").click();

    await expect(page.getByTestId("grid-form")).toBeVisible();
    await expect(page.getByTestId("grid-submit")).toBeDisabled();

    await page.getByTestId("grid-lower").fill("7.4");
    await page.getByTestId("grid-upper").fill("5.2");
    await expect(page.getByTestId("grid-error")).toBeVisible();

    await page.getByTestId("grid-lower").fill("5.2");
    await page.getByTestId("grid-upper").fill("7.4");
    await page.getByTestId("grid-count").fill("22");
    await page.getByTestId("grid-investment").fill("2500");

    await expect(page.getByTestId("grid-preview")).toContainText("arithmetic grid");
    await expect(page.getByTestId("grid-submit")).toBeEnabled();

    await page.getByTestId("grid-submit").click();
    await expect(page.getByTestId("grid-confirmation")).toContainText("Strategy draft ready");
  });

  test("pool page validates slippage and drafts liquidity mint", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("nav-pool").click();

    await expect(page.getByTestId("pool-form")).toBeVisible();
    await expect(page.getByTestId("pool-submit")).toBeDisabled();

    await page.getByTestId("pool-bnb").fill("2");
    await page.getByTestId("pool-ion").fill("800");
    await page.getByTestId("pool-slippage").fill("10");
    await expect(page.getByTestId("pool-error")).toBeVisible();

    await page.getByTestId("pool-slippage").fill("0.5");
    await expect(page.getByTestId("pool-preview")).toContainText("Liquidity preview:");
    await expect(page.getByTestId("pool-submit")).toBeEnabled();

    await page.getByTestId("pool-submit").click();
    await expect(page.getByTestId("pool-confirmation")).toContainText("Liquidity draft ready");
  });

  test("stake page drafts stake and unstake payloads", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("nav-stake").click();

    await expect(page.getByTestId("stake-form")).toBeVisible();
    await expect(page.getByTestId("stake-submit")).toBeDisabled();

    await page.getByTestId("stake-amount").fill("250");
    await expect(page.getByTestId("stake-preview")).toContainText("Stake preview:");
    await expect(page.getByTestId("stake-submit")).toBeEnabled();

    await page.getByTestId("stake-submit").click();
    await expect(page.getByTestId("stake-confirmation")).toContainText("Stake draft ready");

    await page.getByTestId("stake-mode-unstake").click();
    await page.getByTestId("stake-amount").fill("100");
    await expect(page.getByTestId("stake-preview")).toContainText("Unstake preview:");
    await expect(page.getByTestId("stake-submit")).toBeEnabled();

    await page.getByTestId("stake-submit").click();
    await expect(page.getByTestId("stake-confirmation")).toContainText("Unstake draft ready");
  });
});
