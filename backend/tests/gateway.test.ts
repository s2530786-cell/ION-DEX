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

  it("serves profile session and domain showcase", async () => {
    const session = await requestJson(
      "/api/profile/session?provider=metamask&address=0x1111111111111111111111111111111111111111&chainId=56",
    );
    assert.equal(session.status, 200);
    assert.ok(session.body.data && typeof session.body.data === "object");
    const sessionData = session.body.data as { wallets?: { primaryKey?: string } };
    assert.equal(sessionData.wallets?.primaryKey, "metamask");

    const showcase = await requestJson("/api/domain/showcase");
    assert.equal(showcase.status, 200);
    assert.ok(showcase.body.data && typeof showcase.body.data === "object");
    const showcaseData = showcase.body.data as { listings?: unknown[] };
    assert.ok(Array.isArray(showcaseData.listings));
    assert.ok(showcaseData.listings.length > 0);
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
      supportedWallets: Array<{ key: string }>;
      provenance: { source: string; status: string };
    };

    assert.equal(response.status, 200);
    assert.equal(data.appName, "ION DEX");
    assert.equal(data.featureFlags.backendGateway, true);
    assert.equal(data.featureFlags.realWalletAdapters, true);
    assert.ok(data.supportedWallets.some((wallet) => wallet.key === "walletconnect"));
    assert.deepEqual(data.provenance, {
      source: "mock",
      status: "mocked",
      note: "Public configuration is local Phase 3 mock data until official chain IDs and adapters are confirmed.",
    });
  });

  it("serves token metadata", async () => {
    const response = await requestJson("/api/tokens");
    const data = response.body.data as Array<{
      symbol: string;
      decimals: number;
      status: string;
      address: string;
      provenance: { source: string };
    }>;

    assert.equal(response.status, 200);
    assert.ok(data.some((token) => token.symbol === "ION" && token.decimals === 9));
    assert.ok(data.some((token) => token.symbol === "BNB"));
    const usdt = data.find((token) => token.symbol === "USDT");
    assert.ok(usdt);
    assert.equal(usdt!.status, "online");
    assert.equal(usdt!.provenance.source, "upstream");
    assert.match(usdt!.address, /^0x[a-fA-F0-9]{40}$/);
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
    assert.equal(response.body.meta.source, "mock");
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

    assert.equal(first.body.meta.source, "mock");
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
    assert.equal(response.body.meta.source, "mock");
    assert.equal(response.body.meta.adapter, "burn");
    assert.ok(Number(data.totalBurnedIon) > 0);
    assert.equal(data.bscBurnAddress, "0x000000000000000000000000000000000000dEaD");
    assert.ok(data.provenance.some((entry) => entry.source === "mock" && entry.status === "mocked"));
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
    assert.ok(data.apr.dexPct > 0);
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

  it("serves market ion payload with oracle diagnostics", async () => {
    const response = await requestJson("/api/market/ion");
    const data = response.body.data as {
      priceUsd: number;
      oracleMethod?: string;
      oracleSpreadBps?: number;
      oracleUsedQuotes?: number;
      oracleUsedFeeds?: Array<{ platformId: string; weight: number; priceUsd: number }>;
      oracleRejectedFeeds?: Array<{ platformId: string; rejectReason: string }>;
    };

    assert.equal(response.status, 200);
    assert.ok(data.priceUsd >= 0);
    assert.equal(typeof data.oracleMethod, "string");
    assert.equal(typeof data.oracleSpreadBps, "number");
    assert.equal(typeof data.oracleUsedQuotes, "number");
    assert.ok(Array.isArray(data.oracleUsedFeeds));
    assert.ok(Array.isArray(data.oracleRejectedFeeds));
    assert.ok((data.oracleUsedFeeds?.length ?? 0) >= 1);
    assert.ok(typeof data.oracleUsedFeeds?.[0]?.platformId === "string");
  });

  it("keeps oracle diagnostics contract aligned between price and market endpoints", async () => {
    const [priceResponse, marketResponse] = await Promise.all([
      requestJson("/api/price/ion"),
      requestJson("/api/market/ion"),
    ]);

    assert.equal(priceResponse.status, 200);
    assert.equal(marketResponse.status, 200);
    assert.ok(priceResponse.body.data && typeof priceResponse.body.data === "object");
    assert.ok(marketResponse.body.data && typeof marketResponse.body.data === "object");

    const priceData = priceResponse.body.data as Record<string, unknown>;
    const marketData = marketResponse.body.data as Record<string, unknown>;
    const oracleDiagnosticKeys = [
      "oracleMethod",
      "oracleSpreadBps",
      "oracleUsedQuotes",
      "oracleUsedFeeds",
      "oracleRejectedFeeds",
    ] as const;

    assert.deepEqual(
      Object.fromEntries(oracleDiagnosticKeys.map((key) => [key, key in priceData])),
      Object.fromEntries(oracleDiagnosticKeys.map((key) => [key, true])),
      "price endpoint missing oracle diagnostics field(s)",
    );
    assert.deepEqual(
      Object.fromEntries(oracleDiagnosticKeys.map((key) => [key, key in marketData])),
      Object.fromEntries(oracleDiagnosticKeys.map((key) => [key, true])),
      "market endpoint missing oracle diagnostics field(s)",
    );

    assert.equal(typeof priceData.oracleMethod, typeof marketData.oracleMethod);
    assert.equal(typeof priceData.oracleSpreadBps, typeof marketData.oracleSpreadBps);
    assert.equal(typeof priceData.oracleUsedQuotes, typeof marketData.oracleUsedQuotes);
    assert.equal(Array.isArray(priceData.oracleUsedFeeds), true);
    assert.equal(Array.isArray(marketData.oracleUsedFeeds), true);
    assert.equal(Array.isArray(priceData.oracleRejectedFeeds), true);
    assert.equal(Array.isArray(marketData.oracleRejectedFeeds), true);
  });

  it("locks oracle diagnostics key snapshot for price and market endpoints", async () => {
    const [priceResponse, marketResponse] = await Promise.all([
      requestJson("/api/price/ion"),
      requestJson("/api/market/ion"),
    ]);

    assert.equal(priceResponse.status, 200);
    assert.equal(marketResponse.status, 200);
    assert.ok(priceResponse.body.data && typeof priceResponse.body.data === "object");
    assert.ok(marketResponse.body.data && typeof marketResponse.body.data === "object");

    const expectedOracleKeys = [
      "oracleMethod",
      "oracleSpreadBps",
      "oracleUsedQuotes",
      "oracleUsedFeeds",
      "oracleRejectedFeeds",
    ] as const;

    const pickOracleKeys = (payload: Record<string, unknown>) =>
      Object.keys(payload)
        .filter((key) => key.startsWith("oracle"))
        .sort();
    const expected = [...expectedOracleKeys].sort() as string[];
    const checkSnapshot = (endpointName: string, payload: Record<string, unknown>) => {
      const actual = pickOracleKeys(payload);
      const missing = expected.filter((key) => !actual.includes(key));
      const extra = actual.filter((key) => !expected.includes(key));
      assert.deepEqual(
        { missing, extra },
        { missing: [], extra: [] },
        `${endpointName} oracle diagnostics snapshot drifted`,
      );
    };

    checkSnapshot("price", priceResponse.body.data as Record<string, unknown>);
    checkSnapshot("market", marketResponse.body.data as Record<string, unknown>);
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
      provenance: { source: string; priceModel: string; priceImpactModel?: string };
    };

    assert.equal(response.status, 200);
    assert.equal(data.amountInUnits, "2500000000000000000");
    assert.equal(data.slippageBps, 50);
    assert.equal(data.protocolFeeBps, 25);
    assert.equal(data.precision.inputDecimals, 18);
    assert.equal(data.precision.outputDecimals, 9);
    assert.equal(data.precision.math, "bigint-floor");
    assert.equal(data.provenance.source, "test-mock");
    assert.match(data.provenance.priceModel, /test-mock/i);
    assert.match(data.provenance.priceImpactModel ?? "", /size-tier estimate/i);
    assert.ok(BigInt(data.estimatedOutputUnits) > BigInt(data.minimumReceivedUnits));
    assert.ok(BigInt(data.protocolFeeUnits) > 0n);
  });

  it("rejects unsafe quote slippage", async () => {
    const response = await requestJson("/api/trade/quote?inputToken=BNB&outputToken=ION&amountIn=2.5&slippageBps=900");

    assert.equal(response.status, 400);
    assert.equal(response.body.error?.code, "invalid_quote_request");
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
    assert.equal(response.headers.get("access-control-allow-methods"), "GET, POST, OPTIONS");
  });
});
