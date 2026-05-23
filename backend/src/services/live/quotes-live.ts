import { getBnbPriceUsd, getGeckoIonPool, getIonPriceUsd } from "../../upstream/geckoterminal.js";

const MICRO_USD = BigInt(1_000_000);

export type LiveQuotePrices = {
  pricesMicroUsd: Record<string, bigint>;
  provenance: {
    source: "geckoterminal";
    priceModel: string;
    poolId: string;
    ionPriceUsd: string;
    bnbPriceUsd: string;
    reserveInUsd: string;
  };
};

let cached: LiveQuotePrices | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

function toMicroUsd(priceUsd: number): bigint {
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error("GeckoTerminal returned a non-positive USD price.");
  }
  return BigInt(Math.round(priceUsd * 1_000_000));
}

/** Load swap quote USD prices from the official ION/BNB GeckoTerminal pool. */
export async function loadLiveQuotePrices(timeoutMs: number): Promise<LiveQuotePrices> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const [pool, ionUsd, bnbUsd] = await Promise.all([
    getGeckoIonPool(timeoutMs),
    getIonPriceUsd(timeoutMs),
    getBnbPriceUsd(timeoutMs),
  ]);

  const snapshot: LiveQuotePrices = {
    pricesMicroUsd: {
      BNB: toMicroUsd(bnbUsd),
      ION: toMicroUsd(ionUsd),
      USDT: MICRO_USD,
    },
    provenance: {
      source: "geckoterminal",
      priceModel: "GeckoTerminal ION/BNB PancakeSwap V3 pool spot USD prices",
      poolId: pool.id,
      ionPriceUsd: String(ionUsd),
      bnbPriceUsd: String(bnbUsd),
      reserveInUsd: pool.attributes.reserve_in_usd,
    },
  };

  cached = snapshot;
  cachedAt = now;
  return snapshot;
}

export function resetLiveQuotePricesCacheForTests(): void {
  cached = null;
  cachedAt = 0;
}
