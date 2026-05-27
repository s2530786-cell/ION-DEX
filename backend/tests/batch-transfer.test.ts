import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/server.js";

type JsonResponse = {
  data?: Record<string, unknown>;
  error?: {
    message: string;
  };
  meta: {
    requestId: string;
  };
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

describe("batch-transfer API", () => {
  before(async () => {
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

  it("returns config payload", async () => {
    const response = await requestJson("/api/batch-transfer/config");
    assert.equal(response.status, 200);
    assert.equal(response.body.data?.feeCurrency, "ION");
    assert.ok(typeof response.body.data?.maxRecipients === "number");
  });

  it("validates transfer payload", async () => {
    const result = await requestJson("/api/batch-transfer/validate-transfer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "0x1111111111111111111111111111111111111111,1\n0x2222222222222222222222222222222222222222,2",
      }),
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.data?.recipientCount, 2);
    assert.equal(result.body.data?.totalAmount, "3");
  });

  it("validates collect payload", async () => {
    const response = await requestJson("/api/batch-transfer/validate-collect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mainAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        text: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n0xcccccccccccccccccccccccccccccccccccccccc",
      }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.data?.fromCount, 2);
  });

  it("rejects invalid transfer payload", async () => {
    const response = await requestJson("/api/batch-transfer/validate-transfer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "bad_line" }),
    });
    assert.equal(response.status, 400);
    assert.match(response.body.error?.message ?? "", /expected address,amount format/i);
  });
});
