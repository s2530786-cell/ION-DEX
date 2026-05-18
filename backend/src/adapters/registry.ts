import { defaultCachePolicies, MemoryCache } from "../lib/cache.js";
import { systemClock, type Clock } from "../lib/clock.js";
import { getBurnSummary, type BurnSummary } from "../services/burn.js";
import { resolveDomain, type DomainResolution } from "../services/domain.js";
import { getMarketTickers, type MarketTicker } from "../services/markets.js";
import { getStakingSummary, type StakingSummary } from "../services/staking.js";
import { CachedSourceAdapter } from "./cached-adapter.js";
import type { AdapterHealthSnapshot, SourceAdapter } from "./types.js";

export type AdapterRegistry = {
  market: SourceAdapter<MarketTicker[]>;
  burn: SourceAdapter<BurnSummary>;
  staking: SourceAdapter<StakingSummary>;
  domain: SourceAdapter<DomainResolution, { name: string }>;
  listHealth(): AdapterHealthSnapshot[];
  resetForTests(): void;
};

export function createAdapterRegistry(clock: Clock = systemClock): AdapterRegistry {
  const cache = new MemoryCache(clock);

  const market = new CachedSourceAdapter({
    key: "market",
    upstream: "mock",
    status: "mocked",
    note: "Phase 3 mock tickers via in-memory cache; CMC upstream adapter is planned.",
    cache,
    policy: defaultCachePolicies.market,
    clock,
    cacheKey: () => "market:tickers",
    load: () => getMarketTickers(),
  });

  const burn = new CachedSourceAdapter({
    key: "burn",
    upstream: "mock",
    status: "mocked",
    note: "Phase 3 mock burn summary; BSC and ION indexers are planned.",
    cache,
    policy: defaultCachePolicies.burn,
    clock,
    cacheKey: () => "burn:summary",
    load: () => getBurnSummary(),
  });

  const staking = new CachedSourceAdapter({
    key: "staking",
    upstream: "mock",
    status: "mocked",
    note: "Phase 3 mock staking totals; official and DEX staking sources are planned.",
    cache,
    policy: defaultCachePolicies.staking,
    clock,
    cacheKey: () => "staking:summary",
    load: () => getStakingSummary(),
  });

  const domain = new CachedSourceAdapter<DomainResolution, { name: string }>({
    key: "domain",
    upstream: "mock",
    status: "mocked",
    note: "Phase 3 mock .ion resolver; official ION DNS adapter is planned.",
    cache,
    policy: defaultCachePolicies.domain,
    clock,
    cacheKey: (params) => `domain:${params.name}`,
    load: (params) => resolveDomain(params.name),
  });

  return {
    market,
    burn,
    staking,
    domain,
    listHealth() {
      return [market, burn, staking, domain].map((adapter) => adapter.getHealth());
    },
    resetForTests() {
      cache.clear();
    },
  };
}

export const adapterRegistry = createAdapterRegistry();
