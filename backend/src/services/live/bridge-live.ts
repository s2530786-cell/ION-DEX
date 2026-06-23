import type { ServerConfig } from "../../config/server-config.js";
import type { BridgeRoutesPayload } from "../bridge.js";

export function loadLiveBridgeRoutes(config: ServerConfig): BridgeRoutesPayload {
  return {
    routes: [
      {
        routeId: "bsc-ion-ion",
        fromChain: "BSC",
        toChain: "ION",
        asset: "ION",
        status: "design",
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
    relayerStatus: "planned",
    verifier: {
      threshold: "3-of-5 draft",
      replayProtection: true,
      proofStatus: "planned",
    },
    provenance: {
      source: "upstream",
      note: `Bridge architecture reference only; relayer not live. BSC RPC probe: ${config.bscRpcUrl}. User transfers remain disabled.`,
    },
  };
}
