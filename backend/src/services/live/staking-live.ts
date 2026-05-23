import type { ServerConfig } from "../../config/server-config.js";
import { getGeckoIonPool } from "../../upstream/geckoterminal.js";
import type { StakingSummary } from "../staking.js";

export async function loadLiveStakingSummary(config: ServerConfig): Promise<StakingSummary> {
  const pool = await getGeckoIonPool(config.httpTimeoutMs);
  const lpStakedUsd = Number(pool.attributes.reserve_in_usd);
  const ionPriceUsd = Number(pool.attributes.base_token_price_usd);
  const lpStakedIon =
    ionPriceUsd > 0 && Number.isFinite(lpStakedUsd)
      ? (lpStakedUsd / ionPriceUsd).toFixed(3)
      : "0";

  return {
    totalStakedIon: lpStakedIon,
    officialStakedIon: "0",
    dexStakedIon: lpStakedIon,
    lpStakedUsd: Number.isFinite(lpStakedUsd) ? lpStakedUsd.toFixed(2) : "0.00",
    apr: {
      officialPct: 0,
      dexPct: 0,
      lpMiningPct: 0,
    },
    rewardAsset: "ION",
    lockOptions: [
      { label: "Flexible", days: 0, aprBoostPct: 0 },
      { label: "30 days", days: 30, aprBoostPct: 0 },
      { label: "90 days", days: 90, aprBoostPct: 0 },
    ],
    provenance: {
      source: "upstream",
      note: `GeckoTerminal ION/BNB LP pool reserve_in_usd=${pool.attributes.reserve_in_usd}; official PoS totals pending indexer.`,
    },
  };
}
