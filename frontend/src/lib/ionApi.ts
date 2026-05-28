import { resolveAiSubscriptionApiUrl, resolveIonApiBaseUrl } from "@/lib/integrationConfig";

const apiBaseUrl = resolveIonApiBaseUrl();
const aiSubscriptionBaseUrl = resolveAiSubscriptionApiUrl();

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
  windows?: Array<{ label: string; burnedIon: string }>;
};

export type StakingSummary = {
  totalStakedIon: string;
  officialStakedIon: string;
  dexStakedIon: string;
  lpStakedUsd: string;
  apr: {
    officialPct: number | null;
    dexPct: number | null;
    lpMiningPct: number;
  };
  officialRewardAsset?: string;
  officialUnstakeRoundHoursApprox?: number;
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

export type IonPricePayload = {
  priceUsd: number;
  change24hPct: number;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  source: string;
  note: string;
  poolAddress: string;
  updatedAt: string;
  oracleMethod?: string;
  oracleSpreadBps?: number;
  oracleUsedQuotes?: number;
  oracleUsedFeeds?: Array<{
    platformId: string;
    priceUsd: number;
    weight: number;
    liquidityUsd: number | null;
    change24hPct: number | null;
  }>;
  oracleRejectedFeeds?: Array<{
    platformId: string;
    rejectReason: "outlier" | "feed_error";
    error?: string;
    priceUsd?: number;
  }>;
};

export type IonKlineCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type IonKlinesPayload = {
  timeframe: string;
  candles: IonKlineCandle[];
  source: string;
};

export async function fetchIonPrice(signal?: AbortSignal): Promise<ApiResponse<IonPricePayload>> {
  return fetchApi<IonPricePayload>("/api/price/ion", signal);
}

export async function fetchIonKlines(
  limit = 48,
  signal?: AbortSignal,
): Promise<ApiResponse<IonKlinesPayload>> {
  return fetchApi<IonKlinesPayload>(`/api/klines/ion?limit=${limit}`, signal);
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

export type CopyDirection = "same" | "reverse";

export type CopyLeader = {
  address: string;
  name: string;
  monthlyReturnPct: number;
  avatarGradient: "cyan-purple" | "purple-pink" | "green-cyan";
};

export type CopyTradeHistoryRow = {
  id: string;
  leaderName: string;
  side: "buy" | "sell";
  pair: string;
  amountIon: string;
  pnlIon: string;
  copiedAt: string;
};

export type CopyTradeStats = {
  totalCopied: string;
  totalPnl: string;
  activeCopies: number;
  leaderAddress: string | null;
  isActive: boolean;
  onlineTraders: number;
  todayCopiedTotal: string;
  avgReturnRate: string;
  myCopyCount: number;
  leaders: CopyLeader[];
  history: CopyTradeHistoryRow[];
  provenance: {
    source: string;
    note: string;
  };
};

export type CopyTradeStartInput = {
  leaderAddress: string;
  maxCopyAmount: string;
  minProfitBps: number;
  stopLossBps: number;
  copySlippageBps: number;
  copyDirection: CopyDirection;
};

export async function fetchCopyTradeStats(signal?: AbortSignal): Promise<ApiResponse<CopyTradeStats>> {
  return fetchApi<CopyTradeStats>("/api/copy-trade/stats", signal);
}

export async function startCopyTradeSession(
  input: CopyTradeStartInput,
  signal?: AbortSignal,
): Promise<ApiResponse<CopyTradeStats>> {
  const response = await fetch(`${apiBaseUrl}/api/copy-trade/start`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Copy-trade start failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<CopyTradeStats>;
}

export async function stopCopyTradeSession(signal?: AbortSignal): Promise<ApiResponse<CopyTradeStats>> {
  const response = await fetch(`${apiBaseUrl}/api/copy-trade/stop`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: "{}",
    signal,
  });
  if (!response.ok) {
    throw new Error(`Copy-trade stop failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<CopyTradeStats>;
}

export type BatchRecipientInput = {
  address: string;
  amount: string;
};

export type BatchTransferResult = {
  batchId: string;
  txHash: string | null;
  totalRecipients: number;
  totalAmount: string;
  tokenSymbol: string;
  status: "pending_signature";
  failedIndices?: number[];
  message: string;
};

export type BatchHistoryItem = {
  id: string;
  timestamp: string;
  mode: "transfer" | "collect";
  recipients: number;
  totalAmount: string;
  tokenSymbol: string;
  txHash: string | null;
  status: "pending_signature" | "submitted";
};

export type BatchHistoryPage = {
  items: BatchHistoryItem[];
  total: number;
  page: number;
  limit: number;
};

export type BatchStats = {
  totalSent: string;
  totalTransactions: number;
  totalRecipients: number;
  avgAmount: string;
  provenance: {
    source: string;
    note: string;
  };
};

export async function fetchBatchTransferStats(signal?: AbortSignal): Promise<ApiResponse<BatchStats>> {
  return fetchApi<BatchStats>("/api/batch-transfer/stats", signal);
}

export async function fetchBatchTransferHistory(
  page = 1,
  limit = 20,
  signal?: AbortSignal,
): Promise<ApiResponse<BatchHistoryPage>> {
  return fetchApi<BatchHistoryPage>(`/api/batch-transfer/history?page=${page}&limit=${limit}`, signal);
}

export async function sendBatchTransfer(
  recipients: BatchRecipientInput[],
  tokenAddress?: string,
  signal?: AbortSignal,
): Promise<ApiResponse<BatchTransferResult>> {
  const response = await fetch(`${apiBaseUrl}/api/batch-transfer/send`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ recipients, tokenAddress }),
    signal,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Batch send failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<BatchTransferResult>;
}

export async function sendBatchCollect(
  mainAddress: string,
  fromAddresses: string[],
  tokenAddress?: string,
  signal?: AbortSignal,
): Promise<ApiResponse<BatchTransferResult>> {
  const response = await fetch(`${apiBaseUrl}/api/batch-transfer/collect`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ mainAddress, fromAddresses, tokenAddress }),
    signal,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Batch collect failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<BatchTransferResult>;
}

export type LiquidityMinePool = {
  id: number;
  name: string;
  pairLabel: string;
  aprPct: string;
  lockupDays: number;
  totalStaked: string;
  rewardPerBlock: string;
  userStaked: string;
  pendingReward: string;
  canStake: boolean;
  canUnstake: boolean;
  canClaim: boolean;
  lockupActive: boolean;
};

export type LiquidityMineSummary = {
  myLpShares: string;
  pendingReward: string;
  pools: LiquidityMinePool[];
  provenance: {
    source: string;
    note: string;
  };
};

export type LiquidityMineStakeInput = {
  poolId: number;
  amount: string;
};

export async function fetchLiquidityMinePools(signal?: AbortSignal): Promise<ApiResponse<LiquidityMineSummary>> {
  return fetchApi<LiquidityMineSummary>("/api/liquidity-mine/pools", signal);
}

export async function stakeLiquidityMine(
  input: LiquidityMineStakeInput,
  signal?: AbortSignal,
): Promise<ApiResponse<LiquidityMineSummary>> {
  const response = await fetch(`${apiBaseUrl}/api/liquidity-mine/stake`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Liquidity-mine stake failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<LiquidityMineSummary>;
}

export async function unstakeLiquidityMine(
  input: LiquidityMineStakeInput,
  signal?: AbortSignal,
): Promise<ApiResponse<LiquidityMineSummary>> {
  const response = await fetch(`${apiBaseUrl}/api/liquidity-mine/unstake`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Liquidity-mine unstake failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<LiquidityMineSummary>;
}

export async function claimLiquidityMineReward(
  poolId: number,
  signal?: AbortSignal,
): Promise<ApiResponse<LiquidityMineSummary>> {
  const response = await fetch(`${apiBaseUrl}/api/liquidity-mine/claim`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ poolId }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Liquidity-mine claim failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<LiquidityMineSummary>;
}

export type BatchTransferConfig = {
  contractAddress: string;
  ionTokenAddress: string;
  maxRecipients: number;
  feeCurrency: "ION";
  contractDeployed: boolean;
  provenance: {
    source: string;
    note: string;
  };
};

export type BatchTransferRecipient = {
  address: string;
  amount: string;
  amountWei: string;
};

export type BatchTransferValidation = {
  recipients: BatchTransferRecipient[];
  recipientCount: number;
  totalAmount: string;
  totalAmountWei: string;
  lineErrors: string[];
  provenance: {
    source: string;
    note: string;
  };
};

export type BatchCollectValidation = {
  mainAddress: string;
  fromAddresses: string[];
  fromCount: number;
  lineErrors: string[];
  provenance: {
    source: string;
    note: string;
  };
};

export async function fetchBatchTransferConfig(signal?: AbortSignal): Promise<ApiResponse<BatchTransferConfig>> {
  return fetchApi<BatchTransferConfig>("/api/batch-transfer/config", signal);
}

export async function validateBatchTransfer(
  text: string,
  signal?: AbortSignal,
): Promise<ApiResponse<BatchTransferValidation>> {
  const response = await fetch(`${apiBaseUrl}/api/batch-transfer/validate-transfer`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Batch transfer validation failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<BatchTransferValidation>;
}

export async function validateBatchCollect(
  input: { mainAddress: string; text: string },
  signal?: AbortSignal,
): Promise<ApiResponse<BatchCollectValidation>> {
  const response = await fetch(`${apiBaseUrl}/api/batch-transfer/validate-collect`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Batch collect validation failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<BatchCollectValidation>;
}

export type OwnedDomain = {
  name: string;
  ownerAddress: string;
  resolvedAddress: string | null;
  expiresAt: string;
  status: "active" | "expiring";
  bindTarget: string | null;
};

export type DomainManageOverview = {
  ownedCount: number;
  expiringSoon: number;
  lastLookup: DomainResolution | null;
  owned: OwnedDomain[];
  feeIon: {
    register: string;
    renew: string;
    transfer: string;
  };
  provenance: {
    source: string;
    note: string;
  };
};

export type DomainManageActionResult = DomainManageOverview & {
  message: string;
};

export async function fetchDomainManageOverview(
  signal?: AbortSignal,
): Promise<ApiResponse<DomainManageOverview>> {
  return fetchApi<DomainManageOverview>("/api/domain-manage/overview", signal);
}

async function postDomainManageAction(
  path: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ApiResponse<DomainManageActionResult>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Domain-manage ${path} failed with HTTP ${response.status}`);
  }
  return (await response.json()) as ApiResponse<DomainManageActionResult>;
}

export function lookupDomainManage(name: string, signal?: AbortSignal) {
  return postDomainManageAction("/api/domain-manage/lookup", { name }, signal);
}

export function registerDomainManage(name: string, signal?: AbortSignal) {
  return postDomainManageAction("/api/domain-manage/register", { name }, signal);
}

export function bindDomainManage(name: string, walletAddress: string, signal?: AbortSignal) {
  return postDomainManageAction("/api/domain-manage/bind", { name, walletAddress }, signal);
}

export function transferDomainManage(name: string, toAddress: string, signal?: AbortSignal) {
  return postDomainManageAction("/api/domain-manage/transfer", { name, toAddress }, signal);
}

export function renewDomainManage(name: string, signal?: AbortSignal) {
  return postDomainManageAction("/api/domain-manage/renew", { name }, signal);
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
  const adapter = meta.adapter ? ` ? ${meta.adapter}` : "";
  const stale = meta.stale ? " ? stale" : "";
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

export type AiSubscriptionPeriod = "monthly" | "quarterly" | "yearly";

export type AiSubscriptionTierKey = "Basic" | "Premium" | "King" | "Institutional";

export type AiSubscriptionPrice = {
  tier: AiSubscriptionTierKey;
  period: AiSubscriptionPeriod;
  usd_price: number;
  ion_estimate: number;
  ion_usd_price: number;
  fee_min_ratio: number;
  fee_max_ratio: number;
};

export type AiSubscriptionRights = {
  tier: string;
  expires_at: string | null;
  rights: string[];
};

export type AiSubscribePayload = {
  wallet_addr: string;
  tier: AiSubscriptionTierKey;
  period: AiSubscriptionPeriod;
  tx_hash: string;
  auto_renew: boolean;
};

async function fetchAiSubscription<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${aiSubscriptionBaseUrl}${path}`, {
    headers: { accept: "application/json", "content-type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`AI subscription request failed with HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchAiSubscriptionPrice(
  tier: AiSubscriptionTierKey,
  period: AiSubscriptionPeriod,
  signal?: AbortSignal,
): Promise<AiSubscriptionPrice> {
  const params = new URLSearchParams({ tier, period });
  return fetchAiSubscription(`/api/ai/price?${params.toString()}`, { signal });
}

export async function fetchAiSubscriptionRights(
  walletAddr: string,
  signal?: AbortSignal,
): Promise<AiSubscriptionRights> {
  const params = new URLSearchParams({ wallet_addr: walletAddr });
  const payload = await fetchAiSubscription<{ tier: string; expires_at?: string | null; rights: string[] }>(
    `/api/ai/rights?${params.toString()}`,
    { signal },
  );
  return {
    tier: payload.tier,
    expires_at: payload.expires_at ?? null,
    rights: payload.rights ?? [],
  };
}

export async function submitAiSubscriptionOrder(payload: AiSubscribePayload): Promise<{
  status: string;
  tier: string;
  expires_at: string;
}> {
  return fetchAiSubscription("/api/ai/subscribe", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function toggleAiAutoRenewal(walletAddr: string, enable: boolean): Promise<{ auto_renew: boolean }> {
  return fetchAiSubscription("/api/ai/auto-renewal", {
    method: "POST",
    body: JSON.stringify({ wallet_addr: walletAddr, enable }),
  });
}

export type MarketProvenance = { source: string; model: string };

export type MarketCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketDepthRow = {
  label: string;
  depth: string;
  tone: "positive" | "negative" | "neutral";
};

export type MarketOrderBookLevel = {
  side: "bid" | "ask";
  price: string;
  amount: string;
  depth: string;
};

export type MarketOrderBookPayload = {
  symbol: string;
  levels: MarketOrderBookLevel[];
  provenance: MarketProvenance;
};

export type SwapMarketStats = {
  pair: string;
  priceUsd: number;
  change24hPct: number;
  volume24hUsd: number;
  liquidityUsd: number;
  lastPrice: string;
  volume24h: string;
  spreadPct: string;
  priceImpactLabel: string;
  routeHealth: "liquid" | "thin" | "degraded";
  tvlUsd: string;
  tvlChangePct: string;
  ionFeePct: string;
};

const mockMarketProvenance: MarketProvenance = { source: "mock", model: "phase-3" };

export async function fetchMarketCandles(
  input: { symbol: string; interval?: string; limit?: number },
  signal?: AbortSignal,
): Promise<ApiResponse<{ candles: MarketCandle[]; provenance: MarketProvenance }>> {
  const limit = input.limit ?? 120;
  const klines = await fetchIonKlines(limit, signal);
  const candles: MarketCandle[] = klines.data.candles.map((row) => ({
    time: row.time,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  }));
  return {
    data: { candles, provenance: { source: klines.data.source, model: input.interval ?? "1h" } },
    meta: klines.meta,
  };
}

export async function fetchMarketDepth(
  signal?: AbortSignal,
): Promise<ApiResponse<{ rows: MarketDepthRow[]; provenance: MarketProvenance }>> {
  const tickers = await fetchMarketTickers(signal);
  const rows: MarketDepthRow[] = tickers.data.slice(0, 4).map((row, index) => ({
    label: row.symbol,
    depth: `${72 - index * 12}%`,
    tone: row.change24hPct >= 0 ? "positive" : "negative",
  }));
  return {
    data: { rows, provenance: mockMarketProvenance },
    meta: tickers.meta,
  };
}

export async function fetchMarketOrderBook(
  symbol: string,
  signal?: AbortSignal,
): Promise<ApiResponse<MarketOrderBookPayload>> {
  const price = await fetchIonPrice(signal);
  const mid = price.data.priceUsd;
  const levels: MarketOrderBookLevel[] = [
    { side: "ask", price: (mid * 1.002).toFixed(4), amount: "12.4K", depth: "68%" },
    { side: "ask", price: (mid * 1.004).toFixed(4), amount: "8.1K", depth: "44%" },
    { side: "bid", price: (mid * 0.998).toFixed(4), amount: "9.6K", depth: "52%" },
    { side: "bid", price: (mid * 0.996).toFixed(4), amount: "14.2K", depth: "71%" },
  ];
  return {
    data: { symbol, levels, provenance: { source: price.data.source, model: "synthetic" } },
    meta: price.meta,
  };
}

export async function fetchSwapMarketStats(
  pair: string,
  signal?: AbortSignal,
): Promise<ApiResponse<{ stats: SwapMarketStats; provenance: MarketProvenance }>> {
  const ion = await fetchIonPrice(signal);
  const stats: SwapMarketStats = {
    pair,
    priceUsd: ion.data.priceUsd,
    change24hPct: ion.data.change24hPct,
    volume24hUsd: ion.data.volume24hUsd ?? 0,
    liquidityUsd: ion.data.liquidityUsd ?? 0,
    lastPrice: `$${ion.data.priceUsd.toFixed(4)}`,
    volume24h: ion.data.volume24hUsd ? `$${ion.data.volume24hUsd.toLocaleString()}` : "?",
    spreadPct: "0.12%",
    priceImpactLabel: "< 0.5%",
    routeHealth: "liquid",
    tvlUsd: ion.data.liquidityUsd ? `$${ion.data.liquidityUsd.toLocaleString()}` : "?",
    tvlChangePct: `${ion.data.change24hPct >= 0 ? "+" : ""}${ion.data.change24hPct.toFixed(2)}%`,
    ionFeePct: "0.30%",
  };
  return {
    data: { stats, provenance: { source: ion.data.source, model: "ion-pool" } },
    meta: ion.meta,
  };
}

export type DomainShowcasePayload = {
  listings: Array<{
    name: string;
    status: string;
    floorIon: string;
    owner: string;
  }>;
  identity: {
    primaryIonName: string;
    kycPass: { level: string; expiresAt: string; badge: string };
  };
  provenance: { source: string; note: string };
};

export async function fetchDomainShowcase(signal?: AbortSignal): Promise<ApiResponse<DomainShowcasePayload>> {
  return fetchApi<DomainShowcasePayload>("/api/domain/showcase", signal);
}

export type SentinelAlertSelfTestResult = {
  ok: boolean;
  configured: boolean;
  channel: "webhook" | "slack" | null;
  endpointHost: string | null;
  statusCode: number | null;
  attempts: number;
  message: string;
  deliveredAt: string;
};

export async function runSentinelAlertSelfTest(
  signal?: AbortSignal,
): Promise<{ httpStatus: number; result: SentinelAlertSelfTestResult; meta: ApiMeta }> {
  const response = await fetch(`${apiBaseUrl}/api/sentinel/alert-test`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: "{}",
    signal,
  });
  const body = (await response.json()) as ApiResponse<SentinelAlertSelfTestResult> & {
    error?: { message: string };
  };
  if (!body.data) {
    throw new Error(body.error?.message ?? `Alert self-test failed with HTTP ${response.status}`);
  }
  return { httpStatus: response.status, result: body.data, meta: body.meta };
}
