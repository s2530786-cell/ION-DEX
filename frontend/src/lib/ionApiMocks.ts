import type { ApiResponse } from "@/lib/ionApi";
import { MOCK_DATA, mockPreviewMeta } from "@/lib/MOCK_DATA";
import type { KlineInterval } from "@/lib/ionApi";

/** @deprecated 预览模式请直接用 MOCK_DATA；仅供 ionApi 内部 Fallback 解析路径 */
export function mockApiMeta(adapter = "MOCK_DATA") {
  return mockPreviewMeta(adapter);
}

export const MOCK_MARKET_TICKERS = MOCK_DATA.marketTickers;
export const MOCK_BURN_SUMMARY = MOCK_DATA.burnSummary;
export const MOCK_STAKING_SUMMARY = MOCK_DATA.stakingSummary;
export const MOCK_BRIDGE_ROUTES = MOCK_DATA.bridgeRoutes;
export const MOCK_DOMAIN_RESOLUTION = MOCK_DATA.domainResolution;

export function mockTradeQuoteFromSearch(search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return MOCK_DATA.buildTradeQuote({
    amountIn: params.get("amountIn") ?? "1",
    inputToken: params.get("inputToken") ?? "BNB",
    outputToken: params.get("outputToken") ?? "ION",
    slippageBps: Number(params.get("slippageBps") ?? "50"),
  });
}

export function mockBscWalletBalance(address: string) {
  return { ...MOCK_DATA.defaultBscWalletBalance, address };
}

export function resolveStaticMockApi<T>(pathWithQuery: string): ApiResponse<T> {
  const [path, query = ""] = pathWithQuery.split("?");

  switch (path) {
    case "/api/markets/tickers":
      return { data: MOCK_DATA.marketTickers as T, meta: mockPreviewMeta("markets/tickers") };
    case "/api/burn/summary":
      return { data: MOCK_DATA.burnSummary as T, meta: mockPreviewMeta("burn/summary") };
    case "/api/staking/summary":
      return { data: MOCK_DATA.stakingSummary as T, meta: mockPreviewMeta("staking/summary") };
    case "/api/bridge/routes":
      return { data: MOCK_DATA.bridgeRoutes as T, meta: mockPreviewMeta("bridge/routes") };
    case "/api/domain/resolve": {
      const name = new URLSearchParams(query).get("name") ?? MOCK_DATA.domainResolution.name;
      return {
        data: { ...MOCK_DATA.domainResolution, name } as T,
        meta: mockPreviewMeta("domain/resolve"),
      };
    }
    case "/api/klines/ion": {
      const interval = (new URLSearchParams(query).get("interval") ?? "1h") as KlineInterval;
      return {
        data: MOCK_DATA.buildIonKlines(interval) as T,
        meta: mockPreviewMeta("klines/ion"),
      };
    }
    case "/api/trade/quote":
      return {
        data: mockTradeQuoteFromSearch(query ? `?${query}` : "") as T,
        meta: mockPreviewMeta("trade/quote"),
      };
    case "/api/wallet/bsc-balance": {
      const address =
        new URLSearchParams(query).get("address") ?? MOCK_DATA.defaultBscWalletBalance.address;
      return {
        data: mockBscWalletBalance(address) as T,
        meta: mockPreviewMeta("wallet/bsc-balance"),
      };
    }
    default:
      throw new Error(`No MOCK_DATA mapping for ${path}`);
  }
}
