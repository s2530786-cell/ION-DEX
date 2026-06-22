import { CONTRACTS } from "@/config/contracts";

/** Estimate ION protocol fee from a USD notional and spot ION price. */
export function estimateIonProtocolFeeIon(
  usdNotional: number,
  ionPriceUsd: number,
  feeRate: number = CONTRACTS.fee.swapFee,
): number {
  if (!Number.isFinite(usdNotional) || usdNotional <= 0 || !Number.isFinite(ionPriceUsd) || ionPriceUsd <= 0) {
    return 0;
  }
  return (usdNotional * feeRate) / ionPriceUsd;
}

/** Estimate ION protocol fee from an ION-denominated amount. */
export function estimateIonProtocolFeeFromIonAmount(
  ionAmount: number,
  feeRate: number = CONTRACTS.fee.swapFee,
): number {
  if (!Number.isFinite(ionAmount) || ionAmount <= 0) {
    return 0;
  }
  return ionAmount * feeRate;
}

export function formatIonProtocolFee(ionAmount: number, digits = 6): string {
  return `${ionAmount.toFixed(digits)} ${CONTRACTS.fee.currency}`;
}
