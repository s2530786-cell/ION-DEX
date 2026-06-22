import { expect, test } from "@playwright/test";
import { installE2eSessionFlags } from "./helpers";
function hashPathForNav(key) {
  return key === "dashboard" ? "/#/" : `/#/${key}`;
}
const PAGE_SHELL_TEST_ID = {
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
  "batch-transfer": "page-batch-transfer"
};
async function domClick(page, testId) {
  await page.getByTestId(testId).first().evaluate(el => {
    el.click();
  });
}

/** React controlled inputs need the native value setter + input event. */
async function fillControlledInput(page, testId, value) {
  await page.getByTestId(testId).evaluate((el, v) => {
    var _Object$getOwnPropert;
    const input = el;
    const setter = (_Object$getOwnPropert = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")) === null || _Object$getOwnPropert === void 0 ? void 0 : _Object$getOwnPropert.set;
    setter === null || setter === void 0 || setter.call(input, v);
    input.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    input.dispatchEvent(new Event("change", {
      bubbles: true
    }));
  }, value);
}
async function dismissBootSplashIfPresent(page) {
  const splash = page.getByTestId("boot-splash-screen");
  if (await splash.isVisible().catch(() => false)) {
    await splash.click({
      position: {
        x: 24,
        y: 24
      },
      force: true
    });
    await splash.waitFor({
      state: "hidden",
      timeout: 8000
    }).catch(() => undefined);
  }
}
async function ensureAppShell(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await page.getByTestId("main-content").isVisible().catch(() => false)) {
      return;
    }
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    await dismissBootSplashIfPresent(page);
    await page.waitForTimeout(400);
  }
  await expect(page.getByTestId("main-content")).toBeVisible({
    timeout: 30000
  });
}

/** In-app navigation via stable nav test ids (avoids flaky hash reload under preview). */
async function clickNav(page, key) {
  await ensureAppShell(page);
  await domClick(page, `nav-${key}`);
  const shellId = PAGE_SHELL_TEST_ID[key];
  if (shellId) {
    await expect(page.getByTestId(shellId)).toBeVisible({
      timeout: 25000
    });
  }
}
async function expectIonBrand(page) {
  const brands = page.getByTestId("brand-title");
  const count = await brands.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = brands.nth(index);
    if (await candidate.isVisible()) {
      await expect(candidate).toHaveText("ION DEX");
      return;
    }
  }
  await expect(page.locator("header").getByText("ION DEX", {
    exact: true
  }).first()).toBeVisible({
    timeout: 15000
  });
}
test.describe("ION DEX smoke", () => {
  test.describe.configure({
    mode: "serial"
  });
  test.setTimeout(90000);
  test.beforeEach(async ({
    page
  }) => {
    page.setDefaultTimeout(10000);
    await installE2eSessionFlags(page, {
      locale: "zh-CN"
    });
  });
  test("home page shows key sections and controls", async ({
    page
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    await dismissBootSplashIfPresent(page);
    await expectIonBrand(page);
    await expect(page.getByTestId("ticker-strip")).toBeVisible();
    await expect(page.getByTestId("ticker-source")).toHaveText(/\S/);
    await expect(page.getByTestId("main-content")).toBeVisible();
    await expect(page.getByTestId("page-dashboard")).toBeVisible();
    await expect(page.getByTestId("dashboard-main-stage")).toBeVisible();
    await expect(page.getByTestId("dashboard-feature-grid")).toBeVisible();
    await domClick(page, "dashboard-open-swap");
    await expect(page.getByTestId("page-swap")).toBeVisible({
      timeout: 25000
    });
    await page.getByTestId("swap-pay-amount").fill("1");
    const swapSubmit = page.getByTestId("swap-submit");
    await expect(swapSubmit).toBeVisible();
    await expect(swapSubmit).toBeDisabled();
    await expect(page.getByTestId("swap-wallet-hint")).toBeVisible();
    await expect(page.getByTestId("wallet-connect")).toBeVisible();
  });
  test("boot splash renders upgraded ION DEX brand overlays before skip", async ({
    page
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    const splash = page.getByTestId("boot-splash-screen");
    await expect(splash).toBeVisible();
    await expect(splash).toHaveAttribute("data-launch-phase", "boot");
    await expect(splash).toHaveAttribute("data-boot-clip", /.+/);
    await expect(splash).toHaveAttribute("data-boot-variant", /.+/);
    await dismissBootSplashIfPresent(page);
    await expect(page.getByTestId("main-content")).toBeVisible({
      timeout: 30000
    });
  });
  test("wallet shell connects via official ION extension provider mock", async ({
    page
  }) => {
    await page.addInitScript(() => {
      const mockAddress = "EQCTestWalletAddressForE2eSmokeOnlyxxxxxxxxxx";
      window.ton = {
        isTonWallet: true,
        send: async method => {
          if (method === "ton_requestAccounts") {
            return [mockAddress];
          }
          if (method === "ton_getBalance") {
            return "1500000000";
          }
          return [];
        },
        on: () => undefined,
        off: () => undefined
      };
    });
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    await expect(page.getByTestId("wallet-connect")).toBeVisible({
      timeout: 15000
    });
    await page.getByTestId("wallet-connect").evaluate(el => {
      el.click();
    });
    await expect(page.getByTestId("wallet-panel")).toBeVisible();
    await expect(page.getByTestId("wallet-provider-ion-browser")).toBeVisible();
    await domClick(page, "wallet-provider-ion-browser");
    await expect(page.getByTestId("wallet-confirmation")).toContainText(/ION Browser Wallet connected|ION Browser Wallet.*已连|已连.*ION Browser Wallet/);
    await expect(page.getByTestId("profile-menu")).toBeVisible();
    await expect(page.getByTestId("wallet-connect")).toContainText("EQCTes");
    await domClick(page, "wallet-disconnect");
    await expect(page.getByTestId("wallet-connect")).toContainText(/Wallet Connect|连接钱包|连接錢包/);
    await page.getByTestId("wallet-connect").evaluate(el => {
      el.click();
    });
    await expect(page.getByTestId("wallet-panel")).toBeVisible();
    await expect(page.getByTestId("wallet-provider-online")).toBeVisible();
  });
  test("375px viewport keeps brand and main content visible", async ({
    page
  }) => {
    await page.setViewportSize({
      width: 375,
      height: 844
    });
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    await ensureAppShell(page);
    await expectIonBrand(page);
    await expect(page.getByTestId("main-content")).toBeVisible();
  });
  test("768px and 1440px viewports keep brand visible", async ({
    page
  }) => {
    for (const width of [768, 1440]) {
      await page.setViewportSize({
        width,
        height: 900
      });
      await page.goto("/", {
        waitUntil: "domcontentloaded"
      });
      await expectIonBrand(page);
    }
  });
  test("hash route opens swap page directly", async ({
    page
  }) => {
    await page.goto("/#/swap", {
      waitUntil: "domcontentloaded"
    });
    await expect(async () => {
      await expect(page).toHaveURL(/#\/swap/);
      await expect(page.getByTestId("page-swap")).toBeVisible();
    }).toPass({
      timeout: 20000
    });
  });
  test("top navigation opens business page shells", async ({
    page
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    const pages = ["trade", "grid", "pool", "stake", "bridge", "burn"];
    for (const key of pages) {
      await clickNav(page, key);
      await expect(page.getByTestId(`page-${key}`)).toBeVisible();
    }
    await clickNav(page, "domain");
    await expect(page.getByTestId("page-domain")).toBeVisible();
    await expect(page.getByTestId("domain-manage-hero")).toBeVisible();
    await clickNav(page, "ai");
    await expect(page.getByTestId("page-ai-subscription")).toBeVisible();
    await expect(page.getByTestId("ai-subscription-hero")).toBeVisible();
    await clickNav(page, "settings");
    await expect(page.getByTestId("page-settings")).toBeVisible();
    await expect(page.getByTestId("settings-dark-toggle")).toBeVisible();
    await clickNav(page, "batch-transfer");
    await expect(page.getByTestId("page-batch-transfer")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-tabs")).toBeVisible();
  });
  test("trade page shows professional desk modules", async ({
    page
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    await clickNav(page, "trade");
    await expect(page.getByTestId("trade-chart")).toBeVisible();
    await page.getByTestId("trade-orderbook").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("trade-orderbook")).toBeVisible();
    await page.getByTestId("trade-market-trades").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("trade-market-trades")).toBeVisible();
    await page.getByTestId("trade-history").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("trade-history")).toBeVisible();
    await expect(page.getByText(/TWAP guard active|TWAP 守卫已启用/)).toBeVisible();
  });
  test("grid pool bridge burn domain ai pages show liquid-glass desk modules", async ({
    page
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
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
    await expect(page.getByTestId("sentinel-alert-test")).toBeVisible();
    await page.getByTestId("sentinel-alert-test-btn").click();
    await expect(page.getByTestId("sentinel-alert-test-result")).toBeVisible({
      timeout: 15000
    });
    await clickNav(page, "settings");
    await expect(page.getByTestId("settings-dark-toggle")).toBeVisible();
    await expect(page.getByTestId("settings-clear-cache")).toBeVisible();
    await clickNav(page, "batch-transfer");
    await expect(page.getByTestId("batch-transfer-csv-input")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-parse-btn")).toBeVisible();
    await expect(page.getByTestId("batch-transfer-validate")).toBeVisible();
  });
  test("trade page validates and prepares a limit order", async ({
    page
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    await clickNav(page, "trade");
    await expect(page.getByTestId("trade-form")).toBeVisible();
    await expect(page.getByTestId("trade-submit")).toBeDisabled();
    await page.getByTestId("trade-form").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("trade-form")).toBeVisible();
    await fillControlledInput(page, "trade-amount", "1250");
    await fillControlledInput(page, "trade-price", "6");
    await fillControlledInput(page, "trade-slippage", "0.5");
    await expect(page.getByTestId("trade-preview")).toContainText(/Buying 1,250 ION|买入\s*1,250 ION/);
    await expect(page.getByTestId("trade-submit")).toBeEnabled();
    await domClick(page, "trade-submit");
    await expect(page.getByTestId("trade-confirmation")).toContainText(/Order review ready|订单复核已准备就绪/);
  });
  test("grid page validates bounds and prepares a strategy", async ({
    page
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
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
    await expect(page.getByTestId("grid-preview")).toContainText(/arithmetic grid|等差网格/);
    await expect(page.getByTestId("grid-submit")).toBeEnabled();
    await domClick(page, "grid-submit");
    await expect(page.getByTestId("grid-confirmation")).toContainText(/Strategy review ready|策略复核已准备就绪/);
  });
  test("pool page validates slippage and prepares liquidity mint", async ({
    page
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    await clickNav(page, "pool");
    await expect(page.getByTestId("pool-form")).toBeVisible();
    await expect(page.getByTestId("pool-submit")).toBeDisabled();
    await page.getByTestId("pool-bnb").scrollIntoViewIfNeeded();
    await page.getByTestId("pool-bnb").fill("2");
    await page.getByTestId("pool-ion").fill("800");
    await page.getByTestId("pool-slippage").fill("10");
    await expect(page.getByTestId("pool-error")).toBeVisible();
    await page.getByTestId("pool-slippage").fill("0.5");
    await expect(page.getByTestId("pool-preview")).toContainText(/Liquidity preview:|流动性预览/);
    await expect(page.getByTestId("pool-submit")).toBeEnabled();
    await page.getByTestId("pool-form").evaluate(form => {
      form.requestSubmit();
    });
    await expect(page.getByTestId("pool-confirmation")).toContainText("流动性操作已准备好进入钱包签名。");
  });
  test("stake page prepares stake and unstake payloads", async ({
    page
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    await clickNav(page, "stake");
    await expect(page.getByTestId("stake-metrics-source")).toContainText(/mock|cache|fallback/);
    await expect(page.getByTestId("stake-form")).toBeVisible();
    await expect(page.getByTestId("stake-submit")).toBeDisabled();
    await page.getByTestId("stake-amount").scrollIntoViewIfNeeded();
    await page.getByTestId("stake-amount").fill("250");
    await expect(page.getByTestId("stake-preview")).toContainText(/Stake preview:|质押预览/);
    await expect(page.getByTestId("stake-submit")).toBeEnabled();
    await domClick(page, "stake-submit");
    await expect(page.getByTestId("stake-confirmation")).toContainText("质押操作已准备好进入钱包签名。");
    await domClick(page, "stake-mode-unstake");
    await page.getByTestId("stake-amount").fill("100");
    await expect(page.getByTestId("stake-preview")).toContainText(/Unstake preview:|解除质押预览/);
    await expect(page.getByTestId("stake-submit")).toBeEnabled();
    await domClick(page, "stake-submit");
    await expect(page.getByTestId("stake-confirmation")).toContainText("解除质押操作已准备好进入钱包签名。");
  });
  test("bridge page validates destination memo and prepares sweep", async ({
    page
  }) => {
    await page.goto("/#/bridge", {
      waitUntil: "domcontentloaded"
    });
    await expect(page.getByTestId("page-bridge")).toBeVisible({
      timeout: 30000
    });
    await expect(page.getByTestId("bridge-metrics-source")).toContainText(/mock|cache|fallback|upstream|indexer/);
    await expect(page.getByTestId("bridge-form")).toBeVisible();
    await expect(page.getByTestId("bridge-submit")).toBeDisabled();
    await page.getByTestId("bridge-amount").fill("180");
    await page.getByTestId("bridge-destination").fill("0xabc");
    await expect(page.getByTestId("bridge-error")).toBeVisible();
    await page.getByTestId("bridge-destination").fill("0xabcdef12");
    await expect(page.getByTestId("bridge-preview")).toContainText(/Bridge preview:|跨链预览/);
    await expect(page.getByTestId("bridge-submit")).toBeEnabled();
    await domClick(page, "bridge-submit");
    await expect(page.getByTestId("bridge-submit")).toBeEnabled();
  });
  test("burn page enforces memo length and prepares narrative", async ({
    page
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    await clickNav(page, "burn");
    await expect(page.getByTestId("burn-metrics-source")).toContainText(/mock|cache|fallback/);
    await expect(page.getByTestId("burn-form")).toBeVisible();
    await page.getByTestId("burn-amount").fill("5000");
    await page.getByTestId("burn-memo").fill("x".repeat(121));
    await expect(page.getByTestId("burn-error")).toBeVisible();
    await expect(page.getByTestId("burn-submit")).toBeDisabled();
    await page.getByTestId("burn-memo").fill("Weekly burn attestation");
    await expect(page.getByTestId("burn-preview")).toContainText(/Burn preview:|销毁预览/);
    await expect(page.getByTestId("burn-submit")).toBeEnabled();
    await domClick(page, "burn-submit");
    await expect(page.getByTestId("burn-confirmation")).toContainText(/Burn analytics review ready|销毁分析复核已准备就绪/);
  });
  test("domain page validates label shape and prepares handshake", async ({
    page
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    await clickNav(page, "domain");
    await expect(page.getByTestId("domain-metrics-source")).toContainText(/mock|cache|fallback|indexer|upstream/);
    await expect(page.getByTestId("domain-form")).toBeVisible();
    await page.getByTestId("domain-query").fill("bad_label");
    await expect(page.getByTestId("domain-error")).toBeVisible();
    await expect(page.getByTestId("domain-submit")).toBeDisabled();
    await page.getByTestId("domain-query").fill("custodian.ion");
    await expect(page.getByTestId("domain-preview")).toContainText(/Domain preview:|域名预览/);
    await expect(page.getByTestId("domain-submit")).toBeEnabled();
    await domClick(page, "domain-submit");
    await expect(page.getByTestId("domain-confirmation")).toBeVisible({
      timeout: 10000
    });
  });
  test("ai subscription page loads tiers and wallet panel", async ({
    page
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded"
    });
    await clickNav(page, "ai");
    await expect(page.getByTestId("page-ai-subscription")).toBeVisible();
    await expect(page.getByTestId("ai-subscription-tier-basic")).toBeVisible();
    await domClick(page, "ai-subscription-period-quarterly");
    await expect(page.getByTestId("ai-subscription-ion-basic")).toBeVisible();
    await expect(page.getByTestId("ai-subscription-connect")).toBeVisible();
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleHBlY3QiLCJ0ZXN0IiwiaW5zdGFsbEUyZVNlc3Npb25GbGFncyIsImhhc2hQYXRoRm9yTmF2Iiwia2V5IiwiUEFHRV9TSEVMTF9URVNUX0lEIiwiZGFzaGJvYXJkIiwic3dhcCIsInRyYWRlIiwiZ3JpZCIsInBvb2wiLCJzdGFrZSIsImJyaWRnZSIsImJ1cm4iLCJkb21haW4iLCJhaSIsInNldHRpbmdzIiwiZG9tQ2xpY2siLCJwYWdlIiwidGVzdElkIiwiZ2V0QnlUZXN0SWQiLCJmaXJzdCIsImV2YWx1YXRlIiwiZWwiLCJjbGljayIsImZpbGxDb250cm9sbGVkSW5wdXQiLCJ2YWx1ZSIsInYiLCJfT2JqZWN0JGdldE93blByb3BlcnQiLCJpbnB1dCIsInNldHRlciIsIk9iamVjdCIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsIndpbmRvdyIsIkhUTUxJbnB1dEVsZW1lbnQiLCJwcm90b3R5cGUiLCJzZXQiLCJjYWxsIiwiZGlzcGF0Y2hFdmVudCIsIkV2ZW50IiwiYnViYmxlcyIsImRpc21pc3NCb290U3BsYXNoSWZQcmVzZW50Iiwic3BsYXNoIiwiaXNWaXNpYmxlIiwiY2F0Y2giLCJwb3NpdGlvbiIsIngiLCJ5IiwiZm9yY2UiLCJ3YWl0Rm9yIiwic3RhdGUiLCJ0aW1lb3V0IiwidW5kZWZpbmVkIiwiZW5zdXJlQXBwU2hlbGwiLCJhdHRlbXB0IiwiZ290byIsIndhaXRVbnRpbCIsIndhaXRGb3JUaW1lb3V0IiwidG9CZVZpc2libGUiLCJjbGlja05hdiIsInNoZWxsSWQiLCJleHBlY3RJb25CcmFuZCIsImJyYW5kcyIsImNvdW50IiwiaW5kZXgiLCJjYW5kaWRhdGUiLCJudGgiLCJ0b0hhdmVUZXh0IiwibG9jYXRvciIsImdldEJ5VGV4dCIsImV4YWN0IiwiZGVzY3JpYmUiLCJjb25maWd1cmUiLCJtb2RlIiwic2V0VGltZW91dCIsImJlZm9yZUVhY2giLCJzZXREZWZhdWx0VGltZW91dCIsImxvY2FsZSIsImZpbGwiLCJzd2FwU3VibWl0IiwidG9CZURpc2FibGVkIiwidG9IYXZlQXR0cmlidXRlIiwiYWRkSW5pdFNjcmlwdCIsIm1vY2tBZGRyZXNzIiwidG9uIiwiaXNUb25XYWxsZXQiLCJzZW5kIiwibWV0aG9kIiwib24iLCJvZmYiLCJ0b0NvbnRhaW5UZXh0Iiwic2V0Vmlld3BvcnRTaXplIiwid2lkdGgiLCJoZWlnaHQiLCJ0b0hhdmVVUkwiLCJ0b1Bhc3MiLCJwYWdlcyIsInNjcm9sbEludG9WaWV3SWZOZWVkZWQiLCJ0b0JlRW5hYmxlZCIsImZvcm0iLCJyZXF1ZXN0U3VibWl0IiwicmVwZWF0Il0sInNvdXJjZXMiOlsic21va2Uuc3BlYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleHBlY3QsIHRlc3QsIHR5cGUgUGFnZSB9IGZyb20gXCJAcGxheXdyaWdodC90ZXN0XCI7XHJcbmltcG9ydCB7IGluc3RhbGxFMmVTZXNzaW9uRmxhZ3MgfSBmcm9tIFwiLi9oZWxwZXJzXCI7XHJcblxyXG5mdW5jdGlvbiBoYXNoUGF0aEZvck5hdihrZXk6IHN0cmluZykge1xyXG4gIHJldHVybiBrZXkgPT09IFwiZGFzaGJvYXJkXCIgPyBcIi8jL1wiIDogYC8jLyR7a2V5fWA7XHJcbn1cclxuXHJcbmNvbnN0IFBBR0VfU0hFTExfVEVTVF9JRDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcclxuICBkYXNoYm9hcmQ6IFwicGFnZS1kYXNoYm9hcmRcIixcclxuICBzd2FwOiBcInBhZ2Utc3dhcFwiLFxyXG4gIHRyYWRlOiBcInBhZ2UtdHJhZGVcIixcclxuICBncmlkOiBcInBhZ2UtZ3JpZFwiLFxyXG4gIHBvb2w6IFwicGFnZS1wb29sXCIsXHJcbiAgc3Rha2U6IFwicGFnZS1zdGFrZVwiLFxyXG4gIGJyaWRnZTogXCJwYWdlLWJyaWRnZVwiLFxyXG4gIGJ1cm46IFwicGFnZS1idXJuXCIsXHJcbiAgZG9tYWluOiBcInBhZ2UtZG9tYWluXCIsXHJcbiAgYWk6IFwicGFnZS1haS1zdWJzY3JpcHRpb25cIixcclxuICBzZXR0aW5nczogXCJwYWdlLXNldHRpbmdzXCIsXHJcbiAgXCJiYXRjaC10cmFuc2ZlclwiOiBcInBhZ2UtYmF0Y2gtdHJhbnNmZXJcIixcclxufTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGRvbUNsaWNrKHBhZ2U6IFBhZ2UsIHRlc3RJZDogc3RyaW5nKSB7XHJcbiAgYXdhaXQgcGFnZS5nZXRCeVRlc3RJZCh0ZXN0SWQpLmZpcnN0KCkuZXZhbHVhdGUoKGVsKSA9PiB7XHJcbiAgICAoZWwgYXMgSFRNTEVsZW1lbnQpLmNsaWNrKCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKiBSZWFjdCBjb250cm9sbGVkIGlucHV0cyBuZWVkIHRoZSBuYXRpdmUgdmFsdWUgc2V0dGVyICsgaW5wdXQgZXZlbnQuICovXHJcbmFzeW5jIGZ1bmN0aW9uIGZpbGxDb250cm9sbGVkSW5wdXQocGFnZTogUGFnZSwgdGVzdElkOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcclxuICBhd2FpdCBwYWdlLmdldEJ5VGVzdElkKHRlc3RJZCkuZXZhbHVhdGUoKGVsLCB2KSA9PiB7XHJcbiAgICBjb25zdCBpbnB1dCA9IGVsIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICBjb25zdCBzZXR0ZXIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHdpbmRvdy5IVE1MSW5wdXRFbGVtZW50LnByb3RvdHlwZSwgXCJ2YWx1ZVwiKT8uc2V0O1xyXG4gICAgc2V0dGVyPy5jYWxsKGlucHV0LCB2KTtcclxuICAgIGlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiaW5wdXRcIiwgeyBidWJibGVzOiB0cnVlIH0pKTtcclxuICAgIGlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiY2hhbmdlXCIsIHsgYnViYmxlczogdHJ1ZSB9KSk7XHJcbiAgfSwgdmFsdWUpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBkaXNtaXNzQm9vdFNwbGFzaElmUHJlc2VudChwYWdlOiBQYWdlKSB7XHJcbiAgY29uc3Qgc3BsYXNoID0gcGFnZS5nZXRCeVRlc3RJZChcImJvb3Qtc3BsYXNoLXNjcmVlblwiKTtcclxuICBpZiAoYXdhaXQgc3BsYXNoLmlzVmlzaWJsZSgpLmNhdGNoKCgpID0+IGZhbHNlKSkge1xyXG4gICAgYXdhaXQgc3BsYXNoLmNsaWNrKHsgcG9zaXRpb246IHsgeDogMjQsIHk6IDI0IH0sIGZvcmNlOiB0cnVlIH0pO1xyXG4gICAgYXdhaXQgc3BsYXNoLndhaXRGb3IoeyBzdGF0ZTogXCJoaWRkZW5cIiwgdGltZW91dDogOF8wMDAgfSkuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUFwcFNoZWxsKHBhZ2U6IFBhZ2UpIHtcclxuICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDM7IGF0dGVtcHQgKz0gMSkge1xyXG4gICAgaWYgKGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJtYWluLWNvbnRlbnRcIikuaXNWaXNpYmxlKCkuY2F0Y2goKCkgPT4gZmFsc2UpKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGF3YWl0IHBhZ2UuZ290byhcIi9cIiwgeyB3YWl0VW50aWw6IFwiZG9tY29udGVudGxvYWRlZFwiIH0pO1xyXG4gICAgYXdhaXQgZGlzbWlzc0Jvb3RTcGxhc2hJZlByZXNlbnQocGFnZSk7XHJcbiAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDQwMCk7XHJcbiAgfVxyXG4gIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwibWFpbi1jb250ZW50XCIpKS50b0JlVmlzaWJsZSh7IHRpbWVvdXQ6IDMwXzAwMCB9KTtcclxufVxyXG5cclxuLyoqIEluLWFwcCBuYXZpZ2F0aW9uIHZpYSBzdGFibGUgbmF2IHRlc3QgaWRzIChhdm9pZHMgZmxha3kgaGFzaCByZWxvYWQgdW5kZXIgcHJldmlldykuICovXHJcbmFzeW5jIGZ1bmN0aW9uIGNsaWNrTmF2KHBhZ2U6IFBhZ2UsIGtleTogc3RyaW5nKSB7XHJcbiAgYXdhaXQgZW5zdXJlQXBwU2hlbGwocGFnZSk7XHJcbiAgYXdhaXQgZG9tQ2xpY2socGFnZSwgYG5hdi0ke2tleX1gKTtcclxuICBjb25zdCBzaGVsbElkID0gUEFHRV9TSEVMTF9URVNUX0lEW2tleV07XHJcbiAgaWYgKHNoZWxsSWQpIHtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKHNoZWxsSWQpKS50b0JlVmlzaWJsZSh7IHRpbWVvdXQ6IDI1XzAwMCB9KTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGV4cGVjdElvbkJyYW5kKHBhZ2U6IFBhZ2UpIHtcclxuICBjb25zdCBicmFuZHMgPSBwYWdlLmdldEJ5VGVzdElkKFwiYnJhbmQtdGl0bGVcIik7XHJcbiAgY29uc3QgY291bnQgPSBhd2FpdCBicmFuZHMuY291bnQoKTtcclxuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY291bnQ7IGluZGV4ICs9IDEpIHtcclxuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGJyYW5kcy5udGgoaW5kZXgpO1xyXG4gICAgaWYgKGF3YWl0IGNhbmRpZGF0ZS5pc1Zpc2libGUoKSkge1xyXG4gICAgICBhd2FpdCBleHBlY3QoY2FuZGlkYXRlKS50b0hhdmVUZXh0KFwiSU9OIERFWFwiKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gIH1cclxuICBhd2FpdCBleHBlY3QocGFnZS5sb2NhdG9yKFwiaGVhZGVyXCIpLmdldEJ5VGV4dChcIklPTiBERVhcIiwgeyBleGFjdDogdHJ1ZSB9KS5maXJzdCgpKS50b0JlVmlzaWJsZSh7XHJcbiAgICB0aW1lb3V0OiAxNV8wMDAsXHJcbiAgfSk7XHJcbn1cclxuXHJcbnRlc3QuZGVzY3JpYmUoXCJJT04gREVYIHNtb2tlXCIsICgpID0+IHtcclxuICB0ZXN0LmRlc2NyaWJlLmNvbmZpZ3VyZSh7IG1vZGU6IFwic2VyaWFsXCIgfSk7XHJcbiAgdGVzdC5zZXRUaW1lb3V0KDkwXzAwMCk7XG4gIHRlc3QuYmVmb3JlRWFjaChhc3luYyAoeyBwYWdlIH0pID0+IHtcbiAgICBwYWdlLnNldERlZmF1bHRUaW1lb3V0KDEwXzAwMCk7XG4gICAgYXdhaXQgaW5zdGFsbEUyZVNlc3Npb25GbGFncyhwYWdlLCB7IGxvY2FsZTogXCJ6aC1DTlwiIH0pO1xuICB9KTtcblxyXG4gIHRlc3QoXCJob21lIHBhZ2Ugc2hvd3Mga2V5IHNlY3Rpb25zIGFuZCBjb250cm9sc1wiLCBhc3luYyAoeyBwYWdlIH0pID0+IHtcclxuICAgIGF3YWl0IHBhZ2UuZ290byhcIi9cIiwgeyB3YWl0VW50aWw6IFwiZG9tY29udGVudGxvYWRlZFwiIH0pO1xyXG4gICAgYXdhaXQgZGlzbWlzc0Jvb3RTcGxhc2hJZlByZXNlbnQocGFnZSk7XHJcblxyXG4gICAgYXdhaXQgZXhwZWN0SW9uQnJhbmQocGFnZSk7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInRpY2tlci1zdHJpcFwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwidGlja2VyLXNvdXJjZVwiKSkudG9IYXZlVGV4dCgvXFxTLyk7XG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJtYWluLWNvbnRlbnRcIikpLnRvQmVWaXNpYmxlKCk7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInBhZ2UtZGFzaGJvYXJkXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJkYXNoYm9hcmQtbWFpbi1zdGFnZVwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiZGFzaGJvYXJkLWZlYXR1cmUtZ3JpZFwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGRvbUNsaWNrKHBhZ2UsIFwiZGFzaGJvYXJkLW9wZW4tc3dhcFwiKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwicGFnZS1zd2FwXCIpKS50b0JlVmlzaWJsZSh7IHRpbWVvdXQ6IDI1XzAwMCB9KTtcclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJzd2FwLXBheS1hbW91bnRcIikuZmlsbChcIjFcIik7XG4gICAgY29uc3Qgc3dhcFN1Ym1pdCA9IHBhZ2UuZ2V0QnlUZXN0SWQoXCJzd2FwLXN1Ym1pdFwiKTtcbiAgICBhd2FpdCBleHBlY3Qoc3dhcFN1Ym1pdCkudG9CZVZpc2libGUoKTtcbiAgICBhd2FpdCBleHBlY3Qoc3dhcFN1Ym1pdCkudG9CZURpc2FibGVkKCk7XG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJzd2FwLXdhbGxldC1oaW50XCIpKS50b0JlVmlzaWJsZSgpO1xuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwid2FsbGV0LWNvbm5lY3RcIikpLnRvQmVWaXNpYmxlKCk7XG4gIH0pO1xuXHJcbiAgdGVzdChcImJvb3Qgc3BsYXNoIHJlbmRlcnMgdXBncmFkZWQgSU9OIERFWCBicmFuZCBvdmVybGF5cyBiZWZvcmUgc2tpcFwiLCBhc3luYyAoeyBwYWdlIH0pID0+IHtcclxuICAgIGF3YWl0IHBhZ2UuZ290byhcIi9cIiwgeyB3YWl0VW50aWw6IFwiZG9tY29udGVudGxvYWRlZFwiIH0pO1xyXG4gICAgY29uc3Qgc3BsYXNoID0gcGFnZS5nZXRCeVRlc3RJZChcImJvb3Qtc3BsYXNoLXNjcmVlblwiKTtcclxuICAgIGF3YWl0IGV4cGVjdChzcGxhc2gpLnRvQmVWaXNpYmxlKCk7XHJcbiAgICBhd2FpdCBleHBlY3Qoc3BsYXNoKS50b0hhdmVBdHRyaWJ1dGUoXCJkYXRhLWxhdW5jaC1waGFzZVwiLCBcImJvb3RcIik7XG4gICAgYXdhaXQgZXhwZWN0KHNwbGFzaCkudG9IYXZlQXR0cmlidXRlKFwiZGF0YS1ib290LWNsaXBcIiwgLy4rLyk7XG4gICAgYXdhaXQgZXhwZWN0KHNwbGFzaCkudG9IYXZlQXR0cmlidXRlKFwiZGF0YS1ib290LXZhcmlhbnRcIiwgLy4rLyk7XG4gICAgYXdhaXQgZGlzbWlzc0Jvb3RTcGxhc2hJZlByZXNlbnQocGFnZSk7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcIm1haW4tY29udGVudFwiKSkudG9CZVZpc2libGUoeyB0aW1lb3V0OiAzMF8wMDAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHRlc3QoXCJ3YWxsZXQgc2hlbGwgY29ubmVjdHMgdmlhIG9mZmljaWFsIElPTiBleHRlbnNpb24gcHJvdmlkZXIgbW9ja1wiLCBhc3luYyAoeyBwYWdlIH0pID0+IHtcclxuICAgIGF3YWl0IHBhZ2UuYWRkSW5pdFNjcmlwdCgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IG1vY2tBZGRyZXNzID0gXCJFUUNUZXN0V2FsbGV0QWRkcmVzc0ZvckUyZVNtb2tlT25seXh4eHh4eHh4eHhcIjtcclxuICAgICAgd2luZG93LnRvbiA9IHtcclxuICAgICAgICBpc1RvbldhbGxldDogdHJ1ZSxcclxuICAgICAgICBzZW5kOiBhc3luYyAobWV0aG9kOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgIGlmIChtZXRob2QgPT09IFwidG9uX3JlcXVlc3RBY2NvdW50c1wiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbbW9ja0FkZHJlc3NdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKG1ldGhvZCA9PT0gXCJ0b25fZ2V0QmFsYW5jZVwiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIjE1MDAwMDAwMDBcIjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uOiAoKSA9PiB1bmRlZmluZWQsXHJcbiAgICAgICAgb2ZmOiAoKSA9PiB1bmRlZmluZWQsXHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuXHJcbiAgICBhd2FpdCBwYWdlLmdvdG8oXCIvXCIsIHsgd2FpdFVudGlsOiBcImRvbWNvbnRlbnRsb2FkZWRcIiB9KTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwid2FsbGV0LWNvbm5lY3RcIikpLnRvQmVWaXNpYmxlKHsgdGltZW91dDogMTVfMDAwIH0pO1xyXG5cclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJ3YWxsZXQtY29ubmVjdFwiKS5ldmFsdWF0ZSgoZWwpID0+IHtcclxuICAgICAgKGVsIGFzIEhUTUxCdXR0b25FbGVtZW50KS5jbGljaygpO1xyXG4gICAgfSk7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcIndhbGxldC1wYW5lbFwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwid2FsbGV0LXByb3ZpZGVyLWlvbi1icm93c2VyXCIpKS50b0JlVmlzaWJsZSgpO1xyXG5cclxuICAgIGF3YWl0IGRvbUNsaWNrKHBhZ2UsIFwid2FsbGV0LXByb3ZpZGVyLWlvbi1icm93c2VyXCIpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJ3YWxsZXQtY29uZmlybWF0aW9uXCIpKS50b0NvbnRhaW5UZXh0KFxuICAgICAgL0lPTiBCcm93c2VyIFdhbGxldCBjb25uZWN0ZWR8SU9OIEJyb3dzZXIgV2FsbGV0Lirlt7Lov5585bey6L+eLipJT04gQnJvd3NlciBXYWxsZXQvLFxuICAgICk7XG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJwcm9maWxlLW1lbnVcIikpLnRvQmVWaXNpYmxlKCk7XG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJ3YWxsZXQtY29ubmVjdFwiKSkudG9Db250YWluVGV4dChcIkVRQ1Rlc1wiKTtcblxuICAgIGF3YWl0IGRvbUNsaWNrKHBhZ2UsIFwid2FsbGV0LWRpc2Nvbm5lY3RcIik7XG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJ3YWxsZXQtY29ubmVjdFwiKSkudG9Db250YWluVGV4dCgvV2FsbGV0IENvbm5lY3R86L+e5o6l6ZKx5YyFfOi/nuaOpemMouWMhS8pO1xuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJ3YWxsZXQtY29ubmVjdFwiKS5ldmFsdWF0ZSgoZWwpID0+IHtcbiAgICAgIChlbCBhcyBIVE1MQnV0dG9uRWxlbWVudCkuY2xpY2soKTtcbiAgICB9KTtcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcIndhbGxldC1wYW5lbFwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwid2FsbGV0LXByb3ZpZGVyLW9ubGluZVwiKSkudG9CZVZpc2libGUoKTtcclxuICB9KTtcclxuXHJcbiAgdGVzdChcIjM3NXB4IHZpZXdwb3J0IGtlZXBzIGJyYW5kIGFuZCBtYWluIGNvbnRlbnQgdmlzaWJsZVwiLCBhc3luYyAoeyBwYWdlIH0pID0+IHtcclxuICAgIGF3YWl0IHBhZ2Uuc2V0Vmlld3BvcnRTaXplKHsgd2lkdGg6IDM3NSwgaGVpZ2h0OiA4NDQgfSk7XHJcbiAgICBhd2FpdCBwYWdlLmdvdG8oXCIvXCIsIHsgd2FpdFVudGlsOiBcImRvbWNvbnRlbnRsb2FkZWRcIiB9KTtcclxuICAgIGF3YWl0IGVuc3VyZUFwcFNoZWxsKHBhZ2UpO1xyXG4gICAgYXdhaXQgZXhwZWN0SW9uQnJhbmQocGFnZSk7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcIm1haW4tY29udGVudFwiKSkudG9CZVZpc2libGUoKTtcclxuICB9KTtcclxuXHJcbiAgdGVzdChcIjc2OHB4IGFuZCAxNDQwcHggdmlld3BvcnRzIGtlZXAgYnJhbmQgdmlzaWJsZVwiLCBhc3luYyAoeyBwYWdlIH0pID0+IHtcclxuICAgIGZvciAoY29uc3Qgd2lkdGggb2YgWzc2OCwgMTQ0MF0pIHtcclxuICAgICAgYXdhaXQgcGFnZS5zZXRWaWV3cG9ydFNpemUoeyB3aWR0aCwgaGVpZ2h0OiA5MDAgfSk7XHJcbiAgICAgIGF3YWl0IHBhZ2UuZ290byhcIi9cIiwgeyB3YWl0VW50aWw6IFwiZG9tY29udGVudGxvYWRlZFwiIH0pO1xyXG4gICAgICBhd2FpdCBleHBlY3RJb25CcmFuZChwYWdlKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgdGVzdChcImhhc2ggcm91dGUgb3BlbnMgc3dhcCBwYWdlIGRpcmVjdGx5XCIsIGFzeW5jICh7IHBhZ2UgfSkgPT4ge1xyXG4gICAgYXdhaXQgcGFnZS5nb3RvKFwiLyMvc3dhcFwiLCB7IHdhaXRVbnRpbDogXCJkb21jb250ZW50bG9hZGVkXCIgfSk7XHJcbiAgICBhd2FpdCBleHBlY3QoYXN5bmMgKCkgPT4ge1xyXG4gICAgICBhd2FpdCBleHBlY3QocGFnZSkudG9IYXZlVVJMKC8jXFwvc3dhcC8pO1xyXG4gICAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInBhZ2Utc3dhcFwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIH0pLnRvUGFzcyh7IHRpbWVvdXQ6IDIwXzAwMCB9KTtcclxuICB9KTtcclxuXHJcbiAgdGVzdChcInRvcCBuYXZpZ2F0aW9uIG9wZW5zIGJ1c2luZXNzIHBhZ2Ugc2hlbGxzXCIsIGFzeW5jICh7IHBhZ2UgfSkgPT4ge1xyXG4gICAgYXdhaXQgcGFnZS5nb3RvKFwiL1wiLCB7IHdhaXRVbnRpbDogXCJkb21jb250ZW50bG9hZGVkXCIgfSk7XHJcblxyXG4gICAgY29uc3QgcGFnZXMgPSBbXCJ0cmFkZVwiLCBcImdyaWRcIiwgXCJwb29sXCIsIFwic3Rha2VcIiwgXCJicmlkZ2VcIiwgXCJidXJuXCJdIGFzIGNvbnN0O1xuXG4gICAgZm9yIChjb25zdCBrZXkgb2YgcGFnZXMpIHtcbiAgICAgIGF3YWl0IGNsaWNrTmF2KHBhZ2UsIGtleSk7XG4gICAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChgcGFnZS0ke2tleX1gKSkudG9CZVZpc2libGUoKTtcbiAgICB9XG5cclxuICAgIGF3YWl0IGNsaWNrTmF2KHBhZ2UsIFwiZG9tYWluXCIpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJwYWdlLWRvbWFpblwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiZG9tYWluLW1hbmFnZS1oZXJvXCIpKS50b0JlVmlzaWJsZSgpO1xyXG5cclxuICAgIGF3YWl0IGNsaWNrTmF2KHBhZ2UsIFwiYWlcIik7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInBhZ2UtYWktc3Vic2NyaXB0aW9uXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJhaS1zdWJzY3JpcHRpb24taGVyb1wiKSkudG9CZVZpc2libGUoKTtcclxuXHJcbiAgICBhd2FpdCBjbGlja05hdihwYWdlLCBcInNldHRpbmdzXCIpO1xuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwicGFnZS1zZXR0aW5nc1wiKSkudG9CZVZpc2libGUoKTtcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInNldHRpbmdzLWRhcmstdG9nZ2xlXCIpKS50b0JlVmlzaWJsZSgpO1xuXHJcbiAgICBhd2FpdCBjbGlja05hdihwYWdlLCBcImJhdGNoLXRyYW5zZmVyXCIpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJwYWdlLWJhdGNoLXRyYW5zZmVyXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJiYXRjaC10cmFuc2Zlci10YWJzXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gIH0pO1xyXG5cclxuICB0ZXN0KFwidHJhZGUgcGFnZSBzaG93cyBwcm9mZXNzaW9uYWwgZGVzayBtb2R1bGVzXCIsIGFzeW5jICh7IHBhZ2UgfSkgPT4ge1xyXG4gICAgYXdhaXQgcGFnZS5nb3RvKFwiL1wiLCB7IHdhaXRVbnRpbDogXCJkb21jb250ZW50bG9hZGVkXCIgfSk7XHJcbiAgICBhd2FpdCBjbGlja05hdihwYWdlLCBcInRyYWRlXCIpO1xyXG5cclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwidHJhZGUtY2hhcnRcIikpLnRvQmVWaXNpYmxlKCk7XHJcbiAgICBhd2FpdCBwYWdlLmdldEJ5VGVzdElkKFwidHJhZGUtb3JkZXJib29rXCIpLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwidHJhZGUtb3JkZXJib29rXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgcGFnZS5nZXRCeVRlc3RJZChcInRyYWRlLW1hcmtldC10cmFkZXNcIikuc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJ0cmFkZS1tYXJrZXQtdHJhZGVzXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgcGFnZS5nZXRCeVRlc3RJZChcInRyYWRlLWhpc3RvcnlcIikuc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJ0cmFkZS1oaXN0b3J5XCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXh0KC9UV0FQIGd1YXJkIGFjdGl2ZXxUV0FQIOWuiOWNq+W3suWQr+eUqC8pKS50b0JlVmlzaWJsZSgpO1xuICB9KTtcclxuXHJcbiAgdGVzdChcImdyaWQgcG9vbCBicmlkZ2UgYnVybiBkb21haW4gYWkgcGFnZXMgc2hvdyBsaXF1aWQtZ2xhc3MgZGVzayBtb2R1bGVzXCIsIGFzeW5jICh7IHBhZ2UgfSkgPT4ge1xyXG4gICAgYXdhaXQgcGFnZS5nb3RvKFwiL1wiLCB7IHdhaXRVbnRpbDogXCJkb21jb250ZW50bG9hZGVkXCIgfSk7XHJcblxyXG4gICAgYXdhaXQgY2xpY2tOYXYocGFnZSwgXCJncmlkXCIpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJncmlkLXJhbmdlLWNoYXJ0XCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJncmlkLXRlbXBsYXRlc1wiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiZ3JpZC1mb3JtXCIpKS50b0JlVmlzaWJsZSgpO1xyXG5cclxuICAgIGF3YWl0IGNsaWNrTmF2KHBhZ2UsIFwicG9vbFwiKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwicGFnZS1wb29sXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJwb29sLWZvcm1cIikpLnRvQmVWaXNpYmxlKCk7XHJcblxyXG4gICAgYXdhaXQgY2xpY2tOYXYocGFnZSwgXCJicmlkZ2VcIik7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInBhZ2UtYnJpZGdlXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJicmlkZ2UtZm9ybVwiKSkudG9CZVZpc2libGUoKTtcclxuXHJcbiAgICBhd2FpdCBjbGlja05hdihwYWdlLCBcImJ1cm5cIik7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcImJ1cm4tdHJlbmQtY2hhcnRcIikpLnRvQmVWaXNpYmxlKCk7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcImJ1cm4tY2hhaW4tc3BsaXRcIikpLnRvQmVWaXNpYmxlKCk7XHJcblxyXG4gICAgYXdhaXQgY2xpY2tOYXYocGFnZSwgXCJkb21haW5cIik7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcImRvbWFpbi1tYW5hZ2Utb3duZWQtbGlzdFwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiZG9tYWluLW1hbmFnZS1waGlzaGluZy13YXJuXCIpKS50b0JlVmlzaWJsZSgpO1xyXG5cclxuICAgIGF3YWl0IGNsaWNrTmF2KHBhZ2UsIFwiYWlcIik7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInBhZ2UtYWktc3Vic2NyaXB0aW9uXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJhaS1zdWJzY3JpcHRpb24tdGllci1iYXNpY1wiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiYWktc3Vic2NyaXB0aW9uLXdhbGxldC1wYW5lbFwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwic2VudGluZWwtYWxlcnQtdGVzdFwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJzZW50aW5lbC1hbGVydC10ZXN0LWJ0blwiKS5jbGljaygpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJzZW50aW5lbC1hbGVydC10ZXN0LXJlc3VsdFwiKSkudG9CZVZpc2libGUoeyB0aW1lb3V0OiAxNV8wMDAgfSk7XHJcblxyXG4gICAgYXdhaXQgY2xpY2tOYXYocGFnZSwgXCJzZXR0aW5nc1wiKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwic2V0dGluZ3MtZGFyay10b2dnbGVcIikpLnRvQmVWaXNpYmxlKCk7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInNldHRpbmdzLWNsZWFyLWNhY2hlXCIpKS50b0JlVmlzaWJsZSgpO1xyXG5cclxuICAgIGF3YWl0IGNsaWNrTmF2KHBhZ2UsIFwiYmF0Y2gtdHJhbnNmZXJcIik7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcImJhdGNoLXRyYW5zZmVyLWNzdi1pbnB1dFwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiYmF0Y2gtdHJhbnNmZXItcGFyc2UtYnRuXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJiYXRjaC10cmFuc2Zlci12YWxpZGF0ZVwiKSkudG9CZVZpc2libGUoKTtcclxuICB9KTtcclxuXHJcbiAgdGVzdChcInRyYWRlIHBhZ2UgdmFsaWRhdGVzIGFuZCBwcmVwYXJlcyBhIGxpbWl0IG9yZGVyXCIsIGFzeW5jICh7IHBhZ2UgfSkgPT4ge1xyXG4gICAgYXdhaXQgcGFnZS5nb3RvKFwiL1wiLCB7IHdhaXRVbnRpbDogXCJkb21jb250ZW50bG9hZGVkXCIgfSk7XHJcbiAgICBhd2FpdCBjbGlja05hdihwYWdlLCBcInRyYWRlXCIpO1xyXG5cclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwidHJhZGUtZm9ybVwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwidHJhZGUtc3VibWl0XCIpKS50b0JlRGlzYWJsZWQoKTtcclxuXHJcbiAgICBhd2FpdCBwYWdlLmdldEJ5VGVzdElkKFwidHJhZGUtZm9ybVwiKS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInRyYWRlLWZvcm1cIikpLnRvQmVWaXNpYmxlKCk7XHJcbiAgICBhd2FpdCBmaWxsQ29udHJvbGxlZElucHV0KHBhZ2UsIFwidHJhZGUtYW1vdW50XCIsIFwiMTI1MFwiKTtcclxuICAgIGF3YWl0IGZpbGxDb250cm9sbGVkSW5wdXQocGFnZSwgXCJ0cmFkZS1wcmljZVwiLCBcIjZcIik7XHJcbiAgICBhd2FpdCBmaWxsQ29udHJvbGxlZElucHV0KHBhZ2UsIFwidHJhZGUtc2xpcHBhZ2VcIiwgXCIwLjVcIik7XHJcblxyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJ0cmFkZS1wcmV2aWV3XCIpKS50b0NvbnRhaW5UZXh0KC9CdXlpbmcgMSwyNTAgSU9OfOS5sOWFpVxccyoxLDI1MCBJT04vKTtcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInRyYWRlLXN1Ym1pdFwiKSkudG9CZUVuYWJsZWQoKTtcblxuICAgIGF3YWl0IGRvbUNsaWNrKHBhZ2UsIFwidHJhZGUtc3VibWl0XCIpO1xuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwidHJhZGUtY29uZmlybWF0aW9uXCIpKS50b0NvbnRhaW5UZXh0KFxuICAgICAgL09yZGVyIHJldmlldyByZWFkeXzorqLljZXlpI3moLjlt7Llh4blpIflsLHnu6ovLFxuICAgICk7XG4gIH0pO1xyXG5cclxuICB0ZXN0KFwiZ3JpZCBwYWdlIHZhbGlkYXRlcyBib3VuZHMgYW5kIHByZXBhcmVzIGEgc3RyYXRlZ3lcIiwgYXN5bmMgKHsgcGFnZSB9KSA9PiB7XHJcbiAgICBhd2FpdCBwYWdlLmdvdG8oXCIvXCIsIHsgd2FpdFVudGlsOiBcImRvbWNvbnRlbnRsb2FkZWRcIiB9KTtcclxuICAgIGF3YWl0IGNsaWNrTmF2KHBhZ2UsIFwiZ3JpZFwiKTtcclxuXHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcImdyaWQtZm9ybVwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiZ3JpZC1zdWJtaXRcIikpLnRvQmVEaXNhYmxlZCgpO1xyXG5cclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJncmlkLWxvd2VyXCIpLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJncmlkLWxvd2VyXCIpLmZpbGwoXCI3LjRcIik7XHJcbiAgICBhd2FpdCBwYWdlLmdldEJ5VGVzdElkKFwiZ3JpZC11cHBlclwiKS5maWxsKFwiNS4yXCIpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJncmlkLWVycm9yXCIpKS50b0JlVmlzaWJsZSgpO1xyXG5cclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJncmlkLWxvd2VyXCIpLmZpbGwoXCI1LjJcIik7XHJcbiAgICBhd2FpdCBwYWdlLmdldEJ5VGVzdElkKFwiZ3JpZC11cHBlclwiKS5maWxsKFwiNy40XCIpO1xyXG4gICAgYXdhaXQgcGFnZS5nZXRCeVRlc3RJZChcImdyaWQtY291bnRcIikuZmlsbChcIjIyXCIpO1xyXG4gICAgYXdhaXQgcGFnZS5nZXRCeVRlc3RJZChcImdyaWQtaW52ZXN0bWVudFwiKS5maWxsKFwiMjUwMFwiKTtcclxuXHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcImdyaWQtcHJldmlld1wiKSkudG9Db250YWluVGV4dCgvYXJpdGhtZXRpYyBncmlkfOetieW3rue9keagvC8pO1xuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiZ3JpZC1zdWJtaXRcIikpLnRvQmVFbmFibGVkKCk7XG5cbiAgICBhd2FpdCBkb21DbGljayhwYWdlLCBcImdyaWQtc3VibWl0XCIpO1xuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiZ3JpZC1jb25maXJtYXRpb25cIikpLnRvQ29udGFpblRleHQoXG4gICAgICAvU3RyYXRlZ3kgcmV2aWV3IHJlYWR5fOetlueVpeWkjeaguOW3suWHhuWkh+Wwsee7qi8sXG4gICAgKTtcbiAgfSk7XHJcblxyXG4gIHRlc3QoXCJwb29sIHBhZ2UgdmFsaWRhdGVzIHNsaXBwYWdlIGFuZCBwcmVwYXJlcyBsaXF1aWRpdHkgbWludFwiLCBhc3luYyAoeyBwYWdlIH0pID0+IHtcclxuICAgIGF3YWl0IHBhZ2UuZ290byhcIi9cIiwgeyB3YWl0VW50aWw6IFwiZG9tY29udGVudGxvYWRlZFwiIH0pO1xyXG4gICAgYXdhaXQgY2xpY2tOYXYocGFnZSwgXCJwb29sXCIpO1xyXG5cclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwicG9vbC1mb3JtXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJwb29sLXN1Ym1pdFwiKSkudG9CZURpc2FibGVkKCk7XHJcblxyXG4gICAgYXdhaXQgcGFnZS5nZXRCeVRlc3RJZChcInBvb2wtYm5iXCIpLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJwb29sLWJuYlwiKS5maWxsKFwiMlwiKTtcclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJwb29sLWlvblwiKS5maWxsKFwiODAwXCIpO1xyXG4gICAgYXdhaXQgcGFnZS5nZXRCeVRlc3RJZChcInBvb2wtc2xpcHBhZ2VcIikuZmlsbChcIjEwXCIpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJwb29sLWVycm9yXCIpKS50b0JlVmlzaWJsZSgpO1xyXG5cclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJwb29sLXNsaXBwYWdlXCIpLmZpbGwoXCIwLjVcIik7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInBvb2wtcHJldmlld1wiKSkudG9Db250YWluVGV4dCgvTGlxdWlkaXR5IHByZXZpZXc6fOa1geWKqOaAp+mihOiniC8pO1xuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwicG9vbC1zdWJtaXRcIikpLnRvQmVFbmFibGVkKCk7XG5cbiAgICBhd2FpdCBwYWdlLmdldEJ5VGVzdElkKFwicG9vbC1mb3JtXCIpLmV2YWx1YXRlKChmb3JtKSA9PiB7XG4gICAgICAoZm9ybSBhcyBIVE1MRm9ybUVsZW1lbnQpLnJlcXVlc3RTdWJtaXQoKTtcbiAgICB9KTtcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInBvb2wtY29uZmlybWF0aW9uXCIpKS50b0NvbnRhaW5UZXh0KFwi5rWB5Yqo5oCn5pON5L2c5bey5YeG5aSH5aW96L+b5YWl6ZKx5YyF562+5ZCN44CCXCIpO1xuICB9KTtcclxuXHJcbiAgdGVzdChcInN0YWtlIHBhZ2UgcHJlcGFyZXMgc3Rha2UgYW5kIHVuc3Rha2UgcGF5bG9hZHNcIiwgYXN5bmMgKHsgcGFnZSB9KSA9PiB7XHJcbiAgICBhd2FpdCBwYWdlLmdvdG8oXCIvXCIsIHsgd2FpdFVudGlsOiBcImRvbWNvbnRlbnRsb2FkZWRcIiB9KTtcclxuICAgIGF3YWl0IGNsaWNrTmF2KHBhZ2UsIFwic3Rha2VcIik7XHJcblxyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJzdGFrZS1tZXRyaWNzLXNvdXJjZVwiKSkudG9Db250YWluVGV4dCgvbW9ja3xjYWNoZXxmYWxsYmFjay8pO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJzdGFrZS1mb3JtXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJzdGFrZS1zdWJtaXRcIikpLnRvQmVEaXNhYmxlZCgpO1xyXG5cclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJzdGFrZS1hbW91bnRcIikuc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xyXG4gICAgYXdhaXQgcGFnZS5nZXRCeVRlc3RJZChcInN0YWtlLWFtb3VudFwiKS5maWxsKFwiMjUwXCIpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJzdGFrZS1wcmV2aWV3XCIpKS50b0NvbnRhaW5UZXh0KC9TdGFrZSBwcmV2aWV3OnzotKjmirzpooTop4gvKTtcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInN0YWtlLXN1Ym1pdFwiKSkudG9CZUVuYWJsZWQoKTtcblxuICAgIGF3YWl0IGRvbUNsaWNrKHBhZ2UsIFwic3Rha2Utc3VibWl0XCIpO1xuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwic3Rha2UtY29uZmlybWF0aW9uXCIpKS50b0NvbnRhaW5UZXh0KFwi6LSo5oq85pON5L2c5bey5YeG5aSH5aW96L+b5YWl6ZKx5YyF562+5ZCN44CCXCIpO1xuXHJcbiAgICBhd2FpdCBkb21DbGljayhwYWdlLCBcInN0YWtlLW1vZGUtdW5zdGFrZVwiKTtcclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJzdGFrZS1hbW91bnRcIikuZmlsbChcIjEwMFwiKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwic3Rha2UtcHJldmlld1wiKSkudG9Db250YWluVGV4dCgvVW5zdGFrZSBwcmV2aWV3Onzop6PpmaTotKjmirzpooTop4gvKTtcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcInN0YWtlLXN1Ym1pdFwiKSkudG9CZUVuYWJsZWQoKTtcblxuICAgIGF3YWl0IGRvbUNsaWNrKHBhZ2UsIFwic3Rha2Utc3VibWl0XCIpO1xuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwic3Rha2UtY29uZmlybWF0aW9uXCIpKS50b0NvbnRhaW5UZXh0KFwi6Kej6Zmk6LSo5oq85pON5L2c5bey5YeG5aSH5aW96L+b5YWl6ZKx5YyF562+5ZCN44CCXCIpO1xuICB9KTtcblxyXG4gIHRlc3QoXCJicmlkZ2UgcGFnZSB2YWxpZGF0ZXMgZGVzdGluYXRpb24gbWVtbyBhbmQgcHJlcGFyZXMgc3dlZXBcIiwgYXN5bmMgKHsgcGFnZSB9KSA9PiB7XHJcbiAgICBhd2FpdCBwYWdlLmdvdG8oXCIvIy9icmlkZ2VcIiwgeyB3YWl0VW50aWw6IFwiZG9tY29udGVudGxvYWRlZFwiIH0pO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJwYWdlLWJyaWRnZVwiKSkudG9CZVZpc2libGUoeyB0aW1lb3V0OiAzMF8wMDAgfSk7XHJcblxyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJicmlkZ2UtbWV0cmljcy1zb3VyY2VcIikpLnRvQ29udGFpblRleHQoL21vY2t8Y2FjaGV8ZmFsbGJhY2t8dXBzdHJlYW18aW5kZXhlci8pO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJicmlkZ2UtZm9ybVwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiYnJpZGdlLXN1Ym1pdFwiKSkudG9CZURpc2FibGVkKCk7XHJcblxyXG4gICAgYXdhaXQgcGFnZS5nZXRCeVRlc3RJZChcImJyaWRnZS1hbW91bnRcIikuZmlsbChcIjE4MFwiKTtcclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJicmlkZ2UtZGVzdGluYXRpb25cIikuZmlsbChcIjB4YWJjXCIpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJicmlkZ2UtZXJyb3JcIikpLnRvQmVWaXNpYmxlKCk7XHJcblxyXG4gICAgYXdhaXQgcGFnZS5nZXRCeVRlc3RJZChcImJyaWRnZS1kZXN0aW5hdGlvblwiKS5maWxsKFwiMHhhYmNkZWYxMlwiKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiYnJpZGdlLXByZXZpZXdcIikpLnRvQ29udGFpblRleHQoL0JyaWRnZSBwcmV2aWV3Onzot6jpk77pooTop4gvKTtcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcImJyaWRnZS1zdWJtaXRcIikpLnRvQmVFbmFibGVkKCk7XG5cclxuICAgIGF3YWl0IGRvbUNsaWNrKHBhZ2UsIFwiYnJpZGdlLXN1Ym1pdFwiKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiYnJpZGdlLXN1Ym1pdFwiKSkudG9CZUVuYWJsZWQoKTtcclxuICB9KTtcclxuXHJcbiAgdGVzdChcImJ1cm4gcGFnZSBlbmZvcmNlcyBtZW1vIGxlbmd0aCBhbmQgcHJlcGFyZXMgbmFycmF0aXZlXCIsIGFzeW5jICh7IHBhZ2UgfSkgPT4ge1xyXG4gICAgYXdhaXQgcGFnZS5nb3RvKFwiL1wiLCB7IHdhaXRVbnRpbDogXCJkb21jb250ZW50bG9hZGVkXCIgfSk7XHJcbiAgICBhd2FpdCBjbGlja05hdihwYWdlLCBcImJ1cm5cIik7XHJcblxyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJidXJuLW1ldHJpY3Mtc291cmNlXCIpKS50b0NvbnRhaW5UZXh0KC9tb2NrfGNhY2hlfGZhbGxiYWNrLyk7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcImJ1cm4tZm9ybVwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJidXJuLWFtb3VudFwiKS5maWxsKFwiNTAwMFwiKTtcclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJidXJuLW1lbW9cIikuZmlsbChcInhcIi5yZXBlYXQoMTIxKSk7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcImJ1cm4tZXJyb3JcIikpLnRvQmVWaXNpYmxlKCk7XHJcbiAgICBhd2FpdCBleHBlY3QocGFnZS5nZXRCeVRlc3RJZChcImJ1cm4tc3VibWl0XCIpKS50b0JlRGlzYWJsZWQoKTtcclxuXHJcbiAgICBhd2FpdCBwYWdlLmdldEJ5VGVzdElkKFwiYnVybi1tZW1vXCIpLmZpbGwoXCJXZWVrbHkgYnVybiBhdHRlc3RhdGlvblwiKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiYnVybi1wcmV2aWV3XCIpKS50b0NvbnRhaW5UZXh0KC9CdXJuIHByZXZpZXc6fOmUgOavgemihOiniC8pO1xuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiYnVybi1zdWJtaXRcIikpLnRvQmVFbmFibGVkKCk7XG5cbiAgICBhd2FpdCBkb21DbGljayhwYWdlLCBcImJ1cm4tc3VibWl0XCIpO1xuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiYnVybi1jb25maXJtYXRpb25cIikpLnRvQ29udGFpblRleHQoXG4gICAgICAvQnVybiBhbmFseXRpY3MgcmV2aWV3IHJlYWR5fOmUgOavgeWIhuaekOWkjeaguOW3suWHhuWkh+Wwsee7qi8sXG4gICAgKTtcbiAgfSk7XHJcblxyXG4gIHRlc3QoXCJkb21haW4gcGFnZSB2YWxpZGF0ZXMgbGFiZWwgc2hhcGUgYW5kIHByZXBhcmVzIGhhbmRzaGFrZVwiLCBhc3luYyAoeyBwYWdlIH0pID0+IHtcclxuICAgIGF3YWl0IHBhZ2UuZ290byhcIi9cIiwgeyB3YWl0VW50aWw6IFwiZG9tY29udGVudGxvYWRlZFwiIH0pO1xyXG4gICAgYXdhaXQgY2xpY2tOYXYocGFnZSwgXCJkb21haW5cIik7XHJcblxyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJkb21haW4tbWV0cmljcy1zb3VyY2VcIikpLnRvQ29udGFpblRleHQoL21vY2t8Y2FjaGV8ZmFsbGJhY2t8aW5kZXhlcnx1cHN0cmVhbS8pO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJkb21haW4tZm9ybVwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IHBhZ2UuZ2V0QnlUZXN0SWQoXCJkb21haW4tcXVlcnlcIikuZmlsbChcImJhZF9sYWJlbFwiKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiZG9tYWluLWVycm9yXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJkb21haW4tc3VibWl0XCIpKS50b0JlRGlzYWJsZWQoKTtcclxuXHJcbiAgICBhd2FpdCBwYWdlLmdldEJ5VGVzdElkKFwiZG9tYWluLXF1ZXJ5XCIpLmZpbGwoXCJjdXN0b2RpYW4uaW9uXCIpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJkb21haW4tcHJldmlld1wiKSkudG9Db250YWluVGV4dCgvRG9tYWluIHByZXZpZXc6fOWfn+WQjemihOiniC8pO1xuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiZG9tYWluLXN1Ym1pdFwiKSkudG9CZUVuYWJsZWQoKTtcblxyXG4gICAgYXdhaXQgZG9tQ2xpY2socGFnZSwgXCJkb21haW4tc3VibWl0XCIpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJkb21haW4tY29uZmlybWF0aW9uXCIpKS50b0JlVmlzaWJsZSh7IHRpbWVvdXQ6IDEwXzAwMCB9KTtcclxuICB9KTtcclxuXHJcbiAgdGVzdChcImFpIHN1YnNjcmlwdGlvbiBwYWdlIGxvYWRzIHRpZXJzIGFuZCB3YWxsZXQgcGFuZWxcIiwgYXN5bmMgKHsgcGFnZSB9KSA9PiB7XHJcbiAgICBhd2FpdCBwYWdlLmdvdG8oXCIvXCIsIHsgd2FpdFVudGlsOiBcImRvbWNvbnRlbnRsb2FkZWRcIiB9KTtcclxuICAgIGF3YWl0IGNsaWNrTmF2KHBhZ2UsIFwiYWlcIik7XHJcblxyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJwYWdlLWFpLXN1YnNjcmlwdGlvblwiKSkudG9CZVZpc2libGUoKTtcclxuICAgIGF3YWl0IGV4cGVjdChwYWdlLmdldEJ5VGVzdElkKFwiYWktc3Vic2NyaXB0aW9uLXRpZXItYmFzaWNcIikpLnRvQmVWaXNpYmxlKCk7XHJcbiAgICBhd2FpdCBkb21DbGljayhwYWdlLCBcImFpLXN1YnNjcmlwdGlvbi1wZXJpb2QtcXVhcnRlcmx5XCIpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJhaS1zdWJzY3JpcHRpb24taW9uLWJhc2ljXCIpKS50b0JlVmlzaWJsZSgpO1xyXG4gICAgYXdhaXQgZXhwZWN0KHBhZ2UuZ2V0QnlUZXN0SWQoXCJhaS1zdWJzY3JpcHRpb24tY29ubmVjdFwiKSkudG9CZVZpc2libGUoKTtcclxuICB9KTtcclxufSk7XHJcbiJdLCJt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