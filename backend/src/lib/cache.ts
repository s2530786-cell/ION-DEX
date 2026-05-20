import { systemClock, type Clock } from "./clock.js";

export type CachePolicy = {
  ttlMs: number;
  staleTtlMs: number;
};

export type CacheEntry<T> = {
  value: T;
  updatedAt: Date;
  expiresAt: Date;
  staleUntil: Date;
};

export type CacheLookup<T> =
  | { hit: false }
  | { hit: true; entry: CacheEntry<T>; fresh: boolean };

export class MemoryCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly clock: Clock = systemClock) {}

  get<T>(key: string): CacheLookup<T> {
    const entry = this.entries.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return { hit: false };
    }
    const now = this.clock.now().getTime();
    if (now <= entry.expiresAt.getTime()) {
      return { hit: true, entry, fresh: true };
    }
    if (now <= entry.staleUntil.getTime()) {
      return { hit: true, entry, fresh: false };
    }
    this.entries.delete(key);
    return { hit: false };
  }

  set<T>(key: string, value: T, policy: CachePolicy, clock: Clock): CacheEntry<T> {
    const updatedAt = clock.now();
    const entry: CacheEntry<T> = {
      value,
      updatedAt,
      expiresAt: new Date(updatedAt.getTime() + policy.ttlMs),
      staleUntil: new Date(updatedAt.getTime() + policy.ttlMs + policy.staleTtlMs),
    };
    this.entries.set(key, entry as CacheEntry<unknown>);
    return entry;
  }

  clear(): void {
    this.entries.clear();
  }
}

export const defaultCachePolicies = {
  market: { ttlMs: 30_000, staleTtlMs: 120_000 },
  burn: { ttlMs: 60_000, staleTtlMs: 300_000 },
  staking: { ttlMs: 60_000, staleTtlMs: 300_000 },
  domain: { ttlMs: 300_000, staleTtlMs: 600_000 },
} as const satisfies Record<string, CachePolicy>;
