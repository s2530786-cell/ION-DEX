import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import type { OutgoingHttpHeaders } from "node:http";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { tryFastPath } from "./health-fast.js";

type RouteModule = typeof import("../../src/gateway/routes.js");

let bootstrapPromise: Promise<void> | null = null;
let routeModulePromise: Promise<RouteModule> | null = null;

function resolveDbDriver(): string {
  return (process.env.ION_DB_DRIVER ?? "disabled").trim().toLowerCase();
}

function ensureBootstrap(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const driver = resolveDbDriver();
      if (driver === "disabled" || driver === "") {
        return;
      }
      const { bootstrapDatabaseAsync } = await import("../../src/db/index.js");
      await bootstrapDatabaseAsync();
    })();
  }
  return bootstrapPromise;
}

function loadRouteModule(): Promise<RouteModule> {
  if (!routeModulePromise) {
    routeModulePromise = import("../../src/gateway/routes.js");
  }
  return routeModulePromise;
}

function decodeBody(event: APIGatewayProxyEventV2): string | Buffer {
  if (!event.body) {
    return "";
  }
  if (event.isBase64Encoded) {
    return Buffer.from(event.body, "base64");
  }
  return event.body;
}

function createIncomingMessage(event: APIGatewayProxyEventV2): IncomingMessage {
  const socket = new Socket();
  const request = new IncomingMessage(socket);
  const query = event.rawQueryString ? `?${event.rawQueryString}` : "";
  request.method = event.requestContext.http.method;
  request.url = `${event.rawPath}${query}`;
  request.headers = {};

  for (const [key, value] of Object.entries(event.headers ?? {})) {
    if (typeof value === "string" && value.length > 0) {
      request.headers[key.toLowerCase()] = value;
    }
  }

  const body = decodeBody(event);
  if (body.length > 0) {
    request.push(body);
  }
  request.push(null);
  return request;
}

function normalizeHeaderValue(value: number | string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}

function applyHeaders(target: Record<string, string>, source: OutgoingHttpHeaders): void {
  for (const [key, value] of Object.entries(source)) {
    const normalized = normalizeHeaderValue(value as number | string | string[] | undefined);
    if (normalized !== undefined) {
      target[key.toLowerCase()] = normalized;
    }
  }
}

function createLambdaResponse(request: IncomingMessage): {
  response: ServerResponse;
  finished: Promise<APIGatewayProxyResultV2>;
} {
  const socket = new Socket();
  const response = new ServerResponse(request);
  response.assignSocket(socket);

  let statusCode = 200;
  const headers: Record<string, string> = {};
  const bodyParts: Buffer[] = [];
  let settled = false;

  const finished = new Promise<APIGatewayProxyResultV2>((resolve, reject) => {
    response.on("error", reject);

    response.writeHead = function (
      this: ServerResponse,
      code: number | string,
      reasonOrHeaders?: string | OutgoingHttpHeaders,
      headersArg?: OutgoingHttpHeaders,
    ) {
      statusCode = typeof code === "number" ? code : Number.parseInt(String(code), 10);
      if (typeof reasonOrHeaders === "object" && reasonOrHeaders !== null) {
        applyHeaders(headers, reasonOrHeaders);
      } else if (headersArg) {
        applyHeaders(headers, headersArg);
      }
      return this;
    } as typeof response.writeHead;

    response.write = function (chunk: unknown) {
      if (chunk) {
        bodyParts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      return true;
    } as typeof response.write;

    response.end = function (chunk?: unknown) {
      if (chunk) {
        bodyParts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      if (!settled) {
        settled = true;
        const body = bodyParts.length > 0 ? Buffer.concat(bodyParts).toString("utf8") : undefined;
        resolve({
          statusCode,
          headers,
          body: body && body.length > 0 ? body : undefined,
        });
      }
      return response;
    } as typeof response.end;
  });

  return { response, finished };
}

export async function handler(
  event: APIGatewayProxyEventV2,
  _context: Context,
): Promise<APIGatewayProxyResultV2> {
  const fast = tryFastPath(event);
  if (fast) {
    return fast;
  }

  await ensureBootstrap();
  const { routeRequest } = await loadRouteModule();

  const request = createIncomingMessage(event);
  const { response, finished } = createLambdaResponse(request);
  await routeRequest(request, response);
  return finished;
}
