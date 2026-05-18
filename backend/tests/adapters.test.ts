import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createAdapterRegistry } from "../src/adapters/registry.js";

describe("source adapters", () => {
  const clock = {
    now: () => new Date("2026-05-18T12:00:00.000Z"),
  };

  afterEach(() => {
    // no-op; each test uses its own registry instance
  });

  it("returns mock source on first fetch and cache source on second fetch", () => {
    const registry = createAdapterRegistry(clock);

    const first = registry.market.fetch();
    const second = registry.market.fetch();

    assert.equal(first.source, "mock");
    assert.equal(first.cacheHit, false);
    assert.equal(first.provenance.adapterKey, "market");
    assert.equal(second.source, "cache");
    assert.equal(second.cacheHit, true);
    assert.equal(second.stale, false);
  });

  it("exposes adapter health snapshots with upstream status", () => {
    const registry = createAdapterRegistry(clock);
    registry.burn.fetch();

    const health = registry.listHealth();
    const burn = health.find((entry) => entry.adapterKey === "burn");

    assert.ok(burn);
    assert.equal(burn?.upstream, "mock");
    assert.equal(burn?.status, "mocked");
    assert.match(burn?.lastUpdatedAt ?? "", /^2026-05-18T/);
  });

  it("caches domain resolutions per name", () => {
    const registry = createAdapterRegistry(clock);

    const first = registry.domain.fetch({ name: "demo.ion" });
    const second = registry.domain.fetch({ name: "demo.ion" });
    const other = registry.domain.fetch({ name: "other.ion" });

    assert.equal(first.cacheHit, false);
    assert.equal(second.cacheHit, true);
    assert.equal(other.cacheHit, false);
  });
});
