import type { IndexerReadCache } from "./types.js";

const DEFAULT_STALE_MS = 60_000;

let activeCache: IndexerReadCache | null = null;

export function setIndexerReadCache(cache: IndexerReadCache): void {
  activeCache = cache;
}

export function getIndexerReadCache(): IndexerReadCache | null {
  return activeCache;
}

export function clearIndexerReadCache(): void {
  activeCache = null;
}

export function isIndexerCacheStale(
  cache: IndexerReadCache,
  nowMs: number = Date.now(),
): boolean {
  const fetchedAt = Date.parse(cache.fetchedAt);
  if (!Number.isFinite(fetchedAt)) {
    return true;
  }
  return nowMs - fetchedAt > cache.staleAfterMs;
}

export function indexerCacheMeta(cache: IndexerReadCache | null): {
  source: "indexer-cache";
  status: "online" | "stale" | "empty";
  note: string;
} {
  if (!cache) {
    return {
      source: "indexer-cache",
      status: "empty",
      note: "Indexer read cache not warmed yet; workers have not published a snapshot.",
    };
  }
  if (isIndexerCacheStale(cache)) {
    return {
      source: "indexer-cache",
      status: "stale",
      note: `Indexer cache older than ${cache.staleAfterMs}ms (fetchedAt=${cache.fetchedAt}).`,
    };
  }
  return {
    source: "indexer-cache",
    status: "online",
    note: `Indexer cache fresh (fetchedAt=${cache.fetchedAt}).`,
  };
}

export function defaultStaleAfterMs(): number {
  return DEFAULT_STALE_MS;
}
