import { chromium } from "playwright";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3010";

const browser = await chromium.launch();
const page = await browser.newPage();
try {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 20_000 });
  await page.getByTestId("dashboard-swap-stage").waitFor({ state: "visible", timeout: 15_000 });
  await page.getByTestId("dashboard-orderbook-panel").waitFor({ state: "visible", timeout: 15_000 });
  const body = await page.locator("body").innerText();
  if (body.includes("Open Swap") || body.includes("swap.ion Galaxy")) {
    console.error("FAIL: old UI copy detected on", base);
    process.exit(1);
  }
  if (!body.includes("Open Trade")) {
    console.error("FAIL: Open Trade not found on", base);
    process.exit(1);
  }
  const ribbon = page.getByTestId("dev-build-ribbon");
  if ((await ribbon.count()) > 0 && !(await ribbon.isVisible())) {
    console.error("FAIL: dev-build-ribbon present but not visible on", base);
    process.exit(1);
  }
  console.log("OK: current dashboard UI on", base);
} finally {
  await browser.close();
}
