import { useCallback, useMemo } from "react";
import type { PageHeroMetric } from "@/components/ui/glass/PageHero";
import { useApiResource, type ApiLoadState } from "@/hooks/useApiResource";
import { useSwapMarketStats } from "@/hooks/useMarketSurface";
import { fetchMarketTickers, type MarketTicker } from "@/lib/ionApi";

const emptyTickers: MarketTicker[] = [];

export type AiSignalRow = {
  label: string;
  value: string;
  tone?: "cyan" | "magenta" | "gold" | "emerald";
};

export function useAiDeskData() {
  const { stats, loadState: statsState, provenanceLabel: statsProv } = useSwapMarketStats("BNB/ION");
  const fetchTickers = useCallback((signal: AbortSignal) => fetchMarketTickers(signal), []);
  const tickers = useApiResource(fetchTickers, emptyTickers, {
    isEmpty: (data) => data.length === 0,
    timeoutMs: 15_000,
  });

  const heroMetrics = useMemo((): PageHeroMetric[] => {
    const ion =
      tickers.state === "ready"
        ? tickers.data.find((row) => row.symbol === "ION")
        : undefined;
    return [
      {
        label: "ION",
        value: ion?.displayPrice ?? (statsState === "ready" && stats ? stats.lastPrice : "—"),
        tone: "gold",
        testId: "ai-metric-ion",
      },
      {
        label: "24h vol",
        value: statsState === "ready" && stats ? stats.volume24h : "—",
        tone: "cyan",
        testId: "ai-metric-volume",
      },
      {
        label: "Spread",
        value: statsState === "ready" && stats ? stats.spreadPct : "—",
        tone: "magenta",
        testId: "ai-metric-spread",
      },
    ];
  }, [stats, statsState, tickers.data, tickers.state]);

  const signals = useMemo((): AiSignalRow[] => {
    if (statsState !== "ready" || !stats) {
      return [
        { label: "Last price", value: "—" },
        { label: "24h volume", value: "—" },
        { label: "Spread", value: "—" },
        { label: "Route health", value: "—" },
      ];
    }
    const ion =
      tickers.state === "ready"
        ? tickers.data.find((row) => row.symbol === "ION")
        : undefined;
    return [
      {
        label: "Last price",
        value: stats.lastPrice,
        tone: "gold",
      },
      {
        label: "24h change",
        value: ion?.displayChange ?? "—",
        tone: ion && ion.change24hPct >= 0 ? "emerald" : "magenta",
      },
      {
        label: "24h volume",
        value: stats.volume24h,
        tone: "cyan",
      },
      {
        label: "Route health",
        value: stats.routeHealth,
        tone: stats.routeHealth === "liquid" ? "emerald" : "magenta",
      },
    ];
  }, [stats, statsState, tickers.data, tickers.state]);

  const gridSuggestion = useMemo(() => {
    if (statsState !== "ready" || !stats) {
      return "Loading swap-stats for grid bounds hint…";
    }
    return `Market surface · spread ${stats.spreadPct} · price impact ${stats.priceImpactLabel} · route ${stats.routeHealth}. Set bounds in the grid form below.`;
  }, [stats, statsState]);

  const predictionHistory = useMemo(() => {
    if (statsState !== "ready" || !stats) {
      return "Swap-stats API pending — no offline accuracy claims.";
    }
    return `TVL ${stats.tvlUsd} (${stats.tvlChangePct}) · ION fee ${stats.ionFeePct} · data from markets/swap-stats.`;
  }, [stats, statsState]);

  const metricsState: ApiLoadState =
    statsState === "ready"
      ? "ready"
      : statsState === "error"
        ? "error"
        : tickers.state === "empty"
          ? "empty"
          : "loading";

  return {
    tickers,
    stats,
    statsState,
    statsProv,
    heroMetrics,
    signals,
    gridSuggestion,
    predictionHistory,
    metricsState,
  };
}
