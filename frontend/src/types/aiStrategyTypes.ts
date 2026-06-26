/**
 * @file types/strategy.ts
 * @description Type definitions for the ION DEX AI-Intent & Decision Matrix.
 */

export interface DecisionMatrix {
  priceDeviation: number;
  oracleConsensus: boolean;
  volatilityIndex: number;
  isTrusted: boolean;
}

export interface MarketFeature {
  timestamp: number;
  lastSpread: number;
  tradeVelocity: number;
  poolUtilization: number;
  trendPrediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
}

export interface SniperStrategyState {
  targetPrice: string;
  tolerance: number;
  status: 'IDLE' | 'SCANNING' | 'CONSENSUS_REJECTED' | 'EXECUTING';
  lastDecision: DecisionMatrix;
}
