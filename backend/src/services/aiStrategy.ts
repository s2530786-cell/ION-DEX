import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "strategies.json");

export type StrategyType = "grid" | "trend" | "arbitrage" | "market_making";
export type StrategyStatus = "draft" | "running" | "paused" | "closed";
export type RiskLevel = "Low" | "Medium" | "High";

export interface StrategyParams {
  fundAmount: number;
  stopLoss: number;
  takeProfit: number;
  maxSlippage: number;
}

export interface Strategy {
  id: string;
  name: string;
  type: StrategyType;
  riskLevel: RiskLevel;
  params: StrategyParams;
  status: StrategyStatus;
  returnRate: number;
  runtime: number;
  fundSize: number;
  maxDrawdown: number;
  sharpeRatio: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStrategyInput {
  name: string;
  type: StrategyType;
  params: StrategyParams;
}

export interface SimulateResult {
  strategyId: string;
  estimatedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
  backtestDays: number;
}

export type StrategyUpdate = Partial<Pick<Strategy, "name" | "type" | "params" | "status">>;

const riskByType: Record<StrategyType, RiskLevel> = {
  grid: "Low",
  trend: "Medium",
  arbitrage: "Low",
  market_making: "High",
};

const baseReturnByType: Record<StrategyType, number> = {
  grid: 11,
  trend: 18,
  arbitrage: 8,
  market_making: 24,
};

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

function readStrategies(): Strategy[] {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw) as Strategy[];
}

function writeStrategies(strategies: Strategy[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(strategies, null, 2), "utf8");
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function deterministicScore(strategy: Strategy): number {
  const hash = createHash("sha256").update(`${strategy.id}:${strategy.type}:${strategy.name}`).digest();
  return hash.readUInt32BE(0) / 0xffffffff;
}

function calculateSimulation(strategy: Strategy): SimulateResult {
  const score = deterministicScore(strategy);
  const riskPenalty = strategy.params.maxSlippage * 0.7 + strategy.params.stopLoss * 0.35;
  const profitBoost = strategy.params.takeProfit * 0.42 + score * 6;
  const estimatedReturn = round(Math.max(0, baseReturnByType[strategy.type] + profitBoost - riskPenalty), 1);
  const maxDrawdown = round(Math.max(0.4, strategy.params.stopLoss * (0.45 + score * 0.35)), 1);
  const sharpeRatio = round(Math.max(0.5, estimatedReturn / Math.max(maxDrawdown * 2.2, 1)), 2);
  const winRate = round(Math.min(82, 48 + sharpeRatio * 8 + score * 8), 1);
  const totalTrades = Math.max(12, Math.round(90 + strategy.params.fundAmount / 125 + score * 80));
  return { strategyId: strategy.id, estimatedReturn, maxDrawdown, sharpeRatio, winRate, totalTrades, backtestDays: 90 };
}

export function getAllStrategies(): Strategy[] {
  return readStrategies();
}

export function getStrategyById(id: string): Strategy | undefined {
  return readStrategies().find((strategy) => strategy.id === id);
}

export function createStrategy(input: CreateStrategyInput): Strategy {
  const strategies = readStrategies();
  const now = new Date().toISOString();
  const strategy: Strategy = {
    id: randomUUID(),
    name: input.name,
    type: input.type,
    riskLevel: riskByType[input.type],
    params: input.params,
    status: "draft",
    returnRate: 0,
    runtime: 0,
    fundSize: input.params.fundAmount,
    maxDrawdown: 0,
    sharpeRatio: 0,
    createdAt: now,
    updatedAt: now,
  };
  strategies.push(strategy);
  writeStrategies(strategies);
  return strategy;
}

export function updateStrategy(id: string, updates: StrategyUpdate): Strategy | null {
  const strategies = readStrategies();
  const index = strategies.findIndex((strategy) => strategy.id === id);
  if (index === -1) {
    return null;
  }
  const existing = strategies[index];
  const nextType = updates.type ?? existing.type;
  const updated: Strategy = {
    ...existing,
    ...updates,
    type: nextType,
    riskLevel: riskByType[nextType],
    fundSize: updates.params?.fundAmount ?? existing.fundSize,
    updatedAt: new Date().toISOString(),
  };
  strategies[index] = updated;
  writeStrategies(strategies);
  return updated;
}

export function deleteStrategy(id: string): boolean {
  const strategies = readStrategies();
  const next = strategies.filter((strategy) => strategy.id !== id);
  if (next.length === strategies.length) {
    return false;
  }
  writeStrategies(next);
  return true;
}

export function simulateStrategy(id: string): SimulateResult | null {
  const strategies = readStrategies();
  const index = strategies.findIndex((strategy) => strategy.id === id);
  if (index === -1) {
    return null;
  }
  const result = calculateSimulation(strategies[index]);
  strategies[index] = {
    ...strategies[index],
    returnRate: result.estimatedReturn,
    maxDrawdown: result.maxDrawdown,
    sharpeRatio: result.sharpeRatio,
    runtime: result.backtestDays * 86400,
    updatedAt: new Date().toISOString(),
  };
  writeStrategies(strategies);
  return result;
}
