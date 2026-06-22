import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { resetAuditLogForTests } from "../src/ai/audit/log.js";
import {
  DESIGN_PROTOTYPE_ROUTE,
  processDraftRoute,
  VIDEO_BRIEF_ROUTE,
} from "../src/ai/gateway/draft-routes.js";
import type { ToolAllowlistEntry } from "../src/ai/sentinel/types.js";

const FIXTURE_ALLOWLIST: ToolAllowlistEntry[] = [
  {
    tool_name: "draft_design",
    capability_ids: ["design.*"],
    max_tier: "draft_content",
    network_egress: false,
    stores_pii: false,
  },
  {
    tool_name: "draft_content",
    capability_ids: ["content.video.*", "media.studio.generative"],
    max_tier: "draft_content",
    network_egress: false,
    stores_pii: false,
  },
];

const META = {
  source: "mock" as const,
  updatedAt: "2026-05-29T00:00:00.000Z",
  stale: false,
  requestId: "test-draft",
};

describe("AI Gateway draft routes (processDraftRoute)", () => {
  beforeEach(() => {
    resetAuditLogForTests();
  });

  it("allows design prototype when allowlist matches design.*", () => {
    const result = processDraftRoute(
      DESIGN_PROTOTYPE_ROUTE,
      META,
      "user-1",
      "sess-1",
      { prompt: "Swap panel glass refresh" },
      { allowlist: FIXTURE_ALLOWLIST, request_id: "req-design-1" },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.kind, "design_prototype");
      assert.equal(result.data.capability_id, "design.workspace.open-design");
      assert.match(String(result.data.prompt), /Swap panel/);
    }
  });

  it("allows video brief when allowlist matches content.video.*", () => {
    const result = processDraftRoute(
      VIDEO_BRIEF_ROUTE,
      META,
      "user-1",
      "sess-1",
      { topic: "Bridge safety", duration_sec: 30 },
      { allowlist: FIXTURE_ALLOWLIST, request_id: "req-video-1" },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.kind, "video_brief");
      assert.equal(result.data.duration_sec, 30);
      assert.ok(Array.isArray(result.data.scenes));
    }
  });

  it("denies draft routes when allowlist is empty", () => {
    const result = processDraftRoute(
      DESIGN_PROTOTYPE_ROUTE,
      META,
      "user-1",
      "sess-1",
      { prompt: "test" },
      { allowlist: [], request_id: "req-deny-empty" },
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
      assert.match(result.message, /DENY/);
    }
  });

  it("denies swap-like tool names under I1 even with allowlist", () => {
    const swapRoute = {
      ...DESIGN_PROTOTYPE_ROUTE,
      tool_name: "execute_swap",
    };
    const result = processDraftRoute(
      swapRoute,
      META,
      "user-1",
      "sess-1",
      { prompt: "test" },
      { allowlist: FIXTURE_ALLOWLIST, request_id: "req-deny-swap" },
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
      assert.match(result.message, /I1/);
    }
  });
});
