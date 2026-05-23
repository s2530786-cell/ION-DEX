/** Shared market ticker shape for demo fallbacks (avoids ionApi ↔ integrationConfig cycle). */
export type DemoMarketTicker = {
  symbol: string;
  priceUsd: number;
  displayPrice: string;
  change24hPct: number;
  displayChange: string;
  provenance?: { source: string; note: string };
};

export type DemoSwapToken = "BNB" | "ION" | "USDT";
