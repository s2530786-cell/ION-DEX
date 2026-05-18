import type { CachePolicy, MemoryCache } from "../lib/cache.js";
import type { Clock } from "../lib/clock.js";
import type { ApiSource } from "../gateway/response.js";
import type {
  AdapterFetchResult,
  AdapterHealth,
  AdapterHealthSnapshot,
  AdapterProvenance,
  SourceAdapter,
  UpstreamKind,
} from "./types.js";

type CachedAdapterOptions<T, TParams> = {
  key: string;
  upstream: UpstreamKind;
  status: AdapterHealth;
  note: string;
  cache: MemoryCache;
  policy: CachePolicy;
  clock: Clock;
  cacheKey: (params: TParams) => string;
  load: (params: TParams) => T;
};

export class CachedSourceAdapter<T, TParams = void> implements SourceAdapter<T, TParams> {
  readonly key: string;
  readonly upstream: UpstreamKind;
  private readonly status: AdapterHealth;
  private readonly note: string;
  private readonly cache: MemoryCache;
  private readonly policy: CachePolicy;
  private readonly clock: Clock;
  private readonly cacheKey: (params: TParams) => string;
  private readonly load: (params: TParams) => T;
  private lastUpdatedAt: Date | null = null;
  private cacheEntryCount = 0;

  constructor(options: CachedAdapterOptions<T, TParams>) {
    this.key = options.key;
    this.upstream = options.upstream;
    this.status = options.status;
    this.note = options.note;
    this.cache = options.cache;
    this.policy = options.policy;
    this.clock = options.clock;
    this.cacheKey = options.cacheKey;
    this.load = options.load;
  }

  fetch(params: TParams): AdapterFetchResult<T> {
    const key = this.cacheKey(params);
    const lookup = this.cache.get<T>(key);

    if (lookup.hit) {
      this.lastUpdatedAt = lookup.entry.updatedAt;
      return {
        data: lookup.entry.value,
        source: "cache",
        updatedAt: lookup.entry.updatedAt,
        stale: !lookup.fresh,
        cacheHit: true,
        provenance: this.buildProvenance(),
      };
    }

    const data = this.load(params);
    const entry = this.cache.set(key, data, this.policy, this.clock);
    this.lastUpdatedAt = entry.updatedAt;
    this.cacheEntryCount += 1;

    return {
      data,
      source: "mock",
      updatedAt: entry.updatedAt,
      stale: false,
      cacheHit: false,
      provenance: this.buildProvenance(),
    };
  }

  getHealth(): AdapterHealthSnapshot {
    return {
      adapterKey: this.key,
      upstream: this.upstream,
      status: this.status,
      lastUpdatedAt: this.lastUpdatedAt ? this.lastUpdatedAt.toISOString() : null,
      cacheEntries: this.cacheEntryCount,
    };
  }

  private buildProvenance(): AdapterProvenance {
    return {
      adapterKey: this.key,
      upstream: this.upstream,
      status: this.status,
      note: this.note,
    };
  }
}

export function toApiMetaFromAdapter<T>(
  result: AdapterFetchResult<T>,
  requestId: string,
): {
  source: ApiSource;
  updatedAt: string;
  stale: boolean;
  requestId: string;
  cacheHit: boolean;
  adapter: string;
} {
  return {
    source: result.source,
    updatedAt: result.updatedAt.toISOString(),
    stale: result.stale,
    requestId,
    cacheHit: result.cacheHit,
    adapter: result.provenance.adapterKey,
  };
}
