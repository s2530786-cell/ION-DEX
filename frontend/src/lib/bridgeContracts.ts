import { type Address, parseAbi } from "viem";
import { BSC_CHAIN_ID, OFFICIAL_BSC_ION_TOKEN } from "@/lib/integrationConfig";

export { BSC_CHAIN_ID };

export const ION_BSC_TOKEN =
  (import.meta.env.VITE_ION_BSC_TOKEN as Address | undefined) ??
  (OFFICIAL_BSC_ION_TOKEN as Address);

export const USDT_BSC_TOKEN =
  (import.meta.env.VITE_USDT_BSC_TOKEN as Address | undefined) ??
  ("0x55d398326f99059fF775485246099027B3197955" as Address);

export const PANCAKE_ROUTER_BSC =
  "0x10ED43C718714eb63d5aA57B78B54704E256024E" as Address;

export const BSC_VAULT_ADDRESS = import.meta.env.VITE_BSC_VAULT_ADDRESS as Address | undefined;

export const ION_WRAPPER_ADDRESS = import.meta.env.VITE_ION_WRAPPER_ADDRESS as Address | undefined;

export const BSC_BRIDGE_NATIVE_RECEIVER = import.meta.env.VITE_BSC_BRIDGE_NATIVE_RECEIVER as
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

export const ionWrapperAbi = parseAbi([
  "function burn(uint256 amount, bytes32 bridgeTxHash)",
]);

export type BridgeAsset = "usdt" | "bnb" | "ion";

export type BridgeDirection = "bsc-ion" | "ion-bsc";

export function bridgeContractsConfigured(): boolean {
  return Boolean(BSC_VAULT_ADDRESS && ION_WRAPPER_ADDRESS);
}

export function randomBridgeTxHash(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}
