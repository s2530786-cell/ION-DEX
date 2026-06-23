import { randomUUID } from "node:crypto";
import type { SentinelEvent } from "../scraping/types.js";
import { appendAlertLog, enqueueForReview } from "./store.js";
import { shouldAutoNotify, shouldQueueForReview } from "./grading.js";
import type { SentinelAlertLogEntry, SentinelAlertSelfTestResult } from "./types.js";

type AlertChannel = "webhook" | "slack";

export function resolveAlertEndpoint(): { url: string; channel: AlertChannel } | null {
  const forced = process.env.ION_SENTINEL_ALERT_CHANNEL?.trim().toLowerCase();
  const slackUrl = process.env.ION_SENTINEL_SLACK_WEBHOOK_URL?.trim();
  const webhookUrl = process.env.ION_SENTINEL_ALERT_WEBHOOK_URL?.trim();

  if (forced === "slack" && slackUrl) {
    return { url: slackUrl, channel: "slack" };
  }
  if (forced === "webhook" && webhookUrl) {
    return { url: webhookUrl, channel: "webhook" };
  }
  if (slackUrl) {
    return { url: slackUrl, channel: "slack" };
  }
  if (webhookUrl) {
    if (/hooks\.slack\.com/i.test(webhookUrl)) {
      return { url: webhookUrl, channel: "slack" };
    }
    return { url: webhookUrl, channel: "webhook" };
  }
  return null;
}

function timeoutMs(): number {
  const configured = Number(process.env.ION_SENTINEL_ALERT_TIMEOUT_MS ?? 8000);
  if (!Number.isFinite(configured)) {
    return 8000;
  }
  return Math.max(2000, Math.min(15000, Math.trunc(configured)));
}

function retryCount(): number {
  const configured = Number(process.env.ION_SENTINEL_ALERT_RETRIES ?? 2);
  if (!Number.isFinite(configured)) {
    return 2;
  }
  return Math.max(0, Math.min(5, Math.trunc(configured)));
}

function webhookPayload(event: SentinelEvent): Record<string, unknown> {
  return {
    type: "ion_sentinel_alert",
    severity: event.severity,
    taskType: event.taskType,
    target: event.target,
    summary: event.summary,
    findings: event.findings,
    detectedAt: event.detectedAt,
    id: event.id,
  };
}

function slackPayload(event: SentinelEvent): Record<string, unknown> {
  const findings = event.findings.slice(0, 3).map((entry) => `• ${entry}`).join("\n") || "• (no findings)";
  const remediation = event.remediation.slice(0, 2).map((entry) => `• ${entry}`).join("\n") || "• review required";
  return {
    text: `[ION Sentinel] ${event.severity} ${event.taskType} ${event.target}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `ION Sentinel ${event.severity} Alert`, emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Task*\n${event.taskType}` },
          { type: "mrkdwn", text: `*Target*\n${event.target}` },
          { type: "mrkdwn", text: `*Event ID*\n${event.id}` },
          { type: "mrkdwn", text: `*Detected At*\n${event.detectedAt}` },
        ],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Summary*\n${event.summary}` },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Findings*\n${findings}` },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Remediation*\n${remediation}` },
      },
    ],
  };
}

function maskAlertEndpoint(url: string): string {
  try {
    const parsed = new URL(url);
    if (/hooks\.slack\.com$/i.test(parsed.hostname)) {
      return "hooks.slack.com/services/***";
    }
    return `${parsed.hostname}${parsed.pathname ? "/***" : ""}`;
  } catch {
    return "(invalid-url)";
  }
}

function testWebhookPayload(): Record<string, unknown> {
  return {
    type: "ion_sentinel_alert_test",
    source: "ion-dex-sentinel",
    message: "Connectivity check from POST /api/sentinel/alert-test",
    detectedAt: new Date().toISOString(),
  };
}

function testSlackPayload(): Record<string, unknown> {
  return {
    text: "[ION Sentinel] alert-test connectivity check",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Alert channel self-test*\nThis message confirms Slack/webhook delivery is working.",
        },
      },
    ],
  };
}

async function dispatchPayload(
  endpoint: { url: string; channel: AlertChannel },
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; statusCode: number | null; attempts: number }> {
  const maxAttempt = retryCount() + 1;
  const waitMs = [300, 900, 1800, 3000, 5000];
  let lastStatus: number | null = null;

  for (let attempt = 1; attempt <= maxAttempt; attempt += 1) {
    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs()),
      });
      lastStatus = response.status;
      if (response.ok) {
        return { ok: true, statusCode: response.status, attempts: attempt };
      }
      if (attempt < maxAttempt && response.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, waitMs[Math.min(attempt - 1, waitMs.length - 1)]));
        continue;
      }
      break;
    } catch {
      if (attempt < maxAttempt) {
        await new Promise((resolve) => setTimeout(resolve, waitMs[Math.min(attempt - 1, waitMs.length - 1)]));
        continue;
      }
    }
  }

  return { ok: false, statusCode: lastStatus, attempts: maxAttempt };
}

async function dispatchWebhook(event: SentinelEvent): Promise<AlertChannel | null> {
  const endpoint = resolveAlertEndpoint();
  if (!endpoint) {
    return null;
  }
  const payload = endpoint.channel === "slack" ? slackPayload(event) : webhookPayload(event);
  const result = await dispatchPayload(endpoint, payload);
  return result.ok ? endpoint.channel : null;
}

export async function runSentinelAlertSelfTest(): Promise<SentinelAlertSelfTestResult> {
  const deliveredAt = new Date().toISOString();
  const endpoint = resolveAlertEndpoint();
  if (!endpoint) {
    return {
      ok: false,
      configured: false,
      channel: null,
      endpointHost: null,
      statusCode: null,
      attempts: 0,
      message:
        "No alert endpoint configured. Set ION_SENTINEL_SLACK_WEBHOOK_URL or ION_SENTINEL_ALERT_WEBHOOK_URL.",
      deliveredAt,
    };
  }

  const payload = endpoint.channel === "slack" ? testSlackPayload() : testWebhookPayload();
  const result = await dispatchPayload(endpoint, payload);
  const host = maskAlertEndpoint(endpoint.url);

  if (result.ok) {
    return {
      ok: true,
      configured: true,
      channel: endpoint.channel,
      endpointHost: host,
      statusCode: result.statusCode,
      attempts: result.attempts,
      message: `Alert self-test delivered via ${endpoint.channel} (${host}).`,
      deliveredAt,
    };
  }

  return {
    ok: false,
    configured: true,
    channel: endpoint.channel,
    endpointHost: host,
    statusCode: result.statusCode,
    attempts: result.attempts,
    message: `Alert self-test failed for ${endpoint.channel} (${host})${result.statusCode ? ` HTTP ${result.statusCode}` : ""}.`,
    deliveredAt,
  };
}

function logAlert(event: SentinelEvent, channel: SentinelAlertLogEntry["channel"]): void {
  const entry: SentinelAlertLogEntry = {
    id: `alert_${randomUUID()}`,
    severity: event.severity,
    channel,
    eventId: event.id,
    summary: event.summary,
    dispatchedAt: new Date().toISOString(),
  };
  appendAlertLog(entry);
  console.info(
    `[ion-sentinel] ${event.severity} ${event.taskType} target=${event.target} — ${event.summary}`,
  );
}

export async function routeSentinelAlerts(events: SentinelEvent[]): Promise<{
  notified: SentinelEvent[];
  queuedForReview: SentinelEvent[];
}> {
  const notified: SentinelEvent[] = [];
  const queuedForReview: SentinelEvent[] = [];

  for (const event of events) {
    if (shouldAutoNotify(event.severity)) {
      logAlert(event, "log");
      const channel = await dispatchWebhook(event);
      if (channel) {
        logAlert(event, channel);
      }
      notified.push(event);
      continue;
    }
    if (shouldQueueForReview(event.severity)) {
      enqueueForReview(event);
      queuedForReview.push(event);
    }
  }

  return { notified, queuedForReview };
}
