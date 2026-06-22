import { applyBpsFloor } from "./decimal.js";

/** Protocol fee applied before slippage, aligned with quotes service and on-chain router docs. */
export const PROTOCOL_FEE_BPS = 25;

/**
 * Minimum output after protocol fee and slippage (bigint floor).
 * Formula: minOut = floor(floor(grossOut * (10000 - feeBps) / 10000) * (10000 - slipBps) / 10000)
 */
export function computeMinimumOutputUnits(
  grossOutputUnits: bigint,
  slippageBps: number,
  protocolFeeBps: number = PROTOCOL_FEE_BPS,
): { estimatedOutputUnits: bigint; minimumOutputUnits: bigint; protocolFeeUnits: bigint } {
  if (grossOutputUnits < 0n) {
    throw new Error("grossOutputUnits must be non-negative.");
  }
  if (!Number.isInteger(slippageBps) || slippageBps < 10 || slippageBps > 500) {
    throw new Error("slippageBps must be an integer between 10 and 500.");
  }
  if (!Number.isInteger(protocolFeeBps) || protocolFeeBps < 0 || protocolFeeBps > 10_000) {
    throw new Error("protocolFeeBps must be an integer between 0 and 10000.");
  }

  const protocolFeeUnits = applyBpsFloor(grossOutputUnits, protocolFeeBps);
  const estimatedOutputUnits = grossOutputUnits - protocolFeeUnits;
  const minimumOutputUnits =
    (estimatedOutputUnits * BigInt(10_000 - slippageBps)) / 10_000n;

  return { estimatedOutputUnits, minimumOutputUnits, protocolFeeUnits };
}

/** On-chain guard: swap must return at least amountOutMinimum (same semantics as off-chain quote). */
export function assertMinimumOutput(amountOut: bigint, amountOutMinimum: bigint): void {
  if (amountOut < amountOutMinimum) {
    throw new Error("ION_DEX_MIN_OUTPUT: amountOut below minimum");
  }
}
