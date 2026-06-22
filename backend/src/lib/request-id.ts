import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";

const requestIdHeader = "x-request-id";
const requestIdPattern = /^[A-Za-z0-9._:-]{1,80}$/;

export function getRequestId(request: IncomingMessage): string {
  const value = request.headers[requestIdHeader];
  if (typeof value === "string" && value.trim().length > 0) {
    return normalizeRequestId(value);
  }
  if (Array.isArray(value)) {
    const first = value.find((entry) => entry.trim().length > 0);
    if (first) {
      return normalizeRequestId(first);
    }
  }
  return randomUUID();
}

function normalizeRequestId(value: string): string {
  const trimmed = value.trim();
  if (requestIdPattern.test(trimmed)) {
    return trimmed;
  }
  return randomUUID();
}
