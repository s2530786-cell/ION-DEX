export type MarketTicker = {
  symbol: string;
  priceUsd: number;
  displayPrice: string;
  change24hPct: number;
  displayChange: string;
  provenance: {
    source: "mock" | "cmc";
    note: string;
  };
};

const mockMarketProvenance = {
  source: "mock",
  note: "Phase 3 mock ticker only; do not use as market truth.",
} as const;

const tickers: MarketTicker[] = [
  {
    symbol: "ION",
    priceUsd: 6.02,
    displayPrice: "$6.02",
    change24hPct: 8.42,
    displayChange: "+8.42%",
    provenance: mockMarketProvenance,
  },
  {
    symbol: "BNB",
    priceUsd: 642.2,
    displayPrice: "$642.20",
    change24hPct: 1.18,
    displayChange: "+1.18%",
    provenance: mockMarketProvenance,
  },
  {
    symbol: "BTC",
    priceUsd: 103420,
    displayPrice: "$103,420",
    change24hPct: 0.74,
    displayChange: "+0.74%",
    provenance: mockMarketProvenance,
  },
  {
    symbol: "ETH",
    priceUsd: 4906,
    displayPrice: "$4,906",
    change24hPct: -0.38,
    displayChange: "-0.38%",
    provenance: mockMarketProvenance,
  },
  {
    symbol: "SOL",
    priceUsd: 218.3,
    displayPrice: "$218.30",
    change24hPct: 3.12,
    displayChange: "+3.12%",
    provenance: mockMarketProvenance,
  },
  {
    symbol: "USDT",
    priceUsd: 1,
    displayPrice: "$1.00",
    change24hPct: 0.01,
    displayChange: "+0.01%",
    provenance: mockMarketProvenance,
  },
];

export function getMarketTickers(): MarketTicker[] {
  return tickers;
}
