export const OFFICIAL_LIQUID_STAKE_RECEIPT = "LION";
export const OFFICIAL_UNSTAKE_ROUND_HOURS_APPROX = 18;

export function formatStakingAprLabel(value: number | null, fallback: string): string {
  if (value === null || !Number.isFinite(value)) {
    return fallback;
  }
  return `${value.toFixed(2)}%`;
}
