import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createAdapterRegistry } from "../src/adapters/registry.js";
import type { AdapterHealthSnapshot } from "../src/adapters/types.js";

describe("source adapters", () => {
  const clock = {
    now: () => new Date("2026-05-18T12:00:00.000Z"),
  };

  afterEach(() => {
    // no-op; each test uses its own registry instance
  });

  it("returns mock source on first fetch and cache source on second fetch", async () => {
    const registry = createAdapterRegistry(clock);

    const first = await registry.market.fetch();
    const second = await registry.market.fetch();

    assert.equal(first.source, "mock");
    assert.equal(first.cacheHit, false);
    assert.equal(first.provenance.adapterKey, "market");
    assert.equal(second.source, "cache");
    assert.equal(second.cacheHit, true);
    assert.equal(second.stale, false);
  });

  it("exposes adapter health snapshots with upstream status", async () => {
    const registry = createAdapterRegistry(clock);
    await registry.burn.fetch();

    const health = registry.listHealth();
    const burn = health.find((entry: AdapterHealthSnapshot) => entry.adapterKey === "burn");

    assert.ok(burn);
    assert.equal(burn?.upstream, "mock");
    assert.equal(burn?.status, "mocked");
    assert.match(burn?.lastUpdatedAt ?? "", /^2026-05-18T/);
  });

  it("caches domain resolutions per name", async () => {
    const registry = createAdapterRegistry(clock);

    const first = await registry.domain.fetch({ name: "demo.ion" });
    const second = await registry.domain.fetch({ name: "demo.ion" });
    const other = await registry.domain.fetch({ name: "other.ion" });

    assert.equal(first.cacheHit, false);
    assert.equal(second.cacheHit, true);
    assert.equal(other.cacheHit, false);
  });
});
