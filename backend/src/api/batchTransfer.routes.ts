import type { IncomingMessage, ServerResponse } from "node:http";
import { ApiErrorCodes, apiError, apiResponse, writeJson, type ApiMeta } from "../gateway/response.js";
import {
  BatchTransferValidationError,
  getBatchTransferConfig,
  validateBatchCollect,
  validateBatchTransfer,
} from "../services/batchTransfer.js";

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

function parseTextBody(body: unknown): { text: string; mainAddress?: string } {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    text: String(record.text ?? ""),
    mainAddress: record.mainAddress !== undefined ? String(record.mainAddress) : undefined,
  };
}

export async function handleBatchTransferRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  meta: ApiMeta,
): Promise<boolean> {
  if (pathname === "/api/batch-transfer/config" && request.method === "GET") {
    writeJson(response, 200, apiResponse(getBatchTransferConfig(), meta));
    return true;
  }

  if (pathname === "/api/batch-transfer/validate-transfer" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const { text } = parseTextBody(body);
      const result = validateBatchTransfer(text);
      if (result.lineErrors.length > 0) {
        writeJson(
          response,
          400,
          apiError(ApiErrorCodes.invalidQuoteRequest, result.lineErrors.join(" "), meta),
        );
        return true;
      }
      if (result.recipientCount === 0) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "No valid recipients.", meta));
        return true;
      }
      writeJson(response, 200, apiResponse(result, meta));
    } catch (error) {
      if (error instanceof SyntaxError) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Request body must be valid JSON.", meta));
        return true;
      }
      if (error instanceof BatchTransferValidationError) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, error.message, meta));
        return true;
      }
      throw error;
    }
    return true;
  }

  if (pathname === "/api/batch-transfer/validate-collect" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const { text, mainAddress } = parseTextBody(body);
      if (!mainAddress) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "mainAddress is required.", meta));
        return true;
      }
      const result = validateBatchCollect(mainAddress, text);
      if (result.lineErrors.length > 0) {
        writeJson(
          response,
          400,
          apiError(ApiErrorCodes.invalidQuoteRequest, result.lineErrors.join(" "), meta),
        );
        return true;
      }
      if (result.fromCount === 0) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "No valid source addresses.", meta));
        return true;
      }
      writeJson(response, 200, apiResponse(result, meta));
    } catch (error) {
      if (error instanceof SyntaxError) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Request body must be valid JSON.", meta));
        return true;
      }
      if (error instanceof BatchTransferValidationError) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, error.message, meta));
        return true;
      }
      throw error;
    }
    return true;
  }

  return false;
}
