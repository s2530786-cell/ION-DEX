import type { IncomingMessage, ServerResponse } from "node:http";
import { ApiErrorCodes, apiError, apiResponse, writeJson, type ApiMeta } from "../gateway/response.js";
import {
  bindDomainManage,
  DomainManageValidationError,
  getDomainManageOverview,
  lookupDomainManage,
  registerDomainManage,
  renewDomainManage,
  transferDomainManage,
  type DomainManageActionResult,
} from "../services/domainManage.js";

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

function parseNameBody(body: unknown): string {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return String(record.name ?? "");
}

function parseBindBody(body: unknown): { name: string; walletAddress: string } {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    name: String(record.name ?? ""),
    walletAddress: String(record.walletAddress ?? ""),
  };
}

function parseTransferBody(body: unknown): { name: string; toAddress: string } {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    name: String(record.name ?? ""),
    toAddress: String(record.toAddress ?? ""),
  };
}

async function handleMutation(
  response: ServerResponse,
  meta: ApiMeta,
  action: () => Promise<DomainManageActionResult>,
): Promise<void> {
  try {
    const payload = await action();
    writeJson(response, 200, apiResponse(payload, meta));
  } catch (error) {
    if (error instanceof DomainManageValidationError) {
      writeJson(response, 400, apiError(ApiErrorCodes.invalidDomainName, error.message, meta));
      return;
    }
    if (error instanceof SyntaxError) {
      writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Request body must be valid JSON.", meta));
      return;
    }
    throw error;
  }
}

export async function handleDomainManageRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  meta: ApiMeta,
): Promise<boolean> {
  if (pathname === "/api/domain-manage/overview" && request.method === "GET") {
    writeJson(response, 200, apiResponse(getDomainManageOverview(), meta));
    return true;
  }

  if (pathname === "/api/domain-manage/lookup" && request.method === "POST") {
    const body = await readJsonBody(request);
    await handleMutation(response, meta, () => lookupDomainManage(parseNameBody(body)));
    return true;
  }

  if (pathname === "/api/domain-manage/register" && request.method === "POST") {
    const body = await readJsonBody(request);
    await handleMutation(response, meta, () => registerDomainManage(parseNameBody(body)));
    return true;
  }

  if (pathname === "/api/domain-manage/bind" && request.method === "POST") {
    const body = await readJsonBody(request);
    const parsed = parseBindBody(body);
    await handleMutation(response, meta, () => bindDomainManage(parsed.name, parsed.walletAddress));
    return true;
  }

  if (pathname === "/api/domain-manage/transfer" && request.method === "POST") {
    const body = await readJsonBody(request);
    const parsed = parseTransferBody(body);
    await handleMutation(response, meta, () => transferDomainManage(parsed.name, parsed.toAddress));
    return true;
  }

  if (pathname === "/api/domain-manage/renew" && request.method === "POST") {
    const body = await readJsonBody(request);
    await handleMutation(response, meta, () => renewDomainManage(parseNameBody(body)));
    return true;
  }

  return false;
}
