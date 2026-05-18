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

const apiBaseUrl = import.meta.env.VITE_ION_API_BASE_URL ?? "";

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

export async function fetchDomainResolution(
  name: string,
  signal?: AbortSignal,
): Promise<ApiResponse<DomainResolution>> {
  const encoded = encodeURIComponent(name.trim().toLowerCase());
  return fetchApi<DomainResolution>(`/api/domain/resolve?name=${encoded}`, signal);
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
