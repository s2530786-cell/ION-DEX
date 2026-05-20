export const WALLET_PROVIDER_KEYS = [
  "online",
  "ion-browser",
  "walletconnect",
  "metamask",
  "binance-web3",
  "okx-web3",
  "bitget-web3",
  "trust-wallet",
  "coinbase-wallet",
  "rabby",
] as const;

export type WalletProviderKey = (typeof WALLET_PROVIDER_KEYS)[number];

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
  isCoinbaseWallet?: boolean;
  isTrust?: boolean;
  providers?: Eip1193Provider[];
};

export type WalletProbeResult = {
  key: WalletProviderKey;
  detected: boolean;
  detector: string;
  provider: Eip1193Provider | null;
  note: string;
};

export type WalletDetectionSnapshot = {
  scannedAt: string;
  probes: WalletProbeResult[];
  installedCount: number;
};

export type LiveWalletConnection = {
  providerKey: WalletProviderKey;
  address: string;
  chainId: number;
  networkLabel: string;
  addressFormat: string;
  detectionSource: "browser-injected" | "tonconnect-remote";
  /** Official ion-gateway js bridge key (ionmask / tonwallet) when connected via TonConnect injection */
  bridgeKey?: string;
  bridgeField?: "ionconnect" | "tonconnect";
};

export type WalletConnectResult =
  | { ok: true; connection: LiveWalletConnection }
  | {
      ok: false;
      code: "not_detected" | "user_rejected" | "unsupported" | "provider_error" | "awaiting_wallet";
      message: string;
      universalLink?: string;
      walletName?: string;
    };
