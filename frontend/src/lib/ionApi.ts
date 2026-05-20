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

export type BurnSummary = {
  totalBurnedIon: string;
  bscBurnedIon: string;
  ionMainnetBurnedIon: string;
  remainingSupplyIon: string;
  bscBurnAddress: string;
  ionBurnAddress: string;
  ionBurnSource: string;
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

/**
 * 纯 Mock 预览模式（默认）：不发起任何 /api fetch，数据来自 MOCK_DATA。
 * 联调后端：设 VITE_ION_API_LIVE=true，MOCK_DATA 仅作 ionApi 失败时的 Fallback。
 */
export const ION_API_LIVE_ENABLED = import.meta.env.VITE_ION_API_LIVE === "true";

/** @deprecated 使用 ION_API_LIVE_ENABLED */
export const ION_USE_STATIC_MOCK = !ION_API_LIVE_ENABLED;

const apiBaseUrl = import.meta.env.VITE_ION_API_BASE_URL ?? "";

async function fetchApi<T>(path: string, signal?: AbortSignal): Promise<ApiResponse<T>> {
  if (!ION_API_LIVE_ENABLED) {
    signal?.throwIfAborted();
    const { resolveStaticMockApi } = await import("@/lib/ionApiMocks");
    return resolveStaticMockApi<T>(path);
  }

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

export type TradeQuote = {
  inputToken: string;
  outputToken: string;
  amountIn: string;
  estimatedOutput: string;
  minimumReceived: string;
  protocolFee: string;
  protocolFeeBps: number;
  slippageBps: number;
  priceImpactBps: number;
  route: string[];
  provenance: {
    source: "mock" | "cmc" | "cache" | "upstream";
    priceModel: string;
    marketNote: string;
  };
};

export type KlineInterval = "1h" | "4h" | "1d";

export type KlineBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type IonKlinesPayload = {
  symbol: "ION";
  interval: KlineInterval;
  poolAddress: string;
  bars: KlineBar[];
  provenance: {
    source: string;
    note: string;
  };
};

export async function fetchIonKlines(
  interval: KlineInterval,
  signal?: AbortSignal,
): Promise<ApiResponse<IonKlinesPayload>> {
  const params = new URLSearchParams({ interval });
  return fetchApi<IonKlinesPayload>(`/api/klines/ion?${params.toString()}`, signal);
}

export async function fetchTradeQuote(
  input: {
    amountIn: string;
    inputToken: string;
    outputToken: string;
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
  return fetchApi<TradeQuote>(`/api/trade/quote?${params.toString()}`, signal);
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
