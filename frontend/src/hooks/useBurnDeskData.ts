import { useCallback, useMemo } from "react";
import type { PageHeroMetric } from "@/components/ui/glass/PageHero";
import { useApiResource } from "@/hooks/useApiResource";
import { burnTrendBarsFromWindows, formatBurnChainSplit } from "@/lib/burnDeskData";
import { fetchBurnSummary, formatIonAmount, type BurnSummary } from "@/lib/ionApi";

const emptyBurn: BurnSummary = {
  totalBurnedIon: "",
  bscBurnedIon: "",
  ionMainnetBurnedIon: "",
  remainingSupplyIon: "",
  bscBurnAddress: "",
  ionBurnSource: "",
};

export function useBurnDeskData() {
  const fetchBurn = useCallback((signal: AbortSignal) => fetchBurnSummary(signal), []);
  const burn = useApiResource(fetchBurn, emptyBurn, { timeoutMs: 15_000 });

  const heroMetrics = useMemo((): PageHeroMetric[] => {
    if (burn.state !== "ready") {
      return [
        { label: "Total burned", value: "—", tone: "gold" },
        { label: "BSC burn", value: "—", tone: "magenta" },
        { label: "ION burn", value: "—", tone: "cyan" },
      ];
    }
    const summary = burn.data;
    return [
      {
        label: "Total burned",
        value: `${formatIonAmount(summary.totalBurnedIon)} ION`,
        tone: "gold",
        testId: "burn-metric-total",
      },
      {
        label: "BSC burn",
        value: summary.bscBurnAddress
          ? `${summary.bscBurnAddress.slice(0, 6)}…${summary.bscBurnAddress.slice(-4)}`
          : "—",
        tone: "magenta",
        testId: "burn-metric-bsc",
      },
      {
        label: "ION burn",
        value: `${formatIonAmount(summary.ionMainnetBurnedIon)} ION`,
        tone: "cyan",
        testId: "burn-metric-ion",
      },
    ];
  }, [burn.data, burn.state]);

  const trendBars = useMemo(
    () => (burn.state === "ready" ? burnTrendBarsFromWindows(burn.data.windows) : []),
    [burn.data.windows, burn.state],
  );

  const chainSplitLine = useMemo(
    () => (burn.state === "ready" ? formatBurnChainSplit(burn.data) : "Loading burn summary…"),
    [burn.data, burn.state],
  );

  return {
    burn,
    heroMetrics,
    trendBars,
    chainSplitLine,
  };
}
