/**
 * 纯 Mock 预览模式唯一数据源。
 * 联调后端：设置 VITE_ION_API_LIVE=true，本对象仅作 API 失败时的 Fallback。
 */
import type {
  ApiMeta,
  BridgeRoutesPayload,
  BurnSummary,
  BscWalletBalance,
  DomainResolution,
  IonKlinesPayload,
  KlineInterval,
  MarketTicker,
  StakingSummary,
  TradeQuote,
} from "@/lib/ionApi";

export function mockPreviewMeta(adapter = "MOCK_DATA"): ApiMeta {
  return {
    source: "mock",
    updatedAt: "2026-05-20T00:00:00.000Z",
    stale: false,
    requestId: `preview-${adapter}`,
    cacheHit: true,
    adapter,
  };
}

function buildTradeQuote(input: {
  amountIn: string;
  inputToken: string;
  outputToken: string;
  slippageBps: number;
}): TradeQuote {
  const pay = Number(input.amountIn);
  const rate =
    input.inputToken === "ION" ? 0.166 : input.inputToken === "BNB" ? 106.5 : 1;
  const estimated = Number.isFinite(pay) ? pay * rate : 0;
  const slip = input.slippageBps / 10_000;
  const minimum = estimated * (1 - slip);
  return {
    inputToken: input.inputToken,
    outputToken: input.outputToken,
    amountIn: input.amountIn,
    estimatedOutput: estimated.toFixed(6),
    minimumReceived: minimum.toFixed(6),
    protocolFee: (estimated * 0.003).toFixed(6),
    protocolFeeBps: 30,
    slippageBps: input.slippageBps,
    priceImpactBps: 12,
    route: [input.inputToken, "ION_POOL", input.outputToken],
    provenance: {
      source: "mock",
      priceModel: "MOCK_DATA",
      marketNote: "Preview mode — no /api request",
    },
  };
}

function buildIonKlines(interval: KlineInterval): IonKlinesPayload {
  const now = Math.floor(Date.now() / 1000);
  const step = interval === "1h" ? 3600 : interval === "4h" ? 14400 : 86400;
  const bars = Array.from({ length: 24 }, (_, index) => {
    const t = now - (23 - index) * step;
    const base = 6 + Math.sin(index / 4) * 0.35;
    return {
      time: t,
      open: base,
      high: base + 0.12,
      low: base - 0.1,
      close: base + 0.04,
      volume: 12000 + index * 420,
    };
  });
  return {
    symbol: "ION",
    interval,
    poolAddress: "0xmock-ion-pool",
    bars,
    provenance: { source: "mock", note: "MOCK_DATA synthetic klines" },
  };
}

export const MOCK_DATA = {
  marketTickers: [
    {
      symbol: "ION",
      priceUsd: 6.02,
      displayPrice: "$6.02",
      change24hPct: 8.42,
      displayChange: "+8.42%",
      provenance: { source: "mock", note: "MOCK_DATA" },
    },
    {
      symbol: "BNB",
      priceUsd: 642.2,
      displayPrice: "$642.20",
      change24hPct: 1.18,
      displayChange: "+1.18%",
    },
    {
      symbol: "BTC",
      priceUsd: 103420,
      displayPrice: "$103,420",
      change24hPct: 0.74,
      displayChange: "+0.74%",
    },
    {
      symbol: "ETH",
      priceUsd: 4906,
      displayPrice: "$4,906",
      change24hPct: -0.38,
      displayChange: "-0.38%",
    },
    {
      symbol: "SOL",
      priceUsd: 218.3,
      displayPrice: "$218.30",
      change24hPct: 3.12,
      displayChange: "+3.12%",
    },
    {
      symbol: "USDT",
      priceUsd: 1,
      displayPrice: "$1.00",
      change24hPct: 0.01,
      displayChange: "+0.01%",
    },
  ] satisfies MarketTicker[],

  burnSummary: {
    totalBurnedIon: "12845000",
    bscBurnedIon: "8245000",
    ionMainnetBurnedIon: "4600000",
    remainingSupplyIon: "987155000",
    bscBurnAddress: "0x000000000000000000000000000000000000dEaD",
    ionBurnAddress: "ion-mainnet-burn-address-placeholder",
    ionBurnSource: "ion-mainnet-burn-source-placeholder",
  } satisfies BurnSummary,

  stakingSummary: {
    totalStakedIon: "452000000",
    officialStakedIon: "398000000",
    dexStakedIon: "54000000",
    lpStakedUsd: "12800000",
    apr: { officialPct: 18.2, dexPct: 25.5, lpMiningPct: 31.8 },
  } satisfies StakingSummary,

  bridgeRoutes: {
    routes: [
      {
        routeId: "bsc-ion-ion",
        fromChain: "BSC",
        toChain: "ION",
        asset: "ION",
        status: "mock",
        minAmountIon: "10.000",
        maxAmountIon: "500000.000",
        estimatedMinutes: 12,
        confirmationsRequired: 15,
        safeguards: ["vault-limit", "relayer-threshold", "replay-protection", "manual-pause"],
      },
      {
        routeId: "ion-bsc-ion",
        fromChain: "ION",
        toChain: "BSC",
        asset: "ION",
        status: "design",
        minAmountIon: "10.000",
        maxAmountIon: "250000.000",
        estimatedMinutes: 18,
        confirmationsRequired: 8,
        safeguards: ["release-limit", "relayer-threshold", "proof-audit-log", "manual-pause"],
      },
    ],
    relayerStatus: "mocked",
    verifier: {
      threshold: "3-of-5 draft",
      replayProtection: true,
      proofStatus: "planned",
    },
  } satisfies BridgeRoutesPayload,

  domainResolution: {
    name: "custodian.ion",
    available: true,
    ownerAddress: null,
    resolvedAddress: null,
    expiresAt: null,
    records: [],
    marketplace: {
      listed: true,
      floorIon: "2500.000",
      lastSaleIon: null,
    },
    provenance: {
      source: "mock",
      note: "MOCK_DATA domain preview",
    },
  } satisfies DomainResolution,

  defaultBscWalletBalance: {
    address: "0x0000000000000000000000000000000000000000",
    balanceWei: "1250000000000000000",
    balanceBnb: "1.25",
    chainId: 56,
    rpcUrl: "mock://bsc-static",
  } satisfies BscWalletBalance,

  buildTradeQuote,
  buildIonKlines,
} as const;

export type IonMockDataSnapshot = typeof MOCK_DATA;
