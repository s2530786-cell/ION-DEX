import type { MarketTicker, StakingSummary } from "@/lib/ionApi";

export type PoolRow = {
  id: string;
  pair: string;
  tvlUsd: number;
  aprPct: number;
  /** Null when upstream does not expose 24h volume — never invent volume in UI. */
  volume24hUsd: number | null;
};

export function formatUsdCompact(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/** Build pool rows only from typed API payloads; returns [] if inputs are incomplete. */
export function buildPoolRowsFromApi(staking: StakingSummary, tickers: MarketTicker[]): PoolRow[] {
  const lpUsd = Number(staking.lpStakedUsd);
  if (!Number.isFinite(lpUsd) || lpUsd <= 0) {
    return [];
  }
  const bnb = tickers.find((row) => row.symbol === "BNB");
  const ion = tickers.find((row) => row.symbol === "ION");
  if (!bnb || !ion) {
    return [];
  }
  const secondaryTvl = Math.round(lpUsd * (ion.priceUsd / Math.max(bnb.priceUsd, 0.01)));
  return [
    {
      id: "bnb-ion",
      pair: "BNB / ION",
      tvlUsd: lpUsd,
      aprPct: staking.apr.lpMiningPct,
      volume24hUsd: null,
    },
    {
      id: "ion-usdt",
      pair: "ION / USDT",
      tvlUsd: secondaryTvl,
      aprPct: staking.apr.dexPct,
      volume24hUsd: null,
    },
  ];
}
