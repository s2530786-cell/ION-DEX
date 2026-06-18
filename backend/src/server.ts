// Proxy bootstrap for CMC API (Node global fetch doesn't respect HTTP_PROXY)
import { bootstrap } from "global-agent";
bootstrap();
import { createServer, type Server } from "node:http";
import { pathToFileURL } from "node:url";
import { bootstrapDatabase, bootstrapDatabaseAsync } from "./db/index.js";
import { routeRequest } from "./gateway/routes.js";

let databaseReady = false;
const traceBackendRequests = process.env.ION_BACKEND_TRACE_REQUESTS === "1";
const traceBackendExit = process.env.ION_BACKEND_EXIT_TRACE === "1";

function installProcessDiagnostics(): void {
  if (!traceBackendExit) {
    return;
  }

  const originalExit = process.exit.bind(process);

  process.exit = ((code?: number) => {
    const resolvedCode = code ?? 0;
    console.error(`[backend] process.exit(${resolvedCode}) called`);
    console.error(new Error("[backend] process.exit stack").stack);
    return originalExit(code);
  }) as typeof process.exit;

  process.once("uncaughtException", (error) => {
    console.error("[backend] uncaughtException:", error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
    process.exit(1);
  });

  process.once("unhandledRejection", (reason) => {
    console.error("[backend] unhandledRejection:", reason instanceof Error ? reason.stack ?? reason.message : String(reason));
    process.exitCode = 1;
    process.exit(1);
  });

  process.once("beforeExit", (code) => {
    console.error(`[backend] beforeExit code=${code}`);
  });

  process.once("exit", (code) => {
    if (code !== 0) {
      console.error(`[backend] exit code=${code}`);
    }
  });
}

installProcessDiagnostics();

function ensureDatabaseReady(): void {
  if (databaseReady) {
    return;
  }
  bootstrapDatabase();
  databaseReady = true;
}

export function createApp(): Server {
  ensureDatabaseReady();
  const startedAt = new Date();
  return createServer((request, response) => {
    const requestLabel = `${request.method ?? "GET"} ${request.url ?? "/"}`;
    const startedMs = Date.now();
    if (traceBackendRequests) {
      console.error(`[backend] request start ${requestLabel}`);
      response.once("finish", () => {
        console.error(`[backend] request finish ${requestLabel} status=${response.statusCode} duration=${Date.now() - startedMs}ms`);
      });
      response.once("close", () => {
        if (!response.writableEnded) {
          console.error(`[backend] request close ${requestLabel} status=${response.statusCode} duration=${Date.now() - startedMs}ms`);
        }
      });
    }
    void routeRequest(request, response, { startedAt }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (traceBackendRequests) {
        console.error(`[backend] route error ${requestLabel}: ${message}`);
      }
      response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: { message } }));
    });
  });
}

export function startServer(port = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 8787), host = process.env.BACKEND_HOST ?? "127.0.0.1"): Server {
  void bootstrapDatabaseAsync();
  const server = createApp();
  server.listen(port, host, () => {
    const address = server.address();
    const resolvedPort = typeof address === "object" && address ? address.port : port;
    console.log(`ION DEX API gateway listening on http://${host}:${resolvedPort}`);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
