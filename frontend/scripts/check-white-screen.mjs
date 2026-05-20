import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto(base, { waitUntil: "networkidle", timeout: 30_000 });
const rootText = await page.locator("#root").innerText().catch(() => "");
const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const hasDashboard = await page.getByTestId("page-dashboard").isVisible().catch(() => false);

console.log(JSON.stringify({ base, rootTextLen: rootText.length, rootPreview: rootText.slice(0, 120), bodyBg, hasDashboard, errors }, null, 2));
await browser.close();
process.exit(errors.length > 0 && !hasDashboard ? 1 : 0);
