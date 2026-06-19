import {
  BSC_BURN_ADDRESS,
  BSC_ION_TOKEN,
  BSC_USDT_TOKEN,
  ION_BSC_LP_POOL,
  BSC_BURN_CONTRACT_PLACEHOLDER,
  BSC_VAULT_LOCK_PLACEHOLDER,
} from "../constants/official-ion-addresses.js";

const PENDING_DEPLOY = "0x0000000000000000000000000000000000000000";

export const CONTRACTS = {
  ion: {
    tokenAddress: BSC_ION_TOKEN,
    chainId: 56,
    burnSink: BSC_BURN_ADDRESS,
  },
  dex: {
    lpPool: ION_BSC_LP_POOL,
    usdtToken: BSC_USDT_TOKEN,
  },
  bridge: {
    inboxAddress: PENDING_DEPLOY,
  },
  burn: {
    contractAddress: BSC_BURN_CONTRACT_PLACEHOLDER,
  },
  vault: {
    lockAddress: BSC_VAULT_LOCK_PLACEHOLDER,
  },
  batchTransfer: {
    contractAddress:
      process.env.BATCH_TRANSFER_CONTRACT_ADDRESS?.trim().toLowerCase() || PENDING_DEPLOY,
  },
  rpc: {
    bsc: process.env.BSC_RPC_URL ?? "https://bsc-dataseed.binance.org/",
    ion: process.env.ION_RPC_URL ?? "https://api.mainnet.ice.io",
  },
  apis: {
    geckoterminal: {
      baseUrl: "https://api.geckoterminal.com/api/v2",
      poolId: ION_BSC_LP_POOL,
    },
  },
  fees: {
    currency: "ION" as const,
    swapFee: 0.003,
    poolFee: 0.003,
    withdrawalFee: 0.001,
  },
} as const;

export function isDeployed(address: string): boolean {
  return address.toLowerCase() !== PENDING_DEPLOY.toLowerCase();
}
