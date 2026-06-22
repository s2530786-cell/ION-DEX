import type { ServerConfig } from "../config/server-config.js";
import type { BurnSummary } from "../services/burn.js";
import type { BridgeRoutesPayload } from "../services/bridge.js";
import type { StakingSummary } from "../services/staking.js";
import { fetchBscBurnIndexerSnapshot, fetchBscStakingIndexerSnapshot } from "./bsc-worker.js";
import {
  defaultStaleAfterMs,
  getIndexerReadCache,
  indexerCacheMeta,
  setIndexerReadCache,
} from "./cache.js";
import { fetchIonBurnIndexerSnapshot, fetchIonStakingIndexerSnapshot } from "./ion-worker.js";
import type { IndexerReadCache } from "./types.js";

export type { IndexerReadCache } from "./types.js";
export { buildBurnReconcileReport } from "./reconcile-burn.js";
export type { BurnReconcileReport, BurnReconcileRow } from "./reconcile-burn.js";

export async function refreshIndexerReadCache(
  config: ServerConfig,
): Promise<IndexerReadCache> {
  const [burnIon, burnBsc, stakingIon, stakingBsc] = await Promise.all([
    fetchIonBurnIndexerSnapshot(config),
    fetchBscBurnIndexerSnapshot(config),
    fetchIonStakingIndexerSnapshot(config),
    fetchBscStakingIndexerSnapshot(config),
  ]);

  const cache: IndexerReadCache = {
    fetchedAt: new Date().toISOString(),
    staleAfterMs: defaultStaleAfterMs(),
    burn: { ion: burnIon, bsc: burnBsc },
    staking: { ion: stakingIon, bsc: stakingBsc },
  };

  setIndexerReadCache(cache);
  return cache;
}

export function enrichBurnSummaryWithIndexer(
  summary: BurnSummary,
  cache: IndexerReadCache | null = getIndexerReadCache(),
): BurnSummary {
  const meta = indexerCacheMeta(cache);
  const provenance = [...summary.provenance];
  const cacheIndex = provenance.findIndex((entry) => entry.source === "indexer-cache");
  const cacheEntry = {
    source: "indexer-cache" as const,
    status:
      meta.status === "online"
        ? ("online" as const)
        : meta.status === "stale"
          ? ("planned" as const)
          : ("planned" as const),
    note: meta.note,
  };

  if (cacheIndex >= 0) {
    provenance[cacheIndex] = cacheEntry;
  } else {
    provenance.push(cacheEntry);
  }

  if (cache?.burn.bsc.totalBurnedIon) {
    return {
      ...summary,
      bscBurnedIon: cache.burn.bsc.totalBurnedIon,
      totalBurnedIon: cache.burn.bsc.totalBurnedIon,
      provenance: provenance.map((entry) =>
        entry.source === "bsc-indexer"
          ? { ...entry, status: "online" as const, note: cache.burn.bsc.note }
          : entry,
      ),
    };
  }

  return { ...summary, provenance };
}

export function enrichStakingSummaryWithIndexer(
  summary: StakingSummary,
  cache: IndexerReadCache | null = getIndexerReadCache(),
): StakingSummary {
  const meta = indexerCacheMeta(cache);
  const note = [summary.provenance.note, meta.note].filter(Boolean).join(" ");
  return {
    ...summary,
    provenance: {
      source: cache && meta.status === "online" ? "upstream" : summary.provenance.source,
      note,
    },
  };
}

export function enrichBridgeRoutesWithIndexer(
  payload: BridgeRoutesPayload,
  cache: IndexerReadCache | null = getIndexerReadCache(),
): BridgeRoutesPayload {
  const meta = indexerCacheMeta(cache);
  const base = payload.provenance;
  return {
    ...payload,
    provenance: {
      source: meta.status === "online" ? "upstream" : (base?.source ?? "mock"),
      note: `${base?.note ?? ""} ${meta.note}`.trim(),
    },
  };
}
