import type { ServerConfig } from "../config/server-config.js";
import { ION_BSC_LP_POOL } from "../constants/official-ion-addresses.js";
import { MemoryCache } from "../lib/cache.js";
import { systemClock } from "../lib/clock.js";
import { fetchBinance24hr } from "../upstream/binance.js";
import { fetchCmcMarketTickers } from "../upstream/cmc.js";
import { fetchDexScreenerIonPair } from "../upstream/dexscreener.js";
import { fetchGeckoIonOhlcv, getGeckoIonPool } from "../upstream/geckoterminal.js";
import { fetchIonIndexerSupplyHint, probeIonIndexer } from "../upstream/ion-indexer.js";
import { fetchPancakeIonPoolReserves, fetchPancakeIonWbnbPrice } from "../upstream/pancake-pool.js";
import type { MarketTicker } from "./markets.js";
import { resolveIonOracleFeed } from "./price-oracle.js";

const PRICE_CACHE_KEY = "price:ion:usd";
const BNB_CACHE_KEY = "price:bnb:usd";
const KLINES_CACHE_KEY = "klines:ion:hour";
const priceCache = new MemoryCache(systemClock);
const pricePolicy = { ttlMs: 15_000, staleTtlMs: 60_000 };

export type IonPricePayload = {
  priceUsd: number;
  change24hPct: number;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  source: string;
  note: string;
  poolAddress: string;
  updatedAt: string;
  oracleMethod?: string;
  oracleSpreadBps?: number;
  oracleUsedQuotes?: number;
  oracleUsedFeeds?: Array<{
    platformId: string;
    priceUsd: number;
    weight: number;
    liquidityUsd: number | null;
    change24hPct: number | null;
  }>;
  oracleRejectedFeeds?: Array<{
    platformId: string;
    rejectReason: "outlier" | "feed_error";
    error?: string;
    priceUsd?: number;
  }>;
};

export type OracleDiagnosticsDto = {
  oracleMethod?: string;
  oracleSpreadBps?: number;
  oracleUsedQuotes?: number;
  oracleUsedFeeds: Array<{
    platformId: string;
    priceUsd: number;
    weight: number;
    liquidityUsd: number | null;
    change24hPct: number | null;
  }>;
  oracleRejectedFeeds: Array<{
    platformId: string;
    rejectReason: "outlier" | "feed_error";
    error?: string;
    priceUsd?: number;
  }>;
};

export function toOracleDiagnosticsDto(
  payload: Pick<
    IonPricePayload,
    "oracleMethod" | "oracleSpreadBps" | "oracleUsedQuotes" | "oracleUsedFeeds" | "oracleRejectedFeeds"
  >,
): OracleDiagnosticsDto {
  return {
    oracleMethod: payload.oracleMethod,
    oracleSpreadBps: payload.oracleSpreadBps,
    oracleUsedQuotes: payload.oracleUsedQuotes,
    oracleUsedFeeds: payload.oracleUsedFeeds ?? [],
    oracleRejectedFeeds: payload.oracleRejectedFeeds ?? [],
  };
}

export type BnbPricePayload = {
  priceUsd: number;
  change24hPct: number;
  source: string;
  updatedAt: string;
};

export type IonKlineCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function tickerFromUsd(
  symbol: string,
  priceUsd: number,
  change24hPct: number,
  source: MarketTicker["provenance"]["source"],
  note: string,
): MarketTicker {
  const sign = change24hPct >= 0 ? "+" : "";
  return {
    symbol,
    priceUsd,
    displayPrice:
      priceUsd >= 1000
        ? `$${priceUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
        : priceUsd >= 1
          ? `$${priceUsd.toFixed(2)}`
          : `$${priceUsd.toFixed(4)}`,
    change24hPct,
    displayChange: `${sign}${change24hPct.toFixed(2)}%`,
    provenance: { source, note },
  };
}

async function resolveBnbUsd(config: ServerConfig): Promise<BnbPricePayload> {
  const cached = priceCache.get<BnbPricePayload>(BNB_CACHE_KEY);
  if (cached.hit && cached.entry.value) {
    return cached.entry.value;
  }
  const ticker = await fetchBinance24hr(config, "BNBUSDT");
  const payload: BnbPricePayload = {
    priceUsd: ticker.lastPrice,
    change24hPct: ticker.priceChangePercent,
    source: "binance",
    updatedAt: new Date().toISOString(),
  };
  priceCache.set(BNB_CACHE_KEY, payload, pricePolicy, systemClock);
  return payload;
}

export async function resolveIonUsdPrice(config: ServerConfig): Promise<IonPricePayload> {
  const cached = priceCache.get<IonPricePayload>(PRICE_CACHE_KEY);
  if (cached.hit && cached.entry.value) {
    return cached.entry.value;
  }
  try {
    const aggregate = await resolveIonOracleFeed(config);
    const winner: IonPricePayload = {
      priceUsd: aggregate.priceUsd,
      change24hPct: aggregate.change24hPct,
      volume24hUsd: null,
      liquidityUsd: null,
      source: "oracle-aggregated",
      note: `Trimmed-median oracle across ${aggregate.usedQuotes} feeds; rejected ${aggregate.rejected.length} outlier(s).`,
      poolAddress: aggregate.poolAddress.toLowerCase(),
      updatedAt: aggregate.updatedAt,
      oracleMethod: aggregate.method,
      oracleSpreadBps: aggregate.spreadBps,
      oracleUsedQuotes: aggregate.usedQuotes,
      oracleUsedFeeds: aggregate.quotes.map((row) => ({
        platformId: row.platformId,
        priceUsd: row.priceUsd,
        weight: row.weight,
        liquidityUsd: row.liquidityUsd,
        change24hPct: row.change24hPct,
      })),
      oracleRejectedFeeds: aggregate.rejected.map((row) => ({
        platformId: row.platformId,
        rejectReason: row.rejectReason,
        error: row.error,
        priceUsd: row.priceUsd > 0 ? row.priceUsd : undefined,
      })),
    };
    priceCache.set(PRICE_CACHE_KEY, winner, pricePolicy, systemClock);
    return winner;
  } catch (error) {
    return {
      priceUsd: 0,
      change24hPct: 0,
      volume24hUsd: null,
      liquidityUsd: null,
      source: "unavailable",
      note: `ION oracle unavailable: ${error instanceof Error ? error.message : String(error)}`,
      poolAddress: ION_BSC_LP_POOL.toLowerCase(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function getIonPriceApiPayload(config: ServerConfig): Promise<IonPricePayload> {
  return resolveIonUsdPrice(config);
}

export async function getBnbPriceApiPayload(config: ServerConfig): Promise<BnbPricePayload> {
  return resolveBnbUsd(config);
}

export async function getIonKlinesPayload(
  config: ServerConfig,
  limit: number,
): Promise<{ timeframe: string; candles: IonKlineCandle[]; source: string }> {
  const cacheKey = `${KLINES_CACHE_KEY}:${limit}`;
  const cached = priceCache.get<{ timeframe: string; candles: IonKlineCandle[]; source: string }>(
    cacheKey,
  );
  if (cached.hit && cached.entry.value) {
    return cached.entry.value;
  }

  try {
    const rows = await fetchGeckoIonOhlcv(config.httpTimeoutMs, "hour", limit);
    const candles: IonKlineCandle[] = rows
      .map((row) => ({
        time: row.timestamp,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
      }))
      .sort((a, b) => a.time - b.time);
    const payload = { timeframe: "1h", candles, source: "geckoterminal" };
    priceCache.set(cacheKey, payload, pricePolicy, systemClock);
    return payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { timeframe: "1h", candles: [], source: `error:${message}` };
  }
}

export async function getIonMarketPayload(config: ServerConfig) {
  const [ion, dex, indexer] = await Promise.all([
    resolveIonUsdPrice(config),
    fetchDexScreenerIonPair(config).catch(() => null),
    probeIonIndexer(config),
  ]);
  const sources = [ion.source];
  if (dex) {
    sources.push("dexscreener");
  }
  return {
    priceUsd: ion.priceUsd,
    change24hPct: ion.change24hPct,
    volume24hUsd: dex?.volume24hUsd ?? ion.volume24hUsd,
    liquidityUsd: dex?.liquidityUsd ?? ion.liquidityUsd,
    fdvUsd: dex?.fdvUsd ?? null,
    sources: [...new Set(sources)],
    poolAddress: ion.poolAddress,
    indexerNote: indexer.note,
    ...toOracleDiagnosticsDto(ion),
  };
}

export async function getIonPoolPayload(config: ServerConfig) {
  const [reserves, ion] = await Promise.all([
    fetchPancakeIonPoolReserves(config).catch(() => null),
    resolveIonUsdPrice(config),
  ]);
  let reserveInUsd: number | null = null;
  if (reserves) {
    try {
      const bnb = await resolveBnbUsd(config);
      const quoteBnb = Number(reserves.quoteReserve) / 1e18;
      const ionTokens = Number(reserves.ionReserve) / 1e18;
      reserveInUsd = quoteBnb * bnb.priceUsd * 2 + ionTokens * ion.priceUsd;
    } catch {
      reserveInUsd = null;
    }
  }
  return {
    poolAddress: ION_BSC_LP_POOL.toLowerCase(),
    reserveInUsd,
    volume24hUsd: ion.volume24hUsd,
    priceUsd: ion.priceUsd,
    source: ion.source,
    token0: reserves?.token0 ?? null,
    token1: reserves?.token1 ?? null,
  };
}

export async function getIndexerStatusPayload(config: ServerConfig) {
  const [status, supply] = await Promise.all([
    probeIonIndexer(config),
    fetchIonIndexerSupplyHint(config),
  ]);
  return { ...status, supply };
}

export async function buildLiveMarketTickers(config: ServerConfig): Promise<MarketTicker[]> {
  const [ion, bnb] = await Promise.all([
    resolveIonUsdPrice(config),
    resolveBnbUsd(config),
  ]);

  const tickers: MarketTicker[] = [
    tickerFromUsd("ION", ion.priceUsd, ion.change24hPct, "aggregated", ion.note),
    tickerFromUsd("BNB", bnb.priceUsd, bnb.change24hPct, "binance", "Binance BNB/USDT 24h ticker."),
  ];

  const binanceSymbols: Array<{ symbol: string; pair: string }> = [
    { symbol: "BTC", pair: "BTCUSDT" },
    { symbol: "ETH", pair: "ETHUSDT" },
    { symbol: "SOL", pair: "SOLUSDT" },
  ];

  await Promise.all(
    binanceSymbols.map(async ({ symbol, pair }) => {
      try {
        const row = await fetchBinance24hr(config, pair);
        tickers.push(
          tickerFromUsd(symbol, row.lastPrice, row.priceChangePercent, "binance", `Binance ${pair} 24h.`),
        );
      } catch {
        /* skip */
      }
    }),
  );

  if (config.cmcApiKey) {
    try {
      const cmcRows = await fetchCmcMarketTickers(config);
      for (const row of cmcRows) {
        if (row.symbol === "ION" || row.symbol === "BNB") {
          continue;
        }
        const existing = tickers.find((t) => t.symbol === row.symbol);
        if (!existing) {
          tickers.push({
            ...row,
            provenance: { source: "cmc", note: row.provenance.note },
          });
        }
      }
    } catch {
      /* optional */
    }
  }

  tickers.push(
    tickerFromUsd("USDT", 1, 0.01, "binance", "USDT/USD peg via Binance stable reference."),
  );

  return tickers;
}
