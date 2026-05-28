import type { ServerConfig } from "../config/server-config.js";
import { BSC_ION_TOKEN, ION_BSC_LP_POOL } from "../constants/official-ion-addresses.js";
import { fetchCmcMarketTickers } from "../upstream/cmc.js";
import { fetchDexScreenerIonPair } from "../upstream/dexscreener.js";
import { getGeckoIonPool } from "../upstream/geckoterminal.js";
import { fetchPancakeIonWbnbPrice } from "../upstream/pancake-pool.js";
import { fetchBinance24hr } from "../upstream/binance.js";

/** Master 设计：20+ DEX/行情聚合平台登记；已接 feed 的标 active，其余为扩展位。 */
export const ION_DEX_ORACLE_PLATFORM_REGISTRY = [
  { id: "pancakeswap", label: "PancakeSwap (BSC on-chain LP)", status: "active" as const },
  { id: "geckoterminal", label: "GeckoTerminal pool API", status: "active" as const },
  { id: "dexscreener", label: "DexScreener pair API", status: "active" as const },
  { id: "coinmarketcap", label: "CoinMarketCap Pro quotes", status: "active" as const },
  { id: "binance", label: "Binance BNB/USDT (quote leg only)", status: "active" as const },
  { id: "okx-web3", label: "OKX Web3 token page (audit scrape only)", status: "audit" as const },
  { id: "1inch", label: "1inch spot / limit liquidity", status: "planned" as const },
  { id: "paraswap", label: "ParaSwap aggregator", status: "planned" as const },
  { id: "openocean", label: "OpenOcean", status: "planned" as const },
  { id: "kyberswap", label: "KyberSwap", status: "planned" as const },
  { id: "odos", label: "Odos", status: "planned" as const },
  { id: "cowswap", label: "CoW Swap", status: "planned" as const },
  { id: "0x", label: "0x API", status: "planned" as const },
  { id: "matcha", label: "Matcha (0x UI)", status: "planned" as const },
  { id: "uniswap", label: "Uniswap (cross-chain ref)", status: "planned" as const },
  { id: "sushiswap", label: "SushiSwap", status: "planned" as const },
  { id: "biswap", label: "Biswap", status: "planned" as const },
  { id: "thena", label: "Thena", status: "planned" as const },
  { id: "apeswap", label: "ApeSwap", status: "planned" as const },
  { id: "babyswap", label: "BabySwap", status: "planned" as const },
  { id: "mdex", label: "MDEX", status: "planned" as const },
  { id: "dodo", label: "DODO", status: "planned" as const },
  { id: "woofi", label: "WOOFi", status: "planned" as const },
  { id: "liquidmesh", label: "LiquidMesh / routing mesh", status: "planned" as const },
] as const;

export type OracleQuote = {
  platformId: string;
  priceUsd: number;
  change24hPct: number | null;
  liquidityUsd: number | null;
  weight: number;
  ok: boolean;
  error?: string;
  note?: string;
};

export type OracleAggregateResult = {
  priceUsd: number;
  change24hPct: number;
  method: "weighted-median";
  quorum: number;
  usedQuotes: number;
  maxDeviationBps: number;
  spreadBps: number;
  quotes: OracleQuote[];
  rejected: Array<
    OracleQuote & {
      rejectReason: "outlier" | "feed_error";
    }
  >;
  tokenContract: string;
  poolAddress: string;
  updatedAt: string;
};

export type OracleAggregateOptions = {
  minQuorum?: number;
  maxDeviationBps?: number;
};

const DEFAULT_MIN_QUORUM = 2;
const DEFAULT_MAX_DEVIATION_BPS = 2_500;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function weightedMedian(quotes: Pick<OracleQuote, "priceUsd" | "weight">[]): number {
  if (quotes.length === 0) return 0;
  const sorted = [...quotes].sort((a, b) => a.priceUsd - b.priceUsd);
  const totalWeight = sorted.reduce((sum, q) => sum + Math.max(0.0001, q.weight), 0);
  let seen = 0;
  for (const q of sorted) {
    seen += Math.max(0.0001, q.weight);
    if (seen >= totalWeight / 2) {
      return q.priceUsd;
    }
  }
  return sorted[sorted.length - 1]!.priceUsd;
}

function bpsBetween(a: number, b: number): number {
  if (a <= 0 || b <= 0) return Number.POSITIVE_INFINITY;
  return (Math.abs(a - b) / b) * 10_000;
}

/**
 * 抗操纵聚合：中位数 → 剔除偏离中位数超过阈值的报价 → 对剩余做 trimmed median。
 */
export function aggregateOracleQuotes(
  rawQuotes: OracleQuote[],
  options: OracleAggregateOptions = {},
): OracleAggregateResult {
  const minQuorum = options.minQuorum ?? DEFAULT_MIN_QUORUM;
  const maxDeviationBps = options.maxDeviationBps ?? DEFAULT_MAX_DEVIATION_BPS;
  const okQuotes = rawQuotes.filter((q) => q.ok && Number.isFinite(q.priceUsd) && q.priceUsd > 0);
  const failedQuotes = rawQuotes.filter((q) => !q.ok);

  if (okQuotes.length < minQuorum) {
    throw new Error(
      `Oracle quorum not met: need ${minQuorum} feeds, got ${okQuotes.length}.`,
    );
  }

  const prices = okQuotes.map((q) => q.priceUsd);
  const center = median(prices);
  const within = okQuotes.filter((q) => bpsBetween(q.priceUsd, center) <= maxDeviationBps);
  const outliers = okQuotes
    .filter((q) => !within.includes(q))
    .map((q) => ({ ...q, rejectReason: "outlier" as const }));
  const feedErrors = failedQuotes.map((q) => ({ ...q, rejectReason: "feed_error" as const }));

  if (within.length < minQuorum) {
    throw new Error(
      `Oracle deviation filter left ${within.length} feeds (max ${maxDeviationBps} bps from median).`,
    );
  }

  const finalPrice = weightedMedian(within.map((q) => ({ priceUsd: q.priceUsd, weight: q.weight })));
  const minP = Math.min(...within.map((q) => q.priceUsd));
  const maxP = Math.max(...within.map((q) => q.priceUsd));
  const spreadBps = bpsBetween(maxP, minP);

  const changeSamples = within
    .map((q) => q.change24hPct)
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const change24hPct = changeSamples.length > 0 ? median(changeSamples) : 0;

  return {
    priceUsd: finalPrice,
    change24hPct,
    method: "weighted-median",
    quorum: minQuorum,
    usedQuotes: within.length,
    maxDeviationBps,
    spreadBps,
    quotes: within,
    rejected: [...outliers, ...feedErrors],
    tokenContract: BSC_ION_TOKEN,
    poolAddress: ION_BSC_LP_POOL,
    updatedAt: new Date().toISOString(),
  };
}

async function quotePancakeOnchain(config: ServerConfig): Promise<OracleQuote> {
  try {
    const [bnb, wbnbPerIon] = await Promise.all([
      fetchBinance24hr(config, "BNBUSDT"),
      fetchPancakeIonWbnbPrice(config),
    ]);
    const priceUsd = wbnbPerIon * bnb.lastPrice;
    return {
      platformId: "pancakeswap",
      priceUsd,
      change24hPct: null,
      liquidityUsd: null,
      weight: 1.2,
      ok: Number.isFinite(priceUsd) && priceUsd > 0,
      note: "Official ION/WBNB LP on-chain × Binance BNB/USDT.",
    };
  } catch (err) {
    return {
      platformId: "pancakeswap",
      priceUsd: 0,
      change24hPct: null,
      liquidityUsd: null,
      weight: 1.2,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function quoteGeckoTerminal(config: ServerConfig): Promise<OracleQuote> {
  try {
    const pool = await getGeckoIonPool(config.httpTimeoutMs);
    const priceUsd = Number.parseFloat(pool.attributes.base_token_price_usd);
    const liquidityUsd = Number(pool.attributes.reserve_in_usd) || null;
    return {
      platformId: "geckoterminal",
      priceUsd,
      change24hPct: Number(pool.attributes.price_change_percentage.h24) || 0,
      liquidityUsd,
      weight: liquidityUsd ? Math.min(2, 1 + liquidityUsd / 100_000) : 1,
      ok: Number.isFinite(priceUsd) && priceUsd > 0,
      note: "GeckoTerminal official pool USD quote.",
    };
  } catch (err) {
    return {
      platformId: "geckoterminal",
      priceUsd: 0,
      change24hPct: null,
      liquidityUsd: null,
      weight: 1,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function quoteDexScreener(config: ServerConfig): Promise<OracleQuote> {
  try {
    const snap = await fetchDexScreenerIonPair(config);
    return {
      platformId: "dexscreener",
      priceUsd: snap.priceUsd,
      change24hPct: snap.change24hPct,
      liquidityUsd: snap.liquidityUsd,
      weight: snap.liquidityUsd ? Math.min(2, 1 + snap.liquidityUsd / 100_000) : 1,
      ok: true,
      note: "DexScreener ION pair on BSC.",
    };
  } catch (err) {
    return {
      platformId: "dexscreener",
      priceUsd: 0,
      change24hPct: null,
      liquidityUsd: null,
      weight: 1,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function quoteCmc(config: ServerConfig): Promise<OracleQuote> {
  if (!config.cmcApiKey) {
    return {
      platformId: "coinmarketcap",
      priceUsd: 0,
      change24hPct: null,
      liquidityUsd: null,
      weight: 0.8,
      ok: false,
      error: "CMC_API_KEY not configured.",
    };
  }
  try {
    const tickers = await fetchCmcMarketTickers(config);
    const ion = tickers.find((t) => t.symbol === "ION");
    if (!ion) {
      throw new Error("CMC returned no ION row (may be wrong asset id).");
    }
    return {
      platformId: "coinmarketcap",
      priceUsd: ion.priceUsd,
      change24hPct: ion.change24hPct,
      liquidityUsd: null,
      weight: 0.6,
      ok: ion.priceUsd > 0,
      note: ion.provenance.note,
    };
  } catch (err) {
    return {
      platformId: "coinmarketcap",
      priceUsd: 0,
      change24hPct: null,
      liquidityUsd: null,
      weight: 0.6,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** 并行拉取所有已接入的 DEX/行情 feed（非 HTML 爬虫主价）。 */
export async function fetchIonOracleQuotes(config: ServerConfig): Promise<OracleQuote[]> {
  return Promise.all([
    quotePancakeOnchain(config),
    quoteGeckoTerminal(config),
    quoteDexScreener(config),
    quoteCmc(config),
  ]);
}

export async function resolveIonOracleFeed(
  config: ServerConfig,
  options?: OracleAggregateOptions,
): Promise<OracleAggregateResult> {
  const quotes = await fetchIonOracleQuotes(config);
  return aggregateOracleQuotes(quotes, options);
}
