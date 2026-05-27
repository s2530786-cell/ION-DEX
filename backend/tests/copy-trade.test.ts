import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/server.js";
import { resetCopyTradeForTests } from "../src/services/copyTrade.js";

type JsonResponse = {
  data?: {
    isActive?: boolean;
    leaderAddress?: string | null;
    myCopyCount?: number;
    onlineTraders?: number;
  };
  error?: {
    code: string;
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

describe("copy-trade API", () => {
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

  it("returns stats with provenance fields", async () => {
    resetCopyTradeForTests();
    const response = await requestJson("/api/copy-trade/stats");
    assert.equal(response.status, 200);
    assert.equal(response.body.data?.isActive, false);
    assert.ok(typeof response.body.data?.onlineTraders === "number");
  });

  it("starts and stops a copy session", async () => {
    resetCopyTradeForTests();
    const start = await requestJson("/api/copy-trade/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        leaderAddress: "0x1111111111111111111111111111111111111111",
        maxCopyAmount: "1000000000000000000",
        minProfitBps: 50,
        stopLossBps: 200,
        copySlippageBps: 30,
        copyDirection: "same",
      }),
    });
    assert.equal(start.status, 200);
    assert.equal(start.body.data?.isActive, true);
    assert.equal(start.body.data?.leaderAddress, "0x1111111111111111111111111111111111111111");

    const stop = await requestJson("/api/copy-trade/stop", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(stop.status, 200);
    assert.equal(stop.body.data?.isActive, false);
  });

  it("rejects invalid leader address", async () => {
    resetCopyTradeForTests();
    const response = await requestJson("/api/copy-trade/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        leaderAddress: "not-an-address",
        maxCopyAmount: "1",
        minProfitBps: 50,
        stopLossBps: 200,
        copySlippageBps: 30,
        copyDirection: "same",
      }),
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.error?.message);
  });
});
