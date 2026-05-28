import type { DemoMarketTicker, DemoSwapToken } from "@/lib/integrationConfig.types";

/** Confirmed BSC mainnet chain id (wagmi bsc). */
export const BSC_CHAIN_ID = 56;

/** Scaffold only — ION native wallet branch in useWalletAggregator; not an official live EVM network id. */
export const ION_CHAIN_ID_SCAFFOLD = 2026;

export const OFFICIAL_BSC_ION_TOKEN = "0xe1ab61f7b093435204df32f5b3a405de55445ea8";
export const OFFICIAL_BSC_BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

/** Env placeholder until IonBurn is deployed — not the canonical BSC burn sink address. */
export const BURN_CONTRACT_ENV_PLACEHOLDER = "0x0000000000000000000000000000000000000000";

/** Env placeholder until VaultLock is deployed on BSC. */
export const VAULT_CONTRACT_ENV_PLACEHOLDER = "0x0000000000000000000000000000000000000000";

export const ION_MAINNET_BURN_SOURCE_PENDING = "ion-mainnet-burn-source-pending";

/** Explicit demo contracts for Approve manager scaffold — not real spenders. */
export const DEMO_APPROVAL_CONTRACTS = [
  {
    contract: "0x1111111111111111111111111111111111111111",
    allowance: "无限",
    flaggedUnlimited: true,
  },
  {
    contract: "0x2222222222222222222222222222222222222222",
    allowance: "2500 ION",
    flaggedUnlimited: false,
  },
  {
    contract: "0x3333333333333333333333333333333333333333",
    allowance: "无限",
    flaggedUnlimited: true,
  },
] as const;

/**
 * UI-only ticker rows when /api/market/tickers is unavailable.
 * Do not use for swap quotes — Swap uses backend GeckoTerminal-backed /api/trade/quote when live.
 */
export const DEMO_TICKER_FALLBACK: DemoMarketTicker[] = [
  {
    symbol: "ION",
    priceUsd: 6.02,
    displayPrice: "$6.02 (demo)",
    change24hPct: 8.42,
    displayChange: "+8.42%",
    provenance: { source: "demo-fallback", note: "Static UI fallback; fetch live tickers when API is up." },
  },
  {
    symbol: "BNB",
    priceUsd: 642.2,
    displayPrice: "$642.20 (demo)",
    change24hPct: 1.18,
    displayChange: "+1.18%",
    provenance: { source: "demo-fallback", note: "Static UI fallback; fetch live tickers when API is up." },
  },
  {
    symbol: "BTC",
    priceUsd: 103420,
    displayPrice: "$103,420 (demo)",
    change24hPct: 0.74,
    displayChange: "+0.74%",
  },
  {
    symbol: "ETH",
    priceUsd: 4906,
    displayPrice: "$4,906 (demo)",
    change24hPct: -0.38,
    displayChange: "-0.38%",
  },
  {
    symbol: "SOL",
    priceUsd: 218.3,
    displayPrice: "$218.30 (demo)",
    change24hPct: 3.12,
    displayChange: "+3.12%",
  },
  {
    symbol: "USDT",
    priceUsd: 1,
    displayPrice: "$1.00 (demo)",
    change24hPct: 0.01,
    displayChange: "+0.01%",
  },
];

export function resolveIonApiBaseUrl(): string {
  const relative = import.meta.env.VITE_ION_API_RELATIVE?.trim();
  if (relative === "1" || relative === "true") {
    return "";
  }
  const configured = import.meta.env.VITE_ION_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  // Dev: same-origin /api via Vite proxy — avoids localhost ↔ 127.0.0.1 CORS.
  if (import.meta.env.DEV) {
    return "";
  }
  return "http://127.0.0.1:8787";
}

/** AI 订阅 Python 服务（默认 :8000，与主 Node 网关分离） */
export function resolveAiSubscriptionApiUrl(): string {
  const configured = import.meta.env.VITE_AI_SUBSCRIPTION_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return "http://127.0.0.1:8000";
}

export function resolveAiIonTokenAddress(): string | null {
  const value = import.meta.env.VITE_AI_ION_TOKEN_ADDR?.trim();
  return value || OFFICIAL_BSC_ION_TOKEN;
}

export function resolveAiFeeReceiverAddress(): string | null {
  const value = import.meta.env.VITE_AI_FEE_RECEIVER?.trim();
  return value || null;
}

export function resolveBscRpcUrl(): string {
  return import.meta.env.VITE_BSC_RPC_URL?.trim() || "https://bsc-dataseed.binance.org/";
}

export function resolveVaultContractAddress(): string | null {
  const value = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS?.trim();
  return value ? value : null;
}

export function resolveBurnContractAddress(): string | null {
  const value = import.meta.env.VITE_BURN_CONTRACT_ADDRESS?.trim();
  return value ? value : null;
}

export function resolveBurnIndexerUrl(): string | null {
  const value = import.meta.env.VITE_BURN_INDEXER_URL?.trim();
  return value ? value : null;
}

export function resolveBatchTransferContractAddress(): string | null {
  const value = import.meta.env.VITE_BATCH_TRANSFER_CONTRACT_ADDRESS?.trim();
  return value ? value : null;
}

/** True when deploy-only secret is present locally — never log the key value. */
export function isVaultDeployerKeyConfigured(): boolean {
  return Boolean(import.meta.env.VITE_VAULT_DEPLOYER_KEY?.trim());
}

/** Demo USD rates for swap math when live tickers are unavailable — labeled demo in UI. */
export function demoSwapUsdRates(): Record<DemoSwapToken, number> {
  const rates: Record<DemoSwapToken, number> = { BNB: 642.2, ION: 6.02, USDT: 1 };
  for (const row of DEMO_TICKER_FALLBACK) {
    if (row.symbol === "BNB" || row.symbol === "ION" || row.symbol === "USDT") {
      rates[row.symbol] = row.priceUsd;
    }
  }
  return rates;
}

export function demoTickerPrice(symbol: string, fallbackUsd: number): number {
  return DEMO_TICKER_FALLBACK.find((row) => row.symbol === symbol)?.priceUsd ?? fallbackUsd;
}
