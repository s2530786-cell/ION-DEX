import type { MarketTicker, StakingSummary } from "@/lib/ionApi";

export type PoolRow = {
  pair: string;
  tvlUsd: number;
  aprPct: number;
  aprLabel: string;
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
  return `$${value.toFixed(0)}`;
}

export function buildPoolRowsFromApi(staking: StakingSummary, tickers: MarketTicker[]): PoolRow[] {
  const ion = tickers.find((row) => row.symbol === "ION");
  const bnb = tickers.find((row) => row.symbol === "BNB");
  const lpApr = staking.apr.lpMiningPct;
  const lpTvl = Number(staking.lpStakedUsd.replace(/[^0-9.]/g, "")) || 1_250_000;
  return [
    {
      pair: "ION/BNB",
      tvlUsd: lpTvl,
      aprPct: lpApr,
      aprLabel: `${lpApr}% LP mining`,
    },
    {
      pair: "ION/USDT",
      tvlUsd: ion ? ion.priceUsd * 120_000 : 800_000,
      aprPct: ion?.change24hPct ?? 0,
      aprLabel: ion ? ion.displayChange : "—",
    },
    {
      pair: "BNB/ION",
      tvlUsd: bnb ? bnb.priceUsd * 48_000 : 420_000,
      aprPct: bnb?.change24hPct ?? 0,
      aprLabel: bnb ? bnb.displayChange : "—",
    },
  ];
}
