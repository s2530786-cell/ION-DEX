import type { IncomingMessage, ServerResponse } from "node:http";
import { ApiErrorCodes, apiError, apiResponse, writeJson, writeNoContent, type ApiMeta } from "./response.js";
import { systemClock, toIsoTimestamp, type Clock } from "../lib/clock.js";
import { getRequestId } from "../lib/request-id.js";
import { validateIonDomainName } from "../lib/validation.js";
import {
  fetchBurnSummary,
  fetchDomainResolution,
  fetchMarketTickers,
  fetchStakingSummary,
  listAdapterHealth,
} from "../data/gateway-data.js";
import { getBridgeRoutes } from "../services/bridge.js";
import { getPublicConfig } from "../services/config.js";
import { getDemoProfile } from "../services/profile.js";
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
  dataSources: ReturnType<typeof listAdapterHealth>;
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
    writeNoContent(response, requestId);
    return;
  }

  if (request.method !== "GET") {
    writeJson(response, 405, apiError(ApiErrorCodes.methodNotAllowed, "Only GET requests are supported.", meta));
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
            dataSources: listAdapterHealth(),
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
      writeJson(response, 200, fetchMarketTickers(requestId));
      return;
    case "/api/burn/summary":
      writeJson(response, 200, fetchBurnSummary(requestId));
      return;
    case "/api/staking/summary":
      writeJson(response, 200, fetchStakingSummary(requestId));
      return;
    case "/api/bridge/routes":
      writeJson(response, 200, apiResponse(getBridgeRoutes(), meta));
      return;
    case "/api/domain/resolve": {
      const validation = validateIonDomainName(url.searchParams.get("name"));
      if (!validation.ok) {
        const code =
          validation.code === "missingDomainName" ? ApiErrorCodes.missingDomainName : ApiErrorCodes.invalidDomainName;
        writeJson(response, 400, apiError(code, validation.message, meta));
        return;
      }
      writeJson(response, 200, fetchDomainResolution(validation.value, requestId));
      return;
    }
    case "/api/profile/demo":
      writeJson(response, 200, apiResponse(getDemoProfile(), meta));
      return;
    default:
      writeJson(response, 404, apiError(ApiErrorCodes.notFound, "No route is registered for this path.", meta));
  }
}
