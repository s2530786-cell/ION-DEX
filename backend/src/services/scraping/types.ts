export type ScrapingKind = "news" | "blog" | "announcement" | "docs";
export type ScrapingMode = "scrapling" | "firecrawl" | "auto";

export type ScrapingExtractRequest = {
  source: {
    url: string;
    kind: ScrapingKind;
  };
  mode?: ScrapingMode;
  selectors?: {
    title?: string;
    content?: string;
    publishedAt?: string;
  };
  options?: {
    timeoutMs?: number;
    maxRetries?: number;
    respectRobots?: boolean;
  };
};

export type ScrapingExtractResult = {
  url: string;
  title: string | null;
  contentText: string;
  publishedAt: string | null;
  sourceEngine: "scrapling" | "firecrawl";
  confidence: number;
};

export type SentinelSeverity = "P0" | "P1" | "P2" | "P3";
export type SentinelTaskType = "subdomain_scan" | "clickjacking_scan" | "credential_exposure_scan";

export type SentinelEvent = {
  id: string;
  taskType: SentinelTaskType;
  severity: SentinelSeverity;
  target: string;
  summary: string;
  findings: string[];
  sourceTool: string;
  detectedAt: string;
  falsePositive: boolean;
  remediation: string[];
};
