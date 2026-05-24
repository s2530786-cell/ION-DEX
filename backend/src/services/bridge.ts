export type BridgeRoute = {
  routeId: string;
  fromChain: "BSC" | "ION";
  toChain: "BSC" | "ION";
  asset: "ION";
  status: "design" | "mock" | "paused" | "online";
  minAmountIon: string;
  maxAmountIon: string;
  estimatedMinutes: number;
  confirmationsRequired: number;
  safeguards: string[];
};

export type BridgeRoutesPayload = {
  routes: BridgeRoute[];
  relayerStatus: "mocked" | "planned" | "online" | "degraded" | "offline";
  verifier: {
    threshold: string;
    replayProtection: boolean;
    proofStatus: "planned" | "mocked" | "online";
  };
  provenance?: {
    source: "mock" | "upstream";
    note: string;
  };
};

export function getBridgeRoutes(): BridgeRoutesPayload {
  return {
    routes: [
      {
        routeId: "bsc-ion-ion",
        fromChain: "BSC",
        toChain: "ION",
        asset: "ION",
        status: "mock",
        minAmountIon: "10.000",
        maxAmountIon: "500000.000",
        estimatedMinutes: 12,
        confirmationsRequired: 15,
        safeguards: ["vault-limit", "relayer-threshold", "replay-protection", "manual-pause"],
      },
      {
        routeId: "ion-bsc-ion",
        fromChain: "ION",
        toChain: "BSC",
        asset: "ION",
        status: "design",
        minAmountIon: "10.000",
        maxAmountIon: "250000.000",
        estimatedMinutes: 18,
        confirmationsRequired: 8,
        safeguards: ["release-limit", "relayer-threshold", "proof-audit-log", "manual-pause"],
      },
    ],
    relayerStatus: "mocked",
    verifier: {
      threshold: "3-of-5 draft",
      replayProtection: true,
      proofStatus: "planned",
    },
    provenance: {
      source: "mock",
      note: "Phase 3 mock bridge routes; relayer and proof paths are not live.",
    },
  };
}
