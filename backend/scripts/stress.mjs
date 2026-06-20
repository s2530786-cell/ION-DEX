import { performance } from "node:perf_hooks";

process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.ION_DATA_MODE = process.env.ION_DATA_MODE ?? "test-mock";
delete process.env.CMC_API_KEY;

const { createApp } = await import("../dist/src/server.js");

const endpoints = [
  {
    path: "/api/health",
    p95LimitMs: 200,
    expect: (data) =>
      data.status === "ok" &&
      Array.isArray(data.dataSources) &&
      data.dataSources.length >= 4 &&
      (data.database?.status === "ok" || data.database?.status === "disabled"),
  },
  {
    path: "/api/config/public",
    p95LimitMs: 200,
    expect: (data) => data.featureFlags?.backendGateway === true && data.provenance?.source === "mock",
  },
  {
    path: "/api/tokens",
    p95LimitMs: 250,
    expect: (data) =>
      Array.isArray(data) &&
      data.some((token) => token.symbol === "ION") &&
      data.some((token) => token.symbol === "USDT" && token.status === "online"),
  },
  {
    path: "/api/markets/tickers",
    p95LimitMs: 300,
    expect: (data) =>
      Array.isArray(data) &&
      data.some((ticker) => ticker.symbol === "ION") &&
      data.every((ticker) => ticker.provenance?.source === "mock"),
  },
  { path: "/api/burn/summary", p95LimitMs: 300, expect: (data) => Number(data.totalBurnedIon) > 0 },
  { path: "/api/staking/summary", p95LimitMs: 300, expect: (data) => data.rewardAsset === "ION" },
  { path: "/api/bridge/routes", p95LimitMs: 300, expect: (data) => Array.isArray(data.routes) && data.routes.length >= 2 },
  { path: "/api/domain/resolve?name=demo.ion", p95LimitMs: 300, expect: (data) => data.name === "demo.ion" && data.available === false },
  { path: "/api/profile/demo", p95LimitMs: 300, expect: (data) => data.kycPass?.storesRawKyc === false },
];

const requestsPerEndpoint = Number(process.env.ION_STRESS_REQUESTS ?? 120);
const concurrency = Number(process.env.ION_STRESS_CONCURRENCY ?? 24);
const warmupRequestsPerEndpoint = Number(process.env.ION_STRESS_WARMUP_REQUESTS ?? 8);

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

async function warmupEndpoint(baseUrl, endpoint) {
  for (let i = 0; i < warmupRequestsPerEndpoint; i += 1) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`);
      if (response.ok) {
        await response.arrayBuffer();
      }
    } catch {
      // The measured stress run below is authoritative; warmup only removes cold-start noise.
    }
  }
}

async function measureEndpoint(baseUrl, endpoint) {
  await warmupEndpoint(baseUrl, endpoint);

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
        const validSource =
          body.meta?.source === "mock" ||
          body.meta?.source === "cache" ||
          body.meta?.source === "local";
        if (response.ok && validSource && body.meta?.requestId && endpoint.expect(body.data)) {
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

  return {
    path: endpoint.path,
    ok,
    failed,
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    limit: endpoint.p95LimitMs,
  };
}

function printEndpointResult(result, suffix = "") {
  console.log(
    `${result.path}${suffix} ok=${result.ok} failed=${result.failed} p95=${result.p95.toFixed(2)}ms p99=${result.p99.toFixed(2)}ms limit=${result.limit}ms`,
  );
}

async function runEndpoint(baseUrl, endpoint) {
  let result = await measureEndpoint(baseUrl, endpoint);
  printEndpointResult(result);
  if (result.failed === 0 && result.p95 <= endpoint.p95LimitMs) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 250));
  result = await measureEndpoint(baseUrl, endpoint);
  printEndpointResult(result, " retry");
  if (result.failed > 0 || result.p95 > endpoint.p95LimitMs) {
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
