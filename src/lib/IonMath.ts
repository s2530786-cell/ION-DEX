/**
 * @file IonMath.ts
 * @description Precision math utilities for ION DEX token calculations.
 * Handles 18-decimal ION arithmetic with BigInt to avoid floating-point errors.
 */

export const IonMath = {
  ONE_ION: BigInt(10) ** BigInt(18),

  /**
   * Converts a human-readable ION amount to wei-equivalent BigInt.
   */
  toRaw(amount: number): bigint {
    return BigInt(Math.floor(amount * 1e6)) * BigInt(10) ** BigInt(12);
  },

  /**
   * Converts raw BigInt to human-readable ION amount.
   */
  toIon(raw: bigint): number {
    return Number(raw) / 1e18;
  },

  /**
   * Calculates swap output using constant product AMM formula.
   * amountOut = (amountIn * reserveOut * (10000 - feeBps)) / (reserveIn * 10000 + amountIn * (10000 - feeBps))
   */
  getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint, feeBps: number): bigint {
    const amountInWithFee = amountIn * BigInt(10000 - feeBps);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * BigInt(10000) + amountInWithFee;
    return numerator / denominator;
  },

  /**
   * Calculates price impact percentage (0-100).
   */
  priceImpact(amountIn: bigint, reserveIn: bigint): number {
    const impact = (Number(amountIn) / Number(reserveIn)) * 100;
    return Math.min(impact, 100);
  },

  /**
   * Returns the minimum of two BigInts.
   */
  min(a: bigint, b: bigint): bigint {
    return a < b ? a : b;
  },

  /**
   * Returns the maximum of two BigInts.
   */
  max(a: bigint, b: bigint): bigint {
    return a > b ? a : b;
  },
};
