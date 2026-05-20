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
  provenance: {
    source: "mock" | "upstream";
    status: "mocked" | "healthy" | "degraded";
    note: string;
  };
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
      { key: "online", name: "Online+ Wallet", status: "enabled" },
      { key: "ion-browser", name: "ION Browser Wallet", status: "enabled" },
      { key: "walletconnect", name: "TonConnect (ION)", status: "enabled" },
    ],
    provenance: {
      source: "mock",
      status: "mocked",
      note: "Public configuration is local Phase 3 mock data until official chain IDs and adapters are confirmed.",
    },
  };
}
