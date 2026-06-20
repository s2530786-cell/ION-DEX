import { loadBackendDotEnv } from "./load-env.js";

loadBackendDotEnv();

export type DataMode = "live" | "auto" | "test-mock";

export type ServerConfig = {
  dataMode: DataMode;
  bscRpcUrl: string;
  ionApiBaseUrl: string;
  cmcApiKey: string | null;
  cmcApiBaseUrl: string;
  bscIonTokenAddress: string | null;
  bscChainId: number;
  httpTimeoutMs: number;
  bscBurnContractAddress: string | null;
  burnIndexerUrl: string | null;
  bscVaultLockAddress: string | null;
  bscLiquidityMineAddress: string | null;
};

const DEFAULT_BSC_RPC = "https://bsc-dataseed.binance.org/";
const DEFAULT_ION_API = "https://api.mainnet.ice.io/http/v2/";
const DEFAULT_CMC_API = "https://pro-api.coinmarketcap.com";

function parseDataMode(raw: string | undefined): DataMode {
  if (raw === "live" || raw === "auto" || raw === "test-mock") {
    return raw;
  }
  if (process.env.NODE_ENV === "test") {
    return "test-mock";
  }
  return "auto";
}

function parseChainId(raw: string | undefined): number {
  if (!raw) {
    return 56;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 56;
}

function parseOptionalAddress(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return null;
  }
  return /^0x[a-fA-F0-9]{40}$/.test(trimmed) ? trimmed.toLowerCase() : null;
}

export function loadServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const bscIon = env.BSC_ION_TOKEN_ADDRESS?.trim() || null;
  const normalizedIonToken =
    bscIon && /^0x[a-fA-F0-9]{40}$/.test(bscIon) ? bscIon.toLowerCase() : null;

  return {
    dataMode: parseDataMode(env.ION_DATA_MODE),
    bscRpcUrl: env.BSC_RPC_URL?.trim() || DEFAULT_BSC_RPC,
    ionApiBaseUrl: env.ION_CHAIN_RPC?.trim() || env.ION_API_BASE_URL?.trim() || DEFAULT_ION_API,
    cmcApiKey: env.CMC_API_KEY?.trim() || null,
    cmcApiBaseUrl: env.CMC_API_BASE_URL?.trim() || DEFAULT_CMC_API,
    bscIonTokenAddress: normalizedIonToken,
    bscChainId: parseChainId(env.BSC_CHAIN_ID),
    httpTimeoutMs: Number.parseInt(env.ION_HTTP_TIMEOUT_MS ?? "12000", 10) || 12000,
    bscBurnContractAddress: parseOptionalAddress(env.BSC_BURN_CONTRACT_ADDRESS),
    burnIndexerUrl: env.BURN_INDEXER_URL?.trim() || null,
    bscVaultLockAddress: parseOptionalAddress(env.BSC_VAULT_LOCK_ADDRESS),
    bscLiquidityMineAddress: parseOptionalAddress(env.BSC_LIQUIDITY_MINE_ADDRESS),
  };
}

export const serverConfig = loadServerConfig();
