type Eip6963ProviderInfo = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
};

type Eip6963ProviderDetail = {
  info: Eip6963ProviderInfo;
  provider: unknown;
};

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<Eip6963ProviderDetail>;
  }
}

let started = false;

export function startEip6963Discovery(): void {
  if (started) {
    return;
  }
  started = true;

  // Best-effort EIP-6963 discovery. Wagmi also has multiInjectedProviderDiscovery enabled,
  // but we keep this to improve wallet availability signals in supported browsers.
  try {
    window.addEventListener("eip6963:announceProvider", () => {
      // no-op: we only need the browser to emit announcements for other tooling to pick up
    });
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  } catch {
    // ignore
  }
}

export function sortEvmWalletKinds<T extends string>(
  order: readonly T[],
  isAvailable: (kind: T) => boolean,
): T[] {
  return [...order].filter((kind) => isAvailable(kind));
}

