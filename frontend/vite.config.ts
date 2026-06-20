import react from "@vitejs/plugin-react";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const verifyBackendTarget = "http://172.28.184.176:8787";

// Explicit agent that bypasses system HTTP_PROXY
const directAgent = new http.Agent({ keepAlive: true });

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 3000,
    proxy: {
      "/api": {
        target: verifyBackendTarget,
        changeOrigin: true,
        agent: directAgent,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            // Remove proxy-related headers
            proxyReq.removeHeader("proxy-authorization");
            proxyReq.removeHeader("proxy-connection");
          });
        },
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: verifyBackendTarget,
        changeOrigin: true,
        agent: directAgent,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
});
