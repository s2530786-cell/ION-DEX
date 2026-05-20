import type { ServerConfig } from "../../config/server-config.js";
import { assertCmcConfigured, fetchCmcMarketTickers } from "../../upstream/cmc.js";
import { getMarketTickers, type MarketTicker } from "../markets.js";

/** Mock tickers used only when CMC is unavailable; swap amounts still come from Pancake in auto mode. */
function mockTickersForAuxiliaryPricing(): MarketTicker[] {
  return getMarketTickers();
}

export async function loadLiveMarketTickers(config: ServerConfig): Promise<MarketTicker[]> {
  if (!config.cmcApiKey) {
    if (config.dataMode === "live") {
      assertCmcConfigured(config);
    }
    return mockTickersForAuxiliaryPricing();
  }

  try {
    return await fetchCmcMarketTickers(config);
  } catch (error) {
    if (config.dataMode === "auto") {
      return mockTickersForAuxiliaryPricing();
    }
    throw error;
  }
}
