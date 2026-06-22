import { randomUUID } from "node:crypto";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import type { AdapterHealthSnapshot } from "../../src/adapters/types.js";
import { apiResponse, type ApiMeta } from "../../src/gateway/response.js";
import { systemClock, toIsoTimestamp } from "../../src/lib/clock.js";

const requestIdHeader = "x-request-id";
const requestIdPattern = /^[A-Za-z0-9._:-]{1,80}$/;
const handlerStartedAt = systemClock.now();

type HealthPayload = {
  status: "ok";
  service: "ion-dex-api-gateway";
  version: "0.1.0";
  uptimeMs: number;
  dataSources: AdapterHealthSnapshot[];
  database: {
    driver: "disabled";
    status: "disabled";
    migrationsApplied: [];
  };
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-request-id",
} as const;

function normalizeRequestId(value: string): string {
  const trimmed = value.trim();
  if (requestIdPattern.test(trimmed)) {
    return trimmed;
  }
  return randomUUID();
}

function resolveRequestId(headers: APIGatewayProxyEventV2["headers"]): string {
  const direct = headers?.[requestIdHeader] ?? headers?.["X-Request-Id"];
  if (typeof direct === "string" && direct.trim().length > 0) {
    return normalizeRequestId(direct);
  }
  return randomUUID();
}

function isDbDisabled(): boolean {
  const driver = (process.env.ION_DB_DRIVER ?? "disabled").trim().toLowerCase();
  return driver === "disabled" || driver === "";
}

function resolveDataMode(): "live" | "auto" | "test-mock" {
  const raw = (process.env.ION_DATA_MODE ?? "auto").trim().toLowerCase();
  if (raw === "live" || raw === "test-mock") {
    return raw;
  }
  return "auto";
}

function coldAdapterHealthSnapshots(): AdapterHealthSnapshot[] {
  const empty = { lastUpdatedAt: null, cacheEntries: 0 };
  if (resolveDataMode() === "test-mock") {
    return [
      { adapterKey: "market", upstream: "mock", status: "mocked", ...empty },
      { adapterKey: "burn", upstream: "mock", status: "mocked", ...empty },
      { adapterKey: "staking", upstream: "mock", status: "mocked", ...empty },
      { adapterKey: "domain", upstream: "mock", status: "mocked", ...empty },
    ];
  }
  return [
    { adapterKey: "market", upstream: "aggregated", status: "healthy", ...empty },
    { adapterKey: "burn", upstream: "bsc-indexer", status: "healthy", ...empty },
    { adapterKey: "staking", upstream: "ion-indexer", status: "healthy", ...empty },
    { adapterKey: "domain", upstream: "ion-dns", status: "planned", ...empty },
  ];
}

function buildHealthMeta(requestId: string): ApiMeta {
  return {
    source: "local",
    updatedAt: toIsoTimestamp(systemClock.now()),
    stale: false,
    requestId,
  };
}

function optionsResponse(requestId: string): APIGatewayProxyResultV2 {
  return {
    statusCode: 204,
    headers: {
      ...corsHeaders,
      "x-request-id": requestId,
    },
  };
}

function healthResponse(requestId: string): APIGatewayProxyResultV2 {
  const payload = apiResponse<HealthPayload>(
    {
      status: "ok",
      service: "ion-dex-api-gateway",
      version: "0.1.0",
      uptimeMs: Math.max(0, systemClock.now().getTime() - handlerStartedAt.getTime()),
      dataSources: coldAdapterHealthSnapshots(),
      database: {
        driver: "disabled",
        status: "disabled",
        migrationsApplied: [],
      },
    },
    buildHealthMeta(requestId),
  );

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
      "x-request-id": requestId,
    },
    body: JSON.stringify(payload),
  };
}

export function tryFastPath(event: APIGatewayProxyEventV2): APIGatewayProxyResultV2 | null {
  const method = event.requestContext.http.method;
  const path = event.rawPath;
  const requestId = resolveRequestId(event.headers);

  if (method === "OPTIONS") {
    return optionsResponse(requestId);
  }

  if (method === "GET" && path === "/api/health" && isDbDisabled()) {
    return healthResponse(requestId);
  }

  return null;
}
