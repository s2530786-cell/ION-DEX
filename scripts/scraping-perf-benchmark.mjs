#!/usr/bin/env node
/**
 * Scraping engine performance benchmark (HTML pages only — no price REST APIs).
 *
 * Usage:
 *   node scripts/scraping-perf-benchmark.mjs
 *   node scripts/scraping-perf-benchmark.mjs --via-http --base http://127.0.0.1:8787
 *   node scripts/scraping-perf-benchmark.mjs --rounds 3 --timeout-ms 15000
 *
 * Output: %TEMP%/ion-scraping-perf.json and console summary.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const args = process.argv.slice(2);
const viaHttp = args.includes("--via-http");
const baseUrl = (() => {
  const i = args.indexOf("--base");
  return i >= 0 && args[i + 1] ? args[i + 1] : "http://127.0.0.1:8787";
})();
const rounds = (() => {
  const i = args.indexOf("--rounds");
  return i >= 0 && args[i + 1] ? Math.max(1, Number(args[i + 1])) : 2;
})();
const timeoutMs = (() => {
  const i = args.indexOf("--timeout-ms");
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : 12_000;
})();

/** Public HTML pages for ION + mainstream coins (scrape only, not CMC/Binance APIs). */
const SCRAPE_TARGETS = [
  { id: "ion-cmc", label: "ION (CoinMarketCap page)", url: "https://coinmarketcap.com/currencies/ion/" },
  { id: "ion-coingecko", label: "ION (CoinGecko page)", url: "https://www.coingecko.com/en/coins/ion" },
  { id: "btc-coingecko", label: "BTC (CoinGecko)", url: "https://www.coingecko.com/en/coins/bitcoin" },
  { id: "eth-coingecko", label: "ETH (CoinGecko)", url: "https://www.coingecko.com/en/coins/ethereum" },
  { id: "sol-coingecko", label: "SOL (CoinGecko)", url: "https://www.coingecko.com/en/coins/solana" },
  { id: "btc-binance-price", label: "BTC (Binance price page)", url: "https://www.binance.com/en/price/bitcoin" },
];

const ENGINES = ["scrapling", "firecrawl"];

const PRICE_HINT =
  /(\$[\d,]+(?:\.\d+)?|USD\s*[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?\s*USD|price|market\s*cap|24h|%)/i;

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function hasPriceHint(text) {
  return PRICE_HINT.test(text ?? "");
}

async function loadRunner() {
  const runnerPath = join(process.cwd(), "backend", "dist", "src", "services", "scraping", "runner.js");
  return import(pathToFileURL(runnerPath).href);
}

async function extractDirect(runner, mode, url) {
  const req = {
    source: { url, kind: "news" },
    mode,
    options: { timeoutMs, maxRetries: 1, respectRobots: true },
  };
  const valid = runner.validateScrapingExtractRequest(req);
  if (!valid.ok) throw new Error(valid.message);
  const t0 = performance.now();
  const data = await runner.extractWithPolicy(valid.value);
  const latencyMs = Math.round(performance.now() - t0);
  return { data, latencyMs };
}

async function extractHttp(mode, url) {
  const t0 = performance.now();
  const res = await fetch(`${baseUrl}/api/scraping/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: { url, kind: "news" },
      mode,
      options: { timeoutMs, maxRetries: 1, respectRobots: true },
    }),
  });
  const latencyMs = Math.round(performance.now() - t0);
  const body = await res.json();
  if (!res.ok || !body.ok) {
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  }
  return { data: body.data, latencyMs };
}

async function runOne(extractFn, mode, target) {
  try {
    const { data, latencyMs } = await extractFn(mode, target.url);
    const contentLen = (data.contentText ?? "").length;
    return {
      ok: true,
      latencyMs,
      engine: data.sourceEngine ?? mode,
      contentLen,
      confidence: data.confidence ?? null,
      title: data.title ? data.title.slice(0, 120) : null,
      priceHint: hasPriceHint(data.contentText),
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: null,
      engine: mode,
      error: err instanceof Error ? err.message : String(err),
      contentLen: 0,
      priceHint: false,
    };
  }
}

async function fetchHealth(base) {
  try {
    const res = await fetch(`${base}/api/scraping/health`);
    const body = await res.json();
    return body?.data ?? body;
  } catch {
    return null;
  }
}

function summarizeRuns(runs) {
  const okRuns = runs.filter((r) => r.ok && typeof r.latencyMs === "number");
  const latencies = okRuns.map((r) => r.latencyMs).sort((a, b) => a - b);
  return {
    attempts: runs.length,
    success: okRuns.length,
    fail: runs.length - okRuns.length,
    successRate: runs.length ? okRuns.length / runs.length : 0,
    latencyMs: {
      min: latencies[0] ?? null,
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      max: latencies[latencies.length - 1] ?? null,
    },
    avgContentLen: okRuns.length
      ? Math.round(okRuns.reduce((s, r) => s + r.contentLen, 0) / okRuns.length)
      : 0,
    priceHintRate: okRuns.length ? okRuns.filter((r) => r.priceHint).length / okRuns.length : 0,
    errors: runs.filter((r) => !r.ok).map((r) => r.error).filter(Boolean),
  };
}

async function main() {
  const firecrawlConfigured = Boolean(process.env.FIRECRAWL_API_KEY?.trim());
  let extractFn;
  let health = null;

  if (viaHttp) {
    health = await fetchHealth(baseUrl);
    extractFn = (mode, url) => extractHttp(mode, url);
  } else {
    const runner = await loadRunner();
    extractFn = (mode, url) => extractDirect(runner, mode, url);
    health = {
      status: "direct-runner",
      engines: { scrapling: true, firecrawl: firecrawlConfigured },
    };
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: viaHttp ? "http" : "direct",
    baseUrl: viaHttp ? baseUrl : null,
    rounds,
    timeoutMs,
    health,
    firecrawlConfigured,
    targets: SCRAPE_TARGETS.map((t) => ({ id: t.id, label: t.label, url: t.url })),
    matrix: [],
  };

  console.log(`\nION DEX scraping perf (${report.mode}) — ${rounds} round(s)/target/engine\n`);

  for (const engine of ENGINES) {
    if (engine === "firecrawl" && !firecrawlConfigured) {
      console.log(`[skip] firecrawl — FIRECRAWL_API_KEY not set\n`);
      continue;
    }
    for (const target of SCRAPE_TARGETS) {
      const runs = [];
      for (let i = 0; i < rounds; i++) {
        const row = await runOne(extractFn, engine, target);
        runs.push(row);
        const status = row.ok ? `OK ${row.latencyMs}ms len=${row.contentLen} priceHint=${row.priceHint}` : `FAIL ${row.error}`;
        console.log(`  ${engine.padEnd(10)} ${target.id.padEnd(18)} #${i + 1} ${status}`);
        if (i < rounds - 1) await new Promise((r) => setTimeout(r, 400));
      }
      const summary = summarizeRuns(runs);
      report.matrix.push({
        engine,
        targetId: target.id,
        label: target.label,
        url: target.url,
        runs,
        summary,
      });
      console.log(
        `    → success ${(summary.successRate * 100).toFixed(0)}% | p50 ${summary.latencyMs.p50 ?? "-"}ms | p95 ${summary.latencyMs.p95 ?? "-"}ms | priceHint ${(summary.priceHintRate * 100).toFixed(0)}%\n`,
      );
    }
  }

  const outPath = join(process.env.TEMP || process.env.TMP || ".", "ion-scraping-perf.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Full report: ${outPath}\n`);

  const byEngine = {};
  for (const row of report.matrix) {
    if (!byEngine[row.engine]) byEngine[row.engine] = [];
    byEngine[row.engine].push(row.summary);
  }
  console.log("=== Engine totals ===");
  for (const [engine, summaries] of Object.entries(byEngine)) {
    const totalAttempts = summaries.reduce((s, x) => s + x.attempts, 0);
    const totalSuccess = summaries.reduce((s, x) => s + x.success, 0);
    const allLat = report.matrix
      .filter((m) => m.engine === engine)
      .flatMap((m) => m.runs.filter((r) => r.ok).map((r) => r.latencyMs))
      .sort((a, b) => a - b);
    console.log(
      `  ${engine}: ${totalSuccess}/${totalAttempts} ok (${((totalSuccess / totalAttempts) * 100).toFixed(1)}%) | p50 ${percentile(allLat, 50)}ms | p95 ${percentile(allLat, 95)}ms`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
