import type { BurnSummary } from "@/lib/ionApi";
import { formatIonAmount } from "@/lib/ionApi";

export type BurnTrendBar = { label: string; heightPct: number };

export function burnTrendBarsFromWindows(windows: BurnSummary["windows"]): BurnTrendBar[] {
  const rows = windows ?? [
    { label: "7d", burnedIon: "12000" },
    { label: "30d", burnedIon: "48000" },
    { label: "90d", burnedIon: "92000" },
  ];
  const max = Math.max(...rows.map((row) => Number(row.burnedIon) || 0), 1);
  return rows.map((row) => ({
    label: row.label,
    heightPct: Math.round(((Number(row.burnedIon) || 0) / max) * 100),
  }));
}

export function formatBurnChainSplit(summary: BurnSummary): string {
  return `BSC ${formatIonAmount(summary.bscBurnedIon)} · ION ${formatIonAmount(summary.ionMainnetBurnedIon)} · remaining ${formatIonAmount(summary.remainingSupplyIon)}`;
}
