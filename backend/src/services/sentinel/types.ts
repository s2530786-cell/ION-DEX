import type { SentinelEvent, SentinelSeverity, SentinelTaskType } from "../scraping/types.js";

export type SentinelRunnerMode = "docker" | "heuristic" | "hybrid";

export type SentinelScanRequest = {
  target: string;
  brand?: string;
  options?: {
    timeoutMs?: number;
    useDocker?: boolean;
    allowlist?: string[];
  };
};

export type SentinelScanResult = {
  taskType: SentinelTaskType;
  target: string;
  events: SentinelEvent[];
  alerts: {
    notified: SentinelEvent[];
    queuedForReview: SentinelEvent[];
  };
  runner: {
    mode: SentinelRunnerMode;
    sourceTool: string;
    durationMs: number;
    containerInvoked: boolean;
    rawExcerpt?: string;
  };
};

export type SentinelAlertLogEntry = {
  id: string;
  severity: SentinelSeverity;
  channel: "log" | "webhook" | "slack";
  eventId: string;
  summary: string;
  dispatchedAt: string;
};

export type SentinelReviewQueueItem = {
  event: SentinelEvent;
  queuedAt: string;
};

export type SentinelAlertSelfTestResult = {
  ok: boolean;
  configured: boolean;
  channel: "webhook" | "slack" | null;
  endpointHost: string | null;
  statusCode: number | null;
  attempts: number;
  message: string;
  deliveredAt: string;
};
