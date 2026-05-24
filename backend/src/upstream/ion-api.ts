import type { ServerConfig } from "../config/server-config.js";

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
