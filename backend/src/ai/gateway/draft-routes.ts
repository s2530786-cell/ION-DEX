import type { ApiMeta } from "../../gateway/response.js";
import { evaluateToolCall } from "../sentinel/evaluate.js";
import { loadToolAllowlist } from "../sentinel/allowlist-loader.js";
import type { SentinelTier, ToolAllowlistEntry } from "../sentinel/types.js";
import { findRegistryEntry } from "../registry/registry-loader.js";

export type DraftRouteConfig = {
  tool_name: string;
  capability_id: string;
  tier: SentinelTier;
  stub_kind: "design_prototype" | "video_brief";
};

export type DraftSuccess = {
  ok: true;
  data: Record<string, unknown>;
};

export type DraftFailure = {
  ok: false;
  status: number;
  message: string;
  policy_id?: string;
};

export type DraftRouteOptions = {
  allowlist?: ToolAllowlistEntry[];
  request_id: string;
};

const NOT_FINANCIAL_ADVICE = "Not financial advice.";

function buildProvenance(meta: ApiMeta) {
  return {
    source: meta.source,
    confidence: 0.85,
    timestamp: meta.updatedAt,
    disclaimer: NOT_FINANCIAL_ADVICE,
  };
}

function buildDesignStub(payload: Record<string, unknown>, capability_id: string) {
  const prompt = typeof payload.prompt === "string" ? payload.prompt : "ION DEX dashboard module";
  return {
    capability_id,
    kind: "design_prototype",
    status: "draft",
    prompt,
    layout: {
      theme: "okx-web3-cyber-glass",
      sections: ["hero", "market-strip", "swap-panel", "ai-insight-rail"],
    },
    notes: "Mock stub — wire design vendor in authorized private layer (Phase 3+).",
    provenance: {
      source: "mock",
      model: null,
      disclaimer: NOT_FINANCIAL_ADVICE,
    },
  };
}

function buildVideoBriefStub(payload: Record<string, unknown>, capability_id: string) {
  const topic = typeof payload.topic === "string" ? payload.topic : "ION DEX swap walkthrough";
  const durationSec = typeof payload.duration_sec === "number" ? payload.duration_sec : 45;
  return {
    capability_id,
    kind: "video_brief",
    status: "draft",
    topic,
    duration_sec: durationSec,
    hook: `Why ${topic} matters for ION traders`,
    scenes: [
      { id: 1, beat: "Problem / market context", duration_sec: 8 },
      { id: 2, beat: "Product demo overlay", duration_sec: 22 },
      { id: 3, beat: "CTA — explore on ION DEX", duration_sec: 10 },
    ],
    vendor_chain: "lanshu → jineng → MoneyPrinterTurbo (private)",
    notes: "Mock stub — media pipeline integration stays in authorized private repo.",
    provenance: {
      source: "mock",
      model: null,
      disclaimer: NOT_FINANCIAL_ADVICE,
    },
  };
}

export function processDraftRoute(
  config: DraftRouteConfig,
  meta: ApiMeta,
  actor_id: string,
  session_id: string,
  payload: Record<string, unknown>,
  options: DraftRouteOptions,
): DraftSuccess | DraftFailure {
  const registry = findRegistryEntry(config.capability_id);
  const verdict = evaluateToolCall(
    { request_id: options.request_id },
    {
      tool_name: config.tool_name,
      capability_id: config.capability_id,
      tier: config.tier,
      actor_id,
      session_id,
      payload,
    },
    { allowlist: options.allowlist ?? loadToolAllowlist() },
  );

  if (verdict.decision !== "ALLOW") {
    return {
      ok: false,
      status: 403,
      message: `Sentinel ${verdict.decision}: ${verdict.reason}`,
      policy_id: verdict.policy_id,
    };
  }

  const stub =
    config.stub_kind === "design_prototype"
      ? buildDesignStub(payload, config.capability_id)
      : buildVideoBriefStub(payload, config.capability_id);

  return {
    ok: true,
    data: {
      ...stub,
      registry_label: registry?.label ?? null,
      vendor_ref: registry?.vendor_ref ?? null,
      gateway_provenance: buildProvenance(meta),
    },
  };
}

export const DESIGN_PROTOTYPE_ROUTE: DraftRouteConfig = {
  tool_name: "draft_design",
  capability_id: "design.workspace.open-design",
  tier: "draft_content",
  stub_kind: "design_prototype",
};

export const VIDEO_BRIEF_ROUTE: DraftRouteConfig = {
  tool_name: "draft_content",
  capability_id: "content.video.brief",
  tier: "draft_content",
  stub_kind: "video_brief",
};
