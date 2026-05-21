import { useCallback, useMemo } from "react";
import { useApiResource, type ApiLoadState } from "@/hooks/useApiResource";
import { buildPoolRowsFromApi, formatUsdCompact } from "@/lib/poolDeskData";
import { fetchMarketTickers, fetchStakingSummary, type StakingSummary } from "@/lib/ionApi";
import type { PageHeroMetric } from "@/components/ui/glass/PageHero";

const emptyStaking: StakingSummary = {
  totalStakedIon: "",
  officialStakedIon: "",
  dexStakedIon: "",
  lpStakedUsd: "",
  apr: { officialPct: 0, dexPct: 0, lpMiningPct: 0 },
};

function dashMetrics(): PageHeroMetric[] {
  return [
    { label: "Pairs", value: "—", tone: "cyan" },
    { label: "TVL", value: "—", tone: "gold" },
    { label: "APR", value: "—", tone: "magenta" },
  ];
}

export function usePoolDeskData() {
  const fetchStaking = useCallback((signal: AbortSignal) => fetchStakingSummary(signal), []);
  const fetchTickers = useCallback((signal: AbortSignal) => fetchMarketTickers(signal), []);

  const staking = useApiResource(fetchStaking, emptyStaking, { timeoutMs: 15_000 });
  const tickers = useApiResource(fetchTickers, [], {
    isEmpty: (data) => data.length === 0,
    timeoutMs: 15_000,
  });

  const ready = staking.state === "ready" && tickers.state === "ready";

  const pools = useMemo(
    () => (ready ? buildPoolRowsFromApi(staking.data, tickers.data) : []),
    [ready, staking.data, tickers.data],
  );

  const heroMetrics = useMemo((): PageHeroMetric[] => {
    if (!ready || pools.length === 0) {
      return dashMetrics();
    }
    const primary = pools[0];
    return [
      { label: "Pairs", value: primary.pair, tone: "cyan", testId: "pool-metric-pair" },
      { label: "TVL", value: formatUsdCompact(primary.tvlUsd), tone: "gold", testId: "pool-metric-tvl" },
      {
        label: "APR",
        value: `${primary.aprPct}%`,
        tone: "magenta",
        testId: "pool-metric-apr",
      },
    ];
  }, [pools, ready]);

  const combinedState: ApiLoadState =
    staking.state === "loading" || tickers.state === "loading"
      ? "loading"
      : staking.state === "error" || tickers.state === "error"
        ? "error"
        : staking.state === "empty" || tickers.state === "empty" || pools.length === 0
          ? "empty"
          : "ready";

  const combinedError = staking.error ?? tickers.error;

  const reload = () => {
    staking.reload();
    tickers.reload();
  };

  return {
    staking,
    tickers,
    pools,
    heroMetrics,
    ready,
    combinedState,
    combinedError,
    reload,
  };
}
