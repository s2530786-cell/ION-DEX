import { bsc as wagmiBsc } from "wagmi/chains";
import type { Chain } from "viem";

export const bsc = wagmiBsc;

const scaffoldChainId = Number(import.meta.env.VITE_ION_SCAFFOLD_CHAIN_ID ?? "3333");
const scaffoldRpc =
  (import.meta.env.VITE_ION_SCAFFOLD_RPC_URL as string | undefined)?.trim() ||
  "http://127.0.0.1:8545";

export const ionScaffoldChain: Chain = {
  id: scaffoldChainId,
  name: "ION Scaffold",
  nativeCurrency: { name: "ION", symbol: "ION", decimals: 18 },
  rpcUrls: { default: { http: [scaffoldRpc] } },
  blockExplorers: { default: { name: "Explorer", url: "https://example.com" } },
};

export function evmChainLabel(chainId: number): string {
  if (chainId === bsc.id) {
    return "BNB Chain";
  }
  if (chainId === ionScaffoldChain.id) {
    return ionScaffoldChain.name;
  }
  return `Chain ${chainId}`;
}

