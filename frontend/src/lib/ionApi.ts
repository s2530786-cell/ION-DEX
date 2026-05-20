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
