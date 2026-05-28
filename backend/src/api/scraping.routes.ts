import type { IncomingMessage, ServerResponse } from "node:http";
import { ApiErrorCodes, apiError, apiResponse, writeJson, type ApiMeta } from "../gateway/response.js";
import {
  OFFICIAL_ION_BSC_ADDRESSES,
  scrapeLiveMarketPrices,
} from "../services/scraping/market-price.js";
import { extractWithPolicy, validateScrapingExtractRequest } from "../services/scraping/runner.js";
import type { SentinelEvent } from "../services/scraping/types.js";
import { runSentinelAlertSelfTest } from "../services/sentinel/alerts.js";
import { runSentinelScan, validateSentinelScanRequest } from "../services/sentinel/index.js";
import { listAlertLog, listReviewQueue, listSentinelEvents } from "../services/sentinel/store.js";

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? (JSON.parse(raw) as unknown) : {};
}

const sentinelTaskSchemas = {
  subdomain_scan: {
    targetSchema: "domain",
    description: "Enumerate subdomains from controlled sources and baseline drift.",
  },
  clickjacking_scan: {
    targetSchema: "url",
    description: "Validate frame-ancestors/X-Frame-Options and render embedding behavior.",
  },
  credential_exposure_scan: {
    targetSchema: "brand+domain",
    description: "Check leaked-credential intelligence feeds and confidence scoring.",
  },
} as const;

const sampleEvents: SentinelEvent[] = [
  {
    id: "sentinel_evt_sample_subdomain",
    taskType: "subdomain_scan",
    severity: "P2",
    target: "ion-dex.example",
    summary: "New untracked subdomain detected.",
    findings: ["api-legacy.ion-dex.example resolved but not in allowlist"],
    sourceTool: "Sublist3r",
    detectedAt: new Date().toISOString(),
    falsePositive: false,
    remediation: ["Verify owner", "Add DNS policy or decommission endpoint"],
  },
];

export async function handleScrapingRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  meta: ApiMeta,
): Promise<boolean> {
  if (pathname === "/api/scraping/health" && request.method === "GET") {
    writeJson(
      response,
      200,
      apiResponse(
        {
          status: "ok",
          engines: {
            scrapling: true,
            firecrawl: Boolean(process.env.FIRECRAWL_API_KEY),
          },
          sandbox: "docker/security-sandbox/offsec-lab",
        },
        meta,
      ),
    );
    return true;
  }

  if (pathname === "/api/scraping/live-prices" && request.method === "GET") {
    const { prices, failures } = await scrapeLiveMarketPrices();
    writeJson(
      response,
      200,
      apiResponse(
        {
          method: "html-scrape",
          note: "USD prices from HTML scrape: official ION from OKX Web3 token page (contract 0xe1ab…), fallback Pancake LP on-chain; BTC/ETH/SOL/BNB from CMC HTML — not /api/price REST APIs.",
          officialIon: {
            ...OFFICIAL_ION_BSC_ADDRESSES,
            okxWeb3Url: `https://web3.okx.com/zh-hans/token/bsc/${OFFICIAL_ION_BSC_ADDRESSES.token}`,
          },
          prices,
          failures,
        },
        meta,
      ),
    );
    return true;
  }

  if (pathname === "/api/scraping/extract" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const valid = validateScrapingExtractRequest(body);
      if (!valid.ok) {
        writeJson(response, 400, apiError(valid.code, valid.message, meta));
        return true;
      }
      const result = await extractWithPolicy(valid.value);
      writeJson(response, 200, apiResponse(result, meta));
    } catch (error) {
      if (error instanceof SyntaxError) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Request body must be valid JSON.", meta));
        return true;
      }
      throw error;
    }
    return true;
  }

  if (pathname === "/api/sentinel/schema" && request.method === "GET") {
    writeJson(
      response,
      200,
      apiResponse(
        {
          sentinel_event_schema: {
            id: "string",
            taskType: "subdomain_scan|clickjacking_scan|credential_exposure_scan",
            severity: "P0|P1|P2|P3",
            target: "string",
            summary: "string",
            findings: "string[]",
            sourceTool: "string",
            detectedAt: "iso8601",
            falsePositive: "boolean",
            remediation: "string[]",
          },
          task_interfaces: sentinelTaskSchemas,
          scan_endpoint: "POST /api/sentinel/scan/:taskType",
          alert_test_endpoint: "POST /api/sentinel/alert-test",
          samples: sampleEvents,
        },
        meta,
      ),
    );
    return true;
  }

  const scanMatch = pathname.match(/^\/api\/sentinel\/scan\/([^/]+)$/);
  if (scanMatch && request.method === "POST") {
    const taskType = decodeURIComponent(scanMatch[1] ?? "");
    try {
      const body = await readJsonBody(request);
      const valid = validateSentinelScanRequest(taskType, body);
      if (!valid.ok) {
        writeJson(response, 400, apiError(valid.code, valid.message, meta));
        return true;
      }
      const result = await runSentinelScan(valid.value);
      writeJson(response, 200, apiResponse(result, meta));
    } catch (error) {
      if (error instanceof SyntaxError) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Request body must be valid JSON.", meta));
        return true;
      }
      throw error;
    }
    return true;
  }

  if (pathname === "/api/sentinel/alert-test" && request.method === "POST") {
    const result = await runSentinelAlertSelfTest();
    const status = result.ok ? 200 : result.configured ? 502 : 503;
    writeJson(response, status, apiResponse(result, meta));
    return true;
  }

  if (pathname === "/api/sentinel/events" && request.method === "GET") {
    writeJson(response, 200, apiResponse({ events: listSentinelEvents(100) }, meta));
    return true;
  }

  if (pathname === "/api/sentinel/review-queue" && request.method === "GET") {
    writeJson(
      response,
      200,
      apiResponse({ items: listReviewQueue(100), alertLog: listAlertLog(50) }, meta),
    );
    return true;
  }

  return false;
}
