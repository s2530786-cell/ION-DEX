import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'strategies.json');

export type StrategyType = 'grid' | 'trend' | 'arbitrage' | 'market_making';
export type StrategyStatus = 'draft' | 'running' | 'paused' | 'closed';
export type RiskLevel = 'Low' | 'Medium' | 'High';

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

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  }
}

function readStrategies(): Strategy[] {
  ensureDataDir();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as Strategy[];
}

function writeStrategies(strategies: Strategy[]): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(strategies, null, 2), 'utf-8');
}

export function getAllStrategies(): Strategy[] {
  return readStrategies();
}

export function getStrategyById(id: string): Strategy | undefined {
  return readStrategies().find((s) => s.id === id);
}

export function createStrategy(input: CreateStrategyInput): Strategy {
  const strategies = readStrategies();
  const now = new Date().toISOString();
  const strategy: Strategy = {
    id: randomUUID(),
    name: input.name,
    type: input.type,
    riskLevel: input.type === 'market_making' ? 'High' : input.type === 'trend' ? 'Medium' : 'Low',
    params: input.params,
    status: 'draft',
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

export function updateStrategy(id: string, updates: Partial<Pick<Strategy, 'name' | 'type' | 'params' | 'status'>>): Strategy | null {
  const strategies = readStrategies();
  const idx = strategies.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const existing = strategies[idx];
  const updated: Strategy = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  if (updates.params) {
    updated.fundSize = updates.params.fundAmount;
  }
  strategies[idx] = updated;
  writeStrategies(strategies);
  return updated;
}

export function deleteStrategy(id: string): boolean {
  const strategies = readStrategies();
  const idx = strategies.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  strategies.splice(idx, 1);
  writeStrategies(strategies);
  return true;
}

export function simulateStrategy(_id: string): SimulateResult {
  // Mock simulation — production replaces with real backtest engine
  return {
    strategyId: _id,
    estimatedReturn: Math.round((10 + Math.random() * 40) * 10) / 10,
    maxDrawdown: Math.round((1 + Math.random() * 14) * 10) / 10,
    sharpeRatio: Math.round((1 + Math.random() * 3) * 100) / 100,
    winRate: Math.round((45 + Math.random() * 30) * 10) / 10,
    totalTrades: Math.floor(100 + Math.random() * 900),
    backtestDays: 90,
  };
}
