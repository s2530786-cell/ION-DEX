import { randomUUID } from "node:crypto";
import type { AuditEvent, AuditProvenance, SentinelDecision } from "../sentinel/types.js";

const auditEvents: AuditEvent[] = [];

export function appendAuditEvent(event: AuditEvent): void {
  auditEvents.push(event);
}

export function listAuditEvents(): readonly AuditEvent[] {
  return auditEvents;
}

export function resetAuditLogForTests(): void {
  auditEvents.length = 0;
}

export function buildAuditEvent(input: {
  actor_id: string;
  session_id: string;
  tool_name: string;
  capability_id: string;
  tier: string;
  decision: SentinelDecision;
  request_id: string;
  provenance?: Partial<AuditProvenance>;
}): AuditEvent {
  return {
    event_id: randomUUID(),
    timestamp: new Date().toISOString(),
    actor_id: input.actor_id,
    session_id: input.session_id,
    tool_name: input.tool_name,
    capability_id: input.capability_id,
    tier: input.tier,
    decision: input.decision,
    request_id: input.request_id,
    provenance: {
      source: input.provenance?.source ?? "local",
      model: input.provenance?.model ?? null,
      disclaimer: input.provenance?.disclaimer ?? "Not financial advice.",
    },
  };
}
