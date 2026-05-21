import { expect, test, type Page } from "@playwright/test";

function sidebar(page: Page) {
  return page.getByTestId("app-sidebar");
}

async function clickNav(page: Page, key: string) {
  if (await sidebar(page).isVisible()) {
    await sidebar(page).getByTestId(`nav-${key}`).click();
    return;
  }
  const primary = page.getByRole("navigation", { name: "Primary" });
  if (await primary.isVisible()) {
    await primary.getByTestId(`nav-${key}`).click();
    return;
  }
  await page.getByTestId("nav-menu").click();
  await page.getByTestId("app-mobile-nav").getByTestId(`nav-${key}`).click();
}

async function expectIonBrand(page: Page) {
  const brands = page.getByTestId("brand-title");
  const count = await brands.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = brands.nth(index);
    if (await candidate.isVisible()) {
      await expect(candidate).toHaveText("ION DEX");
      return;
    }
  }
  await expect(page.locator("header").getByText("ION DEX", { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("ION DEX smoke", () => {
  test.setTimeout(60_000);

  test("home page shows key sections and controls", async ({ page }) => {
    await page.goto("/");

    await expectIonBrand(page);
    await expect(page.getByTestId("ticker-strip")).toBeVisible();
    await expect(page.getByTestId("ticker-source")).toContainText(/API|fallback/);
    await expect(page.getByTestId("main-content")).toBeVisible();
    await expect(page.getByTestId("page-dashboard")).toBeVisible();
    await expect(page.getByText("Professional Trading Surface")).toBeVisible();
    await clickNav(page, "swap");
    await expect(page.getByTestId("page-swap")).toBeVisible();
    await page.getByTestId("swap-pay-amount").fill("1");
    const swapSubmit = page.getByTestId("swap-submit");
    await expect(swapSubmit).toBeVisible();
    await expect(swapSubmit).toBeDisabled();
    await expect(page.getByTestId("swap-wallet-hint")).toBeVisible();
    await expect(page.getByRole("button", { name: "Wallet Connect" })).toBeVisible();
  });

  test("wallet shell connects via official ION extension provider mock", async ({ page }) => {
    await page.addInitScript(() => {
      const mockAddress = "EQCTestWalletAddressForE2eSmokeOnlyxxxxxxxxxx";
      window.ton = {
        isTonWallet: true,
        send: async (method: string) => {
          if (method === "ton_requestAccounts") {
            return [mockAddress];
          }
          if (method === "ton_getBalance") {
            return "1500000000";
          }
          return [];
        },
        on: () => undefined,
        off: () => undefined,
      };
    });

    await page.goto("/");

    await page.getByTestId("wallet-connect").click();
    await expect(page.getByTestId("wallet-panel")).toBeVisible();
    await expect(page.getByTestId("wallet-provider-ion-browser")).toBeVisible();

    await page.getByTestId("wallet-provider-ion-browser").click();
    await expect(page.getByTestId("wallet-confirmation")).toContainText("ION Browser Wallet connected");
    await expect(page.getByTestId("profile-menu")).toBeVisible();
    await expect(page.getByTestId("wallet-connect")).toContainText("EQCTes");

    await page.getByTestId("wallet-disconnect").click();
    await expect(page.getByTestId("wallet-provider-online")).toBeVisible();
    await expect(page.getByTestId("wallet-connect")).toContainText("Wallet Connect");
  });

  test("375px viewport keeps brand and main content visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto("/");

    await expectIonBrand(page);
    await expect(page.getByTestId("main-content")).toBeVisible();
  });

  test("768px and 1440px viewports keep brand visible", async ({ page }) => {
    for (const width of [768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expectIonBrand(page);
    }
  });

  test("hash route opens swap page directly", async ({ page }) => {
    await page.goto("/#/swap");
    await expect(page.getByTestId("page-swap")).toBeVisible();
    await expect(page).toHaveURL(/#\/swap/);
  });

  test("top navigation opens business page shells", async ({ page }) => {
    await page.goto("/");

    const pages = [
      ["trade", "ION spot order desk"],
      ["grid", "On-chain spot grid"],
      ["pool", "ION liquidity pools"],
      ["stake", "ION staking hub"],
      ["bridge", "BSC <> ION bridge"],
      ["burn", "Dual-chain burn tracker"],
      ["domain", "Domain trading and binding"],
      ["ai", "On-chain AI market analyst"],
    ] as const;

    for (const [key, title] of pages) {
      await clickNav(page, key);
      await expect(page.getByTestId(`page-${key}`)).toBeVisible();
      await expect(page.getByTestId("page-title")).toHaveText(title);
    }
  });

  test("trade page shows professional desk modules", async ({ page }) => {
    await page.goto("/");
    await clickNav(page, "trade");

    await expect(page.getByTestId("trade-chart")).toBeVisible();
    await expect(page.getByTestId("trade-chart-provenance")).toContainText(/local-seed/i, { timeout: 15_000 });
    await expect(page.locator('[data-testid="trade-candle-chart"][data-chart-ready="true"]')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId("trade-orderbook").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("trade-orderbook")).toBeVisible();
    await page.getByTestId("trade-market-trades").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("trade-market-trades")).toBeVisible();
    await page.getByTestId("trade-history").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("trade-history")).toBeVisible();
    await expect(page.getByText("TWAP guard active")).toBeVisible();
  });

  test("grid pool bridge burn domain ai pages show liquid-glass desk modules", async ({ page }) => {
    await page.goto("/");

    await clickNav(page, "grid");
    await expect(page.getByTestId("grid-range-chart")).toBeVisible();
    await expect(page.getByTestId("grid-templates")).toBeVisible();
    await expect(page.getByTestId("grid-form")).toBeVisible();

    await clickNav(page, "pool");
    await expect(page.getByTestId("pool-list")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("pool-form")).toBeVisible();

    await clickNav(page, "bridge");
    await expect(page.getByTestId("bridge-form")).toBeVisible();
    await expect(page.getByTestId("bridge-metrics-source")).toContainText(/local|cache|mock|fallback|upstream/);

    await clickNav(page, "burn");
    await expect(page.getByTestId("burn-trend-chart")).toBeVisible();
    await expect(page.getByTestId("burn-chain-split")).toBeVisible();

    await clickNav(page, "domain");
    await expect(page.getByTestId("domain-marketplace")).toBeVisible();
    await expect(page.getByTestId("domain-phishing-warn")).toBeVisible();

    await clickNav(page, "ai");
    await expect(page.getByTestId("ai-market-summary")).toBeVisible();
    await expect(page.getByTestId("ai-signals")).toBeVisible();
    await expect(page.getByTestId("ai-disclaimer")).toBeVisible();
  });

  test("trade page validates and prepares a limit order", async ({ page }) => {
    await page.goto("/");
    await clickNav(page, "trade");

    await expect(page.getByTestId("trade-form")).toBeVisible();
    await expect(page.getByTestId("trade-submit")).toBeDisabled();

    await page.getByTestId("trade-amount").scrollIntoViewIfNeeded();
    await page.getByTestId("trade-amount").fill("1250");
    await page.getByTestId("trade-price").fill("6");
    await page.getByTestId("trade-slippage").fill("0.5");

    await expect(page.getByTestId("trade-preview")).toContainText("Buying 1,250 ION");
    await expect(page.getByTestId("trade-submit")).toBeEnabled();

    await page.getByTestId("trade-submit").click();
    await expect(page.getByTestId("trade-confirmation")).toContainText("Order review ready");
  });

  test("grid page validates bounds and prepares a strategy", async ({ page }) => {
    await page.goto("/");
    await clickNav(page, "grid");

    await expect(page.getByTestId("grid-form")).toBeVisible();
    await expect(page.getByTestId("grid-submit")).toBeDisabled();

    await page.getByTestId("grid-lower").scrollIntoViewIfNeeded();
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
    await expect(page.getByTestId("grid-confirmation")).toContainText("Strategy review ready");
  });

  test("pool page validates slippage and prepares liquidity mint", async ({ page }) => {
    await page.goto("/");
    await clickNav(page, "pool");

    await expect(page.getByTestId("pool-form")).toBeVisible();
    await expect(page.getByTestId("pool-submit")).toBeDisabled();

    const poolRow = page.getByTestId("pool-row-bnb-ion");
    await expect(poolRow).toBeVisible({ timeout: 15_000 });
    await poolRow.click();

    await page.getByTestId("pool-bnb").scrollIntoViewIfNeeded();
    await page.getByTestId("pool-bnb").fill("2");
    await page.getByTestId("pool-ion").fill("800");
    await page.getByTestId("pool-slippage").fill("10");
    await expect(page.getByTestId("pool-error")).toBeVisible();

    await page.getByTestId("pool-slippage").fill("0.5");
    await expect(page.getByTestId("pool-preview")).toContainText("Liquidity preview:", {
      timeout: 15_000,
    });
    await expect(page.getByTestId("pool-submit")).toBeEnabled();

    await page.getByTestId("pool-submit").click();
    await expect(page.getByTestId("pool-confirmation")).toContainText("Liquidity draft ready");
  });

  test("stake page prepares stake and unstake payloads", async ({ page }) => {
    await page.goto("/");
    await clickNav(page, "stake");

    await expect(page.getByTestId("stake-metrics-source")).toContainText(/local|cache|mock|fallback|upstream/);
    await expect(page.getByTestId("stake-form")).toBeVisible();
    await expect(page.getByTestId("stake-submit")).toBeDisabled();

    await page.getByTestId("stake-amount").scrollIntoViewIfNeeded();
    await page.getByTestId("stake-amount").fill("250");
    await expect(page.getByTestId("stake-preview")).toContainText("DEX draft stake preview:");
    await expect(page.getByTestId("stake-submit")).toBeEnabled();

    await page.getByTestId("stake-submit").click();
    await expect(page.getByTestId("stake-confirmation")).toContainText("DEX draft stake ready");

    await page.getByTestId("stake-mode-unstake").click();
    await page.getByTestId("stake-amount").fill("100");
    await expect(page.getByTestId("stake-preview")).toContainText("DEX draft unstake preview:");
    await expect(page.getByTestId("stake-submit")).toBeEnabled();

    await page.getByTestId("stake-submit").click();
    await expect(page.getByTestId("stake-confirmation")).toContainText("DEX draft unstake ready");
  });

  test("bridge page validates destination memo and prepares sweep", async ({ page }) => {
    await page.goto("/");
    await clickNav(page, "bridge");

    await expect(page.getByTestId("bridge-metrics-source")).toContainText(/local|cache|mock|fallback|upstream/);
    await expect(page.getByTestId("bridge-form")).toBeVisible();
    await expect(page.getByTestId("bridge-submit")).toBeDisabled();

    await page.getByTestId("bridge-amount").fill("180");
    await page.getByTestId("bridge-destination").fill("0xabc");
    await expect(page.getByTestId("bridge-error")).toBeVisible();

    await page.getByTestId("bridge-destination").fill("0xabcdef12");
    await expect(page.getByTestId("bridge-preview")).toContainText("Bridge preview:");
    await expect(page.getByTestId("bridge-submit")).toBeEnabled();

    await page.getByTestId("bridge-submit").click();
    await expect(page.getByTestId("bridge-submit")).toBeEnabled();
  });

  test("burn page enforces memo length and prepares narrative", async ({ page }) => {
    await page.goto("/");
    await clickNav(page, "burn");

    await expect(page.getByTestId("burn-form")).toBeVisible();
    await page.getByTestId("burn-amount").fill("5000");
    await page.getByTestId("burn-memo").fill("x".repeat(121));
    await expect(page.getByTestId("burn-error")).toBeVisible();
    await expect(page.getByTestId("burn-submit")).toBeDisabled();

    await page.getByTestId("burn-memo").fill("Weekly burn attestation");
    await expect(page.getByTestId("burn-preview")).toContainText("Attribution preview:");
    await expect(page.getByTestId("burn-submit")).toBeEnabled();

    await page.getByTestId("burn-submit").click();
    await expect(page.getByTestId("burn-confirmation")).toContainText("Burn analytics review ready");
  });

  test("domain page validates label shape and prepares handshake", async ({ page }) => {
    await page.goto("/");
    await clickNav(page, "domain");

    await expect(page.getByTestId("domain-form")).toBeVisible();
    await page.getByTestId("domain-query").fill("bad_label");
    await expect(page.getByTestId("domain-error")).toBeVisible();
    await expect(page.getByTestId("domain-submit")).toBeDisabled();

    await page.getByTestId("domain-query").fill("custodian.ion");
    await expect(page.getByTestId("domain-preview")).toContainText("Domain preview:");
    await expect(page.getByTestId("domain-submit")).toBeEnabled();

    await page.getByTestId("domain-submit").click();
    await expect(page.getByTestId("domain-confirmation")).toContainText("Domain handshake ready");
  });

  test("ai page validates ticker and prepares sentinel brief", async ({ page }) => {
    await page.goto("/");
    await clickNav(page, "ai");

    await expect(page.getByTestId("ai-form")).toBeVisible();
    await page.getByTestId("ai-symbol").fill("!");
    await expect(page.getByTestId("ai-error")).toBeVisible();

    await page.getByTestId("ai-symbol").fill("ION");
    await expect(page.getByTestId("ai-preview")).toContainText("AI preview:");
    await page.getByTestId("ai-horizon-1d").click();
    await expect(page.getByTestId("ai-preview")).toContainText("(1d,");

    await page.getByTestId("ai-submit").click();
    await expect(page.getByTestId("ai-confirmation")).toContainText("AI Sentinel brief ready");
  });
});
