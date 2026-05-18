export type ApiResponse<T> = {
  data: T;
  meta: {
    source: "mock" | "cache" | "upstream" | "indexer";
    updatedAt: string;
    stale: boolean;
    requestId: string;
  };
};

export type MarketTicker = {
  symbol: string;
  priceUsd: number;
  displayPrice: string;
  change24hPct: number;
  displayChange: string;
};

const apiBaseUrl = import.meta.env.VITE_ION_API_BASE_URL ?? "";

export async function fetchMarketTickers(signal?: AbortSignal): Promise<ApiResponse<MarketTicker[]>> {
  const response = await fetch(`${apiBaseUrl}/api/markets/tickers`, {
    headers: {
      accept: "application/json",
    },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Ticker request failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<MarketTicker[]>;
}
