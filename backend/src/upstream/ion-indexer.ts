import type { ServerConfig } from "../config/server-config.js";
import { fetchJson } from "../lib/http.js";

const DEFAULT_INDEXER = "https://api.mainnet.ice.io/indexer/v3";

export type IonIndexerStatus = {
  baseUrl: string;
  reachable: boolean;
  statusCode: number | null;
  note: string;
};

export async function probeIonIndexer(config: ServerConfig): Promise<IonIndexerStatus> {
  const base = (config.ionApiBaseUrl.includes("indexer")
    ? config.ionApiBaseUrl
    : DEFAULT_INDEXER
  ).replace(/\/$/, "");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.httpTimeoutMs);
  try {
    const response = await fetch(`${base}/`, {
      method: "GET",
      headers: { accept: "application/json,text/html" },
      signal: controller.signal,
    });
    return {
      baseUrl: base,
      reachable: response.ok || response.status < 500,
      statusCode: response.status,
      note: "ION Indexer v3 reachability probe.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      baseUrl: base,
      reachable: false,
      statusCode: null,
      note: `ION Indexer probe failed: ${message}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchIonIndexerSupplyHint(
  config: ServerConfig,
): Promise<{ circulatingSupply: string | null; note: string }> {
  const base = DEFAULT_INDEXER.replace(/\/$/, "");
  try {
    await fetchJson<unknown>(`${base}/`, { timeoutMs: config.httpTimeoutMs });
    return {
      circulatingSupply: null,
      note: "Indexer reachable; supply endpoint wiring pending official route.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      circulatingSupply: null,
      note: `Indexer supply hint unavailable: ${message}`,
    };
  }
}
