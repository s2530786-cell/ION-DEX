import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MemoryCache, defaultCachePolicies } from "../src/lib/cache.js";

describe("MemoryCache", () => {
  it("serves fresh entries within ttl", () => {
    let now = Date.parse("2026-05-18T00:00:00.000Z");
    const clock = { now: () => new Date(now) };
    const cache = new MemoryCache(clock);

    cache.set("market:tickers", ["ION"], defaultCachePolicies.market, clock);
    const lookup = cache.get<string[]>("market:tickers");

    assert.equal(lookup.hit, true);
    if (lookup.hit) {
      assert.equal(lookup.fresh, true);
      assert.deepEqual(lookup.entry.value, ["ION"]);
    }

    now += defaultCachePolicies.market.ttlMs - 1;
    const stillFresh = cache.get<string[]>("market:tickers");
    assert.equal(stillFresh.hit, true);
    if (stillFresh.hit) {
      assert.equal(stillFresh.fresh, true);
    }
  });

  it("marks entries stale after ttl but before stale window ends", () => {
    let now = Date.parse("2026-05-18T00:00:00.000Z");
    const clock = { now: () => new Date(now) };
    const cache = new MemoryCache(clock);

    cache.set("burn:summary", { total: "1" }, defaultCachePolicies.burn, clock);
    now += defaultCachePolicies.burn.ttlMs + 1;

    const staleLookup = cache.get<{ total: string }>("burn:summary");
    assert.equal(staleLookup.hit, true);
    if (staleLookup.hit) {
      assert.equal(staleLookup.fresh, false);
    }
  });

  it("evicts entries after stale window", () => {
    let now = Date.parse("2026-05-18T00:00:00.000Z");
    const clock = { now: () => new Date(now) };
    const cache = new MemoryCache(clock);

    cache.set("domain:demo.ion", { name: "demo.ion" }, defaultCachePolicies.domain, clock);
    now += defaultCachePolicies.domain.ttlMs + defaultCachePolicies.domain.staleTtlMs + 1;

    const lookup = cache.get<{ name: string }>("domain:demo.ion");
    assert.equal(lookup.hit, false);
  });
});
