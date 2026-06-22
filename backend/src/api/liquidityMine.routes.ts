import type { IncomingMessage, ServerResponse } from "node:http";
import { ApiErrorCodes, apiError, apiResponse, writeJson, type ApiMeta } from "../gateway/response.js";
import {
  claimLiquidityMineReward,
  getLiquidityMineSummary,
  LiquidityMineValidationError,
  stakeLiquidityMine,
  unstakeLiquidityMine,
  type LiquidityMineStakeInput,
} from "../services/liquidityMine.js";

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

function parseStakeBody(body: unknown): LiquidityMineStakeInput {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    poolId: Number(record.poolId),
    amount: String(record.amount ?? "0"),
  };
}

function parseClaimBody(body: unknown): number {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return Number(record.poolId);
}

export async function handleLiquidityMineRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  meta: ApiMeta,
): Promise<boolean> {
  if (pathname === "/api/liquidity-mine/pools" && request.method === "GET") {
    writeJson(response, 200, apiResponse(getLiquidityMineSummary(), meta));
    return true;
  }

  if (pathname === "/api/liquidity-mine/stake" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const summary = stakeLiquidityMine(parseStakeBody(body));
      writeJson(response, 200, apiResponse(summary, meta));
    } catch (error) {
      if (error instanceof LiquidityMineValidationError) {
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

  if (pathname === "/api/liquidity-mine/unstake" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const summary = unstakeLiquidityMine(parseStakeBody(body));
      writeJson(response, 200, apiResponse(summary, meta));
    } catch (error) {
      if (error instanceof LiquidityMineValidationError) {
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

  if (pathname === "/api/liquidity-mine/claim" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const summary = claimLiquidityMineReward(parseClaimBody(body));
      writeJson(response, 200, apiResponse(summary, meta));
    } catch (error) {
      if (error instanceof LiquidityMineValidationError) {
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

  return false;
}
