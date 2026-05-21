import type { BurnSummary, BurnWindow } from "@/lib/ionApi";

export type { BurnWindow };

/** Normalize burn window trend % into bar heights (0–100); empty when no windows. */
export function burnTrendBarsFromWindows(windows: BurnWindow[] | undefined): number[] {
  if (!windows || windows.length === 0) {
    return [];
  }
  const magnitudes = windows.map((row) => Math.abs(row.trendPct));
  const max = Math.max(...magnitudes, 0.0001);
  return magnitudes.map((value) => Math.round((value / max) * 100));
}

export function formatBurnChainSplit(summary: BurnSummary): string {
  const bsc = Number(summary.bscBurnedIon);
  const ion = Number(summary.ionMainnetBurnedIon);
  const remaining = Number(summary.remainingSupplyIon);
  if (!Number.isFinite(bsc) || !Number.isFinite(ion) || bsc + ion <= 0) {
    return "Chain split unavailable — waiting for burn summary API.";
  }
  const bscPct = Math.round((bsc / (bsc + ion)) * 100);
  const ionPct = 100 - bscPct;
  const remainingLabel = Number.isFinite(remaining)
    ? `${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} ION remaining`
    : "remaining supply —";
  return `Chain split · BSC ${bscPct}% · ION ${ionPct}% · ${remainingLabel}`;
}
