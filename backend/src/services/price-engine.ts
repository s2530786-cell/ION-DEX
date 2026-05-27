import type { ServerConfig } from "../config/server-config.js";
import { ION_BSC_LP_POOL } from "../constants/official-ion-addresses.js";
import { MemoryCache } from "../lib/cache.js";
import { systemClock } from "../lib/clock.js";
import { fetchBinance24hr } from "../upstream/binance.js";
import { fetchCmcMarketTickers } from "../upstream/cmc.js";
import { fetchDexScreenerIonPair } from "../upstream/dexscreener.js";
import { fetchGeckoIonOhlcv, getGeckoIonPool } from "../upstream/geckoterminal.js";
import { fetchIonIndexerSupplyHint, probeIonIndexer } from "../upstream/ion-indexer.js";
import { fetchPancakeIonPerBnb, fetchPancakeIonPoolReserves } from "../upstream/pancake-pool.js";
import type { MarketTicker } from "./markets.js";

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
};

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

async function resolvePancakeIonUsd(config: ServerConfig): Promise<IonPricePayload | null> {
  try {
    const [bnb, ionPerBnb] = await Promise.all([
      resolveBnbUsd(config),
      fetchPancakeIonPerBnb(config),
    ]);
    const priceUsd = ionPerBnb * bnb.priceUsd;
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
      return null;
    }
    let change24hPct = 0;
    try {
      const gecko = await getGeckoIonPool(config.httpTimeoutMs);
      change24hPct = Number(gecko.attributes.price_change_percentage.h24) || 0;
    } catch {
      /* optional */
    }
    return {
      priceUsd,
      change24hPct,
      volume24hUsd: null,
      liquidityUsd: null,
      source: "pancake+binance",
      note: "ION/WBNB reserves on official LP × Binance BNB/USDT.",
      poolAddress: ION_BSC_LP_POOL.toLowerCase(),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function resolveGeckoIonUsd(config: ServerConfig): Promise<IonPricePayload | null> {
  try {
    const pool = await getGeckoIonPool(config.httpTimeoutMs);
    const priceUsd = Number.parseFloat(pool.attributes.base_token_price_usd);
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
      return null;
    }
    return {
      priceUsd,
      change24hPct: Number(pool.attributes.price_change_percentage.h24) || 0,
      volume24hUsd: Number(pool.attributes.volume_usd.h24) || null,
      liquidityUsd: Number(pool.attributes.reserve_in_usd) || null,
      source: "geckoterminal",
      note: "GeckoTerminal ION/BNB pool USD quote.",
      poolAddress: ION_BSC_LP_POOL.toLowerCase(),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function resolveDexIonUsd(config: ServerConfig): Promise<IonPricePayload | null> {
  try {
    const snap = await fetchDexScreenerIonPair(config);
    return {
      priceUsd: snap.priceUsd,
      change24hPct: snap.change24hPct,
      volume24hUsd: snap.volume24hUsd,
      liquidityUsd: snap.liquidityUsd,
      source: "dexscreener",
      note: "DexScreener ION pair on BSC.",
      poolAddress: snap.pairAddress,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function resolveCmcIonUsd(config: ServerConfig): Promise<IonPricePayload | null> {
  if (!config.cmcApiKey) {
    return null;
  }
  try {
    const tickers = await fetchCmcMarketTickers(config);
    const ion = tickers.find((t) => t.symbol === "ION");
    if (!ion) {
      return null;
    }
    return {
      priceUsd: ion.priceUsd,
      change24hPct: ion.change24hPct,
      volume24hUsd: null,
      liquidityUsd: null,
      source: "coinmarketcap",
      note: ion.provenance.note,
      poolAddress: ION_BSC_LP_POOL.toLowerCase(),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function resolveIonUsdPrice(config: ServerConfig): Promise<IonPricePayload> {
  const cached = priceCache.get<IonPricePayload>(PRICE_CACHE_KEY);
  if (cached.hit && cached.entry.value) {
    return cached.entry.value;
  }

  const candidates = await Promise.all([
    resolvePancakeIonUsd(config),
    resolveGeckoIonUsd(config),
    resolveDexIonUsd(config),
    resolveCmcIonUsd(config),
  ]);

  const winner =
    candidates.find((row) => row !== null) ??
    ({
      priceUsd: 0,
      change24hPct: 0,
      volume24hUsd: null,
      liquidityUsd: null,
      source: "unavailable",
      note: "All ION price engines failed; check RPC and outbound network.",
      poolAddress: ION_BSC_LP_POOL.toLowerCase(),
      updatedAt: new Date().toISOString(),
    } satisfies IonPricePayload);

  if (winner.priceUsd > 0) {
    priceCache.set(PRICE_CACHE_KEY, winner, pricePolicy, systemClock);
  }
  return winner;
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
    const candles: IonKlineCandle[] = rows.map((row) => ({
      time: row.timestamp,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    }));
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
