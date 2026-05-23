import { CONTRACTS } from "../config/contracts.js";

export type PublicConfig = {
  appName: string;
  environment: "local" | "test" | "preview";
  chainIds: {
    ion: string;
    bsc: number;
  };
  fees: {
    currency: "ION";
    swapFee: number;
    poolFee: number;
    withdrawalFee: number;
  };
  contracts: {
    ionToken: string;
    lpPool: string;
    burnSink: string;
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
    fees: {
      currency: CONTRACTS.fees.currency,
      swapFee: CONTRACTS.fees.swapFee,
      poolFee: CONTRACTS.fees.poolFee,
      withdrawalFee: CONTRACTS.fees.withdrawalFee,
    },
    contracts: {
      ionToken: CONTRACTS.ion.tokenAddress,
      lpPool: CONTRACTS.dex.lpPool,
      burnSink: CONTRACTS.ion.burnSink,
    },
    featureFlags: {
      backendGateway: true,
      walletAccess: true,
      realWalletAdapters: true,
      aiSentinel: false,
      bridgeTransfers: false,
    },
    supportedWallets: [
      {
        key: "online",
        name: "Online+ Wallet",
        label: "Online+",
        category: "ion-native",
        status: "enabled",
        detector: "window.ion / ionmask",
      },
      {
        key: "ion-browser",
        name: "ION Browser Wallet",
        label: "ION Browser",
        category: "ion-native",
        status: "enabled",
        detector: "window.ton",
      },
      {
        key: "walletconnect",
        name: "TonConnect (ION)",
        label: "WalletConnect",
        category: "ion-native",
        status: "enabled",
        detector: "@ion-gateway/sdk",
      },
      {
        key: "metamask",
        name: "MetaMask",
        label: "MetaMask",
        category: "evm",
        status: "enabled",
        detector: "window.ethereum",
      },
      {
        key: "okx",
        name: "OKX Web3",
        label: "OKX",
        category: "evm",
        status: "enabled",
        detector: "window.okxwallet",
      },
      {
        key: "bitget",
        name: "Bitget Web3",
        label: "Bitget",
        category: "evm",
        status: "enabled",
        detector: "window.bitkeep",
      },
      {
        key: "trust",
        name: "Trust Wallet",
        label: "Trust",
        category: "evm",
        status: "enabled",
        detector: "window.trustwallet",
      },
    ],
    provenance: {
      source: "mock",
      status: "mocked",
      note: "Public configuration is local Phase 3 mock data until official chain IDs and adapters are confirmed.",
    },
  };
}
