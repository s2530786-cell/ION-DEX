export type ApiResponse<T> = {
  data: T;
  meta: {
    source: "local" | "cache" | "upstream" | "indexer";
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

export type TradeQuote = {
  inputToken: string;
  outputToken: string;
  amountIn: string;
  amountInUnits: string;
  estimatedOutput: string;
  estimatedOutputUnits: string;
  minimumReceived: string;
  minimumReceivedUnits: string;
  protocolFee: string;
  protocolFeeUnits: string;
  protocolFeeBps: number;
  slippageBps: number;
  priceImpactBps: number;
  route: string[];
  precision: {
    inputDecimals: number;
    outputDecimals: number;
    math: "bigint-floor";
  };
  provenance: {
    source: "local-seed";
    priceModel: string;
  };
};

const apiBaseUrl = import.meta.env.VITE_ION_API_BASE_URL ?? "http://127.0.0.1:8787";

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

export async function fetchTradeQuote(
  input: {
    inputToken: string;
    outputToken: string;
    amountIn: string;
    slippageBps: number;
  },
  signal?: AbortSignal,
): Promise<ApiResponse<TradeQuote>> {
  const params = new URLSearchParams({
    amountIn: input.amountIn,
    inputToken: input.inputToken,
    outputToken: input.outputToken,
    slippageBps: String(input.slippageBps),
  });
  const response = await fetch(`${apiBaseUrl}/api/trade/quote?${params.toString()}`, {
    headers: {
      accept: "application/json",
    },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Quote request failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<TradeQuote>;
}
