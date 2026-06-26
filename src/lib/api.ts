/**
 * @file api.ts
 * @description API response types for ION DEX backend communication.
 */

import { BigIntString, RouteStep } from './core';

export interface QuoteResponse {
  quoteId: string;
  amountIn: BigIntString;
  amountOut: BigIntString;
  priceImpact: number;
  fee: BigIntString;
  route: RouteStep[];
  expiresAt: number;
}

export interface SwapResponse {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface PoolInfo {
  address: string;
  tokenA: string;
  tokenB: string;
  reserveA: BigIntString;
  reserveB: BigIntString;
  fee: number;
  tvl: number;
}
