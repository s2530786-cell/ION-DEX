export type PublicConfig = {
  appName: string;
  environment: "local" | "test" | "preview";
  chainIds: {
    ion: string;
    bsc: number;
  };
  featureFlags: {
    backendGateway: boolean;
    walletShell: boolean;
    realWalletAdapters: boolean;
    aiSentinel: boolean;
    bridgeTransfers: boolean;
  };
  supportedWallets: Array<{
    key: string;
    name: string;
    status: "draft" | "planned" | "enabled";
  }>;
};

export function getPublicConfig(): PublicConfig {
  return {
    appName: "ION DEX",
    environment: "local",
    chainIds: {
      ion: "ion-mainnet-placeholder",
      bsc: 56,
    },
    featureFlags: {
      backendGateway: true,
      walletShell: true,
      realWalletAdapters: false,
      aiSentinel: false,
      bridgeTransfers: false,
    },
    supportedWallets: [
      { key: "online", name: "Online+ Wallet", status: "draft" },
      { key: "ion-browser", name: "ION Browser Wallet", status: "planned" },
      { key: "walletconnect", name: "WalletConnect / OKX", status: "draft" },
    ],
  };
}
