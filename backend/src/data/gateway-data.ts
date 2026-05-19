import { toApiMetaFromAdapter } from "../adapters/cached-adapter.js";
import type { AdapterRegistry } from "../adapters/registry.js";
import { adapterRegistry } from "../adapters/registry.js";
import type { AdapterFetchResult } from "../adapters/types.js";
import { apiResponse, type ApiResponse } from "../gateway/response.js";
import type { BurnSummary } from "../services/burn.js";
import type { DomainResolution } from "../services/domain.js";
import type { MarketTicker } from "../services/markets.js";
import type { StakingSummary } from "../services/staking.js";

export type GatewayDataOptions = {
  registry?: AdapterRegistry;
};

async function withMeta<T>(
  resultPromise: Promise<AdapterFetchResult<T>>,
  requestId: string,
): Promise<ApiResponse<T>> {
  const result = await resultPromise;
  return apiResponse(result.data, toApiMetaFromAdapter(result, requestId));
}

export async function fetchMarketTickers(
  requestId: string,
  options: GatewayDataOptions = {},
): Promise<ApiResponse<MarketTicker[]>> {
  const registry = options.registry ?? adapterRegistry;
  return withMeta(registry.market.fetch(), requestId);
}

export async function fetchBurnSummary(
  requestId: string,
  options: GatewayDataOptions = {},
): Promise<ApiResponse<BurnSummary>> {
  const registry = options.registry ?? adapterRegistry;
  return withMeta(registry.burn.fetch(), requestId);
}

export async function fetchStakingSummary(
  requestId: string,
  options: GatewayDataOptions = {},
): Promise<ApiResponse<StakingSummary>> {
  const registry = options.registry ?? adapterRegistry;
  return withMeta(registry.staking.fetch(), requestId);
}

export async function fetchDomainResolution(
  name: string,
  requestId: string,
  options: GatewayDataOptions = {},
): Promise<ApiResponse<DomainResolution>> {
  const registry = options.registry ?? adapterRegistry;
  return withMeta(registry.domain.fetch({ name }), requestId);
}

export function listAdapterHealth(options: GatewayDataOptions = {}) {
  const registry = options.registry ?? adapterRegistry;
  return registry.listHealth();
}
