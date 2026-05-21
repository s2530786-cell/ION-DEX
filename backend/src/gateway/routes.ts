import type { IncomingMessage, ServerResponse } from "node:http";
import { apiError, apiResponse, writeJson, writeNoContent, type ApiMeta } from "./response.js";
import { systemClock, toIsoTimestamp, type Clock } from "../lib/clock.js";
import { getRequestId } from "../lib/request-id.js";
import { getPublicConfig } from "../services/config.js";
import { getMarketTickers } from "../services/markets.js";
import {
  getMarketCandles,
  getMarketDepthRows,
  getMarketOrderBook,
  getSwapMarketStats,
} from "../services/market-surface.js";
import { createQuote, QuoteInputError } from "../services/quotes.js";
import { getProfileSession } from "../services/profile.js";
import { getTokens } from "../services/tokens.js";

export type GatewayOptions = {
  clock?: Clock;
  startedAt?: Date;
};

export type HealthPayload = {
  status: "ok";
  service: "ion-dex-api-gateway";
  version: string;
  uptimeMs: number;
};

const defaultStartedAt = systemClock.now();

export function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: GatewayOptions = {},
): void {
  const clock = options.clock ?? systemClock;
  const startedAt = options.startedAt ?? defaultStartedAt;
  const requestId = getRequestId(request);
  const meta: ApiMeta = {
    source: "local",
    updatedAt: toIsoTimestamp(clock.now()),
    stale: false,
    requestId,
  };

  if (request.method === "OPTIONS") {
    writeNoContent(response);
    return;
  }

  if (request.method !== "GET") {
    writeJson(response, 405, apiError("method_not_allowed", "Only GET requests are supported.", meta));
    return;
  }

  const url = new URL(request.url ?? "/", "http://localhost");

  switch (url.pathname) {
    case "/api/health":
      writeJson(
        response,
        200,
        apiResponse<HealthPayload>(
          {
            status: "ok",
            service: "ion-dex-api-gateway",
            version: "0.1.0",
            uptimeMs: Math.max(0, clock.now().getTime() - startedAt.getTime()),
          },
          meta,
        ),
      );
      return;
    case "/api/config/public":
      writeJson(response, 200, apiResponse(getPublicConfig(), meta));
      return;
    case "/api/tokens":
      writeJson(response, 200, apiResponse(getTokens(), meta));
      return;
    case "/api/markets/tickers":
      writeJson(response, 200, apiResponse(getMarketTickers(), meta));
      return;
    case "/api/markets/depth":
      writeJson(response, 200, apiResponse(getMarketDepthRows(), meta));
      return;
    case "/api/markets/orderbook": {
      const symbol = url.searchParams.get("symbol") ?? "BNB/ION";
      writeJson(response, 200, apiResponse(getMarketOrderBook(symbol), meta));
      return;
    }
    case "/api/markets/candles": {
      const symbol = url.searchParams.get("symbol") ?? "BNB/ION";
      const interval = url.searchParams.get("interval") ?? "15m";
      const limit = Number(url.searchParams.get("limit") ?? "120");
      writeJson(response, 200, apiResponse(getMarketCandles(symbol, interval, limit), meta));
      return;
    }
    case "/api/markets/swap-stats": {
      const pair = url.searchParams.get("pair") ?? "BNB/ION";
      writeJson(response, 200, apiResponse(getSwapMarketStats(pair), meta));
      return;
    }
    case "/api/profile/session": {
      const provider = url.searchParams.get("provider");
      const address = url.searchParams.get("address") ?? undefined;
      const chainIdRaw = url.searchParams.get("chainId");
      const chainId =
        chainIdRaw !== null && chainIdRaw.length > 0 ? Number(chainIdRaw) : undefined;
      writeJson(
        response,
        200,
        apiResponse(
          getProfileSession({
            providerKey: provider,
            address,
            chainId: Number.isFinite(chainId) ? chainId : undefined,
          }),
          meta,
        ),
      );
      return;
    }
    case "/api/trade/quote": {
      const slippageBps = Number(url.searchParams.get("slippageBps"));
      try {
        const quote = createQuote({
          amountIn: url.searchParams.get("amountIn") ?? "",
          inputToken: url.searchParams.get("inputToken") ?? "",
          outputToken: url.searchParams.get("outputToken") ?? "",
          slippageBps,
        });
        writeJson(response, 200, apiResponse(quote, meta));
      } catch (error) {
        if (error instanceof QuoteInputError) {
          writeJson(response, 400, apiError("invalid_quote_request", error.message, meta));
          return;
        }
        throw error;
      }
      return;
    }
    default:
      writeJson(response, 404, apiError("not_found", `No route registered for ${url.pathname}.`, meta));
  }
}
