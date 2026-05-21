import type { ServerConfig } from "../config/server-config.js";
import { OFFICIAL_ION_MAINNET_BURN_ADDRESS } from "../constants/official-ion-addresses.js";
import { fetchJson } from "../lib/http.js";

type TonHttpEnvelope<T> = {
  ok?: boolean;
  result?: T;
  error?: string;
  code?: number;
};

export type IonApiHealth = {
  reachable: boolean;
  baseUrl: string;
  statusCode: number | null;
  note: string;
};

export async function probeIonApi(config: ServerConfig): Promise<IonApiHealth> {
  const base = config.ionApiBaseUrl.endsWith("/")
    ? config.ionApiBaseUrl
    : `${config.ionApiBaseUrl}/`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.httpTimeoutMs);

  try {
    const response = await fetch(base, {
      method: "GET",
      headers: { accept: "application/json,text/html" },
      signal: controller.signal,
    });

    return {
      reachable: response.ok || response.status < 500,
      baseUrl: base,
      statusCode: response.status,
      note: "ION HTTP API reachability probe (not a full indexer sync).",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      reachable: false,
      baseUrl: base,
      statusCode: null,
      note: `ION API probe failed: ${message}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

function ionApiBase(config: ServerConfig): string {
  return config.ionApiBaseUrl.endsWith("/") ? config.ionApiBaseUrl : `${config.ionApiBaseUrl}/`;
}

/**
 * Official mainnet burn sink balance (nanoton string from getAddressBalance).
 * @see docs/ion-official-burn-reference.md
 */
export async function fetchIonMainnetBurnAddressBalance(
  config: ServerConfig,
  address: string = OFFICIAL_ION_MAINNET_BURN_ADDRESS,
): Promise<{ address: string; balanceNanoton: bigint; apiUrl: string }> {
  const base = ionApiBase(config);
  const url = new URL("getAddressBalance", base);
  url.searchParams.set("address", address);

  const payload = await fetchJson<TonHttpEnvelope<string>>(url.toString(), {
    method: "GET",
    headers: { accept: "application/json" },
    timeoutMs: config.httpTimeoutMs,
  });

  if (payload.ok === false || payload.result === undefined) {
    const detail = payload.error ?? "unknown ION API error";
    throw new Error(`ION getAddressBalance failed: ${detail}`);
  }

  return {
    address,
    balanceNanoton: BigInt(payload.result),
    apiUrl: url.toString(),
  };
}
