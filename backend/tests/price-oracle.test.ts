import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateOracleQuotes,
  ION_DEX_ORACLE_PLATFORM_REGISTRY,
} from "../src/services/price-oracle.js";

describe("price oracle aggregator", () => {
  it("registry lists 20+ DEX/quote platforms", () => {
    assert.ok(ION_DEX_ORACLE_PLATFORM_REGISTRY.length >= 20);
    const active = ION_DEX_ORACLE_PLATFORM_REGISTRY.filter((p) => p.status === "active");
    assert.ok(active.length >= 4);
  });

  it("rejects single-source manipulation (needs quorum)", () => {
    assert.throws(
      () =>
        aggregateOracleQuotes([
          {
            platformId: "evil",
            priceUsd: 999,
            change24hPct: 0,
            liquidityUsd: null,
            weight: 1,
            ok: true,
          },
        ]),
      /quorum not met/,
    );
  });

  it("deviation filter drops outlier far from cluster", () => {
    const result = aggregateOracleQuotes(
      [
        { platformId: "a", priceUsd: 0.00013, change24hPct: 0, liquidityUsd: 1000, weight: 1, ok: true },
        { platformId: "b", priceUsd: 0.000131, change24hPct: 0, liquidityUsd: 1000, weight: 1, ok: true },
        { platformId: "c", priceUsd: 0.000129, change24hPct: 0, liquidityUsd: 1000, weight: 1, ok: true },
        { platformId: "attack", priceUsd: 3.08, change24hPct: 0, liquidityUsd: 1, weight: 1, ok: true },
      ],
      { minQuorum: 2, maxDeviationBps: 2500 },
    );
    assert.ok(result.priceUsd < 0.001);
    assert.ok(result.priceUsd > 0.0001);
    assert.equal(result.rejected.length, 1);
    assert.equal(result.rejected[0]?.platformId, "attack");
    assert.equal(result.rejected[0]?.rejectReason, "outlier");
    assert.equal(result.method, "weighted-median");
  });

  it("weighted-median prefers heavier trusted feed", () => {
    const result = aggregateOracleQuotes(
      [
        { platformId: "light-a", priceUsd: 0.00012, change24hPct: 0, liquidityUsd: 100, weight: 0.5, ok: true },
        { platformId: "heavy", priceUsd: 0.0002, change24hPct: 0, liquidityUsd: 1000000, weight: 10, ok: true },
        { platformId: "light-b", priceUsd: 0.00011, change24hPct: 0, liquidityUsd: 100, weight: 0.5, ok: true },
      ],
      { minQuorum: 2, maxDeviationBps: 10000 },
    );
    assert.equal(result.priceUsd, 0.0002);
    assert.equal(result.rejected.length, 0);
  });

  it("includes feed_error entries in rejected list for transparency", () => {
    const result = aggregateOracleQuotes(
      [
        { platformId: "ok-a", priceUsd: 0.00013, change24hPct: 0, liquidityUsd: 1000, weight: 1, ok: true },
        { platformId: "ok-b", priceUsd: 0.000131, change24hPct: 0, liquidityUsd: 1000, weight: 1, ok: true },
        {
          platformId: "down-feed",
          priceUsd: 0,
          change24hPct: null,
          liquidityUsd: null,
          weight: 1,
          ok: false,
          error: "timeout",
        },
      ],
      { minQuorum: 2, maxDeviationBps: 2500 },
    );

    assert.equal(result.rejected.length, 1);
    assert.equal(result.rejected[0]?.platformId, "down-feed");
    assert.equal(result.rejected[0]?.rejectReason, "feed_error");
    assert.equal(result.rejected[0]?.error, "timeout");
  });
});
