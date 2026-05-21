export type ApiMeta = {
  source: "mock" | "cache" | "upstream" | "indexer";
  updatedAt: string;
  stale: boolean;
  requestId: string;
  cacheHit?: boolean;
  adapter?: string;
};

export type ApiResponse<T> = {
  data: T;
  meta: ApiMeta;
};

export type MarketTicker = {
  symbol: string;
  priceUsd: number;
  displayPrice: string;
  change24hPct: number;
  displayChange: string;
  provenance?: { source: string; note: string };
};

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

export type BurnWindow = {
  label: "24h" | "7d" | "30d";
  burnedIon: string;
  trendPct: number;
};

export type BurnSummary = {
  totalBurnedIon: string;
  bscBurnedIon: string;
  ionMainnetBurnedIon: string;
  remainingSupplyIon: string;
  bscBurnAddress: string;
  ionBurnSource: string;
  /** Present when gateway returns burn window trends (test-mock / live). */
  windows?: BurnWindow[];
};

export type StakingSummary = {
  totalStakedIon: string;
  officialStakedIon: string;
  dexStakedIon: string;
  lpStakedUsd: string;
  apr: {
    officialPct: number;
    dexPct: number;
    lpMiningPct: number;
  };
};

export type BridgeRoute = {
  routeId: string;
  fromChain: "BSC" | "ION";
  toChain: "BSC" | "ION";
  asset: "ION";
  status: "design" | "mock" | "paused" | "online";
  minAmountIon: string;
  maxAmountIon: string;
  estimatedMinutes: number;
  confirmationsRequired: number;
  safeguards: string[];
};

export type BridgeRoutesPayload = {
  routes: BridgeRoute[];
  relayerStatus: "mocked" | "planned" | "online" | "degraded";
  verifier: {
    threshold: string;
    replayProtection: boolean;
    proofStatus: "planned" | "mocked" | "online";
  };
};

export type DomainResolution = {
  name: string;
  available: boolean;
  ownerAddress: string | null;
  resolvedAddress: string | null;
  expiresAt: string | null;
  records: Array<{
    key: "wallet" | "profile" | "avatar";
    value: string;
    status: "mock" | "planned";
  }>;
  marketplace: {
    listed: boolean;
    floorIon: string;
    lastSaleIon: string | null;
  };
  provenance: {
    source: "mock";
    note: string;
  };
};

export type DomainListingRow = {
  name: string;
  status: "Owned" | "Listed" | "Available" | "Primary";
  priceIon: string;
  available: boolean;
};

export type DomainShowcasePayload = {
  listings: DomainListingRow[];
  identity: {
    primaryIonName: string;
    kycPass: {
      level: string;
      expiresAt: string;
      badge: string;
    };
  };
  provenance: DomainResolution["provenance"];
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

async function fetchApi<T>(path: string, signal?: AbortSignal): Promise<ApiResponse<T>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      accept: "application/json",
    },
    signal,
  });
  if (!response.ok) {
    throw new Error(`API request failed for ${path} with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<T>;
}

export async function fetchMarketTickers(signal?: AbortSignal): Promise<ApiResponse<MarketTicker[]>> {
  return fetchApi<MarketTicker[]>("/api/markets/tickers", signal);
}

export async function fetchBurnSummary(signal?: AbortSignal): Promise<ApiResponse<BurnSummary>> {
  return fetchApi<BurnSummary>("/api/burn/summary", signal);
}

export async function fetchStakingSummary(signal?: AbortSignal): Promise<ApiResponse<StakingSummary>> {
  return fetchApi<StakingSummary>("/api/staking/summary", signal);
}

export async function fetchBridgeRoutes(signal?: AbortSignal): Promise<ApiResponse<BridgeRoutesPayload>> {
  return fetchApi<BridgeRoutesPayload>("/api/bridge/routes", signal);
}

export async function fetchDomainResolve(name: string, signal?: AbortSignal): Promise<ApiResponse<DomainResolution>> {
  const query = encodeURIComponent(name);
  return fetchApi<DomainResolution>(`/api/domain/resolve?name=${query}`, signal);
}

export async function fetchDomainShowcase(
  signal?: AbortSignal,
): Promise<ApiResponse<DomainShowcasePayload>> {
  return fetchApi<DomainShowcasePayload>("/api/domain/showcase", signal);
}

export type BscWalletBalance = {
  address: string;
  balanceWei: string;
  balanceBnb: string;
  chainId: number;
  rpcUrl: string;
};

export async function fetchBscWalletBalance(
  address: string,
  signal?: AbortSignal,
): Promise<ApiResponse<BscWalletBalance>> {
  const query = encodeURIComponent(address);
  return fetchApi<BscWalletBalance>(`/api/wallet/bsc-balance?address=${query}`, signal);
}

export function formatIonAmount(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  return parsed.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatDataSourceLabel(meta: ApiMeta): string {
  const adapter = meta.adapter ? ` · ${meta.adapter}` : "";
  const stale = meta.stale ? " · stale" : "";
  return `${meta.source}${adapter}${stale}`;
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

export async function fetchMarketCandles(
  input: { symbol: string; interval?: string; limit?: number },
  signal?: AbortSignal,
): Promise<ApiResponse<MarketCandlesPayload>> {
  const params = new URLSearchParams({
    symbol: input.symbol,
    interval: input.interval ?? "15m",
    limit: String(input.limit ?? 120),
  });
  return fetchApi<MarketCandlesPayload>(`/api/markets/candles?${params.toString()}`, signal);
}

export async function fetchMarketDepth(signal?: AbortSignal): Promise<ApiResponse<MarketDepthPayload>> {
  return fetchApi<MarketDepthPayload>("/api/markets/depth", signal);
}

export async function fetchMarketOrderBook(
  symbol: string,
  signal?: AbortSignal,
): Promise<ApiResponse<MarketOrderBookPayload>> {
  const params = new URLSearchParams({ symbol });
  return fetchApi<MarketOrderBookPayload>(`/api/markets/orderbook?${params.toString()}`, signal);
}

export async function fetchSwapMarketStats(
  pair: string,
  signal?: AbortSignal,
): Promise<ApiResponse<SwapMarketStatsPayload>> {
  const params = new URLSearchParams({ pair });
  return fetchApi<SwapMarketStatsPayload>(`/api/markets/swap-stats?${params.toString()}`, signal);
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
