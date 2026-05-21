import type { ServerConfig } from "../../config/server-config.js";
import { fetchBscChainSnapshot } from "../../upstream/bsc-rpc.js";
import { probeIonApi } from "../../upstream/ion-api.js";
import type { PublicConfig } from "../config.js";
import { listWalletEntries } from "../profile.js";

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
    supportedWallets: listWalletEntries().map((wallet) => ({
      key: wallet.key,
      name: wallet.name,
      category: wallet.category,
      status: wallet.status,
      detector: wallet.detector,
      label: wallet.label,
    })),
    provenance: {
      source: "upstream",
      status: ion.reachable ? "healthy" : "degraded",
      note: `BSC chainId=${bsc.chainId} block=${bsc.blockNumber}; ION API ${ion.reachable ? "reachable" : "unreachable"}.`,
    },
  };
}
