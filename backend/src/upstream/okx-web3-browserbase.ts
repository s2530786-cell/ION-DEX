import type { ServerConfig } from "../config/server-config.js";
import { OFFICIAL_ION_OKX_WEB3_URL } from "../services/scraping/market-price.js";
import { fetchPageHtml } from "../services/scraping/market-price.js";
import { parseOkxWeb3TokenPrice } from "../services/scraping/parse-market-price.js";

export type OkxWeb3BrowserbaseConfig = {
  apiKey: string | null;
  functionId: string | null;
  localInvokeUrl: string | null;
  pollIntervalMs: number;
  maxWaitMs: number;
  httpTimeoutMs: number;
};

export type OkxWeb3IonSnapshot = {
  priceUsd: number;
  change24hPct: number | null;
  url: string;
  observedAt: string;
  sourceEngine: "browserbase-functions" | "html-fetch";
};

export type OkxWeb3FunctionResult = {
  ok: boolean;
  platformId?: string;
  priceUsd?: number;
  change24hPct?: number | null;
  url?: string;
  observedAt?: string;
  sourceEngine?: string;
  error?: string;
};

type FetchLike = typeof fetch;

export function normalizeOkxWeb3TokenUrl(input: string): string {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return OFFICIAL_ION_OKX_WEB3_URL;
  }

  const official = new URL(OFFICIAL_ION_OKX_WEB3_URL);
  const isAllowed =
    parsed.protocol === "https:" &&
    parsed.hostname === official.hostname &&
    parsed.pathname.toLowerCase() === official.pathname.toLowerCase();

  return isAllowed ? parsed.toString() : OFFICIAL_ION_OKX_WEB3_URL;
}

export function loadOkxWeb3BrowserbaseConfig(
  env: NodeJS.ProcessEnv = process.env,
  config?: Pick<ServerConfig, "httpTimeoutMs">,
): OkxWeb3BrowserbaseConfig {
  return {
    apiKey: env.BROWSERBASE_API_KEY?.trim() || null,
    functionId: env.BROWSERBASE_OKX_FUNCTION_ID?.trim() || null,
    localInvokeUrl: env.BROWSERBASE_OKX_FUNCTION_URL?.trim() || null,
    pollIntervalMs: Number.parseInt(env.ION_OKX_WEB3_BB_POLL_MS ?? "2000", 10) || 2000,
    maxWaitMs: Number.parseInt(env.ION_OKX_WEB3_BB_MAX_WAIT_MS ?? "90000", 10) || 90000,
    httpTimeoutMs: (config?.httpTimeoutMs ?? Number.parseInt(env.ION_HTTP_TIMEOUT_MS ?? "12000", 10)) || 12000,
  };
}

export function canInvokeOkxWeb3Browserbase(bbConfig: OkxWeb3BrowserbaseConfig): boolean {
  if (bbConfig.localInvokeUrl) return true;
  return Boolean(bbConfig.apiKey && bbConfig.functionId);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function invokeLocalFunction(
  invokeUrl: string,
  url: string,
  fetchImpl: FetchLike,
  timeoutMs: number,
): Promise<OkxWeb3FunctionResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(invokeUrl, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params: { url } }),
    });
    if (!res.ok) {
      throw new Error(`Browserbase local invoke HTTP ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as OkxWeb3FunctionResult;
  } finally {
    clearTimeout(timer);
  }
}

async function invokeCloudFunction(
  bbConfig: OkxWeb3BrowserbaseConfig,
  url: string,
  fetchImpl: FetchLike,
): Promise<OkxWeb3FunctionResult> {
  const apiKey = bbConfig.apiKey!;
  const functionId = bbConfig.functionId!;
  const invokeRes = await fetchImpl(`https://api.browserbase.com/v1/functions/${functionId}/invoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bb-api-key": apiKey,
    },
    body: JSON.stringify({ params: { url } }),
  });
  if (!invokeRes.ok) {
    throw new Error(`Browserbase invoke HTTP ${invokeRes.status} ${invokeRes.statusText}`);
  }
  const invokeBody = (await invokeRes.json()) as { id?: string };
  const invocationId = invokeBody.id;
  if (!invocationId) {
    throw new Error("Browserbase invoke response missing invocation id.");
  }

  const deadline = Date.now() + bbConfig.maxWaitMs;
  while (Date.now() < deadline) {
    const pollRes = await fetchImpl(
      `https://api.browserbase.com/v1/functions/${functionId}/invocations/${invocationId}`,
      { headers: { "x-bb-api-key": apiKey } },
    );
    if (!pollRes.ok) {
      throw new Error(`Browserbase poll HTTP ${pollRes.status} ${pollRes.statusText}`);
    }
    const pollBody = (await pollRes.json()) as {
      status?: string;
      result?: OkxWeb3FunctionResult;
      error?: string;
    };
    if (pollBody.status === "completed") {
      if (pollBody.result) return pollBody.result;
      throw new Error(pollBody.error ?? "Browserbase invocation completed without result.");
    }
    if (pollBody.status === "failed") {
      throw new Error(pollBody.error ?? "Browserbase invocation failed.");
    }
    await sleep(bbConfig.pollIntervalMs);
  }
  throw new Error(`Browserbase invocation timed out after ${bbConfig.maxWaitMs}ms.`);
}

export async function invokeOkxWeb3BrowserbaseFunction(
  bbConfig: OkxWeb3BrowserbaseConfig,
  url: string = OFFICIAL_ION_OKX_WEB3_URL,
  fetchImpl: FetchLike = fetch,
): Promise<OkxWeb3FunctionResult> {
  const safeUrl = normalizeOkxWeb3TokenUrl(url);
  if (bbConfig.localInvokeUrl) {
    return invokeLocalFunction(bbConfig.localInvokeUrl, safeUrl, fetchImpl, bbConfig.maxWaitMs);
  }
  if (!bbConfig.apiKey || !bbConfig.functionId) {
    throw new Error("Browserbase function id and API key are required for cloud invoke.");
  }
  return invokeCloudFunction(bbConfig, safeUrl, fetchImpl);
}

export async function fetchOkxWeb3IonSnapshot(
  config: ServerConfig,
  fetchImpl: FetchLike = fetch,
): Promise<OkxWeb3IonSnapshot> {
  const bbConfig = loadOkxWeb3BrowserbaseConfig(process.env, config);
  const url = OFFICIAL_ION_OKX_WEB3_URL;

  if (canInvokeOkxWeb3Browserbase(bbConfig)) {
    const result = await invokeOkxWeb3BrowserbaseFunction(bbConfig, url, fetchImpl);
    if (result.ok && typeof result.priceUsd === "number" && result.priceUsd > 0) {
      return {
        priceUsd: result.priceUsd,
        change24hPct: result.change24hPct ?? null,
        url: result.url ?? url,
        observedAt: result.observedAt ?? new Date().toISOString(),
        sourceEngine: "browserbase-functions",
      };
    }
    throw new Error(result.error ?? "Browserbase OKX function returned no price.");
  }

  const html = await fetchPageHtml(url, bbConfig.httpTimeoutMs, fetchImpl);
  const parsed = parseOkxWeb3TokenPrice(html);
  if (!parsed) {
    throw new Error("Could not parse OKX Web3 ION USD price from HTML (static fetch).");
  }
  return {
    priceUsd: parsed.priceUsd,
    change24hPct: parsed.change24hPct,
    url,
    observedAt: new Date().toISOString(),
    sourceEngine: "html-fetch",
  };
}
