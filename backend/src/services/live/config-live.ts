import type { ServerConfig } from "../../config/server-config.js";
import { fetchBscChainSnapshot } from "../../upstream/bsc-rpc.js";
import { probeIonApi } from "../../upstream/ion-api.js";
import type { PublicConfig } from "../config.js";

export async function loadLivePublicConfig(config: ServerConfig): Promise<PublicConfig> {
  const [bsc, ion] = await Promise.all([fetchBscChainSnapshot(config), probeIonApi(config)]);

  return {
    appName: "ION DEX",
    environment: process.env.NODE_ENV === "production" ? "preview" : "local",
    chainIds: {
      ion: ion.reachable ? "ion-mainnet" : "ion-unreachable",
      bsc: bsc.chainId,
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
    ],
    provenance: {
      source: "upstream",
      status: ion.reachable ? "healthy" : "degraded",
      note: `BSC chainId=${bsc.chainId} block=${bsc.blockNumber}; ION API ${ion.reachable ? "reachable" : "unreachable"}.`,
    },
  };
}
