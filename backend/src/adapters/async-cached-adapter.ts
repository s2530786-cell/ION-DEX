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

type AsyncCachedAdapterOptions<T, TParams> = {
  key: string;
  upstream: UpstreamKind;
  status: AdapterHealth;
  note: string;
  cache: MemoryCache;
  policy: CachePolicy;
  clock: Clock;
  cacheKey: (params: TParams) => string;
  load: (params: TParams) => Promise<T>;
  resolveSource?: (cacheHit: boolean) => ApiSource;
};

export class AsyncCachedSourceAdapter<T, TParams = void> implements SourceAdapter<T, TParams> {
  readonly key: string;
  readonly upstream: UpstreamKind;
  private readonly status: AdapterHealth;
  private readonly note: string;
  private readonly cache: MemoryCache;
  private readonly policy: CachePolicy;
  private readonly clock: Clock;
  private readonly cacheKey: (params: TParams) => string;
  private readonly load: (params: TParams) => Promise<T>;
  private readonly resolveSource: (cacheHit: boolean) => ApiSource;
  private lastUpdatedAt: Date | null = null;
  private cacheEntryCount = 0;
  private lastError: string | null = null;

  constructor(options: AsyncCachedAdapterOptions<T, TParams>) {
    this.key = options.key;
    this.upstream = options.upstream;
    this.status = options.status;
    this.note = options.note;
    this.cache = options.cache;
    this.policy = options.policy;
    this.clock = options.clock;
    this.cacheKey = options.cacheKey;
    this.load = options.load;
    this.resolveSource = options.resolveSource ?? ((cacheHit) => (cacheHit ? "cache" : "upstream"));
  }

  async fetch(params: TParams): Promise<AdapterFetchResult<T>> {
    const key = this.cacheKey(params);
    const lookup = this.cache.get<T>(key);

    if (lookup.hit) {
      this.lastUpdatedAt = lookup.entry.updatedAt;
      return {
        data: lookup.entry.value,
        source: this.resolveSource(true),
        updatedAt: lookup.entry.updatedAt,
        stale: !lookup.fresh,
        cacheHit: true,
        provenance: this.buildProvenance(),
      };
    }

    try {
      const data = await this.load(params);
      const entry = this.cache.set(key, data, this.policy, this.clock);
      this.lastUpdatedAt = entry.updatedAt;
      this.cacheEntryCount += 1;
      this.lastError = null;

      return {
        data,
        source: this.resolveSource(false),
        updatedAt: entry.updatedAt,
        stale: false,
        cacheHit: false,
        provenance: this.buildProvenance(),
      };
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  getHealth(): AdapterHealthSnapshot {
    const status = this.lastError ? "degraded" : this.status;
    return {
      adapterKey: this.key,
      upstream: this.upstream,
      status,
      lastUpdatedAt: this.lastUpdatedAt ? this.lastUpdatedAt.toISOString() : null,
      cacheEntries: this.cacheEntryCount,
    };
  }

  private buildProvenance(): AdapterProvenance {
    return {
      adapterKey: this.key,
      upstream: this.upstream,
      status: this.lastError ? "degraded" : this.status,
      note: this.lastError ? `${this.note} Last error: ${this.lastError}` : this.note,
    };
  }
}
