import type { ServerConfig } from "../config/server-config.js";
import { fetchBscChainSnapshot, fetchBscIonBurnedBalance } from "../upstream/bsc-rpc.js";
import { formatUnits } from "../services/live/format-units.js";
import type { BurnIndexerSnapshot, IndexerEventCursor, StakingIndexerSnapshot } from "./types.js";

const ION_DECIMALS = 9;

function cursor(
  chain: "bsc",
  kind: "burn" | "staking",
  lastBlock: number | null,
): IndexerEventCursor {
  return {
    chain,
    kind,
    lastBlock,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function fetchBscBurnIndexerSnapshot(
  config: ServerConfig,
): Promise<BurnIndexerSnapshot> {
  if (!config.bscIonTokenAddress) {
    return {
      chain: "bsc",
      totalBurnedIon: null,
      note: "BSC_ION_TOKEN_ADDRESS unset; BSC burn indexer worker skipped.",
      cursor: cursor("bsc", "burn", null),
    };
  }

  try {
    const chain = await fetchBscChainSnapshot(config);
    const burned = await fetchBscIonBurnedBalance(config, config.bscIonTokenAddress);
    const totalBurnedIon = formatUnits(burned.burnedWei, ION_DECIMALS);
    return {
      chain: "bsc",
      totalBurnedIon,
      note: `BSC burn balance at ${burned.burnAddress} (block #${chain.blockNumber}).`,
      cursor: cursor("bsc", "burn", chain.blockNumber),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      chain: "bsc",
      totalBurnedIon: null,
      note: `BSC burn indexer worker failed: ${message}`,
      cursor: cursor("bsc", "burn", null),
    };
  }
}

export async function fetchBscStakingIndexerSnapshot(
  config: ServerConfig,
): Promise<StakingIndexerSnapshot> {
  try {
    const chain = await fetchBscChainSnapshot(config);
    return {
      chain: "bsc",
      totalStakedIon: null,
      note: `BSC RPC ${chain.rpcUrl} block #${chain.blockNumber}; LP staking events not indexed yet.`,
      cursor: cursor("bsc", "staking", chain.blockNumber),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      chain: "bsc",
      totalStakedIon: null,
      note: `BSC staking indexer worker failed: ${message}`,
      cursor: cursor("bsc", "staking", null),
    };
  }
}
