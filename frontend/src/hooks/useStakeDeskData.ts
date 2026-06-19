import { useCallback, useMemo } from "react";
import type { PageHeroMetric } from "@/components/ui/glass/PageHero";
import { useApiResource } from "@/hooks/useApiResource";
import {
  formatStakingAprLabel,
  OFFICIAL_LIQUID_STAKE_RECEIPT,
  OFFICIAL_UNSTAKE_ROUND_HOURS_APPROX,
} from "@/lib/officialStakingSemantics";
import { fetchStakingSummary, type StakingSummary } from "@/lib/ionApi";

const emptyStaking: StakingSummary = {
  totalStakedIon: "0",
  officialStakedIon: "0",
  dexStakedIon: "0",
  lpStakedUsd: "0",
  apr: { officialPct: null, dexPct: null, lpMiningPct: 0 },
  officialRewardAsset: "LION",
  officialUnstakeRoundHoursApprox: OFFICIAL_UNSTAKE_ROUND_HOURS_APPROX,
};

export function useStakeDeskData() {
  const fetchStaking = useCallback((signal: AbortSignal) => fetchStakingSummary(signal), []);
  const staking = useApiResource(fetchStaking, emptyStaking, { timeoutMs: 15_000 });

  const heroMetrics = useMemo((): PageHeroMetric[] => {
    if (staking.state !== "ready") {
      return [
        { label: "Official receipt", value: OFFICIAL_LIQUID_STAKE_RECEIPT, tone: "gold" },
        { label: "Unstake", value: `~${OFFICIAL_UNSTAKE_ROUND_HOURS_APPROX}h`, tone: "cyan" },
        { label: "DEX integration", value: "—", tone: "magenta" },
      ];
    }
    const summary = staking.data;
    return [
      {
        label: "Official staked",
        value: `${Number(summary.officialStakedIon).toLocaleString()} ION`,
        tone: "gold",
        testId: "stake-metric-official",
      },
      {
        label: "Official APR",
        value: formatStakingAprLabel(summary.apr.officialPct, "Dynamic · live after validator feed"),
        tone: "cyan",
        testId: "stake-metric-official-apr",
      },
      {
        label: "LP mining APR",
        value: formatStakingAprLabel(summary.apr.lpMiningPct, "—"),
        tone: "magenta",
        testId: "stake-metric-lp",
      },
    ];
  }, [staking.data, staking.state]);

  const overviewLine = useMemo(() => {
    if (staking.state !== "ready") {
      return "Loading staking summary…";
    }
    const s = staking.data;
    const officialApr = formatStakingAprLabel(s.apr.officialPct, "dynamic (official pool)");
    const dexApr = formatStakingAprLabel(s.apr.dexPct, "integration pool · not wired");
    return `Official: stake ION → ${s.officialRewardAsset ?? OFFICIAL_LIQUID_STAKE_RECEIPT}, unstake ~${s.officialUnstakeRoundHoursApprox ?? OFFICIAL_UNSTAKE_ROUND_HOURS_APPROX}h per validation round · APR ${officialApr}. DEX integration fee staking APR ${dexApr} — ${Number(s.dexStakedIon).toLocaleString()} ION (fallback until contracts wired).`;
  }, [staking.data, staking.state]);

  return {
    staking,
    heroMetrics,
    overviewLine,
  };
}
