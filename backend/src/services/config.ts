import { listWalletEntries } from "./profile.js";

export type PublicConfig = {
  appName: string;
  environment: "local" | "test" | "preview";
  chainIds: {
    ion: string;
    bsc: number;
  };
  featureFlags: {
    backendGateway: boolean;
    walletAccess: boolean;
    realWalletAdapters: boolean;
    aiSentinel: boolean;
    bridgeTransfers: boolean;
  };
  supportedWallets: Array<{
    key: string;
    name: string;
    category: "ion-native" | "evm";
    status: "ready" | "planned" | "enabled";
    detector: string;
    label: string;
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
      ion: "ion-mainnet",
      bsc: 56,
    },
    featureFlags: {
      backendGateway: true,
      walletAccess: true,
      realWalletAdapters: true,
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
