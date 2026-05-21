import type { ServerConfig } from "../../config/server-config.js";
import { fetchCmcMarketTickers } from "../../upstream/cmc.js";
import type { MarketTicker } from "../markets.js";

export async function loadLiveMarketTickers(config: ServerConfig): Promise<MarketTicker[]> {
  return fetchCmcMarketTickers(config);
}
