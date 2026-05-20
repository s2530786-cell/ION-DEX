/** Official ION browser extension injects `window.ton` (TonProvider). See ion-browser-wallet provider.js */

export type TonProviderLike = {
  isTonWallet?: boolean;
  isOpenMask?: boolean;
  isTonProvider?: boolean;
  send: (method: string, params?: unknown[]) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export type TonConnectBridgeLike = {
  connect: (protocolVersion: number, message: unknown) => Promise<unknown>;
  restoreConnection?: () => Promise<unknown>;
  disconnect?: () => Promise<unknown>;
};

export type IonWalletKind = "ion-browser" | "online" | "walletconnect";

export type IonWalletSnapshot = {
  kind: IonWalletKind;
  address: string;
  balanceIon: string | null;
  balanceSource: "extension" | "rpc" | "unavailable";
  network: string;
};

declare global {
  interface Window {
    ton?: TonProviderLike;
    tonwallet?: {
      provider?: TonProviderLike;
      tonconnect?: TonConnectBridgeLike;
    };
    tonProtocolVersion?: number;
    okxwallet?: { request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  }
}
