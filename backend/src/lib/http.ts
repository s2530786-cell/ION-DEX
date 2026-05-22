import { ProxyAgent } from "undici";

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
const proxyAgent = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

export type FetchJsonOptions = {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs: number;
};

export class HttpRequestError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = "HttpRequestError";
    this.status = status;
    this.url = url;
  }
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: options.headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      ...(proxyAgent ? { dispatcher: proxyAgent } : {}),
    });

    if (!response.ok) {
      const snippet = (await response.text()).slice(0, 240);
      throw new HttpRequestError(
        `HTTP ${response.status} from ${url}: ${snippet}`,
        response.status,
        url,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
