import type { ServerResponse } from "node:http";

export type ApiSource = "local" | "cache" | "upstream" | "indexer";

export type ApiMeta = {
  source: ApiSource;
  updatedAt: string;
  stale: boolean;
  requestId: string;
};

export type ApiResponse<T> = {
  data: T;
  meta: ApiMeta;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
  meta: ApiMeta;
};

export function apiResponse<T>(data: T, meta: ApiMeta): ApiResponse<T> {
  return { data, meta };
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
  response.end(JSON.stringify(payload));
}

export function writeNoContent(response: ServerResponse): void {
  response.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-request-id",
  });
  response.end();
}

export function apiError(code: string, message: string, meta: ApiMeta): ApiErrorResponse {
  return {
    error: {
      code,
      message,
    },
    meta,
  };
}
