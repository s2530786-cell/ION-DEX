import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { resetAuditLogForTests, listAuditEvents } from "../src/ai/audit/log.js";
import { resetAllowlistCacheForTests } from "../src/ai/sentinel/allowlist-loader.js";
import { evaluateToolCall } from "../src/ai/sentinel/evaluate.js";
import type { ToolAllowlistEntry } from "../src/ai/sentinel/types.js";

const FIXTURE_ALLOWLIST: ToolAllowlistEntry[] = [
  {
    tool_name: "read_insight",
    capability_ids: ["insight.market.*", "analytics.onchain.*"],
    max_tier: "read_insight",
    network_egress: true,
    stores_pii: false,
  },
];

describe("AI Sentinel evaluateToolCall", () => {
  beforeEach(() => {
    resetAllowlistCacheForTests();
    resetAuditLogForTests();
  });

  it("denies swap/sign tool names under I1", () => {
    const verdict = evaluateToolCall(
      { request_id: "req-deny-swap" },
      {
        tool_name: "execute_swap",
        capability_id: "dex.swap.quote",
        tier: "read_insight",
        actor_id: "user-1",
        session_id: "sess-1",
      },
      { allowlist: FIXTURE_ALLOWLIST },
    );
    assert.equal(verdict.decision, "DENY");
    assert.match(verdict.reason, /I1/);
  });

  it("denies sign_transaction capability under I1", () => {
    const verdict = evaluateToolCall(
      { request_id: "req-deny-sign" },
      {
        tool_name: "wallet_helper",
        capability_id: "wallet.sign_transaction",
        tier: "read_insight",
        actor_id: "user-1",
        session_id: "sess-1",
      },
      { allowlist: FIXTURE_ALLOWLIST },
    );
    assert.equal(verdict.decision, "DENY");
  });

  it("allows read_insight when allowlist matches", () => {
    const verdict = evaluateToolCall(
      { request_id: "req-allow" },
      {
        tool_name: "read_insight",
        capability_id: "insight.market.summary",
        tier: "read_insight",
        actor_id: "user-1",
        session_id: "sess-1",
      },
      { allowlist: FIXTURE_ALLOWLIST },
    );
    assert.equal(verdict.decision, "ALLOW");
  });

  it("denies all tools when allowlist is empty (deny-by-default)", () => {
    const verdict = evaluateToolCall(
      { request_id: "req-empty" },
      {
        tool_name: "read_insight",
        capability_id: "insight.market.summary",
        tier: "read_insight",
        actor_id: "user-1",
        session_id: "sess-1",
      },
      { allowlist: [] },
    );
    assert.equal(verdict.decision, "DENY");
    assert.match(verdict.reason, /empty tool allowlist/i);
  });

  it("writes AuditEvent on evaluation", () => {
    evaluateToolCall(
      { request_id: "req-audit" },
      {
        tool_name: "read_insight",
        capability_id: "insight.market.summary",
        tier: "read_insight",
        actor_id: "user-1",
        session_id: "sess-1",
      },
      { allowlist: FIXTURE_ALLOWLIST },
    );
    const events = listAuditEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0]?.request_id, "req-audit");
    assert.equal(events[0]?.decision, "ALLOW");
  });
});
