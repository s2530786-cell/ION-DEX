import { type Address, parseAbi } from "viem";
import { CONTRACTS, isDeployed } from "@/config/contracts";

export { BSC_CHAIN_ID } from "@/lib/integrationConfig";

export const ION_BSC_TOKEN = CONTRACTS.ion.token.address as Address;
export const USDT_BSC_TOKEN = "0x55d398326f99059fF775485246099027B3197955" as Address;
export const PANCAKE_ROUTER_BSC = CONTRACTS.dex.router.address as Address;
export const ION_LP_POOL_BSC = CONTRACTS.dex.pool.address as Address;

export const BSC_VAULT_ADDRESS = isDeployed(CONTRACTS.vault.lock.address)
  ? (CONTRACTS.vault.lock.address as Address)
  : (import.meta.env.VITE_BSC_VAULT_ADDRESS as Address | undefined);

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
