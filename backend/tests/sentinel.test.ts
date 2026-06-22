import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/server.js";
import { resetSentinelStoreForTests } from "../src/services/sentinel/store.js";

type JsonResponse = {
  data?: Record<string, unknown>;
  error?: { message: string };
  meta: { requestId: string };
};

let server: Server;
let baseUrl: string;

async function requestJson(path: string, init?: RequestInit): Promise<{ status: number; body: JsonResponse }> {
  const response = await fetch(`${baseUrl}${path}`, init);
  return {
    status: response.status,
    body: (await response.json()) as JsonResponse,
  };
}

describe("sentinel scan API", () => {
  before(async () => {
    process.env.ION_SENTINEL_DOCKER = "0";
    resetSentinelStoreForTests();
    server = createApp();
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address === "object");
    baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("returns sentinel schema", async () => {
    const response = await requestJson("/api/sentinel/schema");
    assert.equal(response.status, 200);
    assert.ok(response.body.data?.sentinel_event_schema);
    assert.equal(response.body.data?.alert_test_endpoint, "POST /api/sentinel/alert-test");
  });

  it("alert-test returns 503 when webhook not configured", async () => {
    delete process.env.ION_SENTINEL_SLACK_WEBHOOK_URL;
    delete process.env.ION_SENTINEL_ALERT_WEBHOOK_URL;
    delete process.env.ION_SENTINEL_ALERT_CHANNEL;

    const response = await requestJson("/api/sentinel/alert-test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(response.status, 503);
    const data = response.body.data as { ok: boolean; configured: boolean };
    assert.equal(data.ok, false);
    assert.equal(data.configured, false);
  });

  it("runs subdomain_scan and stores events", async () => {
    const response = await requestJson("/api/sentinel/scan/subdomain_scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        target: "example.com",
        options: { allowlist: ["www.example.com", "example.com"], timeoutMs: 5000 },
      }),
    });
    assert.equal(response.status, 200);
    const events = response.body.data?.events as Array<{ taskType: string; severity: string }>;
    assert.ok(Array.isArray(events) && events.length > 0);
    assert.equal(events[0]?.taskType, "subdomain_scan");
    const listed = await requestJson("/api/sentinel/events");
    assert.equal(listed.status, 200);
    const stored = listed.body.data?.events as unknown[];
    assert.ok(Array.isArray(stored) && stored.length > 0);
  });

  it("routes P2 findings to review queue for clickjacking_scan", async () => {
    resetSentinelStoreForTests();
    const response = await requestJson("/api/sentinel/scan/clickjacking_scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        target: "https://example.com",
        options: { timeoutMs: 8000 },
      }),
    });
    assert.equal(response.status, 200);
    const alerts = response.body.data?.alerts as {
      notified: unknown[];
      queuedForReview: unknown[];
    };
    assert.ok(alerts);
    const review = await requestJson("/api/sentinel/review-queue");
    assert.equal(review.status, 200);
    const items = review.body.data?.items as unknown[];
    assert.ok(Array.isArray(items));
  });

  it("rejects unknown task type", async () => {
    const response = await requestJson("/api/sentinel/scan/unknown_task", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ target: "example.com" }),
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.error?.message);
  });
});
