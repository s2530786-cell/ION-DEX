import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBurnReconcileReport } from "../src/indexer/reconcile-burn.js";

describe("buildBurnReconcileReport", () => {
  it("returns rows for mock, bsc-indexer, and ion-indexer sources", () => {
    const report = buildBurnReconcileReport({
      mockTotal: "1000.000",
      bscIndexed: "1000.000",
      ionIndexed: null,
      generatedAt: "2026-05-27T00:00:00.000Z",
    });

    assert.equal(report.generatedAt, "2026-05-27T00:00:00.000Z");
    assert.equal(report.rows.length, 3);
    assert.deepEqual(
      report.rows.map((row) => row.source),
      ["mock", "bsc-indexer", "ion-indexer"],
    );
    assert.equal(report.rows[0]?.status, "ok");
    assert.equal(report.rows[1]?.status, "ok");
    assert.equal(report.rows[2]?.status, "pending");
  });

  it("flags mismatch when indexed total diverges from mock", () => {
    const report = buildBurnReconcileReport({
      mockTotal: "1000.000",
      bscIndexed: "1001.500",
      ionIndexed: "999.000",
    });

    assert.equal(report.rows[1]?.status, "mismatch");
    assert.equal(report.rows[2]?.status, "mismatch");
  });
});
