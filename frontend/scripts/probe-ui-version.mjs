import { chromium } from "playwright";

const urls = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["http://127.0.0.1:3001/#/trade", "http://127.0.0.1:3010/#/swap"];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const url of urls) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.waitForTimeout(2500);
    const report = await page.evaluate(() => {
      const center =
        document.querySelector('[data-testid="dashboard-swap-ion-center"]') ??
        document.querySelector('[data-testid="swap-ion-center"]');
      return {
        path: location.hash || "/",
        pageTrade: !!document.querySelector('[data-testid="page-trade"]'),
        pageSwap: !!document.querySelector('[data-testid="page-swap"]'),
        dashboardSwap: !!document.querySelector('[data-testid="dashboard-swap-stage"]'),
        hasBrandEmblem: !!document.querySelector(".ion-brand-emblem"),
        switchPairLabel: Array.from(document.querySelectorAll("button")).some((b) =>
          (b.textContent ?? "").includes("Switch pair"),
        ),
        legacyFlipOnLogo:
          !!center?.querySelector("img.absolute") && !!center?.querySelector("button"),
      };
    });
    console.log(`\n=== ${url} ===`);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.log(`\n=== ${url} === FAIL: ${error.message}`);
  }
}

await browser.close();
