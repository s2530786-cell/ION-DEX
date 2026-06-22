import type { ServerConfig } from "../config/server-config.js";
import { loadServerConfig } from "../config/server-config.js";
import { defaultCachePolicies, MemoryCache } from "../lib/cache.js";
import { systemClock, type Clock } from "../lib/clock.js";
import { getBurnSummary, type BurnSummary } from "../services/burn.js";
import { resolveDomain, type DomainResolution } from "../services/domain.js";
import { loadLiveBurnSummary } from "../services/live/burn-live.js";
import { loadLiveMarketTickers } from "../services/live/markets-live.js";
import { loadLiveStakingSummary } from "../services/live/staking-live.js";
import { getMarketTickers, type MarketTicker } from "../services/markets.js";
import { getStakingSummary, type StakingSummary } from "../services/staking.js";
import { AsyncCachedSourceAdapter } from "./async-cached-adapter.js";
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

function useTestMock(config: ServerConfig): boolean {
  return config.dataMode === "test-mock";
}

export function createAdapterRegistry(
  clock: Clock = systemClock,
  config: ServerConfig = loadServerConfig(),
): AdapterRegistry {
  const cache = new MemoryCache(clock);

  if (useTestMock(config)) {
    const market = new CachedSourceAdapter({
      key: "market",
      upstream: "mock",
      status: "mocked",
      note: "Test-only mock tickers (ION_ALLOW_TEST_MOCK=1).",
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
      note: "Test-only mock burn summary.",
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
      note: "Test-only mock staking summary.",
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
      note: "Test-only mock domain resolver.",
      cache,
      policy: defaultCachePolicies.domain,
      clock,
      cacheKey: (params) => `domain:${params.name}`,
      load: (params) => resolveDomain(params.name),
    });

    return wrapRegistry(cache, market, burn, staking, domain);
  }

  const market = new AsyncCachedSourceAdapter({
    key: "market",
    upstream: "aggregated",
    status: "healthy",
    note: "Pancake×Binance ION price with Gecko/DexScreener/CMC fallbacks (15s cache).",
    cache,
    policy: defaultCachePolicies.market,
    clock,
    cacheKey: () => "market:tickers",
    load: () => loadLiveMarketTickers(config),
  });

  const burn = new AsyncCachedSourceAdapter({
    key: "burn",
    upstream: "bsc-indexer",
    status: "healthy",
    note: "BSC RPC ERC20 balanceOf burn address (requires BSC_ION_TOKEN_ADDRESS).",
    cache,
    policy: defaultCachePolicies.burn,
    clock,
    cacheKey: () => "burn:summary",
    load: () => loadLiveBurnSummary(config),
  });

  const staking = new AsyncCachedSourceAdapter({
    key: "staking",
    upstream: "ion-indexer",
    status: "healthy",
    note: "GeckoTerminal LP TVL + volume; official PoS totals via indexer when available.",
    cache,
    policy: defaultCachePolicies.staking,
    clock,
    cacheKey: () => "staking:summary",
    load: () => loadLiveStakingSummary(config),
  });

  const domain = new AsyncCachedSourceAdapter<DomainResolution, { name: string }>({
    key: "domain",
    upstream: "ion-dns",
    status: "planned",
    note: "ION DNS resolver requires official API; not available in live mode yet.",
    cache,
    policy: defaultCachePolicies.domain,
    clock,
    cacheKey: (params) => `domain:${params.name}`,
    load: async () => {
      throw new Error("ION DNS live resolver is not wired yet.");
    },
  });

  return wrapRegistry(cache, market, burn, staking, domain);
}

function wrapRegistry(
  cache: MemoryCache,
  market: SourceAdapter<MarketTicker[]>,
  burn: SourceAdapter<BurnSummary>,
  staking: SourceAdapter<StakingSummary>,
  domain: SourceAdapter<DomainResolution, { name: string }>,
): AdapterRegistry {
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
