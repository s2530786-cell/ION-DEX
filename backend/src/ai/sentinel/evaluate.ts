import { appendAuditEvent, buildAuditEvent } from "../audit/log.js";
import { loadToolAllowlist } from "./allowlist-loader.js";
import type { SentinelTier, SentinelVerdict, ToolAllowlistEntry, ToolCallRequest } from "./types.js";

const TIER_ORDER: SentinelTier[] = ["read_insight", "draft_content", "simulate", "propose_tx"];

const I1_DENIED_PATTERN =
  /\b(swap|sign|stake|bridge|burn|approve|tx|wallet|admin|mnemonic|private[_-]?key)\b/i;

export type EvaluateContext = {
  request_id: string;
};

export type EvaluateOptions = {
  allowlist?: ToolAllowlistEntry[];
  skipAudit?: boolean;
};

function tierRank(tier: SentinelTier): number {
  const index = TIER_ORDER.indexOf(tier);
  return index >= 0 ? index : -1;
}

function globMatch(pattern: string, value: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i").test(value);
}

function isI1Violation(toolName: string, capabilityId: string): boolean {
  const normalized = `${toolName} ${capabilityId}`.replace(/_/g, " ");
  return I1_DENIED_PATTERN.test(normalized);
}

function findAllowlistEntry(
  allowlist: ToolAllowlistEntry[],
  toolName: string,
  capabilityId: string,
): ToolAllowlistEntry | undefined {
  return allowlist.find(
    (entry) =>
      entry.tool_name === toolName &&
      entry.capability_ids.some((pattern) => globMatch(pattern, capabilityId)),
  );
}

export function evaluateToolCall(
  ctx: EvaluateContext,
  request: ToolCallRequest,
  options: EvaluateOptions = {},
): SentinelVerdict {
  const allowlist = options.allowlist ?? loadToolAllowlist();
  let verdict: SentinelVerdict;

  if (isI1Violation(request.tool_name, request.capability_id)) {
    verdict = {
      decision: "DENY",
      reason: "I1 invariant: forbidden tx/wallet/sign/swap capability",
      policy_id: "ion.sentinel.i1-hard-deny",
    };
  } else if (allowlist.length === 0) {
    verdict = {
      decision: "DENY",
      reason: "Deny-by-default: empty tool allowlist",
      policy_id: "ion.sentinel.deny-by-default",
    };
  } else {
    const entry = findAllowlistEntry(allowlist, request.tool_name, request.capability_id);
    if (!entry) {
      verdict = {
        decision: "DENY",
        reason: "Tool not registered in allowlist",
        policy_id: "ion.sentinel.allowlist-miss",
      };
    } else if (tierRank(request.tier) > tierRank(entry.max_tier)) {
      verdict = {
        decision: "DENY",
        reason: `Tier ${request.tier} exceeds max_tier ${entry.max_tier}`,
        policy_id: "ion.sentinel.tier-cap",
      };
    } else {
      verdict = {
        decision: "ALLOW",
        reason: "Allowlist match",
        policy_id: "ion.sentinel.allowlist-allow",
        scrubbed_payload: request.payload,
      };
    }
  }

  if (!options.skipAudit) {
    appendAuditEvent(
      buildAuditEvent({
        actor_id: request.actor_id,
        session_id: request.session_id,
        tool_name: request.tool_name,
        capability_id: request.capability_id,
        tier: request.tier,
        decision: verdict.decision,
        request_id: ctx.request_id,
      }),
    );
  }

  return verdict;
}
