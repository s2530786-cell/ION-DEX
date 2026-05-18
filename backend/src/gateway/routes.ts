import type { IncomingMessage, ServerResponse } from "node:http";
import { apiError, apiResponse, writeJson, writeNoContent, type ApiMeta } from "./response.js";
import { systemClock, toIsoTimestamp, type Clock } from "../lib/clock.js";
import { getRequestId } from "../lib/request-id.js";
import { getPublicConfig } from "../services/config.js";
import { getMarketTickers } from "../services/markets.js";
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
    source: "mock",
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
    default:
      writeJson(response, 404, apiError("not_found", `No route registered for ${url.pathname}.`, meta));
  }
}
