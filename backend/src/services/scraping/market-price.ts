import {
  BSC_BURN_ADDRESS,
  BSC_ION_TOKEN,
  ION_BSC_LP_POOL,
} from "../../constants/official-ion-addresses.js";
import { loadServerConfig } from "../../config/server-config.js";
import { fetchPancakeIonWbnbPrice } from "../../upstream/pancake-pool.js";
import { formatScrapedPriceUsd, parseMarketPriceFromHtml } from "./parse-market-price.js";

export type MarketPriceTarget = {
  symbol: string;
  label: string;
  url: string;
  preferredSource: "coinmarketcap" | "coingecko";
};

/** Confirmed Master addresses — exported for API responses. */
export const OFFICIAL_ION_BSC_ADDRESSES = {
  token: BSC_ION_TOKEN,
  lpPool: ION_BSC_LP_POOL,
  burnSink: BSC_BURN_ADDRESS,
} as const;

/** OKX Web3 token page for official BSC ION contract (matches Master address). */
export const OFFICIAL_ION_OKX_WEB3_URL = `https://web3.okx.com/zh-hans/token/bsc/${BSC_ION_TOKEN}`;

export const DEFAULT_MARKET_PRICE_TARGETS: MarketPriceTarget[] = [
  {    symbol: "BTC",
    label: "Bitcoin",
    url: "https://coinmarketcap.com/currencies/bitcoin/",
    preferredSource: "coinmarketcap",
  },
  {
    symbol: "ETH",
    label: "Ethereum",
    url: "https://coinmarketcap.com/currencies/ethereum/",
    preferredSource: "coinmarketcap",
  },
  {
    symbol: "SOL",
    label: "Solana",
    url: "https://coinmarketcap.com/currencies/solana/",
    preferredSource: "coinmarketcap",
  },
  {
    symbol: "BNB",
    label: "BNB",
    url: "https://coinmarketcap.com/currencies/bnb/",
    preferredSource: "coinmarketcap",
  },
];

export type ScrapedPriceSource = "coinmarketcap" | "coingecko" | "okx-web3" | "bsc-onchain-pool";

export type ScrapedLivePrice = {
  symbol: string;
  label: string;
  priceUsd: number;
  priceUsdFormatted: string;
  change24hPct: number | null;
  url: string;
  source: ScrapedPriceSource;
  sourceEngine: "scrapling";
  fetchedAt: string;
  latencyMs: number;
  tokenContractAddress?: string;
  lpPoolAddress?: string;
  burnAddress?: string;
  priceMethod?: string;
};

export type ScrapedLivePriceFailure = {
  symbol: string;
  label: string;
  url: string;
  error: string;
  fetchedAt: string;
  latencyMs: number;
};

const SCRAPE_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 ION-DEX-Scraper/1.0";

export async function fetchPageHtml(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": SCRAPE_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function scrapeLiveMarketPrice(
  target: MarketPriceTarget,
  timeoutMs = 15_000,
): Promise<ScrapedLivePrice | ScrapedLivePriceFailure> {
  const fetchedAt = new Date().toISOString();
  const t0 = Date.now();
  try {
    const html = await fetchPageHtml(target.url, timeoutMs);
    const parsed = parseMarketPriceFromHtml(target.url, html);
    const latencyMs = Date.now() - t0;
    if (!parsed) {
      return {
        symbol: target.symbol,
        label: target.label,
        url: target.url,
        error: "Could not parse USD price from scraped HTML (page may be blocked or layout changed).",
        fetchedAt,
        latencyMs,
      };
    }
    return {
      symbol: target.symbol,
      label: target.label,
      priceUsd: parsed.priceUsd,
      priceUsdFormatted: formatScrapedPriceUsd(parsed.priceUsd),
      change24hPct: parsed.change24hPct,
      url: target.url,
      source: parsed.source,
      sourceEngine: "scrapling",
      fetchedAt,
      latencyMs,
    };
  } catch (err) {
    return {
      symbol: target.symbol,
      label: target.label,
      url: target.url,
      error: err instanceof Error ? err.message : String(err),
      fetchedAt,
      latencyMs: Date.now() - t0,
    };
  }
}

async function scrapeOfficialIonFromOnChainPool(
  config: ReturnType<typeof loadServerConfig>,
  timeoutMs: number,
  fetchedAt: string,
  t0: number,
): Promise<ScrapedLivePrice | ScrapedLivePriceFailure> {
  const bscscanUrl = `https://bscscan.com/token/${BSC_ION_TOKEN}`;
  const bnbTarget = DEFAULT_MARKET_PRICE_TARGETS.find((t) => t.symbol === "BNB");
  if (!bnbTarget) {
    throw new Error("BNB scrape target missing from defaults.");
  }

  const [bnbResult, wbnbPerIon] = await Promise.all([
    scrapeLiveMarketPrice(bnbTarget, timeoutMs),
    fetchPancakeIonWbnbPrice(config),
  ]);

  const latencyMs = Date.now() - t0;

  if (!("priceUsd" in bnbResult)) {
    return {
      symbol: "ION",
      label: "ION (official BSC)",
      url: bscscanUrl,
      error: `BNB/USD HTML scrape failed: ${bnbResult.error}`,
      fetchedAt,
      latencyMs,
    };
  }

  const priceUsd = wbnbPerIon * bnbResult.priceUsd;
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
    return {
      symbol: "ION",
      label: "ION (official BSC)",
      url: bscscanUrl,
      error: "Computed ION/USD from pool reserves is invalid.",
      fetchedAt,
      latencyMs,
    };
  }

  return {
    symbol: "ION",
    label: "ION (official BSC)",
    priceUsd,
    priceUsdFormatted: formatScrapedPriceUsd(priceUsd),
    change24hPct: null,
    url: bscscanUrl,
    source: "bsc-onchain-pool",
    sourceEngine: "scrapling",
    fetchedAt,
    latencyMs,
    tokenContractAddress: BSC_ION_TOKEN,
    lpPoolAddress: ION_BSC_LP_POOL,
    burnAddress: BSC_BURN_ADDRESS,
    priceMethod:
      "PancakeSwap V3 slot0 (or V2 reserves) on official ION/WBNB LP via BSC RPC × scraped BNB/USD from CMC HTML.",
  };
}

/**
 * Official ION (BSC `0xe1ab…5ea8`) USD: OKX Web3 token page HTML first, then on-chain LP fallback.
 */
export async function scrapeOfficialIonLivePrice(
  timeoutMs = 15_000,
): Promise<ScrapedLivePrice | ScrapedLivePriceFailure> {
  const fetchedAt = new Date().toISOString();
  const t0 = Date.now();
  const config = loadServerConfig();

  try {
    const okxHtml = await fetchPageHtml(OFFICIAL_ION_OKX_WEB3_URL, timeoutMs);
    const okxParsed = parseMarketPriceFromHtml(OFFICIAL_ION_OKX_WEB3_URL, okxHtml);
    if (okxParsed) {
      return {
        symbol: "ION",
        label: "ION (Ice Open Network)",
        priceUsd: okxParsed.priceUsd,
        priceUsdFormatted: formatScrapedPriceUsd(okxParsed.priceUsd),
        change24hPct: okxParsed.change24hPct,
        url: OFFICIAL_ION_OKX_WEB3_URL,
        source: "okx-web3",
        sourceEngine: "scrapling",
        fetchedAt,
        latencyMs: Date.now() - t0,
        tokenContractAddress: BSC_ION_TOKEN,
        lpPoolAddress: ION_BSC_LP_POOL,
        burnAddress: BSC_BURN_ADDRESS,
        priceMethod: "OKX Web3 token page meta (og:description / title) for official BSC contract.",
      };
    }
  } catch {
    /* fall through to on-chain */
  }

  try {
    return await scrapeOfficialIonFromOnChainPool(config, timeoutMs, fetchedAt, t0);
  } catch (err) {
    return {
      symbol: "ION",
      label: "ION (official BSC)",
      url: OFFICIAL_ION_OKX_WEB3_URL,
      error: err instanceof Error ? err.message : String(err),
      fetchedAt,
      latencyMs: Date.now() - t0,
    };
  }
}

export async function scrapeLiveMarketPrices(
  targets: MarketPriceTarget[] = DEFAULT_MARKET_PRICE_TARGETS,
  timeoutMs = 15_000,
): Promise<{ prices: ScrapedLivePrice[]; failures: ScrapedLivePriceFailure[] }> {
  const prices: ScrapedLivePrice[] = [];
  const failures: ScrapedLivePriceFailure[] = [];

  const ionOfficial = await scrapeOfficialIonLivePrice(timeoutMs);
  if ("priceUsd" in ionOfficial) {
    prices.push(ionOfficial);
  } else {
    failures.push(ionOfficial);
  }
  await new Promise((r) => setTimeout(r, 350));

  for (const target of targets) {
    const result = await scrapeLiveMarketPrice(target, timeoutMs);
    if ("priceUsd" in result) {
      prices.push(result);
    } else {
      failures.push(result);
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  return { prices, failures };
}
