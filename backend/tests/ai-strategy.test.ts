import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  createStrategy,
  deleteStrategy,
  getAllStrategies,
  getStrategyById,
  simulateStrategy,
  updateStrategy,
} from "../src/services/aiStrategy.js";

const dataDir = path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "strategies.json");
let originalData: string | null = null;

function resetStrategies(): void {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, "[]", "utf8");
}

describe("AI strategy storage service", () => {
  before(() => {
    originalData = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, "utf8") : null;
    resetStrategies();
  });

  beforeEach(() => {
    resetStrategies();
  });

  after(() => {
    if (originalData === null) {
      fs.rmSync(dataFile, { force: true });
      return;
    }
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataFile, originalData, "utf8");
  });

  it("persists a created strategy with derived risk and fund size", () => {
    const strategy = createStrategy({
      name: "Aurora Grid",
      type: "grid",
      params: { fundAmount: 2500, stopLoss: 5, takeProfit: 18, maxSlippage: 0.4 },
    });

    assert.match(strategy.id, /^[0-9a-f-]{36}$/i);
    assert.equal(strategy.riskLevel, "Low");
    assert.equal(strategy.status, "draft");
    assert.equal(strategy.fundSize, 2500);
    assert.equal(getAllStrategies().length, 1);
    assert.equal(getStrategyById(strategy.id)?.name, "Aurora Grid");
  });

  it("updates derived fields when type or params change", () => {
    const strategy = createStrategy({
      name: "Trend Alpha",
      type: "trend",
      params: { fundAmount: 3000, stopLoss: 6, takeProfit: 20, maxSlippage: 0.5 },
    });

    const updated = updateStrategy(strategy.id, {
      type: "market_making",
      status: "running",
      params: { fundAmount: 4200, stopLoss: 7, takeProfit: 24, maxSlippage: 0.7 },
    });

    assert.ok(updated);
    assert.equal(updated.riskLevel, "High");
    assert.equal(updated.status, "running");
    assert.equal(updated.fundSize, 4200);
    assert.notEqual(updated.updatedAt, strategy.updatedAt);
  });

  it("runs deterministic simulation and writes metrics back", () => {
    const strategy = createStrategy({
      name: "Arb Pulse",
      type: "arbitrage",
      params: { fundAmount: 1800, stopLoss: 3, takeProfit: 9, maxSlippage: 0.2 },
    });

    const result = simulateStrategy(strategy.id);
    assert.ok(result);
    assert.equal(result.strategyId, strategy.id);
    assert.equal(result.backtestDays, 90);
    assert.ok(result.estimatedReturn > 0);
    assert.ok(result.totalTrades >= 12);

    const stored = getStrategyById(strategy.id);
    assert.ok(stored);
    assert.equal(stored.returnRate, result.estimatedReturn);
    assert.equal(stored.runtime, 90 * 86400);
    assert.equal(stored.maxDrawdown, result.maxDrawdown);
  });

  it("returns null or false for missing records", () => {
    assert.equal(getStrategyById("missing"), undefined);
    assert.equal(updateStrategy("missing", { status: "paused" }), null);
    assert.equal(simulateStrategy("missing"), null);
    assert.equal(deleteStrategy("missing"), false);
  });
});
