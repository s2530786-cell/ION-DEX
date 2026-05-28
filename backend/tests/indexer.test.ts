import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearIndexerReadCache,
  getIndexerReadCache,
  isIndexerCacheStale,
  setIndexerReadCache,
} from "../src/indexer/cache.js";
import { refreshIndexerReadCache } from "../src/indexer/index.js";
import { loadServerConfig } from "../src/config/server-config.js";

describe("indexer read cache", () => {
  it("marks cache stale after staleAfterMs", () => {
    const cache = {
      fetchedAt: "2020-01-01T00:00:00.000Z",
      staleAfterMs: 1,
      burn: {
        ion: {
          chain: "ion" as const,
          totalBurnedIon: null,
          note: "test",
          cursor: {
            chain: "ion" as const,
            kind: "burn" as const,
            lastBlock: null,
            lastUpdatedAt: "2020-01-01T00:00:00.000Z",
          },
        },
        bsc: {
          chain: "bsc" as const,
          totalBurnedIon: null,
          note: "test",
          cursor: {
            chain: "bsc" as const,
            kind: "burn" as const,
            lastBlock: null,
            lastUpdatedAt: "2020-01-01T00:00:00.000Z",
          },
        },
      },
      staking: {
        ion: {
          chain: "ion" as const,
          totalStakedIon: null,
          note: "test",
          cursor: {
            chain: "ion" as const,
            kind: "staking" as const,
            lastBlock: null,
            lastUpdatedAt: "2020-01-01T00:00:00.000Z",
          },
        },
        bsc: {
          chain: "bsc" as const,
          totalStakedIon: null,
          note: "test",
          cursor: {
            chain: "bsc" as const,
            kind: "staking" as const,
            lastBlock: null,
            lastUpdatedAt: "2020-01-01T00:00:00.000Z",
          },
        },
      },
    };

    setIndexerReadCache(cache);
    assert.equal(isIndexerCacheStale(cache), true);
    clearIndexerReadCache();
    assert.equal(getIndexerReadCache(), null);
  });

  it("refreshes ION/BSC indexer skeleton in test-mock mode", async () => {
    clearIndexerReadCache();
    const config = loadServerConfig();
    const cache = await refreshIndexerReadCache({
      ...config,
      dataMode: "test-mock",
    });

    assert.ok(cache.fetchedAt);
    assert.equal(cache.burn.ion.chain, "ion");
    assert.equal(cache.burn.bsc.chain, "bsc");
    assert.equal(cache.staking.ion.cursor.kind, "staking");
    assert.equal(getIndexerReadCache()?.fetchedAt, cache.fetchedAt);
    clearIndexerReadCache();
  });
});
