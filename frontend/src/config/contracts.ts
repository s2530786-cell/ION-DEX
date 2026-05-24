/**
 * ION DEX contract addresses — single import surface for frontend.
 * Official BSC ION token + burn sink are confirmed; dex router/pool use Pancake references.
 */
import {
  BSC_CHAIN_ID,
  OFFICIAL_BSC_BURN_ADDRESS,
  OFFICIAL_BSC_ION_TOKEN,
  resolveBurnContractAddress,
  resolveVaultContractAddress,
} from "@/lib/integrationConfig";

export const PLACEHOLDER_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

const burnContractAddress =
  resolveBurnContractAddress() ?? PLACEHOLDER_ADDRESS;
const vaultLockAddress =
  resolveVaultContractAddress() ?? PLACEHOLDER_ADDRESS;

export const CONTRACTS = {
  ion: {
    token: {
      address: OFFICIAL_BSC_ION_TOKEN,
      chainId: BSC_CHAIN_ID,
      decimals: 18,
      symbol: "ION",
      name: "ION Token",
    },
  },
  dex: {
    router: {
      address: "0x10ED43C718714eb63d5aA57B78B54704E256024E" as const,
      chainId: BSC_CHAIN_ID,
    },
    factory: {
      address: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73" as const,
      chainId: BSC_CHAIN_ID,
    },
    pool: {
      address: "0x6487725b383954e05cA56F3c2B93a104B3DD2C25" as const,
      chainId: BSC_CHAIN_ID,
    },
    staking: {
      address: PLACEHOLDER_ADDRESS,
      chainId: BSC_CHAIN_ID,
    },
  },
  bridge: {
    inbox: {
      address: PLACEHOLDER_ADDRESS,
      chainId: BSC_CHAIN_ID,
    },
  },
  burn: {
    contract: {
      address: burnContractAddress,
      chainId: BSC_CHAIN_ID,
    },
    sink: {
      address: OFFICIAL_BSC_BURN_ADDRESS,
      chainId: BSC_CHAIN_ID,
    },
  },
  vault: {
    lock: {
      address: vaultLockAddress,
      chainId: BSC_CHAIN_ID,
    },
  },
  fee: {
    receiver: {
      address: "0x8ff2e1210434495c4f5629bd9d8bd4965a67b84c" as const,
      chainId: BSC_CHAIN_ID,
    },
    currency: "ION" as const,
    swapFee: 0.003,
    poolFee: 0.003,
    withdrawalFee: 0.001,
  },
} as const;

export function isDeployed(address: string): boolean {
  return address.toLowerCase() !== PLACEHOLDER_ADDRESS.toLowerCase();
}
