import type { SentinelEvent, SentinelSeverity, SentinelTaskType } from "../scraping/types.js";

function bump(current: SentinelSeverity, next: SentinelSeverity): SentinelSeverity {
  const order: SentinelSeverity[] = ["P3", "P2", "P1", "P0"];
  return order.indexOf(next) > order.indexOf(current) ? next : current;
}

export function gradeSubdomainFinding(domain: string, subdomain: string, allowlist: string[]): SentinelSeverity {
  const normalized = subdomain.toLowerCase();
  if (allowlist.some((entry) => normalized === entry.toLowerCase() || normalized.endsWith(`.${entry.toLowerCase()}`))) {
    return "P3";
  }
  if (/^(admin|api|vault|bridge|wallet|signer|treasury|multisig)\./i.test(normalized)) {
    return "P1";
  }
  if (/^(staging|dev|test|internal|legacy|old)\./i.test(normalized)) {
    return "P2";
  }
  if (normalized.includes(domain.toLowerCase())) {
    return "P2";
  }
  return "P3";
}

export function gradeClickjacking(headers: Record<string, string>): SentinelSeverity {
  const xfo = headers["x-frame-options"]?.toLowerCase() ?? "";
  const csp = headers["content-security-policy"]?.toLowerCase() ?? "";
  const hasFrameAncestors = csp.includes("frame-ancestors");
  if (!xfo && !hasFrameAncestors) {
    return "P1";
  }
  if (csp.includes("frame-ancestors *")) {
    return "P0";
  }
  if (xfo === "allow-from" || xfo === "allowall") {
    return "P0";
  }
  if (xfo === "sameorigin" || xfo === "deny" || hasFrameAncestors) {
    return "P3";
  }
  return "P2";
}

export function gradeCredentialExposure(hitCount: number, highConfidence: boolean): SentinelSeverity {
  if (hitCount >= 3 || highConfidence) {
    return "P0";
  }
  if (hitCount >= 1) {
    return "P1";
  }
  return "P3";
}

export function applySeverityCap(events: SentinelEvent[], taskType: SentinelTaskType): SentinelEvent[] {
  return events.map((event) => {
    let severity = event.severity;
    if (taskType === "clickjacking_scan" && event.findings.some((f) => /deny|sameorigin|frame-ancestors/i.test(f))) {
      severity = bump(severity, "P3");
    }
    return { ...event, severity };
  });
}

export function shouldAutoNotify(severity: SentinelSeverity): boolean {
  return severity === "P0" || severity === "P1";
}

export function shouldQueueForReview(severity: SentinelSeverity): boolean {
  return severity === "P2" || severity === "P3";
}
