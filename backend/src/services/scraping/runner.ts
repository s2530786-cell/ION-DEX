import { ApiErrorCodes } from "../../gateway/response.js";
import type { ScrapingExtractRequest, ScrapingExtractResult, ScrapingMode } from "./types.js";

type NormalizedScrapingRequest = {
  source: {
    url: string;
    kind: ScrapingExtractRequest["source"]["kind"];
  };
  mode: ScrapingMode;
  selectors: {
    title: string;
    content: string;
    publishedAt: string;
  };
  options: {
    timeoutMs: number;
    maxRetries: number;
    respectRobots: boolean;
  };
};

type ScrapingValidationResult =
  | { ok: true; value: NormalizedScrapingRequest }
  | { ok: false; code: (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes]; message: string };

const PRIVATE_IP_PATTERN =
  /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)/i;

function normalizeContent(text: string): string {
  return text.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseTitle(html: string): string | null {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) return normalizeContent(h1[1]).slice(0, 300);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return title?.[1] ? normalizeContent(title[1]).slice(0, 300) : null;
}

function parsePublishedAt(html: string): string | null {
  const time = html.match(/<time[^>]*datetime=["']([^"']+)["']/i);
  if (!time?.[1]) return null;
  const date = new Date(time[1]);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toRequired(input: ScrapingExtractRequest): NormalizedScrapingRequest {
  return {
    source: input.source,
    mode: input.mode ?? "auto",
    selectors: {
      title: input.selectors?.title ?? "h1",
      content: input.selectors?.content ?? "article",
      publishedAt: input.selectors?.publishedAt ?? "time[datetime]",
    },
    options: {
      timeoutMs: input.options?.timeoutMs ?? 12_000,
      maxRetries: input.options?.maxRetries ?? 2,
      respectRobots: input.options?.respectRobots ?? true,
    },
  };
}

export function validateScrapingExtractRequest(input: unknown): ScrapingValidationResult {
  if (!input || typeof input !== "object") {
    return { ok: false, code: ApiErrorCodes.invalidQuoteRequest, message: "Request body must be a JSON object." };
  }
  const candidate = input as ScrapingExtractRequest;
  if (!candidate.source?.url || typeof candidate.source.url !== "string") {
    return { ok: false, code: ApiErrorCodes.invalidQuoteRequest, message: "source.url is required." };
  }
  if (!/^https?:\/\//i.test(candidate.source.url)) {
    return { ok: false, code: ApiErrorCodes.invalidQuoteRequest, message: "source.url must start with http:// or https://." };
  }
  if (PRIVATE_IP_PATTERN.test(candidate.source.url)) {
    return { ok: false, code: ApiErrorCodes.invalidQuoteRequest, message: "Private/local targets are blocked by SSRF policy." };
  }
  const req = toRequired(candidate);
  if (req.options.timeoutMs < 1000 || req.options.timeoutMs > 30000) {
    return { ok: false, code: ApiErrorCodes.invalidQuoteRequest, message: "options.timeoutMs must be within 1000..30000." };
  }
  if (req.options.maxRetries < 0 || req.options.maxRetries > 5) {
    return { ok: false, code: ApiErrorCodes.invalidQuoteRequest, message: "options.maxRetries must be within 0..5." };
  }
  return { ok: true, value: req };
}

async function runFirecrawl(url: string, timeoutMs: number): Promise<ScrapingExtractResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { markdown?: string; metadata?: { title?: string } } };
    const markdown = body.data?.markdown ?? "";
    return {
      url,
      title: body.data?.metadata?.title ?? null,
      contentText: markdown.trim(),
      publishedAt: null,
      sourceEngine: "firecrawl",
      confidence: markdown.length > 50 ? 0.88 : 0.7,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function runScraplingLike(url: string, timeoutMs: number): Promise<ScrapingExtractResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "ION-DEX-Sentinel/1.0 (+scraping)" } });
    const html = await res.text();
    return {
      url,
      title: parseTitle(html),
      contentText: normalizeContent(html).slice(0, 8000),
      publishedAt: parsePublishedAt(html),
      sourceEngine: "scrapling",
      confidence: 0.78,
    };
  } finally {
    clearTimeout(timer);
  }
}

function pickMode(mode: ScrapingMode): ScrapingMode {
  if (mode !== "auto") return mode;
  return process.env.FIRECRAWL_API_KEY ? "firecrawl" : "scrapling";
}

export async function extractWithPolicy(input: NormalizedScrapingRequest): Promise<ScrapingExtractResult> {
  const mode = pickMode(input.mode);
  if (mode === "firecrawl") {
    const fc = await runFirecrawl(input.source.url, input.options.timeoutMs);
    if (fc) return fc;
    return runScraplingLike(input.source.url, input.options.timeoutMs);
  }
  if (mode === "scrapling") {
    return runScraplingLike(input.source.url, input.options.timeoutMs);
  }
  return runScraplingLike(input.source.url, input.options.timeoutMs);
}
