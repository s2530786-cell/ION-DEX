import { randomUUID } from "node:crypto";
import type { SentinelEvent } from "../../scraping/types.js";
import { runSentinelContainerScript, sentinelDockerEnabled } from "../container.js";
import { gradeCredentialExposure } from "../grading.js";
import type { SentinelRunnerMode } from "../types.js";

function parseCredentialHits(stdout: string): { hits: string[]; highConfidence: boolean } {
  const hits: string[] = [];
  let highConfidence = false;
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    if (/leak|breach|pwned|compromised|found/i.test(trimmed)) {
      hits.push(trimmed);
    }
    if (/high.?confidence|critical|password/i.test(trimmed)) {
      highConfidence = true;
    }
  }
  return { hits, highConfidence };
}

export async function runCredentialExposureScan(input: {
  target: string;
  brand?: string;
  timeoutMs: number;
  useDocker?: boolean;
}): Promise<{
  events: SentinelEvent[];
  mode: SentinelRunnerMode;
  containerInvoked: boolean;
  rawExcerpt?: string;
}> {
  const brand = (input.brand ?? input.target).trim();
  const domain = input.target.toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? input.target;
  let mode: SentinelRunnerMode = "heuristic";
  let containerInvoked = false;
  let rawExcerpt: string | undefined;
  let hits: string[] = [];
  let highConfidence = false;

  if (sentinelDockerEnabled(input.useDocker)) {
    const result = await runSentinelContainerScript(
      "run-cr3dov3r.sh",
      [brand, domain],
      input.timeoutMs,
    );
    containerInvoked = result.invoked;
    rawExcerpt = result.stdout.slice(0, 2000) || result.stderr.slice(0, 500);
    if (result.stdout.trim()) {
      const parsed = parseCredentialHits(result.stdout);
      hits = parsed.hits;
      highConfidence = parsed.highConfidence;
      mode = hits.length > 0 ? "docker" : "hybrid";
    }
  }

  if (hits.length === 0) {
    mode = mode === "docker" ? "hybrid" : "heuristic";
    hits = [
      `No automated credential exposure signal for brand=${brand} domain=${domain}`,
      "Run Cr3dOv3r in sentinel-lab with outbound network for live breach intelligence",
    ];
  }

  const severity = gradeCredentialExposure(hits.filter((h) => /leak|breach|pwned/i.test(h)).length, highConfidence);
  const actionable = severity === "P0" || severity === "P1";

  const events: SentinelEvent[] = [
    {
      id: `sentinel_evt_${randomUUID()}`,
      taskType: "credential_exposure_scan",
      severity,
      target: `${brand}@${domain}`,
      summary: actionable
        ? "Potential credential exposure indicators require immediate review."
        : "No high-confidence credential exposure indicators in this pass.",
      findings: hits,
      sourceTool: "Cr3dOv3r",
      detectedAt: new Date().toISOString(),
      falsePositive: !actionable,
      remediation: actionable
        ? ["Force password reset for affected accounts", "Enable MFA and session revocation", "Audit API keys and signing keys"]
        : ["Continue scheduled credential exposure monitoring"],
    },
  ];

  return { events, mode, containerInvoked, rawExcerpt };
}
