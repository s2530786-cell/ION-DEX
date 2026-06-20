import type { IncomingMessage, ServerResponse } from "node:http";
import {
  getAllStrategies,
  getStrategyById,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  simulateStrategy,
  type CreateStrategyInput,
  type StrategyUpdate,
} from "../services/aiStrategy.js";
import { ApiErrorCodes, apiError, apiResponse, writeJson, type ApiMeta } from "../gateway/response.js";

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? (JSON.parse(raw) as unknown) : {};
}

export async function handleAiStrategyRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  meta: ApiMeta,
): Promise<boolean> {
  // GET /api/ai/strategies
  if (pathname === "/api/ai/strategies" && request.method === "GET") {
    const strategies = getAllStrategies();
    writeJson(response, 200, apiResponse({ data: strategies, total: strategies.length }, meta));
    return true;
  }

  // POST /api/ai/strategies
  if (pathname === "/api/ai/strategies" && request.method === "POST") {
    try {
      const body = (await readJsonBody(request)) as Partial<CreateStrategyInput>;
      const { name, type, params } = body;

      if (!name?.trim()) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Strategy name is required.", meta));
        return true;
      }
      if (!["grid", "trend", "arbitrage", "market_making"].includes(type ?? "")) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, `Invalid strategy type: ${type}.`, meta));
        return true;
      }
      if (!params?.fundAmount || params.fundAmount <= 0) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Fund amount must be positive.", meta));
        return true;
      }
      if (!params?.stopLoss || params?.stopLoss <= 0) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Stop loss must be positive.", meta));
        return true;
      }
      if (!params?.takeProfit || params?.takeProfit <= 0) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Take profit must be positive.", meta));
        return true;
      }
      if (params.stopLoss >= params.takeProfit) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Stop loss must be less than take profit.", meta));
        return true;
      }
      if (!params?.maxSlippage || params.maxSlippage <= 0) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Max slippage must be positive.", meta));
        return true;
      }

      const strategy = createStrategy({ name: name.trim(), type: type!, params: params! });
      writeJson(response, 201, apiResponse({ data: strategy }, meta));
    } catch (error) {
      if (error instanceof SyntaxError) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Request body must be valid JSON.", meta));
        return true;
      }
      throw error;
    }
    return true;
  }

  // GET /api/ai/strategies/:id
  const byIdMatch = pathname.match(/^\/api\/ai\/strategies\/([^/]+)$/);
  if (byIdMatch && request.method === "GET") {
    const id = byIdMatch[1];
    const strategy = getStrategyById(id);
    if (!strategy) {
      writeJson(response, 404, apiError(ApiErrorCodes.notFound, "Strategy not found.", meta));
      return true;
    }
    writeJson(response, 200, apiResponse({ data: strategy }, meta));
    return true;
  }

  // PUT /api/ai/strategies/:id
  if (byIdMatch && request.method === "PUT") {
    try {
      const id = byIdMatch[1];
      const body = (await readJsonBody(request)) as Partial<StrategyUpdate>;
      const allowed = ["name", "type", "params", "status"] as const;
      const filtered: StrategyUpdate = {};
      for (const key of allowed) {
        if (key in body) {
          filtered[key] = body[key] as never;
        }
      }

      if (filtered.type && !["grid", "trend", "arbitrage", "market_making"].includes(filtered.type)) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Invalid strategy type.", meta));
        return true;
      }
      if (filtered.status && !["draft", "running", "paused", "closed"].includes(filtered.status)) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Invalid status.", meta));
        return true;
      }

      const updated = updateStrategy(id, filtered);
      if (!updated) {
        writeJson(response, 404, apiError(ApiErrorCodes.notFound, "Strategy not found.", meta));
        return true;
      }
      writeJson(response, 200, apiResponse({ data: updated }, meta));
    } catch (error) {
      if (error instanceof SyntaxError) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Request body must be valid JSON.", meta));
        return true;
      }
      throw error;
    }
    return true;
  }

  // DELETE /api/ai/strategies/:id
  if (byIdMatch && request.method === "DELETE") {
    const id = byIdMatch[1];
    const deleted = deleteStrategy(id);
    if (!deleted) {
      writeJson(response, 404, apiError(ApiErrorCodes.notFound, "Strategy not found.", meta));
      return true;
    }
    writeJson(response, 200, apiResponse({ data: { id, deleted: true } }, meta));
    return true;
  }

  // POST /api/ai/strategies/:id/simulate
  const simulateMatch = pathname.match(/^\/api\/ai\/strategies\/([^/]+)\/simulate$/);
  if (simulateMatch && request.method === "POST") {
    const id = simulateMatch[1];
    const strategy = getStrategyById(id);
    if (!strategy) {
      writeJson(response, 404, apiError(ApiErrorCodes.notFound, "Strategy not found.", meta));
      return true;
    }
    const result = simulateStrategy(id);
    writeJson(response, 200, apiResponse({ data: result }, meta));
    return true;
  }

  return false;
}
