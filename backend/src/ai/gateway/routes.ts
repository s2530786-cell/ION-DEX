import type { IncomingMessage, ServerResponse } from "node:http";
import { ApiErrorCodes, apiError, apiResponse, writeJson, type ApiMeta } from "../../gateway/response.js";
import { loadToolAllowlist } from "../sentinel/allowlist-loader.js";
import { loadCapabilityRegistry } from "../registry/registry-loader.js";
import {
  DESIGN_PROTOTYPE_ROUTE,
  processDraftRoute,
  VIDEO_BRIEF_ROUTE,
} from "./draft-routes.js";
import { parseActorSession, readJsonBody } from "./http.js";

function buildProvenance(meta: ApiMeta) {
  return {
    source: meta.source,
    confidence: 0.85,
    timestamp: meta.updatedAt,
    disclaimer: "Not financial advice.",
  };
}

function mergeCapabilities(meta: ApiMeta) {
  const allowlist = loadToolAllowlist();
  const registry = loadCapabilityRegistry();
  const registryById = new Map(registry.map((entry) => [entry.capability_id, entry]));

  const fromAllowlist = allowlist.flatMap((tool) =>
    tool.capability_ids.map((capability_id) => {
      const reg = registryById.get(capability_id);
      return {
        capability_id,
        tool_name: tool.tool_name,
        max_tier: tool.max_tier,
        label: reg?.label ?? null,
        vendor_ref: reg?.vendor_ref ?? null,
        gateway_path: reg?.gateway_path ?? null,
        tier_default: reg?.tier_default ?? null,
      };
    }),
  );

  const allowlistIds = new Set(fromAllowlist.map((item) => item.capability_id));
  const registryOnly = registry
    .filter((entry) => !allowlistIds.has(entry.capability_id))
    .map((entry) => ({
      capability_id: entry.capability_id,
      tool_name: null,
      max_tier: entry.tier_default,
      label: entry.label,
      vendor_ref: entry.vendor_ref,
      gateway_path: entry.gateway_path,
      tier_default: entry.tier_default,
      registered_only: true,
    }));

  return {
    capabilities: [...fromAllowlist, ...registryOnly],
    provenance: buildProvenance(meta),
  };
}

async function handleDraftPost(
  request: IncomingMessage,
  response: ServerResponse,
  meta: ApiMeta,
  routeConfig: typeof DESIGN_PROTOTYPE_ROUTE,
): Promise<void> {
  const body = await readJsonBody(request);
  const parsed = parseActorSession(body);
  if (!parsed) {
    writeJson(
      response,
      400,
      apiError(ApiErrorCodes.invalidQuoteRequest, "actor_id and session_id are required", meta),
    );
    return;
  }

  const request_id = `${routeConfig.capability_id}:${Date.now()}`;
  const result = processDraftRoute(
    routeConfig,
    meta,
    parsed.actor_id,
    parsed.session_id,
    parsed.payload,
    { request_id },
  );

  if (!result.ok) {
    writeJson(response, result.status, apiError(ApiErrorCodes.dataUnavailable, result.message, meta));
    return;
  }

  writeJson(response, 200, apiResponse(result.data, meta));
}

export async function handleAiGatewayRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  meta: ApiMeta,
): Promise<boolean> {
  if (pathname === "/v1/ai/health" && request.method === "GET") {
    writeJson(
      response,
      200,
      apiResponse(
        {
          status: "ok",
          service: "ion-ai-gateway",
          sentinel: "active",
          allowlist_loaded: loadToolAllowlist().length > 0,
          registry_loaded: loadCapabilityRegistry().length > 0,
          routes: [
            "GET /v1/ai/health",
            "GET /v1/ai/capabilities",
            "POST /v1/ai/design/prototype",
            "POST /v1/ai/content/video/brief",
          ],
        },
        meta,
      ),
    );
    return true;
  }

  if (pathname === "/v1/ai/capabilities" && request.method === "GET") {
    writeJson(response, 200, apiResponse(mergeCapabilities(meta), meta));
    return true;
  }

  if (pathname === "/v1/ai/design/prototype" && request.method === "POST") {
    await handleDraftPost(request, response, meta, DESIGN_PROTOTYPE_ROUTE);
    return true;
  }

  if (pathname === "/v1/ai/content/video/brief" && request.method === "POST") {
    await handleDraftPost(request, response, meta, VIDEO_BRIEF_ROUTE);
    return true;
  }

  if (pathname.startsWith("/v1/ai/tx/") || pathname.startsWith("/v1/ai/wallet/") || pathname.startsWith("/v1/ai/admin/")) {
    writeJson(
      response,
      404,
      apiError(ApiErrorCodes.notFound, "Route forbidden by AI Gateway contract", meta),
    );
    return true;
  }

  return false;
}
