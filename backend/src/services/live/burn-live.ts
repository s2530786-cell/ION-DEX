import type { ServerConfig } from "../../config/server-config.js";
import { fetchBscChainSnapshot, fetchBscIonBurnedBalance } from "../../upstream/bsc-rpc.js";
import { enrichBurnSummaryWithIndexer, refreshIndexerReadCache } from "../../indexer/index.js";
import type { BurnSummary } from "../burn.js";
import { formatUnits } from "./format-units.js";

const ION_DECIMALS = 9;

export async function loadLiveBurnSummary(config: ServerConfig): Promise<BurnSummary> {
  const indexerCache = await refreshIndexerReadCache(config);
  const chain = await fetchBscChainSnapshot(config);

  if (!config.bscIonTokenAddress) {
    throw new Error(
      "BSC_ION_TOKEN_ADDRESS is not configured. Cannot read on-chain burn balance without the official BSC ION token contract.",
    );
  }

  const burned = await fetchBscIonBurnedBalance(config, config.bscIonTokenAddress);
  const bscBurnedIon = formatUnits(burned.burnedWei, ION_DECIMALS);

  return enrichBurnSummaryWithIndexer({
    totalBurnedIon: bscBurnedIon,
    bscBurnedIon,
    ionMainnetBurnedIon: "0",
    remainingSupplyIon: "0",
    bscBurnAddress: burned.burnAddress,
    ionBurnSource: "pending-official-ion-burn-address",
    windows: [
      { label: "24h", burnedIon: "0", trendPct: 0 },
      { label: "7d", burnedIon: "0", trendPct: 0 },
      { label: "30d", burnedIon: "0", trendPct: 0 },
    ],
    provenance: [
      {
        source: "bsc-indexer",
        status: "online",
        note: `BSC RPC ${chain.rpcUrl} block #${chain.blockNumber}; burn = ERC20 balanceOf(${burned.burnAddress}).`,
      },
      {
        source: "ion-indexer",
        status: "planned",
        note: "ION mainnet burn totals require official burn address + indexer (not guessed).",
      },
    ],
  }, indexerCache);
}
