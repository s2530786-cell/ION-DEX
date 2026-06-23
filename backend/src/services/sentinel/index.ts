import { ApiErrorCodes } from "../../gateway/response.js";
import type { SentinelTaskType } from "../scraping/types.js";
import { routeSentinelAlerts } from "./alerts.js";
import { applySeverityCap } from "./grading.js";
import { runClickjackingScan } from "./runners/clickjacking.js";
import { runCredentialExposureScan } from "./runners/credential.js";
import { runSubdomainScan } from "./runners/subdomain.js";
import { persistSentinelEvents } from "./store.js";
import type { SentinelScanRequest, SentinelScanResult } from "./types.js";

const TASK_TYPES: SentinelTaskType[] = [
  "subdomain_scan",
  "clickjacking_scan",
  "credential_exposure_scan",
];

export function isSentinelTaskType(value: string): value is SentinelTaskType {
  return (TASK_TYPES as string[]).includes(value);
}

type ValidationResult =
  | { ok: true; value: SentinelScanRequest & { taskType: SentinelTaskType } }
  | { ok: false; code: (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes]; message: string };

function normalizeDomain(target: string): string {
  return target
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    ?.replace(/:\d+$/, "") ?? target.trim();
}

export function validateSentinelScanRequest(
  taskType: string,
  body: unknown,
): ValidationResult {
  if (!isSentinelTaskType(taskType)) {
    return {
      ok: false,
      code: ApiErrorCodes.invalidQuoteRequest,
      message: `Unknown taskType. Allowed: ${TASK_TYPES.join(", ")}.`,
    };
  }
  if (!body || typeof body !== "object") {
    return { ok: false, code: ApiErrorCodes.invalidQuoteRequest, message: "Request body must be a JSON object." };
  }
  const candidate = body as SentinelScanRequest;
  if (!candidate.target || typeof candidate.target !== "string" || !candidate.target.trim()) {
    return { ok: false, code: ApiErrorCodes.invalidQuoteRequest, message: "target is required." };
  }
  const target = candidate.target.trim();
  if (taskType === "clickjacking_scan") {
    if (!/^https?:\/\//i.test(target) && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalizeDomain(target))) {
      return {
        ok: false,
        code: ApiErrorCodes.invalidQuoteRequest,
        message: "clickjacking_scan target must be a URL or public hostname.",
      };
    }
  } else if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalizeDomain(target))) {
    return {
      ok: false,
      code: ApiErrorCodes.invalidQuoteRequest,
      message: "target must be a valid domain name.",
    };
  }
  if (taskType === "credential_exposure_scan" && candidate.brand !== undefined && typeof candidate.brand !== "string") {
    return { ok: false, code: ApiErrorCodes.invalidQuoteRequest, message: "brand must be a string when provided." };
  }
  const timeoutMs = candidate.options?.timeoutMs ?? 20_000;
  if (timeoutMs < 3000 || timeoutMs > 120_000) {
    return {
      ok: false,
      code: ApiErrorCodes.invalidQuoteRequest,
      message: "options.timeoutMs must be within 3000..120000.",
    };
  }
  return {
    ok: true,
    value: {
      taskType,
      target,
      brand: candidate.brand?.trim(),
      options: {
        timeoutMs,
        useDocker: candidate.options?.useDocker,
        allowlist: candidate.options?.allowlist,
      },
    },
  };
}

export async function runSentinelScan(
  input: SentinelScanRequest & { taskType: SentinelTaskType },
): Promise<SentinelScanResult> {
  const started = Date.now();
  const timeoutMs = input.options?.timeoutMs ?? 20_000;

  let events;
  let mode;
  let containerInvoked;
  let rawExcerpt;
  let sourceTool: string;

  switch (input.taskType) {
    case "subdomain_scan": {
      const result = await runSubdomainScan({
        target: normalizeDomain(input.target),
        timeoutMs,
        useDocker: input.options?.useDocker,
        allowlist: input.options?.allowlist,
      });
      events = result.events;
      mode = result.mode;
      containerInvoked = result.containerInvoked;
      rawExcerpt = result.rawExcerpt;
      sourceTool = "Sublist3r";
      break;
    }
    case "clickjacking_scan": {
      const result = await runClickjackingScan({
        target: input.target,
        timeoutMs,
        useDocker: input.options?.useDocker,
      });
      events = result.events;
      mode = result.mode;
      containerInvoked = result.containerInvoked;
      rawExcerpt = result.rawExcerpt;
      sourceTool = "Clickjacking-Tester";
      break;
    }
    case "credential_exposure_scan": {
      const result = await runCredentialExposureScan({
        target: normalizeDomain(input.target),
        brand: input.brand,
        timeoutMs,
        useDocker: input.options?.useDocker,
      });
      events = result.events;
      mode = result.mode;
      containerInvoked = result.containerInvoked;
      rawExcerpt = result.rawExcerpt;
      sourceTool = "Cr3dOv3r";
      break;
    }
  }

  const graded = applySeverityCap(events, input.taskType);
  persistSentinelEvents(graded);
  const alerts = await routeSentinelAlerts(graded);

  return {
    taskType: input.taskType,
    target: input.target,
    events: graded,
    alerts,
    runner: {
      mode,
      sourceTool,
      durationMs: Date.now() - started,
      containerInvoked,
      rawExcerpt,
    },
  };
}
