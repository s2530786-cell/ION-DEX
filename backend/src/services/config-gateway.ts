import { loadServerConfig, serverConfig } from "../config/server-config.js";
import { loadLivePublicConfig } from "./live/config-live.js";
import { getPublicConfig, type PublicConfig } from "./config.js";

export async function fetchPublicConfig(): Promise<PublicConfig> {
  const config = loadServerConfig();
  if (config.dataMode === "test-mock") {
    return getPublicConfig();
  }
  return loadLivePublicConfig(config);
}

export async function fetchBscWalletBalance(address: string): Promise<{
  address: string;
  balanceWei: string;
  balanceBnb: string;
  chainId: number;
  rpcUrl: string;
}> {
  const { fetchBscChainSnapshot, fetchBscNativeBalance } = await import("../upstream/bsc-rpc.js");
  const { formatUnits } = await import("./live/format-units.js");
  const config = serverConfig;
  const [chain, balanceWei] = await Promise.all([
    fetchBscChainSnapshot(config),
    fetchBscNativeBalance(config, address),
  ]);

  return {
    address: address.toLowerCase(),
    balanceWei: balanceWei.toString(),
    balanceBnb: formatUnits(balanceWei, 18),
    chainId: chain.chainId,
    rpcUrl: chain.rpcUrl,
  };
}
