import { toApiMetaFromAdapter } from "../adapters/cached-adapter.js";
import type { AdapterRegistry } from "../adapters/registry.js";
import { adapterRegistry } from "../adapters/registry.js";
import { apiResponse, type ApiResponse } from "../gateway/response.js";
import type { BurnSummary } from "../services/burn.js";
import type { DomainResolution } from "../services/domain.js";
import type { MarketTicker } from "../services/markets.js";
import type { StakingSummary } from "../services/staking.js";

export type GatewayDataOptions = {
  registry?: AdapterRegistry;
};

import type { AdapterFetchResult } from "../adapters/types.js";

function withMeta<T>(result: AdapterFetchResult<T>, requestId: string): ApiResponse<T> {
  return apiResponse(result.data, toApiMetaFromAdapter(result, requestId));
}

export function fetchMarketTickers(requestId: string, options: GatewayDataOptions = {}): ApiResponse<MarketTicker[]> {
  const registry = options.registry ?? adapterRegistry;
  return withMeta(registry.market.fetch(), requestId);
}

export function fetchBurnSummary(requestId: string, options: GatewayDataOptions = {}): ApiResponse<BurnSummary> {
  const registry = options.registry ?? adapterRegistry;
  return withMeta(registry.burn.fetch(), requestId);
}

export function fetchStakingSummary(requestId: string, options: GatewayDataOptions = {}): ApiResponse<StakingSummary> {
  const registry = options.registry ?? adapterRegistry;
  return withMeta(registry.staking.fetch(), requestId);
}

export function fetchDomainResolution(
  name: string,
  requestId: string,
  options: GatewayDataOptions = {},
): ApiResponse<DomainResolution> {
  const registry = options.registry ?? adapterRegistry;
  return withMeta(registry.domain.fetch({ name }), requestId);
}

export function listAdapterHealth(options: GatewayDataOptions = {}) {
  const registry = options.registry ?? adapterRegistry;
  return registry.listHealth();
}
