#!/usr/bin/env node
/**
 * Capture current UI screenshots for visual diff against docs/ui-audit-screenshots/ref-*.png
 * Usage: node scripts/capture-ui-screenshots.mjs [baseUrl]
 */
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "..", "docs", "ui-audit-screenshots");
const baseUrl = process.argv[2] ?? "http://127.0.0.1:3001";

const shots = [
  { name: "current-dashboard", path: "/", waitFor: "[data-testid=page-dashboard]" },
  { name: "current-swap", path: "/#swap", waitFor: "[data-testid=page-swap]" },
  { name: "current-trade", path: "/#trade", waitFor: "[data-testid=trade-candle-chart]" },
  { name: "current-pool", path: "/#pool", waitFor: "[data-testid=page-pool]" },
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
const page = await context.newPage();

for (const shot of shots) {
  await page.goto(`${baseUrl}${shot.path}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForSelector(shot.waitFor, { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(800);
  const file = join(outDir, `${shot.name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`Wrote ${file}`);
}

await browser.close();
console.log("OK — UI screenshots captured.");
