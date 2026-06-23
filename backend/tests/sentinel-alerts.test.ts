import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { SentinelEvent } from "../src/services/scraping/types.js";
import { routeSentinelAlerts, runSentinelAlertSelfTest } from "../src/services/sentinel/alerts.js";
import { listAlertLog, listReviewQueue, resetSentinelStoreForTests } from "../src/services/sentinel/store.js";

const baseEvent: SentinelEvent = {
  id: "evt_test",
  taskType: "credential_exposure_scan",
  severity: "P1",
  target: "ion-dex@example.com",
  summary: "Credential exposure candidate",
  findings: ["leak marker found"],
  sourceTool: "Cr3dOv3r",
  detectedAt: new Date().toISOString(),
  falsePositive: false,
  remediation: ["Force password reset"],
};

describe("sentinel alert channels", () => {
  beforeEach(() => {
    resetSentinelStoreForTests();
    delete process.env.ION_SENTINEL_ALERT_WEBHOOK_URL;
    delete process.env.ION_SENTINEL_SLACK_WEBHOOK_URL;
    delete process.env.ION_SENTINEL_ALERT_CHANNEL;
    delete process.env.ION_SENTINEL_ALERT_TIMEOUT_MS;
    delete process.env.ION_SENTINEL_ALERT_RETRIES;
  });

  it("sends Slack payload when slack channel is configured", async () => {
    process.env.ION_SENTINEL_ALERT_CHANNEL = "slack";
    process.env.ION_SENTINEL_SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T000/B000/XXXX";

    const originalFetch = globalThis.fetch;
    let called = false;
    globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
      called = true;
      assert.equal(init?.method, "POST");
      const payload = JSON.parse(String(init?.body ?? "{}")) as { blocks?: unknown[]; text?: string };
      assert.ok(Array.isArray(payload.blocks));
      assert.ok(payload.text?.includes("ION Sentinel"));
      return new Response("ok", { status: 200 });
    }) as typeof fetch;

    try {
      const result = await routeSentinelAlerts([baseEvent]);
      assert.equal(result.notified.length, 1);
      assert.equal(called, true);
      const logs = listAlertLog(10);
      assert.ok(logs.some((entry) => entry.channel === "slack"));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("alert self-test reports not configured when env missing", async () => {
    const result = await runSentinelAlertSelfTest();
    assert.equal(result.ok, false);
    assert.equal(result.configured, false);
    assert.equal(result.channel, null);
  });

  it("alert self-test succeeds when webhook responds ok", async () => {
    process.env.ION_SENTINEL_ALERT_WEBHOOK_URL = "https://hooks.example.com/ion-sentinel";

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body ?? "{}")) as { type?: string };
      assert.equal(payload.type, "ion_sentinel_alert_test");
      return new Response("ok", { status: 200 });
    }) as typeof fetch;

    try {
      const result = await runSentinelAlertSelfTest();
      assert.equal(result.ok, true);
      assert.equal(result.configured, true);
      assert.equal(result.channel, "webhook");
      assert.equal(result.statusCode, 200);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("queues P2/P3 events for review", async () => {
    const result = await routeSentinelAlerts([{ ...baseEvent, id: "evt_p2", severity: "P2" }]);
    assert.equal(result.notified.length, 0);
    assert.equal(result.queuedForReview.length, 1);
    assert.equal(listReviewQueue(10).length, 1);
  });
});
