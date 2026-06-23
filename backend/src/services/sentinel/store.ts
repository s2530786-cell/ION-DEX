import type { SentinelEvent } from "../scraping/types.js";
import type { SentinelAlertLogEntry, SentinelReviewQueueItem } from "./types.js";

const MAX_EVENTS = 500;
const MAX_ALERT_LOG = 200;
const MAX_REVIEW_QUEUE = 300;

const events: SentinelEvent[] = [];
const alertLog: SentinelAlertLogEntry[] = [];
const reviewQueue: SentinelReviewQueueItem[] = [];

export function persistSentinelEvents(incoming: SentinelEvent[]): void {
  for (const event of incoming) {
    events.unshift(event);
  }
  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS;
  }
}

export function listSentinelEvents(limit = 50): SentinelEvent[] {
  return events.slice(0, Math.min(limit, MAX_EVENTS));
}

export function appendAlertLog(entry: SentinelAlertLogEntry): void {
  alertLog.unshift(entry);
  if (alertLog.length > MAX_ALERT_LOG) {
    alertLog.length = MAX_ALERT_LOG;
  }
}

export function listAlertLog(limit = 50): SentinelAlertLogEntry[] {
  return alertLog.slice(0, Math.min(limit, MAX_ALERT_LOG));
}

export function enqueueForReview(event: SentinelEvent): void {
  reviewQueue.unshift({ event, queuedAt: new Date().toISOString() });
  if (reviewQueue.length > MAX_REVIEW_QUEUE) {
    reviewQueue.length = MAX_REVIEW_QUEUE;
  }
}

export function listReviewQueue(limit = 50): SentinelReviewQueueItem[] {
  return reviewQueue.slice(0, Math.min(limit, MAX_REVIEW_QUEUE));
}

export function resetSentinelStoreForTests(): void {
  events.length = 0;
  alertLog.length = 0;
  reviewQueue.length = 0;
}
