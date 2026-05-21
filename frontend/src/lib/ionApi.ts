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

export type MarketCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type MarketProvenance = {
  source: "local-seed";
  model: string;
  symbol: string;
  note: string;
};

export type MarketCandlesPayload = {
  symbol: string;
  interval: string;
  candles: MarketCandle[];
  provenance: MarketProvenance;
};

export type MarketDepthRow = {
  label: string;
  price: string;
  change: string;
  tone: "positive" | "negative" | "neutral";
};

export type MarketDepthPayload = {
  rows: MarketDepthRow[];
  provenance: MarketProvenance;
};

export type OrderBookLevel = {
  price: string;
  amount: string;
  depth: string;
  side: "ask" | "bid";
};

export type MarketOrderBookPayload = {
  symbol: string;
  midPrice: string;
  levels: OrderBookLevel[];
  provenance: MarketProvenance;
};

export type SwapMarketStats = {
  tvlUsd: string;
  tvlChangePct: string;
  priceImpactBps: number;
  priceImpactLabel: string;
  routeHealth: "liquid" | "thin" | "stressed";
  lastPrice: string;
  volume24h: string;
  spreadPct: string;
  ionFeePct: string;
};

export type SwapMarketStatsPayload = {
  pair: string;
  stats: SwapMarketStats;
  provenance: MarketProvenance;
};

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

export async function fetchMarketCandles(
  input: { symbol: string; interval?: string; limit?: number },
  signal?: AbortSignal,
): Promise<ApiResponse<MarketCandlesPayload>> {
  const params = new URLSearchParams({
    symbol: input.symbol,
    interval: input.interval ?? "15m",
    limit: String(input.limit ?? 120),
  });
  const response = await fetch(`${apiBaseUrl}/api/markets/candles?${params.toString()}`, {
    headers: { accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Candles request failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<MarketCandlesPayload>;
}

export async function fetchMarketDepth(signal?: AbortSignal): Promise<ApiResponse<MarketDepthPayload>> {
  const response = await fetch(`${apiBaseUrl}/api/markets/depth`, {
    headers: { accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Depth request failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<MarketDepthPayload>;
}

export async function fetchMarketOrderBook(
  symbol: string,
  signal?: AbortSignal,
): Promise<ApiResponse<MarketOrderBookPayload>> {
  const params = new URLSearchParams({ symbol });
  const response = await fetch(`${apiBaseUrl}/api/markets/orderbook?${params.toString()}`, {
    headers: { accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Order book request failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<MarketOrderBookPayload>;
}

export async function fetchSwapMarketStats(
  pair: string,
  signal?: AbortSignal,
): Promise<ApiResponse<SwapMarketStatsPayload>> {
  const params = new URLSearchParams({ pair });
  const response = await fetch(`${apiBaseUrl}/api/markets/swap-stats?${params.toString()}`, {
    headers: { accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Swap stats request failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<SwapMarketStatsPayload>;
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

export type PublicConfig = {
  appName: string;
  environment: string;
  chainIds: { ion: string; bsc: number };
  featureFlags: {
    backendGateway: boolean;
    walletAccess: boolean;
    realWalletAdapters: boolean;
    aiSentinel: boolean;
    bridgeTransfers: boolean;
  };
  supportedWallets: Array<{
    key: string;
    name: string;
    category: "ion-native" | "evm";
    status: "ready" | "planned" | "enabled";
    detector: string;
    label: string;
  }>;
};

export type ProfileSession = {
  provenance: { source: string; description: string };
  identity: {
    displayName: string;
    primaryIonName: string;
    ionIdStatus: "verified" | "pending" | "unlinked";
    kycPass: { level: string; expiresAt: string; badge: string };
  };
  avatar: {
    selectedId: string;
    options: Array<{
      id: string;
      label: string;
      kind: "gradient" | "nft";
      preview: string;
      provenance: string;
    }>;
    nftSource: { label: string; status: string; mediaUrl: string | null };
  };
  wallets: {
    primaryKey: string | null;
    entries: Array<{
      key: string;
      name: string;
      category: "ion-native" | "evm";
      status: "ready" | "planned" | "enabled";
      detector: string;
      label: string;
    }>;
  };
  domains: {
    primaryName: string;
    records: Array<{ name: string; type: string; value: string }>;
  };
  preferences: {
    language: string;
    region: string;
    theme: "galaxy-neon" | "aurora-dark";
    animation: "full" | "reduced";
    privacyMode: boolean;
  };
  quickActions: Array<{
    key: string;
    label: string;
    description: string;
    routeHint: string;
    count: number | null;
  }>;
  sessionDetection: {
    network: string;
    walletProvider: string;
    addressFormat: string;
    language: string;
    ionName: string;
    identityStatus: string;
    addressPreview: string;
    detectionSource: "browser-injected" | "local-seed";
  } | null;
};

export type ProfileSessionQuery = {
  provider?: string | null;
  address?: string;
  chainId?: number;
};

export async function fetchPublicConfig(signal?: AbortSignal): Promise<ApiResponse<PublicConfig>> {
  const response = await fetch(`${apiBaseUrl}/api/config/public`, {
    headers: { accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Config request failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<PublicConfig>;
}

export async function fetchProfileSession(
  query: ProfileSessionQuery = {},
  signal?: AbortSignal,
): Promise<ApiResponse<ProfileSession>> {
  const params = new URLSearchParams();
  if (query.provider) {
    params.set("provider", query.provider);
  }
  if (query.address) {
    params.set("address", query.address);
  }
  if (typeof query.chainId === "number" && Number.isFinite(query.chainId)) {
    params.set("chainId", String(query.chainId));
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${apiBaseUrl}/api/profile/session${suffix}`, {
    headers: { accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Profile session request failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<ProfileSession>;
}
