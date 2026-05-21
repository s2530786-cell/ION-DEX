import type { BridgeRoute, BridgeRoutesPayload } from "@/lib/ionApi";

export type BridgeStepRow = {
  step: string;
  chain: string;
  state: string;
};

function formatTitleCase(word: string): string {
  if (!word) {
    return word;
  }
  return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`;
}

/** Build status tracker rows from gateway bridge routes (no static demo steps). */
export function bridgeStepsFromPayload(payload: BridgeRoutesPayload): BridgeStepRow[] {
  const rows: BridgeStepRow[] = [
    {
      step: "Relayer",
      chain: "Multisig",
      state: formatTitleCase(payload.relayerStatus),
    },
    {
      step: "Verifier",
      chain: "Threshold",
      state: payload.verifier.threshold,
    },
  ];

  for (const route of payload.routes) {
    rows.push({
      step: `${route.fromChain} → ${route.toChain}`,
      chain: route.asset,
      state: `${formatTitleCase(route.status)} · ~${route.estimatedMinutes} min`,
    });
  }

  return rows;
}

export function primaryBridgeRoute(payload: BridgeRoutesPayload): BridgeRoute | undefined {
  return payload.routes[0];
}
