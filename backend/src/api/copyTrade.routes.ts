import type { IncomingMessage, ServerResponse } from "node:http";
import { ApiErrorCodes, apiError, apiResponse, writeJson, type ApiMeta } from "../gateway/response.js";
import {
  CopyTradeValidationError,
  getCopyTradeStats,
  startCopyTrade,
  stopCopyTrade,
  type CopyDirection,
  type CopyTradeStartInput,
} from "../services/copyTrade.js";

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }
  return JSON.parse(raw) as unknown;
}

function parseStartBody(body: unknown): CopyTradeStartInput {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    leaderAddress: String(record.leaderAddress ?? ""),
    maxCopyAmount: String(record.maxCopyAmount ?? "0"),
    minProfitBps: Number(record.minProfitBps),
    stopLossBps: Number(record.stopLossBps),
    copySlippageBps: Number(record.copySlippageBps),
    copyDirection: record.copyDirection === "reverse" ? "reverse" : "same",
  };
}

export async function handleCopyTradeRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  meta: ApiMeta,
): Promise<boolean> {
  if (pathname === "/api/copy-trade/stats" && request.method === "GET") {
    writeJson(response, 200, apiResponse(getCopyTradeStats(), meta));
    return true;
  }

  if (pathname === "/api/copy-trade/start" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const stats = startCopyTrade(parseStartBody(body));
      writeJson(response, 200, apiResponse(stats, meta));
    } catch (error) {
      if (error instanceof CopyTradeValidationError) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, error.message, meta));
        return true;
      }
      if (error instanceof SyntaxError) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Request body must be valid JSON.", meta));
        return true;
      }
      throw error;
    }
    return true;
  }

  if (pathname === "/api/copy-trade/stop" && request.method === "POST") {
    const stats = stopCopyTrade();
    writeJson(response, 200, apiResponse(stats, meta));
    return true;
  }

  return false;
}

export type { CopyDirection };
