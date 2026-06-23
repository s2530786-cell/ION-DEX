import type { Address, Hex } from 'viem';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      selectedAddress: string | null;
      chainId: string;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export {};
