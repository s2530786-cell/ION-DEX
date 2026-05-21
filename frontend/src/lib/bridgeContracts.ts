import { type Address, parseAbi } from "viem";
import { OFFICIAL_BSC_ION_TOKEN_ADDRESS } from "@/lib/officialIonAddresses";

export const BSC_CHAIN_ID = 56;

export const ION_BSC_TOKEN =
  (import.meta.env.VITE_ION_BSC_TOKEN as Address | undefined) ??
  (OFFICIAL_BSC_ION_TOKEN_ADDRESS as Address);

export const USDT_BSC_TOKEN =
  (import.meta.env.VITE_USDT_BSC_TOKEN as Address | undefined) ??
  ("0x55d398326f99059fF775485246999027B3197955" as Address);

export const PANCAKE_ROUTER_BSC =
  "0x10ED43C718714eb63d5aA57B78B54704E256024E" as Address;

export const BSC_VAULT_ADDRESS = import.meta.env.VITE_BSC_VAULT_ADDRESS as Address | undefined;

export const BSC_BRIDGE_NATIVE_RECEIVER = import.meta.env.VITE_BSC_BRIDGE_NATIVE_RECEIVER as
  | Address
  | undefined;

/** Optional: official ice-swap Bridge / IONBridgeRouter on BSC (mint with oracle signatures). */
export const ION_BRIDGE_ROUTER_ADDRESS = import.meta.env.VITE_ION_BRIDGE_ROUTER_ADDRESS as
  | Address
  | undefined;

export const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

export const bscVaultAbi = parseAbi([
  "function deposit(address token, uint256 amount)",
]);

export type BridgeAsset = "usdt" | "bnb" | "ion";

export type BridgeDirection = "bsc-ion" | "ion-bsc";

/** Draft BSC vault deposit path (BSC → ION experiments only). */
export function bscVaultBridgeConfigured(): boolean {
  return Boolean(BSC_VAULT_ADDRESS);
}
