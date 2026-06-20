import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/server.js";
import { resetLiquidityMineSessionForTests } from "../src/services/liquidityMine.js";

type JsonResponse = {
  data?: {
    myLpShares?: string;
    pendingReward?: string;
    provenance?: {
      status: string;
      contractAddress: string | null;
    };
    pools?: Array<{ id: number; userStaked: string; canClaim: boolean }>;
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

describe("liquidity-mine API", () => {
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

  it("returns pool catalog", async () => {
    resetLiquidityMineSessionForTests();
    const response = await requestJson("/api/liquidity-mine/pools");
    assert.equal(response.status, 200);
    assert.equal(response.body.data?.pools?.length, 2);
    assert.equal(response.body.data?.myLpShares, "0");
    assert.equal(response.body.data?.provenance?.status, "missing-contract");
  });

  it("returns configured contract provenance when BSC address is set", async () => {
    const previous = process.env.BSC_LIQUIDITY_MINE_ADDRESS;
    process.env.BSC_LIQUIDITY_MINE_ADDRESS = "0x1111111111111111111111111111111111111111";
    resetLiquidityMineSessionForTests();
    try {
      const response = await requestJson("/api/liquidity-mine/pools");
      assert.equal(response.status, 200);
      assert.equal(response.body.data?.provenance?.status, "configured");
      assert.equal(response.body.data?.provenance?.contractAddress, "0x1111111111111111111111111111111111111111");
    } finally {
      if (previous === undefined) {
        delete process.env.BSC_LIQUIDITY_MINE_ADDRESS;
      } else {
        process.env.BSC_LIQUIDITY_MINE_ADDRESS = previous;
      }
    }
  });

  it("stakes and claims rewards", async () => {
    resetLiquidityMineSessionForTests();
    const stake = await requestJson("/api/liquidity-mine/stake", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ poolId: 0, amount: "100" }),
    });
    assert.equal(stake.status, 200);
    assert.notEqual(stake.body.data?.myLpShares, "0");

    const claim = await requestJson("/api/liquidity-mine/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ poolId: 0 }),
    });
    assert.equal(claim.status, 200);
    assert.equal(claim.body.data?.pools?.[0]?.canClaim, false);
  });

  it("rejects invalid pool id", async () => {
    resetLiquidityMineSessionForTests();
    const response = await requestJson("/api/liquidity-mine/stake", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ poolId: 99, amount: "1" }),
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.error?.message);
  });
});
