import { expect, test, type Page } from "@playwright/test";
import { domClick, fillControlledInput, installE2eSessionFlags } from "./helpers";

const EVM_PROVIDER_IDS = [
  "wallet-provider-metamask",
  "wallet-provider-binance",
  "wallet-provider-okx",
  "wallet-provider-bitget",
  "wallet-provider-trust",
  "wallet-provider-coinbase",
  "wallet-provider-rabby",
] as const;

async function dismissBootSplashIfPresent(page: Page) {
  const splash = page.getByTestId("boot-splash-screen");
  if (await splash.isVisible().catch(() => false)) {
    await splash.click({ position: { x: 24, y: 24 }, force: true });
    await splash.waitFor({ state: "hidden", timeout: 8_000 }).catch(() => undefined);
  }
}

async function ensureAppShell(page: Page, path = "/") {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await page.getByTestId("main-content").isVisible().catch(() => false)) {
      return;
    }
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await dismissBootSplashIfPresent(page);
    await page.waitForTimeout(400);
  }
  await expect(page.getByTestId("main-content")).toBeVisible({ timeout: 30_000 });
}

function installEvmMock() {
  return () => {
    localStorage.clear();
    const mockAddress = "0xE2E0000000000000000000000000000000000001";
    const provider = {
      isMetaMask: true,
      request: async (args: { method: string; params?: unknown[] }) => {
        if (args.method === "eth_accounts") {
          return [];
        }
        if (args.method === "eth_requestAccounts") {
          return [mockAddress];
        }
        if (args.method === "eth_chainId") {
          return "0x38";
        }
        if (args.method === "wallet_switchEthereumChain") {
          return null;
        }
        return [];
      },
      on: () => undefined,
      off: () => undefined,
      removeListener: () => undefined,
    };
    window.ethereum = provider;
    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: {
          info: {
            uuid: "e2e-metamask",
            name: "MetaMask",
            icon: "",
            rdns: "io.metamask",
          },
          provider,
        },
      }),
    );
  };
}

test.describe("wallet connect (W2) — EVM", () => {
  test.beforeEach(async ({ page }) => {
    await installE2eSessionFlags(page);
    await page.addInitScript(installEvmMock());
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await ensureAppShell(page);
  });

  test("shows seven EVM wallet entries in connect panel", async ({ page }) => {
    await page.getByTestId("wallet-connect").evaluate((el) => {
      (el as HTMLButtonElement).click();
    });
    await expect(page.getByTestId("wallet-panel")).toBeVisible();
    for (const testId of EVM_PROVIDER_IDS) {
      await expect(page.getByTestId(testId)).toBeVisible();
    }
    await expect(page.getByTestId("wallet-provider-online")).toBeVisible();
    await expect(page.getByTestId("wallet-provider-ion-browser")).toBeVisible();
    await expect(page.getByTestId("wallet-provider-walletconnect")).toBeVisible();
  });

  test("connects mocked MetaMask and shows profile hub", async ({ page }) => {
    await page.getByTestId("wallet-connect").evaluate((el) => {
      (el as HTMLButtonElement).click();
    });
    await expect(page.getByTestId("wallet-panel")).toBeVisible();
    await domClick(page, "wallet-provider-metamask");
    await expect(page.getByTestId("wallet-confirmation")).toContainText("MetaMask connected", {
      timeout: 15_000,
    });
    await expect(page.getByTestId("profile-menu")).toBeVisible();
    await expect(page.getByTestId("evm-chain-switch")).toBeVisible();
    await expect(page.getByTestId("wallet-connect")).toContainText("0xE2E0");
  });
});

test.describe("wallet connect (W2) — sign summary", () => {
  test.beforeEach(async ({ page }) => {
    await installE2eSessionFlags(page);
    await page.addInitScript(() => {
      localStorage.clear();
      const mockAddress = "EQCTestWalletAddressForE2eWalletConnectOnlyxxxxxx";
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
    await page.goto("/#/swap", { waitUntil: "domcontentloaded" });
    await ensureAppShell(page, "/#/swap");
    await expect(page.getByTestId("page-swap")).toBeVisible({ timeout: 15_000 });
  });

  test("swap opens sign summary before ION wallet intent", async ({ page }) => {
    await page.getByTestId("wallet-connect").evaluate((el) => {
      (el as HTMLButtonElement).click();
    });
    await domClick(page, "wallet-provider-ion-browser");
    await expect(page.getByTestId("wallet-confirmation")).toContainText("ION Browser Wallet connected", {
      timeout: 15_000,
    });
    await page.getByTestId("wallet-connect").evaluate((el) => {
      (el as HTMLButtonElement).click();
    });

    await fillControlledInput(page, "swap-pay-amount", "1");
    await domClick(page, "swap-submit");
    await expect(page.getByTestId("sign-summary-dialog")).toBeVisible();
    await expect(page.getByTestId("sign-summary-confirm")).toBeVisible();
  });
});
