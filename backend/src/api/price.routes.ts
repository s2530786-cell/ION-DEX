import type { IncomingMessage, ServerResponse } from "node:http";
import type { ServerConfig } from "../config/server-config.js";
import { getMarketTickers } from "../services/markets.js";
import {
  getBnbPriceApiPayload,
  getIonKlinesPayload,
  getIonMarketPayload,
  getIonPoolPayload,
  getIonPriceApiPayload,
} from "../services/price-engine.js";
import { apiResponse, type ApiMeta } from "../gateway/response.js";

function writeJson(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function mockIonPriceFromTickers() {
  const ion = getMarketTickers().find((t) => t.symbol === "ION");
  if (!ion) {
    return {
      priceUsd: 6.02,
      change24hPct: 8.42,
      volume24hUsd: null,
      liquidityUsd: null,
      source: "mock" as const,
      note: "Phase 3 mock ION price.",
      poolAddress: "0x6487725b383954e05ca56f3c2b93a104b3dd2c25",
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    priceUsd: ion.priceUsd,
    change24hPct: ion.change24hPct,
    volume24hUsd: null,
    liquidityUsd: null,
    source: "mock" as const,
    note: ion.provenance.note,
    poolAddress: "0x6487725b383954e05ca56f3c2b93a104b3dd2c25",
    updatedAt: new Date().toISOString(),
  };
}

export async function handlePriceRoute(
  config: ServerConfig,
  pathname: string,
  url: URL,
  response: ServerResponse,
  meta: ApiMeta,
): Promise<boolean> {
  if (config.dataMode === "test-mock") {
    switch (pathname) {
      case "/api/price/ion":
        writeJson(response, 200, apiResponse(mockIonPriceFromTickers(), meta));
        return true;
      case "/api/price/bnb": {
        const bnb = getMarketTickers().find((t) => t.symbol === "BNB");
        writeJson(
          response,
          200,
          apiResponse(
            {
              priceUsd: bnb?.priceUsd ?? 642.2,
              change24hPct: bnb?.change24hPct ?? 1.18,
              source: "mock",
              updatedAt: new Date().toISOString(),
            },
            meta,
          ),
        );
        return true;
      }
      case "/api/klines/ion":
        writeJson(
          response,
          200,
          apiResponse({ timeframe: "1h", candles: [], source: "mock" }, meta),
        );
        return true;
      case "/api/market/ion":
        writeJson(
          response,
          200,
          apiResponse(
            {
              priceUsd: mockIonPriceFromTickers().priceUsd,
              change24hPct: mockIonPriceFromTickers().change24hPct,
              volume24hUsd: null,
              liquidityUsd: null,
              fdvUsd: null,
              sources: ["mock"],
              poolAddress: mockIonPriceFromTickers().poolAddress,
              indexerNote: "test-mock mode",
            },
            meta,
          ),
        );
        return true;
      case "/api/pool/ion":
        writeJson(
          response,
          200,
          apiResponse(
            {
              poolAddress: "0x6487725b383954e05ca56f3c2b93a104b3dd2c25",
              reserveInUsd: null,
              volume24hUsd: null,
              priceUsd: mockIonPriceFromTickers().priceUsd,
              source: "mock",
            },
            meta,
          ),
        );
        return true;
      default:
        return false;
    }
  }

  switch (pathname) {
    case "/api/price/ion":
      writeJson(response, 200, apiResponse(await getIonPriceApiPayload(config), meta));
      return true;
    case "/api/price/bnb":
      writeJson(response, 200, apiResponse(await getBnbPriceApiPayload(config), meta));
      return true;
    case "/api/klines/ion": {
      const limit = Number.parseInt(url.searchParams.get("limit") ?? "100", 10);
      const safeLimit = Number.isFinite(limit) ? Math.min(500, Math.max(1, limit)) : 100;
      writeJson(response, 200, apiResponse(await getIonKlinesPayload(config, safeLimit), meta));
      return true;
    }
    case "/api/market/ion":
      writeJson(response, 200, apiResponse(await getIonMarketPayload(config), meta));
      return true;
    case "/api/pool/ion":
      writeJson(response, 200, apiResponse(await getIonPoolPayload(config), meta));
      return true;
    default:
      return false;
  }
}
