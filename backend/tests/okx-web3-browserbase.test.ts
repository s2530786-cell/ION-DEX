import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { loadServerConfig } from "../src/config/server-config.js";
import {
  canInvokeOkxWeb3Browserbase,
  fetchOkxWeb3IonSnapshot,
  invokeOkxWeb3BrowserbaseFunction,
  loadOkxWeb3BrowserbaseConfig,
  normalizeOkxWeb3TokenUrl,
} from "../src/upstream/okx-web3-browserbase.js";

const ENV_KEYS = [
  "BROWSERBASE_API_KEY",
  "BROWSERBASE_OKX_FUNCTION_ID",
  "BROWSERBASE_OKX_FUNCTION_URL",
] as const;

function snapshotEnv(): Record<string, string | undefined> {
  const snap: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) {
    snap[key] = process.env[key];
  }
  return snap;
}

function restoreEnv(snap: Record<string, string | undefined>): void {
  for (const key of ENV_KEYS) {
    if (snap[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snap[key];
    }
  }
}

describe("okx-web3 browserbase upstream", () => {
  const envSnap = snapshotEnv();

  afterEach(() => {
    restoreEnv(envSnap);
  });

  it("loads config defaults when env is unset", () => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
    const cfg = loadOkxWeb3BrowserbaseConfig({}, { httpTimeoutMs: 8000 });
    assert.equal(cfg.apiKey, null);
    assert.equal(cfg.functionId, null);
    assert.equal(cfg.localInvokeUrl, null);
    assert.equal(cfg.pollIntervalMs, 2000);
    assert.equal(cfg.maxWaitMs, 90000);
    assert.equal(cfg.httpTimeoutMs, 8000);
  });

  it("normalizes Browserbase target URL to the official OKX ION page", () => {
    const official = "https://web3.okx.com/zh-hans/token/bsc/0xe1ab61f7b093435204df32f5b3a405de55445ea8";
    assert.equal(normalizeOkxWeb3TokenUrl(official), official);
    assert.equal(normalizeOkxWeb3TokenUrl("https://web3.okx.com/zh-Hans/token/bsc/0xe1ab61f7b093435204df32f5b3a405de55445ea8"), official);
    assert.equal(normalizeOkxWeb3TokenUrl("https://web3.okx.com/zh-hans/token/bsc/0xe1ab61f7b093435204df32f5b3a405de55445ea8?foo=bar"), official);
    assert.equal(normalizeOkxWeb3TokenUrl("http://169.254.169.254/latest/meta-data"), official);
    assert.equal(normalizeOkxWeb3TokenUrl("https://web3.okx.com.evil.example/token/bsc/0xe1ab61f7b093435204df32f5b3a405de55445ea8"), official);
    assert.equal(normalizeOkxWeb3TokenUrl("https://web3.okx.com/token/bsc/0xe1ab61f7b093435204df32f5b3a405de55445ea8"), official);
  });

  it("detects invoke availability from local URL or cloud credentials", () => {
    assert.equal(canInvokeOkxWeb3Browserbase(loadOkxWeb3BrowserbaseConfig({})), false);
    assert.equal(
      canInvokeOkxWeb3Browserbase(
        loadOkxWeb3BrowserbaseConfig({ BROWSERBASE_OKX_FUNCTION_URL: "http://127.0.0.1:14113/x" }),
      ),
      true,
    );
    assert.equal(
      canInvokeOkxWeb3Browserbase(
        loadOkxWeb3BrowserbaseConfig({
          BROWSERBASE_API_KEY: "bb_test",
          BROWSERBASE_OKX_FUNCTION_ID: "fn_123",
        }),
      ),
      true,
    );
  });

  it("invokes local Browserbase function and returns parsed price", async () => {
    const bbConfig = loadOkxWeb3BrowserbaseConfig({
      BROWSERBASE_OKX_FUNCTION_URL: "http://127.0.0.1:14113/v1/functions/ion-oracle-okx-web3/invoke",
    });
    const mockFetch = async () =>
      ({
        ok: true,
        json: async () => ({
          ok: true,
          platformId: "okx-web3",
          priceUsd: 0.0001315,
          change24hPct: -1.2,
          url: "https://web3.okx.com/test",
          observedAt: "2026-05-29T00:00:00.000Z",
          sourceEngine: "browserbase-functions",
        }),
      }) as Response;

    const result = await invokeOkxWeb3BrowserbaseFunction(bbConfig, "https://web3.okx.com/test", mockFetch);
    assert.equal(result.ok, true);
    assert.equal(result.priceUsd, 0.0001315);
  });

  it("fetchOkxWeb3IonSnapshot uses Browserbase when configured", async () => {
    process.env.BROWSERBASE_OKX_FUNCTION_URL =
      "http://127.0.0.1:14113/v1/functions/ion-oracle-okx-web3/invoke";
    const config = loadServerConfig();
    const mockFetch = async () =>
      ({
        ok: true,
        json: async () => ({
          ok: true,
          priceUsd: 0.0002,
          change24hPct: 0.5,
          observedAt: "2026-05-29T01:00:00.000Z",
        }),
      }) as Response;

    const snap = await fetchOkxWeb3IonSnapshot(config, mockFetch);
    assert.equal(snap.priceUsd, 0.0002);
    assert.equal(snap.change24hPct, 0.5);
    assert.equal(snap.sourceEngine, "browserbase-functions");
  });

  it("fetchOkxWeb3IonSnapshot falls back to HTML fetch when Browserbase is not configured", async () => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
    const config = loadServerConfig();
    const html = `<html><head>
      <meta property="og:description" content="ION 的实时价格为 $0.0001315。" />
      <title>ION $0.0001315 (Ice Open Network) | BNB Chain</title>
    </head></html>`;
    const mockFetch = async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("web3.okx.com")) {
        return { ok: true, text: async () => html } as Response;
      }
      throw new Error(`unexpected fetch: ${url}`);
    };

    const snap = await fetchOkxWeb3IonSnapshot(config, mockFetch);
    assert.equal(snap.priceUsd, 0.0001315);
    assert.equal(snap.sourceEngine, "html-fetch");
  });

  it("fetchOkxWeb3IonSnapshot throws when Browserbase returns failure", async () => {
    process.env.BROWSERBASE_OKX_FUNCTION_URL = "http://127.0.0.1:14113/invoke";
    const config = loadServerConfig();
    const mockFetch = async () =>
      ({
        ok: true,
        json: async () => ({ ok: false, error: "page timeout" }),
      }) as Response;

    await assert.rejects(() => fetchOkxWeb3IonSnapshot(config, mockFetch), /page timeout/);
  });
});
