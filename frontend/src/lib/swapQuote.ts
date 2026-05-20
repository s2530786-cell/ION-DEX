/** Swap protocol fee in basis points (25 bps = 0.25%). */
export const SWAP_PROTOCOL_FEE_BPS = 25;

export type SwapQuoteBreakdown = {
  grossOut: number;
  protocolFee: number;
  minReceived: number;
  priceImpactPct: number;
};

/**
 * Worst-case output after protocol fee and user slippage tolerance.
 * minReceived = (grossOut - protocolFee) * (1 - slippagePct / 100)
 */
export function computeSwapQuoteBreakdown(
  grossOut: number,
  slippagePct: number,
  priceImpactPct: number,
): SwapQuoteBreakdown | null {
  if (!Number.isFinite(grossOut) || grossOut <= 0) {
    return null;
  }
  if (!Number.isFinite(slippagePct) || slippagePct < 0.1 || slippagePct > 5) {
    return null;
  }
  if (!Number.isFinite(priceImpactPct) || priceImpactPct < 0) {
    return null;
  }

  const protocolFee = grossOut * (SWAP_PROTOCOL_FEE_BPS / 10_000);
  const netBeforeSlip = grossOut - protocolFee;
  const minReceived = netBeforeSlip * (1 - slippagePct / 100);

  return {
    grossOut,
    protocolFee,
    minReceived,
    priceImpactPct,
  };
}
