/**
 * @file types/swap.ts
 * @description The "Sacred Contract" for ION DEX Swap module.
 * Formalizes the exchange of high-precision financial data between the 
 * SniperEngine (Go) and the Vue 3 frontend.
 */

/**
 * 1. Atomic Asset Definitions
 */
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  chainId: number;
  balance?: bigint; // nanoION scale
  usdPrice?: number;
}

/**
 * 2. Strategic Routing Models
 */
export interface RouteStep {
  poolAddress: string;
  protocol: 'UniV2' | 'UniV3' | 'Curve' | 'ION-Native';
  tokenIn: string;
  tokenOut: string;
  feeTier: number; // in basis points (e.g. 30 for 0.3%)
  liquidityDepth: string; // BigInt string
}

export interface QuoteResponse {
  inputAmount: string;
  expectedOutput: string;
  minimumOutput: string;
  priceImpact: number; // percentage (0.01 = 1%)
  gasEstimate: string; // in Wei
  route: RouteStep[];
  isStable: boolean; // Verified by Shadow Monitor
  executionPrice: string;
  timestamp: number;
}

/**
 * 3. Security & Simulation
 */
export interface SimulationResult {
  success: boolean;
  gasUsed: string;
  netBalanceDelta: string;
  revertReason?: string;
  logs: string[];
}

/**
 * 4. User Intent & Settings
 */
export interface SwapSettings {
  slippageTolerance: number; // e.g. 0.5
  transactionDeadline: number; // minutes
  autoSlippage: boolean;
  rpcPreference: 'fast' | 'secure' | 'balanced';
}

export type SwapStatus = 'IDLE' | 'QUOTING' | 'SIMULATING' | 'SIGNING' | 'BROADCASTING' | 'CONFIRMED' | 'FAILED';

/**
 * 5. Component Prop Interfaces
 */
export interface SwapPanelProps {
  initialTokenIn?: string;
  initialTokenOut?: string;
}

export interface TokenSelectProps {
  isOpen: boolean;
  excludeAddress?: string;
  onSelect: (token: Token) => void;
}

export interface SwapRouteProps {
  route: RouteStep[];
  isLoading: boolean;
}
