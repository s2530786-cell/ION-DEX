import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../.cursor/logs/screenshots");
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";

const pages = [
  { key: "swap", nav: null },
  { key: "trade", nav: "trade" },
  { key: "grid", nav: "grid" },
  { key: "pool", nav: "pool" },
  { key: "stake", nav: "stake" },
  { key: "bridge", nav: "bridge" },
  { key: "burn", nav: "burn" },
  { key: "domain", nav: "domain" },
  { key: "ai", nav: "ai" },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
const page = await context.newPage();

for (const { key, nav } of pages) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  if (nav) {
    await page.getByTestId(`nav-${nav}`).click();
    await page.waitForTimeout(600);
  }
  await page.getByTestId("main-content").waitFor({ state: "visible" });
  const file = path.join(outDir, `ui-${key}-1440.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("saved", file);
}

await browser.close();
