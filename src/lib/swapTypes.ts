/**
 * @file types/swap.ts
 * @description Standardized type contracts for the ION DEX Swap module.
 */

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  balance?: string; 
}

export interface RouteStep {
  poolAddress: string;
  tokenIn: string;
  tokenOut: string;
  fee: number;
}

export interface QuoteResponse {
  expectedOutput: string;
  minimumReceived: string;
  route: RouteStep[];
  priceImpact: number;
  gasEstimate: string;
  simulationPassed: boolean;
}
