import type { IncomingMessage } from "node:http";

export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? (JSON.parse(raw) as unknown) : {};
}

export function parseActorSession(body: unknown): {
  actor_id: string;
  session_id: string;
  payload: Record<string, unknown>;
} | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }
  const record = body as Record<string, unknown>;
  const actor_id = typeof record.actor_id === "string" ? record.actor_id.trim() : "";
  const session_id = typeof record.session_id === "string" ? record.session_id.trim() : "";
  if (!actor_id || !session_id) {
    return null;
  }
  const { actor_id: _a, session_id: _s, ...rest } = record;
  return { actor_id, session_id, payload: rest };
}
