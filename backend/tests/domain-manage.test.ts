import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/server.js";
import { resetDomainManageSessionForTests } from "../src/services/domainManage.js";

type JsonResponse = {
  data?: {
    ownedCount?: number;
    owned?: Array<{ name: string }>;
    lastLookup?: { name: string; available: boolean } | null;
    message?: string;
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

describe("domain-manage API", () => {
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

  it("returns portfolio overview with seed domain", async () => {
    resetDomainManageSessionForTests();
    const response = await requestJson("/api/domain-manage/overview");
    assert.equal(response.status, 200);
    assert.ok((response.body.data?.ownedCount ?? 0) >= 1);
    assert.ok(response.body.data?.owned?.some((entry) => entry.name === "demo.ion"));
  });

  it("looks up and registers an available domain", async () => {
    resetDomainManageSessionForTests();
    const lookup = await requestJson("/api/domain-manage/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "alpha.ion" }),
    });
    assert.equal(lookup.status, 200);
    assert.equal(lookup.body.data?.lastLookup?.name, "alpha.ion");
    assert.equal(lookup.body.data?.lastLookup?.available, true);

    const register = await requestJson("/api/domain-manage/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "alpha.ion" }),
    });
    assert.equal(register.status, 200);
    assert.ok(register.body.data?.owned?.some((entry) => entry.name === "alpha.ion"));
  });

  it("binds and renews an owned domain", async () => {
    resetDomainManageSessionForTests();
    await requestJson("/api/domain-manage/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "bindme.ion" }),
    });

    const bind = await requestJson("/api/domain-manage/bind", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "bindme.ion", walletAddress: "ion1bindtarget000000000000000000000000000000" }),
    });
    assert.equal(bind.status, 200);
    assert.match(bind.body.data?.message ?? "", /Bind payload prepared/);

    const renew = await requestJson("/api/domain-manage/renew", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "bindme.ion" }),
    });
    assert.equal(renew.status, 200);
    assert.match(renew.body.data?.message ?? "", /Renewal intent recorded/);
  });

  it("rejects invalid domain labels", async () => {
    resetDomainManageSessionForTests();
    const response = await requestJson("/api/domain-manage/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "bad_label" }),
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.error?.message);
  });
});
