import { performance } from "node:perf_hooks";
import { createApp } from "../dist/src/server.js";

const endpoints = [
  { path: "/api/health", p95LimitMs: 200 },
  { path: "/api/config/public", p95LimitMs: 200 },
  { path: "/api/tokens", p95LimitMs: 250 },
  { path: "/api/markets/tickers", p95LimitMs: 300 },
];

const requestsPerEndpoint = Number(process.env.ION_STRESS_REQUESTS ?? 80);
const concurrency = Number(process.env.ION_STRESS_CONCURRENCY ?? 16);

const server = createApp();

function percentile(values, pct) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[index] ?? 0;
}

async function listen() {
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address !== "object") {
    throw new Error("Unable to resolve stress server address.");
  }
  return `http://127.0.0.1:${address.port}`;
}

async function close() {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function runEndpoint(baseUrl, endpoint) {
  const latencies = [];
  let ok = 0;
  let failed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < requestsPerEndpoint) {
      cursor += 1;
      const started = performance.now();
      try {
        const response = await fetch(`${baseUrl}${endpoint.path}`);
        const body = await response.json();
        if (response.ok && body.meta?.source === "mock") {
          ok += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      } finally {
        latencies.push(performance.now() - started);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const p95 = percentile(latencies, 95);
  const p99 = percentile(latencies, 99);
  const result = {
    path: endpoint.path,
    ok,
    failed,
    p95,
    p99,
    limit: endpoint.p95LimitMs,
  };
  console.log(
    `${result.path} ok=${result.ok} failed=${result.failed} p95=${result.p95.toFixed(2)}ms p99=${result.p99.toFixed(2)}ms limit=${result.limit}ms`,
  );
  if (failed > 0 || p95 > endpoint.p95LimitMs) {
    throw new Error(`Stress threshold failed for ${endpoint.path}`);
  }
}

const baseUrl = await listen();
try {
  for (const endpoint of endpoints) {
    await runEndpoint(baseUrl, endpoint);
  }
  console.log("ION DEX backend stress smoke passed");
} finally {
  await close();
}
