import type { ServerConfig } from "../config/server-config.js";
import { probeIonIndexer } from "../upstream/ion-indexer.js";
import type { BurnIndexerSnapshot, IndexerEventCursor, StakingIndexerSnapshot } from "./types.js";

function cursor(chain: "ion", kind: "burn" | "staking"): IndexerEventCursor {
  return {
    chain,
    kind,
    lastBlock: null,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function fetchIonBurnIndexerSnapshot(
  config: ServerConfig,
): Promise<BurnIndexerSnapshot> {
  const probe = await probeIonIndexer(config);
  return {
    chain: "ion",
    totalBurnedIon: null,
    note: probe.reachable
      ? `ION indexer reachable (${probe.baseUrl}); burn event stream wiring pending.`
      : `ION indexer unreachable: ${probe.note}`,
    cursor: cursor("ion", "burn"),
  };
}

export async function fetchIonStakingIndexerSnapshot(
  config: ServerConfig,
): Promise<StakingIndexerSnapshot> {
  const probe = await probeIonIndexer(config);
  return {
    chain: "ion",
    totalStakedIon: null,
    note: probe.reachable
      ? `ION indexer reachable (${probe.baseUrl}); staking totals route pending.`
      : `ION indexer unreachable: ${probe.note}`,
    cursor: cursor("ion", "staking"),
  };
}
