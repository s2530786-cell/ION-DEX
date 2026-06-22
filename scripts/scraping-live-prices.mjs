#!/usr/bin/env node
/**
 * Scrape real-time USD prices from public HTML pages (no price REST APIs).
 *
 *   node scripts/scraping-live-prices.mjs
 *   node scripts/scraping-live-prices.mjs --via-http --base http://127.0.0.1:8787
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const viaHttp = args.includes("--via-http");
const baseUrl = (() => {
  const i = args.indexOf("--base");
  return i >= 0 && args[i + 1] ? args[i + 1] : "http://127.0.0.1:8787";
})();

async function runDirect() {
  const mod = await import(
    pathToFileURL(join(process.cwd(), "backend", "dist", "src", "services", "scraping", "market-price.js")).href
  );
  return mod.scrapeLiveMarketPrices();
}

async function runHttp() {
  const res = await fetch(`${baseUrl}/api/scraping/live-prices`);
  const body = await res.json();
  if (!res.ok || !body.ok) {
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  }
  return { prices: body.data.prices, failures: body.data.failures };
}

async function main() {
  const { prices, failures } = viaHttp ? await runHttp() : await runDirect();

  console.log("\n=== ION DEX 爬虫实时价格（非 /api/price 行情 API）===\n");
  console.log(`${"币种".padEnd(6)} ${"USD 价格".padEnd(16)} ${"24h%".padEnd(10)} ${"来源".padEnd(18)} 延迟`);
  console.log("-".repeat(68));

  for (const row of prices) {
    if (row.symbol === "ION" && row.tokenContractAddress) {
      console.log(`  合约 ${row.tokenContractAddress}`);
      console.log(`  LP   ${row.lpPoolAddress ?? "—"}`);
      console.log(`  销毁 ${row.burnAddress ?? "—"}`);
      if (row.priceMethod) console.log(`  方法 ${row.priceMethod}`);
    }
    const ch =
      row.change24hPct === null || row.change24hPct === undefined
        ? "—"
        : `${row.change24hPct >= 0 ? "+" : ""}${row.change24hPct.toFixed(2)}%`;
    console.log(
      `${row.symbol.padEnd(6)} ${row.priceUsdFormatted.padEnd(16)} ${ch.padEnd(10)} ${row.source.padEnd(18)} ${row.latencyMs}ms`,
    );
  }

  if (failures.length > 0) {
    console.log("\n失败:");
    for (const f of failures) {
      console.log(`  ${f.symbol}: ${f.error}`);
    }
  }

  const out = join(process.env.TEMP || ".", "ion-scraping-live-prices.json");
  writeFileSync(
    out,
    JSON.stringify({ generatedAt: new Date().toISOString(), prices, failures }, null, 2),
    "utf8",
  );
  console.log(`\nJSON: ${out}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
