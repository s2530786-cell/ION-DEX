import { randomUUID } from "node:crypto";
import { fetch } from "undici";
import type { SentinelEvent } from "../../scraping/types.js";
import { runSentinelContainerScript, sentinelDockerEnabled } from "../container.js";
import { gradeClickjacking } from "../grading.js";
import type { SentinelRunnerMode } from "../types.js";

function normalizeUrl(target: string): string {
  if (/^https?:\/\//i.test(target)) {
    return target;
  }
  return `https://${target}`;
}

function headersFromFetch(responseHeaders: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  responseHeaders.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

export async function runClickjackingScan(input: {
  target: string;
  timeoutMs: number;
  useDocker?: boolean;
}): Promise<{
  events: SentinelEvent[];
  mode: SentinelRunnerMode;
  containerInvoked: boolean;
  rawExcerpt?: string;
}> {
  const url = normalizeUrl(input.target);
  let mode: SentinelRunnerMode = "heuristic";
  let containerInvoked = false;
  let rawExcerpt: string | undefined;
  const findings: string[] = [];
  let headers: Record<string, string> = {};

  if (sentinelDockerEnabled(input.useDocker)) {
    const result = await runSentinelContainerScript("run-clickjacking.sh", [url], input.timeoutMs);
    containerInvoked = result.invoked;
    rawExcerpt = result.stdout.slice(0, 2000) || result.stderr.slice(0, 500);
    if (result.stdout.trim()) {
      mode = "docker";
      for (const line of result.stdout.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed) {
          findings.push(trimmed);
        }
      }
      const xfoLine = findings.find((f) => f.toLowerCase().startsWith("x-frame-options:"));
      const cspLine = findings.find((f) => f.toLowerCase().startsWith("content-security-policy:"));
      if (xfoLine) {
        headers["x-frame-options"] = xfoLine.split(":").slice(1).join(":").trim();
      }
      if (cspLine) {
        headers["content-security-policy"] = cspLine.split(":").slice(1).join(":").trim();
      }
    }
  }

  if (Object.keys(headers).length === 0) {
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(input.timeoutMs),
        headers: { "user-agent": "ION-DEX-Sentinel/1.0 (+security-scan)" },
      });
      headers = headersFromFetch(response.headers);
      findings.push(`HTTP status: ${response.status}`);
      if (headers["x-frame-options"]) {
        findings.push(`X-Frame-Options: ${headers["x-frame-options"]}`);
      } else {
        findings.push("X-Frame-Options header missing");
      }
      if (headers["content-security-policy"]) {
        findings.push(`Content-Security-Policy: ${headers["content-security-policy"]}`);
      } else {
        findings.push("Content-Security-Policy header missing (frame-ancestors not declared)");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "fetch failed";
      findings.push(`Unable to fetch target headers: ${message}`);
      headers = {};
    }
  }

  const severity = gradeClickjacking(headers);
  const vulnerable = severity === "P0" || severity === "P1";

  const events: SentinelEvent[] = [
    {
      id: `sentinel_evt_${randomUUID()}`,
      taskType: "clickjacking_scan",
      severity,
      target: url,
      summary: vulnerable
        ? "Page may be embeddable in a hostile frame context."
        : "Frame embedding protections appear present.",
      findings: findings.length > 0 ? findings : ["No header data collected"],
      sourceTool: "Clickjacking-Tester",
      detectedAt: new Date().toISOString(),
      falsePositive: !vulnerable,
      remediation: vulnerable
        ? ["Set X-Frame-Options: DENY or SAMEORIGIN", "Add CSP frame-ancestors directive"]
        : ["Maintain current anti-clickjacking headers on release"],
    },
  ];

  return { events, mode, containerInvoked, rawExcerpt };
}
