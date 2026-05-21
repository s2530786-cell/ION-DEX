import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { adapterRegistry } from "../src/adapters/registry.js";
import { createApp } from "../src/server.js";

type JsonResponse = {
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    source: string;
    updatedAt: string;
    stale: boolean;
    requestId: string;
    cacheHit?: boolean;
    adapter?: string;
  };
};

const apiErrorCodes = {
  methodNotAllowed: "ION_DEX_E_GATEWAY_METHOD_NOT_ALLOWED",
  notFound: "ION_DEX_E_GATEWAY_NOT_FOUND",
  missingDomainName: "ION_DEX_E_DOMAIN_NAME_REQUIRED",
  invalidDomainName: "ION_DEX_E_DOMAIN_NAME_INVALID",
  invalidQuoteRequest: "ION_DEX_E_INVALID_QUOTE_REQUEST",
} as const;

let server: Server;
let baseUrl: string;

async function requestJson(path: string, init?: RequestInit): Promise<{ status: number; body: JsonResponse }> {
  const response = await fetch(`${baseUrl}${path}`, init);
  return {
    status: response.status,
    body: (await response.json()) as JsonResponse,
  };
}

describe("ION DEX API gateway", () => {
  beforeEach(() => {
    adapterRegistry.resetForTests();
  });

  before(async () => {
    server = createApp();
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const listenAddress = address as AddressInfo;
    baseUrl = `http://127.0.0.1:${listenAddress.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  it("serves health with request metadata", async () => {
    const response = await requestJson("/api/health", {
      headers: {
        "x-request-id": "test-health-request",
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.meta.source, "local");
    assert.equal(response.body.meta.stale, false);
    assert.equal(response.body.meta.requestId, "test-health-request");
    assert.match(response.body.meta.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
    const health = response.body.data as {
      status: string;
      dataSources: Array<{ adapterKey: string; status: string }>;
    };
    assert.equal(health.status, "ok");
    assert.ok(health.dataSources.some((source) => source.adapterKey === "market"));
  });

  it("normalizes unsafe request IDs before echoing metadata", async () => {
    const response = await requestJson("/api/health", {
      headers: {
        "x-request-id": "bad id with spaces and symbols <>".repeat(6),
      },
    });

    assert.equal(response.status, 200);
    assert.notEqual(response.body.meta.requestId, "bad id with spaces and symbols <>".repeat(6));
    assert.match(response.body.meta.requestId, /^[A-Za-z0-9._:-]{1,80}$/);
  });

  it("serves public config and supported wallet access flags", async () => {
    const response = await requestJson("/api/config/public");
    const data = response.body.data as {
      appName: string;
      featureFlags: { backendGateway: boolean; realWalletAdapters: boolean };
      supportedWallets: Array<{ key: string; category: string }>;
      provenance: { source: string; status: string };
    };

    assert.equal(response.status, 200);
    assert.equal(data.appName, "ION DEX");
    assert.equal(data.featureFlags.backendGateway, true);
    assert.equal(data.featureFlags.realWalletAdapters, true);
    assert.ok(data.supportedWallets.some((wallet) => wallet.key === "walletconnect"));
    assert.ok(data.supportedWallets.some((wallet) => wallet.key === "metamask" && wallet.category === "evm"));
    assert.equal(data.supportedWallets.length, 10);
    assert.deepEqual(data.provenance, {
      source: "mock",
      status: "mocked",
      note: "Public configuration is local Phase 3 mock data until official chain IDs and adapters are confirmed.",
    });
  });

  it("serves profile session with wallet detection when provider is connected", async () => {
    const response = await requestJson("/api/profile/session?provider=online");
    const data = response.body.data as {
      identity: { primaryIonName: string };
      wallets: { primaryKey: string | null; entries: Array<{ key: string }> };
      sessionDetection: { network: string; walletProvider: string; addressPreview: string } | null;
      quickActions: Array<{ key: string }>;
    };

    assert.equal(response.status, 200);
    assert.equal(data.identity.primaryIonName, "trader.ion");
    assert.equal(data.wallets.primaryKey, "online");
    assert.equal(data.wallets.entries.length, 10);
    assert.ok(data.sessionDetection);
    assert.equal(data.sessionDetection?.walletProvider, "Online+ Wallet");
    assert.match(data.sessionDetection?.addressPreview ?? "", /…/);
    assert.ok(data.quickActions.some((action) => action.key === "security-logs"));
  });

  it("merges live ION TonConnect address into profile session detection", async () => {
    const address = "0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const response = await requestJson(
      `/api/profile/session?provider=ion-browser&address=${encodeURIComponent(address)}&chainId=-239`,
    );
    const data = response.body.data as {
      sessionDetection: {
        addressPreview: string;
        network: string;
        detectionSource: string;
        addressFormat: string;
      } | null;
    };

    assert.equal(response.status, 200);
    assert.ok(data.sessionDetection);
    assert.equal(data.sessionDetection?.detectionSource, "browser-injected");
    assert.equal(data.sessionDetection?.network, "ION Mainnet");
    assert.equal(data.sessionDetection?.addressFormat, "ION / TON-style");
    assert.match(data.sessionDetection?.addressPreview ?? "", /0:12/);
  });

  it("merges live browser wallet metadata into profile session detection", async () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678";
    const response = await requestJson(
      `/api/profile/session?provider=metamask&address=${encodeURIComponent(address)}&chainId=56`,
    );
    const data = response.body.data as {
      sessionDetection: {
        addressPreview: string;
        network: string;
        detectionSource: string;
        addressFormat: string;
      } | null;
    };

    assert.equal(response.status, 200);
    assert.ok(data.sessionDetection);
    assert.equal(data.sessionDetection?.detectionSource, "browser-injected");
    assert.equal(data.sessionDetection?.network, "BNB Smart Chain");
    assert.equal(data.sessionDetection?.addressFormat, "EVM checksummed");
    assert.match(data.sessionDetection?.addressPreview ?? "", /0x1234/);
  });

  it("serves disconnected profile session without session detection", async () => {
    const response = await requestJson("/api/profile/session");
    const data = response.body.data as {
      sessionDetection: unknown;
      wallets: { primaryKey: string | null };
    };

    assert.equal(response.status, 200);
    assert.equal(data.sessionDetection, null);
    assert.equal(data.wallets.primaryKey, null);
  });

  it("serves token metadata", async () => {
    const response = await requestJson("/api/tokens");
    const data = response.body.data as Array<{ symbol: string; decimals: number; status: string; provenance: { source: string } }>;

    assert.equal(response.status, 200);
    assert.ok(data.some((token) => token.symbol === "ION" && token.decimals === 9));
    assert.ok(data.some((token) => token.symbol === "BNB"));
    assert.ok(data.every((token) => token.status === "mock" && token.provenance.source === "mock"));
  });

  it("serves market tickers for the frontend ticker strip", async () => {
    const response = await requestJson("/api/markets/tickers");
    const data = response.body.data as Array<{
      symbol: string;
      displayPrice: string;
      displayChange: string;
      provenance: { source: string };
    }>;

    assert.equal(response.status, 200);
    assert.equal(response.body.meta.source, "local");
    assert.equal(response.body.meta.adapter, "market");
    assert.equal(response.body.meta.cacheHit, false);
    assert.ok(data.length >= 4);
    assert.ok(data.every((ticker) => ticker.displayPrice.startsWith("$")));
    assert.ok(data.some((ticker) => ticker.symbol === "ION" && ticker.displayChange.startsWith("+")));
    assert.ok(data.every((ticker) => ticker.provenance.source === "mock"));
  });

  it("serves cached market tickers with adapter metadata on repeat reads", async () => {
    const first = await requestJson("/api/markets/tickers");
    const second = await requestJson("/api/markets/tickers");

    assert.equal(first.body.meta.source, "local");
    assert.equal(second.body.meta.source, "cache");
    assert.equal(second.body.meta.cacheHit, true);
    assert.equal(second.body.meta.adapter, "market");
    assert.equal(second.body.meta.stale, false);
  });

  it("serves burn summary with provenance", async () => {
    const response = await requestJson("/api/burn/summary");
    const data = response.body.data as {
      totalBurnedIon: string;
      bscBurnAddress: string;
      provenance: Array<{ source: string; status: string }>;
    };

    assert.equal(response.status, 200);
    assert.equal(response.body.meta.source, "local");
    assert.equal(response.body.meta.adapter, "burn");
    assert.ok(Number(data.totalBurnedIon) > 0);
    assert.equal(
      data.bscBurnAddress.toLowerCase(),
      "0x000000000000000000000000000000000000dead",
    );
    assert.ok(data.provenance.some((entry) => entry.source === "mock" && entry.status === "mocked"));
    assert.equal(
      (data as { ionBurnSource?: string }).ionBurnSource,
      "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ",
    );
  });

  it("serves staking summary with reward and APR data", async () => {
    const response = await requestJson("/api/staking/summary");
    const data = response.body.data as {
      totalStakedIon: string;
      rewardAsset: string;
      apr: { dexPct: number };
      lockOptions: Array<{ days: number }>;
    };

    assert.equal(response.status, 200);
    assert.ok(Number(data.totalStakedIon) > 0);
    assert.equal(data.rewardAsset, "ION");
    assert.equal(data.apr.dexPct, null);
    assert.equal((data as { officialRewardAsset?: string }).officialRewardAsset, "LION");
    assert.ok(data.lockOptions.some((option) => option.days === 90));
  });

  it("serves bridge routes with verifier safeguards", async () => {
    const response = await requestJson("/api/bridge/routes");
    const data = response.body.data as {
      routes: Array<{ routeId: string; safeguards: string[] }>;
      verifier: { replayProtection: boolean };
    };

    assert.equal(response.status, 200);
    assert.ok(data.routes.some((route) => route.routeId === "bsc-ion-ion"));
    assert.ok(data.routes.every((route) => route.safeguards.includes("manual-pause")));
    assert.equal(data.verifier.replayProtection, true);
  });

  it("serves domain showcase listings from resolver catalog", async () => {
    const response = await requestJson("/api/domain/showcase");
    const data = response.body.data as {
      listings: Array<{ name: string; status: string; priceIon: string }>;
      identity: { primaryIonName: string; kycPass: { badge: string } };
    };

    assert.equal(response.status, 200);
    assert.ok(data.listings.some((row) => row.name === "demo.ion" && row.status === "Owned"));
    assert.ok(data.listings.some((row) => row.name === "trader.ion" && row.status === "Primary"));
    assert.equal(data.identity.primaryIonName, "trader.ion");
    assert.equal(data.identity.kycPass.badge, "KYC Pass");
  });

  it("resolves valid .ion domains and rejects invalid domain names", async () => {
    const resolved = await requestJson("/api/domain/resolve?name=Demo.ION");
    const resolvedData = resolved.body.data as {
      name: string;
      available: boolean;
      resolvedAddress: string | null;
    };

    assert.equal(resolved.status, 200);
    assert.equal(resolvedData.name, "demo.ion");
    assert.equal(resolvedData.available, false);
    assert.ok(resolvedData.resolvedAddress?.startsWith("ion1"));

    const missing = await requestJson("/api/domain/resolve");
    assert.equal(missing.status, 400);
    assert.equal(missing.body.error?.code, apiErrorCodes.missingDomainName);

    const invalid = await requestJson("/api/domain/resolve?name=bad_domain");
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.error?.code, apiErrorCodes.invalidDomainName);
  });

  it("serves demo profile without raw KYC data", async () => {
    const response = await requestJson("/api/profile/demo");
    const data = response.body.data as {
      displayName: string;
      kycPass: { storesRawKyc: boolean };
      linkedDomains: string[];
      preferences: { language: string; riskWarnings: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(data.displayName, "ION DEX Demo");
    assert.equal(data.kycPass.storesRawKyc, false);
    assert.ok(data.linkedDomains.includes("demo.ion"));
    assert.equal(data.preferences.riskWarnings, true);
  });

  it("rejects invalid wallet balance addresses", async () => {
    const invalid = await requestJson("/api/wallet/bsc-balance?address=not-an-address");
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.error?.code, "ION_DEX_E_INVALID_ADDRESS");
  });

  it("serves bigint quote with slippage and fee precision", async () => {
    const response = await requestJson("/api/trade/quote?inputToken=BNB&outputToken=ION&amountIn=2.5&slippageBps=50");
    const data = response.body.data as {
      amountInUnits: string;
      estimatedOutputUnits: string;
      minimumReceivedUnits: string;
      protocolFeeUnits: string;
      slippageBps: number;
      protocolFeeBps: number;
      precision: { inputDecimals: number; outputDecimals: number; math: string };
    };

    assert.equal(response.status, 200);
    assert.equal(data.amountInUnits, "2500000000000000000");
    assert.equal(data.slippageBps, 50);
    assert.equal(data.protocolFeeBps, 25);
    assert.equal(data.precision.inputDecimals, 18);
    assert.equal(data.precision.outputDecimals, 9);
    assert.equal(data.precision.math, "bigint-floor");
    assert.ok(BigInt(data.estimatedOutputUnits) > BigInt(data.minimumReceivedUnits));
    assert.ok(BigInt(data.protocolFeeUnits) > 0n);
  });

  it("rejects unsafe quote slippage", async () => {
    const response = await requestJson("/api/trade/quote?inputToken=BNB&outputToken=ION&amountIn=2.5&slippageBps=900");

    assert.equal(response.status, 400);
    assert.equal(response.body.error?.code, apiErrorCodes.invalidQuoteRequest);
    assert.match(response.body.error?.message ?? "", /slippageBps/);
  });

  it("serves typed market surface feeds with provenance", async () => {
    const depth = await requestJson("/api/markets/depth");
    const depthData = depth.body.data as { rows: Array<{ label: string }>; provenance: { source: string } };
    assert.equal(depth.status, 200);
    assert.ok(depthData.rows.length >= 3);
    assert.equal(depthData.provenance.source, "local-seed");

    const candles = await requestJson("/api/markets/candles?symbol=BNB/ION&interval=15m&limit=48");
    const candleData = candles.body.data as {
      candles: Array<{ time: number; open: number; high: number; low: number; close: number }>;
      provenance: { model: string };
    };
    assert.equal(candles.status, 200);
    assert.ok(candleData.candles.length >= 24);
    assert.ok(candleData.candles.every((bar) => bar.high >= bar.low));

    const book = await requestJson("/api/markets/orderbook?symbol=BNB/ION");
    const bookData = book.body.data as { levels: Array<{ side: string }>; midPrice: string };
    assert.equal(book.status, 200);
    assert.ok(bookData.levels.some((level) => level.side === "ask"));
    assert.ok(bookData.levels.some((level) => level.side === "bid"));

    const stats = await requestJson("/api/markets/swap-stats?pair=BNB/ION");
    const statsData = stats.body.data as { stats: { lastPrice: string; tvlUsd: string } };
    assert.equal(stats.status, 200);
    assert.ok(statsData.stats.lastPrice.length > 0);
    assert.ok(statsData.stats.tvlUsd.startsWith("$"));
  });

  it("serves bigint quote with slippage and fee precision", async () => {
    const response = await requestJson("/api/trade/quote?inputToken=BNB&outputToken=ION&amountIn=2.5&slippageBps=50");
    const data = response.body.data as {
      amountInUnits: string;
      estimatedOutputUnits: string;
      minimumReceivedUnits: string;
      protocolFeeUnits: string;
      slippageBps: number;
      protocolFeeBps: number;
      precision: { inputDecimals: number; outputDecimals: number; math: string };
    };

    assert.equal(response.status, 200);
    assert.equal(data.amountInUnits, "2500000000000000000");
    assert.equal(data.slippageBps, 50);
    assert.equal(data.protocolFeeBps, 25);
    assert.equal(data.precision.inputDecimals, 18);
    assert.equal(data.precision.outputDecimals, 9);
    assert.equal(data.precision.math, "bigint-floor");
    assert.ok(BigInt(data.estimatedOutputUnits) > BigInt(data.minimumReceivedUnits));
    assert.ok(BigInt(data.protocolFeeUnits) > 0n);
  });

  it("rejects unsafe quote slippage", async () => {
    const response = await requestJson("/api/trade/quote?inputToken=BNB&outputToken=ION&amountIn=2.5&slippageBps=900");

    assert.equal(response.status, 400);
    assert.equal(response.body.error?.code, apiErrorCodes.invalidQuoteRequest);
    assert.match(response.body.error?.message ?? "", /slippageBps/);
  });

  it("returns typed errors for unknown routes and invalid methods", async () => {
    const notFound = await requestJson("/api/missing");
    assert.equal(notFound.status, 404);
    assert.equal(notFound.body.error?.code, apiErrorCodes.notFound);
    assert.equal(notFound.body.error?.message.includes("/api/missing"), false);

    const method = await requestJson("/api/health", { method: "POST" });
    assert.equal(method.status, 405);
    assert.equal(method.body.error?.code, apiErrorCodes.methodNotAllowed);
  });

  it("serves OPTIONS preflight with request tracing", async () => {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: "OPTIONS",
      headers: {
        "x-request-id": "test-options-request",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get("x-request-id"), "test-options-request");
    assert.equal(response.headers.get("access-control-allow-methods"), "GET, OPTIONS");
  });
});
