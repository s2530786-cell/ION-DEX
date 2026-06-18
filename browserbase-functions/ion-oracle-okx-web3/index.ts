import { defineFn } from "@browserbasehq/sdk-functions";
import { chromium } from "playwright-core";
import { parseOkxWeb3TokenPrice } from "./parse-okx-price.js";

const DEFAULT_OKX_URL =
  "https://web3.okx.com/zh-hans/token/bsc/0xe1ab61f7b093435204df32f5b3a405de55445ea8";
const OKX_HOST = "web3.okx.com";

function normalizeOkxUrl(input: unknown): string {
  if (typeof input !== "string" || !input.trim()) {
    return DEFAULT_OKX_URL;
  }

  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    return DEFAULT_OKX_URL;
  }

  const official = new URL(DEFAULT_OKX_URL);
  const isAllowed =
    parsed.protocol === "https:" &&
    parsed.hostname === OKX_HOST &&
    parsed.pathname.toLowerCase() === official.pathname.toLowerCase();

  return isAllowed ? parsed.toString() : DEFAULT_OKX_URL;
}

defineFn("ion-oracle-okx-web3", async ({ session, params }) => {
  const url = normalizeOkxUrl(params.url);
  const browser = await chromium.connectOverCDP(session.connectUrl);
  const context = browser.contexts()[0];
  const page = context?.pages()[0] ?? (await context?.newPage());
  if (!page) {
    return { ok: false, error: "No Playwright page available on Browserbase session." };
  }

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
    await page.waitForTimeout(1500);

    const html = await page.content();
    const parsed = parseOkxWeb3TokenPrice(html);
    if (!parsed) {
      const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 4000);
      return {
        ok: false,
        url,
        error: "Could not parse OKX Web3 ION USD price from rendered page.",
        htmlLength: html.length,
        bodyPreview: bodyText,
      };
    }

    return {
      ok: true,
      platformId: "okx-web3",
      priceUsd: parsed.priceUsd,
      change24hPct: parsed.change24hPct,
      url,
      observedAt: new Date().toISOString(),
      sourceEngine: "browserbase-functions",
    };
  } catch (error) {
    return {
      ok: false,
      url,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});
