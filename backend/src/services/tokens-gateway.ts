import { loadServerConfig } from "../config/server-config.js";
import { getBridgeRoutes, type BridgeRoutesPayload } from "./bridge.js";
import { loadLiveBridgeRoutes } from "./live/bridge-live.js";
import { loadLiveTokens } from "./live/tokens-live.js";
import { getTokens, type TokenMetadata } from "./tokens.js";

export async function fetchTokens(): Promise<TokenMetadata[]> {
  const config = loadServerConfig();
  if (config.dataMode === "test-mock") {
    return getTokens();
  }
  return loadLiveTokens(config);
}

export async function fetchBridgeRoutes(): Promise<BridgeRoutesPayload> {
  const config = loadServerConfig();
  if (config.dataMode === "test-mock") {
    return getBridgeRoutes();
  }
  return loadLiveBridgeRoutes(config);
}
