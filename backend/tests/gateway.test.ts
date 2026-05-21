import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
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
  };
};

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
    assert.deepEqual((response.body.data as { status: string }).status, "ok");
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
    };

    assert.equal(response.status, 200);
    assert.equal(data.appName, "ION DEX");
    assert.equal(data.featureFlags.backendGateway, true);
    assert.equal(data.featureFlags.realWalletAdapters, true);
    assert.ok(data.supportedWallets.some((wallet) => wallet.key === "walletconnect"));
    assert.ok(data.supportedWallets.some((wallet) => wallet.key === "metamask" && wallet.category === "evm"));
    assert.equal(data.supportedWallets.length, 10);
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
    const data = response.body.data as Array<{ symbol: string; decimals: number }>;

    assert.equal(response.status, 200);
    assert.ok(data.some((token) => token.symbol === "ION" && token.decimals === 9));
    assert.ok(data.some((token) => token.symbol === "BNB"));
  });

  it("serves market tickers for the frontend ticker strip", async () => {
    const response = await requestJson("/api/markets/tickers");
    const data = response.body.data as Array<{ symbol: string; displayPrice: string; displayChange: string }>;

    assert.equal(response.status, 200);
    assert.ok(data.length >= 4);
    assert.ok(data.every((ticker) => ticker.displayPrice.startsWith("$")));
    assert.ok(data.some((ticker) => ticker.symbol === "ION" && ticker.displayChange.startsWith("+")));
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
    assert.equal(response.body.error?.code, "invalid_quote_request");
    assert.match(response.body.error?.message ?? "", /slippageBps/);
  });

  it("returns typed errors for unknown routes and invalid methods", async () => {
    const notFound = await requestJson("/api/missing");
    assert.equal(notFound.status, 404);
    assert.equal(notFound.body.error?.code, "not_found");

    const method = await requestJson("/api/health", { method: "POST" });
    assert.equal(method.status, 405);
    assert.equal(method.body.error?.code, "method_not_allowed");
  });
});
