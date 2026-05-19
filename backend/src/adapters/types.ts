import type { ApiSource } from "../gateway/response.js";

export type AdapterHealth = "mocked" | "planned" | "healthy" | "degraded" | "offline";

export type UpstreamKind = "mock" | "cmc" | "bsc-indexer" | "ion-indexer" | "ion-dns";

export type AdapterProvenance = {
  adapterKey: string;
  upstream: UpstreamKind;
  status: AdapterHealth;
  note: string;
};

export type AdapterFetchResult<T> = {
  data: T;
  source: ApiSource;
  updatedAt: Date;
  stale: boolean;
  cacheHit: boolean;
  provenance: AdapterProvenance;
};

export type AdapterHealthSnapshot = {
  adapterKey: string;
  upstream: UpstreamKind;
  status: AdapterHealth;
  lastUpdatedAt: string | null;
  cacheEntries: number;
};

export interface SourceAdapter<T, TParams = void> {
  readonly key: string;
  readonly upstream: UpstreamKind;
  fetch(params: TParams): Promise<AdapterFetchResult<T>>;
  getHealth(): AdapterHealthSnapshot;
}
