import { fetchJson } from "../lib/http.js";

export type GeckoPool = {
  id: string;
  type: string;
  attributes: {
    base_token_price_usd: string;
    base_token_price_native: string;
    quote_token_price_usd: string;
    quote_token_price_native: string;
    reserve_in_usd: string;
    volume_usd: { h24: string };
    price_change_percentage: { h24: string; h6: string; h1: string; m5: string };
    transactions: { h24: { buys: number; sells: number } };
  };
};

export type GeckoResponse = {
  data: GeckoPool;
};

const GECKO_BASE = "https://api.geckoterminal.com/api/v2";
const GECKO_HEADERS = {
  Accept: "application/json;version=20230302",
};

/** ION/BNB pool on BSC PancakeSwap V3 */
const ION_BSC_POOL_PATH = "bsc/pools/0x6487725b383954e05cA56F3c2B93a104B3DD2C25";

let cachedPool: GeckoPool | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 1 min cache

export async function getGeckoIonPool(timeoutMs = 12000): Promise<GeckoPool> {
  const now = Date.now();
  if (cachedPool && now - cachedAt < CACHE_TTL_MS) {
    return cachedPool;
  }
  const data = await fetchJson<GeckoResponse>(
    `${GECKO_BASE}/networks/${ION_BSC_POOL_PATH}`,
    {
      headers: GECKO_HEADERS,
      timeoutMs,
    },
  );
  cachedPool = data.data;
  cachedAt = now;
  return data.data;
}

/** ION price in USD from GeckoTerminal */
export async function getIonPriceUsd(timeoutMs = 12000): Promise<number> {
  const pool = await getGeckoIonPool(timeoutMs);
  return Number(pool.attributes.base_token_price_usd);
}

/** BNB price in USD from the same pool's quote token */
export async function getBnbPriceUsd(timeoutMs = 12000): Promise<number> {
  const pool = await getGeckoIonPool(timeoutMs);
  return Number(pool.attributes.quote_token_price_usd);
}

/** Fetch ION 24h volume in USD */
export async function getIonVolumeUsd(timeoutMs = 12000): Promise<number> {
  const pool = await getGeckoIonPool(timeoutMs);
  return Number(pool.attributes.volume_usd.h24);
}

/** Fetch ION 24h price change % */
export async function getIonPriceChange24h(timeoutMs = 12000): Promise<number> {
  const pool = await getGeckoIonPool(timeoutMs);
  return Number(pool.attributes.price_change_percentage.h24);
}

export type GeckoOhlcvCandle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type GeckoOhlcvResponse = {
  data?: {
    attributes?: {
      ohlcv_list?: Array<[number, number, number, number, number, number]>;
    };
  };
};

export async function fetchGeckoIonOhlcv(
  timeoutMs: number,
  timeframe: "hour" | "minute" = "hour",
  limit = 100,
): Promise<GeckoOhlcvCandle[]> {
  const url = new URL(`${GECKO_BASE}/networks/${ION_BSC_POOL_PATH}/ohlcv/${timeframe}`);
  url.searchParams.set("limit", String(Math.min(1000, Math.max(1, limit))));
  const body = await fetchJson<GeckoOhlcvResponse>(url.toString(), {
    headers: GECKO_HEADERS,
    timeoutMs,
  });
  const rows = body.data?.attributes?.ohlcv_list ?? [];
  return rows.map(([ts, open, high, low, close, volume]) => ({
    timestamp: ts,
    open,
    high,
    low,
    close,
    volume,
  }));
}
