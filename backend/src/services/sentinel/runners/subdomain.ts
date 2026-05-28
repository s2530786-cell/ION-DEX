import { randomUUID } from "node:crypto";
import type { SentinelEvent } from "../../scraping/types.js";
import { runSentinelContainerScript, sentinelDockerEnabled } from "../container.js";
import { gradeSubdomainFinding } from "../grading.js";
import type { SentinelRunnerMode } from "../types.js";

function parseSubdomains(stdout: string, domain: string): string[] {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);
  const unique = new Set<string>();
  for (const line of lines) {
    if (line.includes(domain.toLowerCase()) && !line.includes(" ")) {
      unique.add(line.replace(/^\*\./, ""));
    }
  }
  return [...unique];
}

function heuristicSubdomains(domain: string): string[] {
  const prefixes = ["www", "api", "app", "staging", "dev", "mail", "cdn"];
  return prefixes.map((prefix) => `${prefix}.${domain}`);
}

export async function runSubdomainScan(input: {
  target: string;
  timeoutMs: number;
  useDocker?: boolean;
  allowlist?: string[];
}): Promise<{
  events: SentinelEvent[];
  mode: SentinelRunnerMode;
  containerInvoked: boolean;
  rawExcerpt?: string;
}> {
  const domain = input.target.toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? input.target;
  const allowlist = input.allowlist ?? [`www.${domain}`, domain];
  let subdomains: string[] = [];
  let mode: SentinelRunnerMode = "heuristic";
  let containerInvoked = false;
  let rawExcerpt: string | undefined;

  if (sentinelDockerEnabled(input.useDocker)) {
    const result = await runSentinelContainerScript("run-sublist3r.sh", [domain], input.timeoutMs);
    containerInvoked = result.invoked;
    rawExcerpt = result.stdout.slice(0, 2000) || result.stderr.slice(0, 500);
    if (result.exitCode === 0 && result.stdout.trim()) {
      subdomains = parseSubdomains(result.stdout, domain);
      mode = subdomains.length > 0 ? "docker" : "hybrid";
    }
  }

  if (subdomains.length === 0) {
    subdomains = heuristicSubdomains(domain);
    if (mode === "docker") {
      mode = "hybrid";
    }
  }

  const events: SentinelEvent[] = subdomains.map((subdomain) => {
    const severity = gradeSubdomainFinding(domain, subdomain, allowlist);
    const untracked = severity !== "P3";
    return {
      id: `sentinel_evt_${randomUUID()}`,
      taskType: "subdomain_scan",
      severity,
      target: subdomain,
      summary: untracked
        ? `Untracked subdomain candidate: ${subdomain}`
        : `Subdomain within allowlist baseline: ${subdomain}`,
      findings: untracked
        ? [`Subdomain ${subdomain} not in configured allowlist`, `Parent domain: ${domain}`]
        : [`Subdomain ${subdomain} matches allowlist policy`],
      sourceTool: "Sublist3r",
      detectedAt: new Date().toISOString(),
      falsePositive: !untracked,
      remediation: untracked
        ? ["Verify DNS ownership", "Add to asset inventory or decommission"]
        : ["No action required for allowlisted host"],
    };
  });

  return { events, mode, containerInvoked, rawExcerpt };
}
