import type { ServerConfig } from "../../config/server-config.js";
import { buildLiveMarketTickers } from "../price-engine.js";
import type { MarketTicker } from "../markets.js";

export async function loadLiveMarketTickers(config: ServerConfig): Promise<MarketTicker[]> {
  return buildLiveMarketTickers(config);
}
