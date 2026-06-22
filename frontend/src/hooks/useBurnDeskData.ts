import { useCallback, useMemo } from "react";
import type { PageHeroMetric } from "@/components/ui/glass/PageHero";
import { useApiResource } from "@/hooks/useApiResource";
import { burnTrendBarsFromWindows, formatBurnChainSplit } from "@/lib/burnDeskData";
import {
  OFFICIAL_BURN_PROOF_STEPS,
  OFFICIAL_ION_MAINNET_BURN_ADDRESS,
  OFFICIAL_ION_MAINNET_BURN_NAME,
} from "@/lib/officialBurnSemantics";
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
        label: "BSC dead",
        value: summary.bscBurnAddress
          ? `${summary.bscBurnAddress.slice(0, 6)}…${summary.bscBurnAddress.slice(-4)}`
          : "—",
        tone: "magenta",
        testId: "burn-metric-bsc",
      },
      {
        label: OFFICIAL_ION_MAINNET_BURN_NAME,
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

  const proofLines = useMemo(() => {
    if (burn.state !== "ready") {
      return OFFICIAL_BURN_PROOF_STEPS;
    }
    const s = burn.data;
    return [
      `BSC dead: ${s.bscBurnAddress || "—"}`,
      `ION ${OFFICIAL_ION_MAINNET_BURN_NAME}: ${s.ionBurnSource || OFFICIAL_ION_MAINNET_BURN_ADDRESS}`,
      OFFICIAL_BURN_PROOF_STEPS[2],
    ];
  }, [burn.data, burn.state]);

  return {
    burn,
    heroMetrics,
    trendBars,
    chainSplitLine,
    proofLines,
  };
}
