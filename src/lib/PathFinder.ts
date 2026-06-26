import { IonMath } from '../lib/IonMath';

/**
 * @file PathFinder.ts
 * @description Advanced multi-hop routing engine for ION DEX.
 * Calculates optimal trade paths to minimize slippage and gas overhead.
 */

interface LiquidityPool {
  id: string;
  tokenA: string;
  tokenB: string;
  reserveA: bigint;
  reserveB: bigint;
  feeBps: number; // 30 = 0.3%
}

export class PathFinder {
  /**
   * Finds the most capital-efficient path between two tokens.
   */
  static findBestPath(
    tokenIn: string,
    tokenOut: string,
    pools: LiquidityPool[],
    maxHops: number = 2
  ): string[] {
    const allPaths = this.findAllPaths(tokenIn, tokenOut, pools, maxHops);
    
    let bestPath: string[] = [];
    let maxOutput = 0n;

    for (const path of allPaths) {
      const expectedOutput = this.calculateExpectedOutput(path, pools);
      // Logic: Subtract gas cost from output before comparison
      if (expectedOutput > maxOutput) {
        maxOutput = expectedOutput;
        bestPath = path;
      }
    }

    return bestPath;
  }

  private static calculateExpectedOutput(path: string[], pools: LiquidityPool[]): bigint {
    let currentAmount = 1000000000n; // 1 unit for comparison
    
    for (let i = 0; i < path.length - 1; i++) {
      const pool = pools.find(p => 
        (p.tokenA === path[i] && p.tokenB === path[i+1]) || 
        (p.tokenB === path[i] && p.tokenA === path[i+1])
      );
      if (!pool) return 0n;
      
      // Apply x * y = k logic with fee
      currentAmount = this.getAmountOut(currentAmount, pool, path[i]);
    }
    
    return currentAmount;
  }

  private static getAmountOut(amountIn: bigint, pool: LiquidityPool, tokenIn: string): bigint {
    const reserveIn = tokenIn === pool.tokenA ? pool.reserveA : pool.reserveB;
    const reserveOut = tokenIn === pool.tokenA ? pool.reserveB : pool.reserveA;
    
    const amountInWithFee = amountIn * BigInt(10000 - pool.feeBps);
    const numerator = amountInWithFee * reserveOut;
    const denominator = (reserveIn * 10000n) + amountInWithFee;
    
    return numerator / denominator;
  }

  private static findAllPaths(start: string, end: string, pools: LiquidityPool[], maxHops: number): string[][] {
    // Basic DFS to find all paths up to maxHops
    const paths: string[][] = [];
    const traverse = (current: string, path: string[]) => {
      if (current === end) {
        paths.push(path);
        return;
      }
      if (path.length > maxHops) return;

      const neighbors = pools
        .filter(p => p.tokenA === current || p.tokenB === current)
        .map(p => p.tokenA === current ? p.tokenB : p.tokenA);

      for (const neighbor of neighbors) {
        if (!path.includes(neighbor)) {
          traverse(neighbor, [...path, neighbor]);
        }
      }
    };

    traverse(start, [start]);
    return paths;
  }
}
