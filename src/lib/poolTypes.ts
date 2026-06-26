// src/types/pool.ts

export interface PoolToken {
  address: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

/**
 * @file types/pool.ts
 * @description Single Source of Truth for ION DEX V3 Concentrated Liquidity.
 * Strictly adheres to sqrtPriceX96 and tick-based positioning.
 */
export interface LiquidityPool {
  id: string; // Pool Contract Address
  token0: PoolToken;
  token1: PoolToken;
  feeTier: number; // 100 = 0.01%, 500 = 0.05%, 3000 = 0.3%, 10000 = 1%
  
  // V3 Math Core
  liquidity: string; // Active liquidity (BigInt String)
  sqrtPriceX96: string; // sqrt(P) * 2^96
  tick: number; // Discrete price tick
  
  // Intelligence Metrics
  tvlUSD: number; 
  volume24hUSD: number;
  apr: number; 
}

/** User Position (NFT-based) */
export interface Position {
  tokenId: string; 
  poolAddress: string;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  tokensOwed0: string; 
  tokensOwed1: string;
  inRange: boolean; 
}
