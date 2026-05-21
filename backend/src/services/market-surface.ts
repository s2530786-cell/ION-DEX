import { getMarketTickers, type MarketTicker } from "./markets.js";

export type MarketProvenance = {
  source: "local-seed";
  model: string;
  symbol: string;
  note: string;
};

export type MarketCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type MarketCandlesPayload = {
  symbol: string;
  interval: string;
  candles: MarketCandle[];
  provenance: MarketProvenance;
};

export type MarketDepthRow = {
  label: string;
  price: string;
  change: string;
  tone: "positive" | "negative" | "neutral";
};

export type MarketDepthPayload = {
  rows: MarketDepthRow[];
  provenance: MarketProvenance;
};

export type OrderBookLevel = {
  price: string;
  amount: string;
  depth: string;
  side: "ask" | "bid";
};

export type MarketOrderBookPayload = {
  symbol: string;
  midPrice: string;
  levels: OrderBookLevel[];
  provenance: MarketProvenance;
};

export type SwapMarketStats = {
  tvlUsd: string;
  tvlChangePct: string;
  priceImpactBps: number;
  priceImpactLabel: string;
  routeHealth: "liquid" | "thin" | "stressed";
  lastPrice: string;
  volume24h: string;
  spreadPct: string;
  ionFeePct: string;
};

export type SwapMarketStatsPayload = {
  pair: string;
  stats: SwapMarketStats;
  provenance: MarketProvenance;
};

function hashSeed(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pseudoRandom(seed: number, step: number): number {
  const mixed = (seed ^ (step * 2654435761)) >>> 0;
  return (mixed % 10_000) / 10_000;
}

function findTicker(symbol: string): MarketTicker | undefined {
  const normalized = symbol.toUpperCase().replace(/\s+/g, "");
  const base = normalized.split("/")[0]?.replace("BNB", "BNB") ?? "ION";
  return getMarketTickers().find((ticker) => ticker.symbol.toUpperCase() === base);
}

function midPriceForSymbol(symbol: string): number {
  const upper = symbol.toUpperCase();
  if (upper.includes("BNB") && upper.includes("ION")) {
    const ion = findTicker("ION");
    const bnb = findTicker("BNB");
    if (ion && bnb && bnb.priceUsd > 0) {
      return ion.priceUsd / bnb.priceUsd;
    }
    return 106.68;
  }
  const ion = findTicker("ION");
  return ion?.priceUsd ?? 6.02;
}

export function getMarketCandles(symbol: string, interval: string, limit: number): MarketCandlesPayload {
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 120, 24), 240);
  const mid = midPriceForSymbol(symbol);
  const seed = hashSeed(`${symbol}:${interval}`);
  const stepSeconds = interval === "1h" ? 3600 : interval === "4h" ? 14_400 : 900;
  const now = Math.floor(Date.now() / 1000);
  const alignedNow = now - (now % stepSeconds);

  const candles: MarketCandle[] = [];
  let previousClose = mid * (0.992 + pseudoRandom(seed, 0) * 0.016);

  for (let index = safeLimit - 1; index >= 0; index -= 1) {
    const time = alignedNow - index * stepSeconds;
    const drift = (pseudoRandom(seed, index + 1) - 0.5) * mid * 0.018;
    const open = previousClose;
    const close = Math.max(0.0001, open + drift);
    const wick = mid * (0.004 + pseudoRandom(seed, index + 50) * 0.01);
    const high = Math.max(open, close) + wick * pseudoRandom(seed, index + 90);
    const low = Math.min(open, close) - wick * pseudoRandom(seed, index + 120);
    candles.push({
      time,
      open: Number(open.toFixed(6)),
      high: Number(high.toFixed(6)),
      low: Number(Math.max(0.0001, low).toFixed(6)),
      close: Number(close.toFixed(6)),
    });
    previousClose = close;
  }

  return {
    symbol,
    interval,
    candles,
    provenance: {
      source: "local-seed",
      model: "ticker-anchored-synthetic-ohlc",
      symbol,
      note: "OHLC derived from gateway ticker seed until CMC/indexer candle feed is wired.",
    },
  };
}

export function getMarketDepthRows(): MarketDepthPayload {
  const tickers = getMarketTickers();
  const ion = tickers.find((t) => t.symbol === "ION");
  const bnb = tickers.find((t) => t.symbol === "BNB");
  const btc = tickers.find((t) => t.symbol === "BTC");

  const rows: MarketDepthRow[] = [
    {
      label: "ION/USDT",
      price: ion ? ion.displayPrice.replace("$", "") : "6.024",
      change: ion?.displayChange ?? "+8.42%",
      tone: (ion?.change24hPct ?? 0) >= 0 ? "positive" : "negative",
    },
    {
      label: "BNB/ION",
      price:
        ion && bnb && bnb.priceUsd > 0 ? (ion.priceUsd / bnb.priceUsd).toFixed(2) : "106.68",
      change: bnb?.displayChange ?? "+1.18%",
      tone: (bnb?.change24hPct ?? 0) >= 0 ? "positive" : "neutral",
    },
    {
      label: "ION/BTC",
      price:
        ion && btc && btc.priceUsd > 0
          ? (ion.priceUsd / btc.priceUsd).toFixed(7)
          : "0.0000582",
      change: btc?.displayChange ?? "-0.38%",
      tone: (btc?.change24hPct ?? 0) < 0 ? "negative" : "neutral",
    },
  ];

  return {
    rows,
    provenance: {
      source: "local-seed",
      model: "gateway-ticker-derived-pairs",
      symbol: "multi",
      note: "Pair tiles computed from /api/markets/tickers seed.",
    },
  };
}

export function getMarketOrderBook(symbol: string): MarketOrderBookPayload {
  const mid = midPriceForSymbol(symbol);
  const seed = hashSeed(symbol);
  const levels: OrderBookLevel[] = [];

  for (let index = 0; index < 3; index += 1) {
    const offset = 0.012 + index * 0.006 + pseudoRandom(seed, index) * 0.004;
    const price = mid * (1 + offset);
    levels.push({
      price: price.toFixed(3),
      amount: `${Math.round(9_000 + pseudoRandom(seed, index + 10) * 12_000).toLocaleString("en-US")}`,
      depth: `${Math.round(38 + pseudoRandom(seed, index + 20) * 40)}%`,
      side: "ask",
    });
  }

  for (let index = 0; index < 3; index += 1) {
    const offset = 0.012 + index * 0.006 + pseudoRandom(seed, index + 30) * 0.004;
    const price = mid * (1 - offset);
    levels.push({
      price: price.toFixed(3),
      amount: `${Math.round(9_000 + pseudoRandom(seed, index + 40) * 12_000).toLocaleString("en-US")}`,
      depth: `${Math.round(38 + pseudoRandom(seed, index + 50) * 40)}%`,
      side: "bid",
    });
  }

  return {
    symbol,
    midPrice: mid.toFixed(3),
    levels,
    provenance: {
      source: "local-seed",
      model: "mid-anchored-synthetic-book",
      symbol,
      note: "Order book levels anchored to ticker mid until live depth feed is connected.",
    },
  };
}

export function getSwapMarketStats(pair: string): SwapMarketStatsPayload {
  const mid = midPriceForSymbol(pair);
  const seed = hashSeed(pair);
  const tvlBase = 1_100_000 + Math.round(pseudoRandom(seed, 1) * 350_000);

  return {
    pair,
    stats: {
      tvlUsd: `$${tvlBase.toLocaleString("en-US")}`,
      tvlChangePct: `+${(8 + pseudoRandom(seed, 2) * 6).toFixed(1)}% weekly depth`,
      priceImpactBps: Math.round(18 + pseudoRandom(seed, 3) * 14),
      priceImpactLabel: `${(0.18 + pseudoRandom(seed, 4) * 0.12).toFixed(2)}%`,
      routeHealth: mid > 0 ? "liquid" : "stressed",
      lastPrice: mid.toFixed(3),
      volume24h: `${(16 + pseudoRandom(seed, 5) * 6).toFixed(2)}M ION`,
      spreadPct: `${(0.02 + pseudoRandom(seed, 6) * 0.05).toFixed(2)}%`,
      ionFeePct: "0.25%",
    },
    provenance: {
      source: "local-seed",
      model: "pair-liquidity-estimate",
      symbol: pair,
      note: "Swap desk stats derived from ticker seed; replace with pool indexer TVL when available.",
    },
  };
}
