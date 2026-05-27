import { expect, test, type Page } from "@playwright/test";
import { installE2eSessionFlags } from "./helpers";

function hashPathForNav(key: string) {
  return key === "dashboard" ? "/#/" : `/#/${key}`;
}

const PAGE_SHELL_TEST_ID: Record<string, string> = {
  dashboard: "page-dashboard",
  swap: "page-swap",
  trade: "page-trade",
  grid: "page-grid",
  pool: "page-pool",
  stake: "page-stake",
  bridge: "page-bridge",
  burn: "page-burn",
  domain: "page-domain",
  ai: "page-ai-subscription",
  settings: "page-settings",
  "batch-transfer": "page-batch-transfer",
};

async function domClick(page: Page, testId: string) {
  await page.getByTestId(testId).first().evaluate((el) => {
    (el as HTMLElement).click();
  });
}

/** React controlled inputs need the native value setter + input event. */
async function fillControlledInput(page: Page, testId: string, value: string) {
  await page.getByTestId(testId).evaluate((el, v) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, v);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function dismissBootSplashIfPresent(page: Page) {
  const splash = page.getByTestId("boot-splash-screen");
  if (await splash.isVisible().catch(() => false)) {
    await splash.click({ position: { x: 24, y: 24 }, force: true });
    await splash.waitFor({ state: "hidden", timeout: 8_000 }).catch(() => undefined);
  }
}

async function ensureAppShell(page: Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await page.getByTestId("main-content").isVisible().catch(() => false)) {
      return;
    }
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissBootSplashIfPresent(page);
    await page.waitForTimeout(400);
  }
  await expect(page.getByTestId("main-content")).toBeVisible({ timeout: 30_000 });
}

/** In-app navigation via stable nav test ids (avoids flaky hash reload under preview). */
async function clickNav(page: Page, key: string) {
  await ensureAppShell(page);
  await domClick(page, `nav-${key}`);
  const shellId = PAGE_SHELL_TEST_ID[key];
  if (shellId) {
    await expect(page.getByTestId(shellId)).toBeVisible({ timeout: 25_000 });
  }
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
  test.describe.configure({ mode: "serial" });
  test.setTimeout(90_000);
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(10_000);
    await installE2eSessionFlags(page);
  });

  test("home page shows key sections and controls", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissBootSplashIfPresent(page);

    await expectIonBrand(page);
    await expect(page.getByTestId("ticker-strip")).toBeVisible();
    await expect(page.getByTestId("ticker-source")).toContainText(/API|fallback/);
    await expect(page.getByTestId("main-content")).toBeVisible();
    await expect(page.getByTestId("page-dashboard")).toBeVisible();
    await expect(page.getByTestId("dashboard-main-stage")).toBeVisible();
    await expect(page.getByTestId("dashboard-feature-grid")).toBeVisible();
    await domClick(page, "dashboard-open-swap");
    await expect(page.getByTestId("page-swap")).toBeVisible({ timeout: 25_000 });
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

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("wallet-connect")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("wallet-connect").evaluate((el) => {
      (el as HTMLButtonElement).click();
    });
    await expect(page.getByTestId("wallet-panel")).toBeVisible();
    await expect(page.getByTestId("wallet-provider-ion-browser")).toBeVisible();

    await domClick(page, "wallet-provider-ion-browser");
    await expect(page.getByTestId("wallet-confirmation")).toContainText("ION Browser Wallet connected");
    await expect(page.getByTestId("profile-menu")).toBeVisible();
    await expect(page.getByTestId("wallet-connect")).toContainText("EQCTes");

    await domClick(page, "wallet-disconnect");
    await expect(page.getByTestId("wallet-connect")).toContainText("Wallet Connect");
    await page.getByTestId("wallet-connect").evaluate((el) => {
      (el as HTMLButtonElement).click();
    });
    await expect(page.getByTestId("wallet-panel")).toBeVisible();
    await expect(page.getByTestId("wallet-provider-online")).toBeVisible();
  });

  test("375px viewport keeps brand and main content visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await ensureAppShell(page);
    await expectIonBrand(page);
    await expect(page.getByTestId("main-content")).toBeVisible();
  });

  test("768px and 1440px viewports keep brand visible", async ({ page }) => {
    for (const width of [768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expectIonBrand(page);
    }
  });

  test("hash route opens swap page directly", async ({ page }) => {
    await page.goto("/#/swap", { waitUntil: "domcontentloaded" });
    await expect(async () => {
      await expect(page).toHaveURL(/#\/swap/);
      await expect(page.getByTestId("page-swap")).toBeVisible();
    }).toPass({ timeout: 20_000 });
  });

  test("top navigation opens business page shells", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const pages = [
      ["trade", "ION spot order desk"],
      ["grid", "On-chain spot grid"],
      ["pool", "ION liquidity pools"],
      ["stake", "DEX staking hub"],
      ["bridge", "BSC <> ION bridge"],
      ["burn", "Dual-chain burn tracker"],
    ] as const;

    for (const [key, title] of pages) {
      await clickNav(page, key);
      await expect(page.getByTestId(`page-${key}`)).toBeVisible();
      await expect(page.getByTestId("page-title")).toHaveText(title);
    }

    await clickNav(page, "domain");
    await expect(page.getByTestId("page-domain")).toBeVisible();
    await expect(page.getByTestId("domain-manage-hero")).toBeVisible();

    await clickNav(page, "ai");
    await expect(page.getByTestId("page-ai-subscription")).toBeVisible();
    await expect(page.getByTestId("ai-subscription-hero")).toBeVisible();

    await clickNav(page, "settings");
    await expect(page.getByTestId("page-settings")).toBeVisible();
    await expect(page.getByTestId("page-title")).toHaveText("System settings");

    await clickNav(page, "batch-transfer");
    await expect(page.getByTestId("page-batch-transfer")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-tabs")).toBeVisible();
  });

  test("trade page shows professional desk modules", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await clickNav(page, "trade");

    await expect(page.getByTestId("trade-chart")).toBeVisible();
    await page.getByTestId("trade-orderbook").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("trade-orderbook")).toBeVisible();
    await page.getByTestId("trade-market-trades").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("trade-market-trades")).toBeVisible();
    await page.getByTestId("trade-history").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("trade-history")).toBeVisible();
    await expect(page.getByText("TWAP guard active")).toBeVisible();
  });

  test("grid pool bridge burn domain ai pages show liquid-glass desk modules", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await clickNav(page, "grid");
    await expect(page.getByTestId("grid-range-chart")).toBeVisible();
    await expect(page.getByTestId("grid-templates")).toBeVisible();
    await expect(page.getByTestId("grid-form")).toBeVisible();

    await clickNav(page, "pool");
    await expect(page.getByTestId("page-pool")).toBeVisible();
    await expect(page.getByTestId("pool-form")).toBeVisible();

    await clickNav(page, "bridge");
    await expect(page.getByTestId("page-bridge")).toBeVisible();
    await expect(page.getByTestId("bridge-form")).toBeVisible();

    await clickNav(page, "burn");
    await expect(page.getByTestId("burn-trend-chart")).toBeVisible();
    await expect(page.getByTestId("burn-chain-split")).toBeVisible();

    await clickNav(page, "domain");
    await expect(page.getByTestId("domain-manage-owned-list")).toBeVisible();
    await expect(page.getByTestId("domain-manage-phishing-warn")).toBeVisible();

    await clickNav(page, "ai");
    await expect(page.getByTestId("page-ai-subscription")).toBeVisible();
    await expect(page.getByTestId("ai-subscription-tier-basic")).toBeVisible();
    await expect(page.getByTestId("ai-subscription-wallet-panel")).toBeVisible();

    await clickNav(page, "settings");
    await expect(page.getByTestId("settings-dark-toggle")).toBeVisible();
    await expect(page.getByTestId("settings-clear-cache")).toBeVisible();

    await clickNav(page, "batch-transfer");
    await expect(page.getByTestId("batch-transfer-csv-input")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-parse-btn")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-validate")).toBeVisible();
  });

  test("trade page validates and prepares a limit order", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await clickNav(page, "trade");

    await expect(page.getByTestId("trade-form")).toBeVisible();
    await expect(page.getByTestId("trade-submit")).toBeDisabled();

    await page.getByTestId("trade-form").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("trade-form")).toBeVisible();
    await fillControlledInput(page, "trade-amount", "1250");
    await fillControlledInput(page, "trade-price", "6");
    await fillControlledInput(page, "trade-slippage", "0.5");

    await expect(page.getByTestId("trade-preview")).toContainText("Buying 1,250 ION");
    await expect(page.getByTestId("trade-submit")).toBeEnabled();

    await domClick(page, "trade-submit");
    await expect(page.getByTestId("trade-confirmation")).toContainText("Order review ready");
  });

  test("grid page validates bounds and prepares a strategy", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
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

    await domClick(page, "grid-submit");
    await expect(page.getByTestId("grid-confirmation")).toContainText("Strategy review ready");
  });

  test("pool page validates slippage and prepares liquidity mint", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await clickNav(page, "pool");

    await expect(page.getByTestId("pool-form")).toBeVisible();
    await expect(page.getByTestId("pool-submit")).toBeDisabled();

    await page.getByTestId("pool-bnb").scrollIntoViewIfNeeded();
    await page.getByTestId("pool-bnb").fill("2");
    await page.getByTestId("pool-ion").fill("800");
    await page.getByTestId("pool-slippage").fill("10");
    await expect(page.getByTestId("pool-error")).toBeVisible();

    await page.getByTestId("pool-slippage").fill("0.5");
    await expect(page.getByTestId("pool-preview")).toContainText("Liquidity preview:");
    await expect(page.getByTestId("pool-submit")).toBeEnabled();

    await page.getByTestId("pool-form").evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
    });
    await expect(page.getByTestId("pool-confirmation")).toContainText("Liquidity review ready");
  });

  test("stake page prepares stake and unstake payloads", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await clickNav(page, "stake");

    await expect(page.getByTestId("stake-metrics-source")).toContainText(/mock|cache|fallback/);
    await expect(page.getByTestId("stake-form")).toBeVisible();
    await expect(page.getByTestId("stake-submit")).toBeDisabled();

    await page.getByTestId("stake-amount").scrollIntoViewIfNeeded();
    await page.getByTestId("stake-amount").fill("250");
    await expect(page.getByTestId("stake-preview")).toContainText("Stake preview:");
    await expect(page.getByTestId("stake-submit")).toBeEnabled();

    await domClick(page, "stake-submit");
    await expect(page.getByTestId("stake-confirmation")).toContainText("Stake review ready");

    await domClick(page, "stake-mode-unstake");
    await page.getByTestId("stake-amount").fill("100");
    await expect(page.getByTestId("stake-preview")).toContainText("Unstake preview:");
    await expect(page.getByTestId("stake-submit")).toBeEnabled();

    await domClick(page, "stake-submit");
    await expect(page.getByTestId("stake-confirmation")).toContainText("Unstake review ready");
  });

  test("bridge page validates destination memo and prepares sweep", async ({ page }) => {
    await page.goto("/#/bridge", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("page-bridge")).toBeVisible({ timeout: 30_000 });

    await expect(page.getByTestId("bridge-metrics-source")).toContainText(/mock|cache|fallback|upstream|indexer/);
    await expect(page.getByTestId("bridge-form")).toBeVisible();
    await expect(page.getByTestId("bridge-submit")).toBeDisabled();

    await page.getByTestId("bridge-amount").fill("180");
    await page.getByTestId("bridge-destination").fill("0xabc");
    await expect(page.getByTestId("bridge-error")).toBeVisible();

    await page.getByTestId("bridge-destination").fill("0xabcdef12");
    await expect(page.getByTestId("bridge-preview")).toContainText("Bridge preview:");
    await expect(page.getByTestId("bridge-submit")).toBeEnabled();

    await domClick(page, "bridge-submit");
    await expect(page.getByTestId("bridge-submit")).toBeEnabled();
  });

  test("burn page enforces memo length and prepares narrative", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await clickNav(page, "burn");

    await expect(page.getByTestId("burn-metrics-source")).toContainText(/mock|cache|fallback/);
    await expect(page.getByTestId("burn-form")).toBeVisible();
    await page.getByTestId("burn-amount").fill("5000");
    await page.getByTestId("burn-memo").fill("x".repeat(121));
    await expect(page.getByTestId("burn-error")).toBeVisible();
    await expect(page.getByTestId("burn-submit")).toBeDisabled();

    await page.getByTestId("burn-memo").fill("Weekly burn attestation");
    await expect(page.getByTestId("burn-preview")).toContainText("Burn preview:");
    await expect(page.getByTestId("burn-submit")).toBeEnabled();

    await domClick(page, "burn-submit");
    await expect(page.getByTestId("burn-confirmation")).toContainText("Burn analytics review ready");
  });

  test("domain page validates label shape and prepares handshake", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await clickNav(page, "domain");

    await expect(page.getByTestId("domain-metrics-source")).toContainText(/mock|cache|fallback|indexer|upstream/);
    await expect(page.getByTestId("domain-form")).toBeVisible();
    await page.getByTestId("domain-query").fill("bad_label");
    await expect(page.getByTestId("domain-error")).toBeVisible();
    await expect(page.getByTestId("domain-submit")).toBeDisabled();

    await page.getByTestId("domain-query").fill("custodian.ion");
    await expect(page.getByTestId("domain-preview")).toContainText("Domain preview:");
    await expect(page.getByTestId("domain-submit")).toBeEnabled();

    await domClick(page, "domain-submit");
    await expect(page.getByTestId("domain-confirmation")).toBeVisible({ timeout: 10_000 });
  });

  test("ai subscription page loads tiers and wallet panel", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await clickNav(page, "ai");

    await expect(page.getByTestId("page-ai-subscription")).toBeVisible();
    await expect(page.getByTestId("ai-subscription-tier-basic")).toBeVisible();
    await domClick(page, "ai-subscription-period-quarterly");
    await expect(page.getByTestId("ai-subscription-ion-basic")).toBeVisible();
    await expect(page.getByTestId("ai-subscription-connect")).toBeVisible();
  });
});
