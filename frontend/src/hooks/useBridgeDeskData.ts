import { useCallback, useMemo } from "react";
import type { PageHeroMetric } from "@/components/ui/glass/PageHero";
import { useApiResource } from "@/hooks/useApiResource";
import { bridgeStepsFromPayload, primaryBridgeRoute } from "@/lib/bridgeDeskData";
import {
  fetchBridgeRoutes,
  type BridgeRoutesPayload,
} from "@/lib/ionApi";

const emptyBridge: BridgeRoutesPayload = {
  routes: [],
  relayerStatus: "mocked",
  verifier: {
    threshold: "—",
    replayProtection: false,
    proofStatus: "planned",
  },
};

function formatTitleCase(word: string): string {
  if (!word) {
    return word;
  }
  return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`;
}

export function useBridgeDeskData() {
  const fetchRoutes = useCallback((signal: AbortSignal) => fetchBridgeRoutes(signal), []);
  const routes = useApiResource(fetchRoutes, emptyBridge, {
    isEmpty: (data) => data.routes.length === 0,
    timeoutMs: 15_000,
  });

  const heroMetrics = useMemo((): PageHeroMetric[] => {
    if (routes.state !== "ready") {
      return [
        { label: "Route", value: "—", tone: "cyan" },
        { label: "Relayers", value: "—", tone: "gold" },
        { label: "Verifier", value: "—", tone: "magenta" },
      ];
    }
    const primary = primaryBridgeRoute(routes.data);
    const leg = primary ? `${primary.fromChain} → ${primary.toChain}` : "—";
    return [
      { label: "Route", value: leg, tone: "cyan", testId: "bridge-metric-route" },
      {
        label: "Relayers",
        value: formatTitleCase(routes.data.relayerStatus),
        tone: "gold",
        testId: "bridge-metric-relayer",
      },
      {
        label: "Verifier",
        value: routes.data.verifier.threshold,
        tone: "magenta",
        testId: "bridge-metric-verifier",
      },
    ];
  }, [routes.data, routes.state]);

  const steps = useMemo(
    () => (routes.state === "ready" ? bridgeStepsFromPayload(routes.data) : []),
    [routes.data, routes.state],
  );

  const etaSubtitle = useMemo(() => {
    if (routes.state !== "ready") {
      return "Loading routes…";
    }
    const primary = primaryBridgeRoute(routes.data);
    if (!primary) {
      return "No active route";
    }
    return `Est. ${primary.estimatedMinutes} min · ${primary.confirmationsRequired} confirmations`;
  }, [routes.data, routes.state]);

  return {
    routes,
    heroMetrics,
    steps,
    etaSubtitle,
  };
}
