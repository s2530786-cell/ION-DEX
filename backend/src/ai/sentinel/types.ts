export type SentinelTier = "read_insight" | "draft_content" | "simulate" | "propose_tx";

export type SentinelDecision = "ALLOW" | "DENY" | "MASK";

export type ToolAllowlistEntry = {
  tool_name: string;
  capability_ids: string[];
  max_tier: SentinelTier;
  network_egress: boolean;
  stores_pii: boolean;
};

export type ToolCallRequest = {
  tool_name: string;
  capability_id: string;
  tier: SentinelTier;
  actor_id: string;
  session_id: string;
  payload?: Record<string, unknown>;
};

export type SentinelVerdict = {
  decision: SentinelDecision;
  reason: string;
  policy_id: string;
  scrubbed_payload?: Record<string, unknown>;
};

export type AuditProvenance = {
  source: "local" | "mock" | "upstream";
  model: string | null;
  disclaimer: string;
};

export type AuditEvent = {
  event_id: string;
  timestamp: string;
  actor_id: string;
  session_id: string;
  tool_name: string;
  capability_id: string;
  tier: string;
  decision: SentinelDecision;
  request_id: string;
  provenance: AuditProvenance;
};
