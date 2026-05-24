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
import { fetchBscWalletBalance, fetchPublicConfig } from "../services/config-gateway.js";
import { fetchBridgeRoutes, fetchTokens } from "../services/tokens-gateway.js";
import { getDemoProfile } from "../services/profile.js";
import { fetchIonPortfolio, fetchPortfolio } from "../services/portfolio.js";
import { createQuote, QuoteInputError } from "../services/quotes.js";
import { getDatabaseHealth } from "../db/index.js";
import { loadServerConfig } from "../config/server-config.js";

export type GatewayOptions = {
  clock?: Clock;
  startedAt?: Date;
};

export type DatabaseHealthPayload = {
  driver: "sqlite" | "postgres" | "disabled";
  status: "ok" | "disabled" | "error";
  path?: string;
  migrationsApplied: string[];
  tableCount?: number;
  message?: string;
};

export type HealthPayload = {
  status: "ok";
  service: "ion-dex-api-gateway";
  version: string;
  uptimeMs: number;
  dataSources: ReturnType<typeof listAdapterHealth>;
  database: DatabaseHealthPayload;
};

const defaultStartedAt = systemClock.now();
const evmAddressPattern = /^0x[a-fA-F0-9]{40}$/;

function buildMeta(clock: Clock, requestId: string, source: ApiMeta["source"] = "upstream"): ApiMeta {
  return {
    source,
    updatedAt: toIsoTimestamp(clock.now()),
    stale: false,
    requestId,
  };
}

export async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: GatewayOptions = {},
): Promise<void> {
  const clock = options.clock ?? systemClock;
  const startedAt = options.startedAt ?? defaultStartedAt;
  const requestId = getRequestId(request);
  const meta = buildMeta(
    clock,
    requestId,
    loadServerConfig().dataMode === "test-mock" ? "mock" : "upstream",
  );

  if (request.method === "OPTIONS") {
    writeNoContent(response, requestId);
    return;
  }

  if (request.method !== "GET") {
    writeJson(response, 405, apiError(ApiErrorCodes.methodNotAllowed, "Only GET requests are supported.", meta));
    return;
  }

  const url = new URL(request.url ?? "/", "http://localhost");

  try {
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
              database: getDatabaseHealth(),
            },
            buildMeta(clock, requestId, "local"),
          ),
        );
        return;
      case "/api/config/public": {
        const config = await fetchPublicConfig();
        writeJson(response, 200, apiResponse(config, meta));
        return;
      }
      case "/api/tokens": {
        const tokens = await fetchTokens();
        writeJson(
          response,
          200,
          apiResponse(tokens, buildMeta(clock, requestId, loadServerConfig().dataMode === "test-mock" ? "mock" : "upstream")),
        );
        return;
      }
      case "/api/markets/tickers": {
        const payload = await fetchMarketTickers(requestId);
        writeJson(response, 200, payload);
        return;
      }
      case "/api/burn/summary": {
        const payload = await fetchBurnSummary(requestId);
        writeJson(response, 200, payload);
        return;
      }
      case "/api/staking/summary": {
        const payload = await fetchStakingSummary(requestId);
        writeJson(response, 200, payload);
        return;
      }
      case "/api/wallet/bsc-balance": {
        const address = url.searchParams.get("address")?.trim() ?? "";
        if (!evmAddressPattern.test(address)) {
          writeJson(
            response,
            400,
            apiError(ApiErrorCodes.invalidAddress, "Query parameter address must be a valid EVM address.", meta),
          );
          return;
        }
        const balance = await fetchBscWalletBalance(address);
        writeJson(response, 200, apiResponse(balance, meta));
        return;
      }
      case "/api/bridge/routes": {
        const bridge = await fetchBridgeRoutes();
        writeJson(
          response,
          200,
          apiResponse(bridge, buildMeta(clock, requestId, loadServerConfig().dataMode === "test-mock" ? "mock" : "upstream")),
        );
        return;
      }
      case "/api/domain/resolve": {
        const validation = validateIonDomainName(url.searchParams.get("name"));
        if (!validation.ok) {
          const code =
            validation.code === "missingDomainName"
              ? ApiErrorCodes.missingDomainName
              : ApiErrorCodes.invalidDomainName;
          writeJson(response, 400, apiError(code, validation.message, meta));
          return;
        }
        const payload = await fetchDomainResolution(validation.value, requestId);
        writeJson(response, 200, payload);
        return;
      }
      case "/api/trade/quote": {
        const inputToken = url.searchParams.get("inputToken")?.trim() ?? "";
        const outputToken = url.searchParams.get("outputToken")?.trim() ?? "";
        const amountIn = url.searchParams.get("amountIn")?.trim() ?? "";
        const slippageRaw = url.searchParams.get("slippageBps")?.trim() ?? "";
        const slippageBps = Number.parseInt(slippageRaw, 10);

        if (!inputToken || !outputToken || !amountIn || !Number.isFinite(slippageBps)) {
          writeJson(
            response,
            400,
            apiError(ApiErrorCodes.invalidQuoteRequest, "inputToken, outputToken, amountIn, and slippageBps are required.", meta),
          );
          return;







          
        }

        try {
          const quote = await createQuote({ inputToken, outputToken, amountIn, slippageBps });
          writeJson(response, 200, apiResponse(quote, meta));
        } catch (error) {
          if (error instanceof QuoteInputError) {
            writeJson(
              response,
              400,
              apiError(ApiErrorCodes.invalidQuoteRequest, error.message, meta),
            );
            return;
          }
          throw error;
        }
        return;
      }
      case "/api/profile/demo":
        writeJson(response, 200, apiResponse(getDemoProfile(), buildMeta(clock, requestId, "mock")));
        return;
      case "/api/portfolio":
        await routePortfolio(url, response, meta);
        return;
      case "/api/portfolio/ion":
        await routeIonPortfolio(url, response, meta);
        return;
      default:
        writeJson(response, 404, apiError(ApiErrorCodes.notFound, "No route is registered for this path.", meta));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeJson(
      response,
      503,
      apiError(
        ApiErrorCodes.dataUnavailable,
        message,
        meta,
      ),
    );
  }
}

async function routeIonPortfolio(url: URL, response: ServerResponse, meta: ApiMeta): Promise<void> {
  const address = url.searchParams.get("address")?.trim() ?? "";
  if (!address) {
    writeJson(response, 400, apiError(ApiErrorCodes.invalidAddress, "address query param is required.", meta));
    return;
  }
  try {
    const result = await fetchIonPortfolio(address);
    writeJson(response, 200, apiResponse(result.chain, meta));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeJson(response, 503, apiError(ApiErrorCodes.dataUnavailable, message, meta));
  }
}

async function routePortfolio(url: URL, response: ServerResponse, meta: ApiMeta): Promise<void> {
  const address = url.searchParams.get("address")?.trim() ?? "";
  if (!address) {
    writeJson(response, 400, apiError(ApiErrorCodes.invalidAddress, "address query param is required.", meta));
    return;
  }
  try {
    const portfolio = await fetchPortfolio(address);
    writeJson(response, 200, apiResponse(portfolio, meta));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeJson(response, 503, apiError(ApiErrorCodes.dataUnavailable, message, meta));
  }
}
