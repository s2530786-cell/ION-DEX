import { createServer, type Server } from "node:http";
import { pathToFileURL } from "node:url";
import { routeRequest } from "./gateway/routes.js";

export function createApp(): Server {
  const startedAt = new Date();
  return createServer((request, response) => {
    routeRequest(request, response, { startedAt });
  });
}

export function startServer(port = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 8787)): Server {
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
