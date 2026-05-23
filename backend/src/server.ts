// Proxy bootstrap for CMC API (Node global fetch doesn't respect HTTP_PROXY)
import { bootstrap } from "global-agent";
bootstrap();
import { createServer, type Server } from "node:http";
import { pathToFileURL } from "node:url";
import { bootstrapDatabase, bootstrapDatabaseAsync } from "./db/index.js";
import { routeRequest } from "./gateway/routes.js";

let databaseReady = false;

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
    void routeRequest(request, response, { startedAt }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: { message } }));
    });
  });
}

export function startServer(port = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 8787)): Server {
  void bootstrapDatabaseAsync();
  const server = createApp();
  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    const resolvedPort = typeof address === "object" && address ? address.port : port;
    console.log(`ION DEX API gateway listening on http://127.0.0.1:${resolvedPort}`);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
