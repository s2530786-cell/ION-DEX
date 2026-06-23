export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export type InjectedEthereum = Eip1193Provider & {
  isMetaMask?: boolean;
};

import type { EvmWalletKind } from "@/wallet/evmConnectors";

export type EvmWalletSnapshot = {
  address: string;
  chainId: number;
  balanceBnb: string | null;
  balanceSource: "backend" | "unavailable";
  walletKind: EvmWalletKind | null;
};
