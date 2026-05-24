import type { ServerResponse } from "node:http";

export type ApiSource = "local" | "mock" | "cache" | "upstream" | "indexer";

export type ApiMeta = {
  source: ApiSource;
  updatedAt: string;
  stale: boolean;
  requestId: string;
  cacheHit?: boolean;
  adapter?: string;
};

export type ApiResponse<T> = {
  data: T;
  meta: ApiMeta;
};

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
  meta: ApiMeta;
};

export const ApiErrorCodes = {
  methodNotAllowed: "ION_DEX_E_GATEWAY_METHOD_NOT_ALLOWED",
  notFound: "ION_DEX_E_GATEWAY_NOT_FOUND",
  missingDomainName: "ION_DEX_E_DOMAIN_NAME_REQUIRED",
  invalidDomainName: "ION_DEX_E_DOMAIN_NAME_INVALID",
  dataUnavailable: "ION_DEX_E_DATA_UNAVAILABLE",
  invalidAddress: "ION_DEX_E_INVALID_ADDRESS",
  invalidQuoteRequest: "invalid_quote_request",
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes];

export function apiResponse<T>(data: T, meta: ApiMeta): ApiResponse<T> {
  return { data, meta };
}

/**
 * Safe JSON replacer — strips `stack`, `cause`, and any internal Error properties
 * so that CodeQL rule `js/stack-trace-exposure` passes green.
 *
 * References:
 *  - async-cached-adapter.ts#L85 (error.stack)
 *  - routes.ts#L194, L219, L242, L257 (error → response)
 */
function safeReplacer(key: string, value: unknown): unknown {
  // Hard-block every property named "stack" or "cause" at any nesting depth
  if (key === "stack" || key === "cause") {
    return undefined;
  }
  // Never serialize Error properties beyond what the frontend needs
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  // Skip internal symbols / prototype-chain leaks
  if (typeof value === "symbol") {
    return String(value);
  }
  return value;
}

export function writeJson(
  response: ServerResponse,
  statusCode: number,
  payload: ApiResponse<unknown> | ApiErrorResponse,
): void {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-request-id",
    "Content-Type": "application/json; charset=utf-8",
    "X-Request-Id": payload.meta.requestId,
  });
  response.end(JSON.stringify(payload, safeReplacer));
}

export function writeNoContent(response: ServerResponse, requestId: string): void {
  response.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-request-id",
    "X-Request-Id": requestId,
  });
  response.end();
}

export function apiError(code: ApiErrorCode, message: string, meta: ApiMeta): ApiErrorResponse {
  return {
    error: {
      code,
      message,
    },
    meta,
  };
}
