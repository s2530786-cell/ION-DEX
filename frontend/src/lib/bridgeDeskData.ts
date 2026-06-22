import type { BridgeRoute, BridgeRoutesPayload } from "@/lib/ionApi";
import type { BridgeDirection } from "@/lib/bridgeContracts";

export function activeRouteForDirection(
  payload: BridgeRoutesPayload,
  direction: BridgeDirection,
): BridgeRoute | null {
  const [from, to] = direction === "bsc-ion" ? (["BSC", "ION"] as const) : (["ION", "BSC"] as const);
  return (
    payload.routes.find((route) => route.fromChain === from && route.toChain === to) ??
    payload.routes[0] ??
    null
  );
}

export function primaryBridgeRoute(payload: BridgeRoutesPayload): BridgeRoute | null {
  return payload.routes[0] ?? null;
}

export function bridgeStepsFromPayload(payload: BridgeRoutesPayload): string[] {
  const route = primaryBridgeRoute(payload);
  if (!route) {
    return ["Configure relayer", "Submit deposit", "Await confirmations"];
  }
  return [
    `${route.fromChain} → ${route.toChain}`,
    `Min ${route.minAmountIon} ION · max ${route.maxAmountIon} ION`,
    `ETA ~${route.estimatedMinutes} min · ${route.confirmationsRequired} confirmations`,
  ];
}
