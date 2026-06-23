import type { ServerConfig } from "../config/server-config.js";
import { ION_BSC_LP_POOL } from "../constants/official-ion-addresses.js";
import { fetchJson } from "../lib/http.js";

type DexPair = {
  priceUsd?: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
};

type DexScreenerResponse = {
  pairs?: DexPair[];
};

const DEX_BASE = "https://api.dexscreener.com/latest/dex/pairs/bsc";

export type DexScreenerIonSnapshot = {
  priceUsd: number;
  change24hPct: number;
  volume24hUsd: number;
  liquidityUsd: number;
  fdvUsd: number | null;
  pairAddress: string;
};

export async function fetchDexScreenerIonPair(
  config: ServerConfig,
  pairAddress: string = ION_BSC_LP_POOL,
): Promise<DexScreenerIonSnapshot> {
  const url = `${DEX_BASE}/${pairAddress}`;
  const body = await fetchJson<DexScreenerResponse>(url, {
    timeoutMs: config.httpTimeoutMs,
  });
  const pair = body.pairs?.[0];
  if (!pair?.priceUsd) {
    throw new Error("DexScreener returned no pair row for ION pool.");
  }
  const priceUsd = Number.parseFloat(pair.priceUsd);
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error("DexScreener returned invalid ION price.");
  }
  return {
    priceUsd,
    change24hPct: Number(pair.priceChange?.h24 ?? 0),
    volume24hUsd: Number(pair.volume?.h24 ?? 0),
    liquidityUsd: Number(pair.liquidity?.usd ?? 0),
    fdvUsd: pair.fdv != null && Number.isFinite(pair.fdv) ? pair.fdv : null,
    pairAddress: pairAddress.toLowerCase(),
  };
}
