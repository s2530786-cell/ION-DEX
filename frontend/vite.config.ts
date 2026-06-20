import react from "@vitejs/plugin-react";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const verifyBackendTarget = process.env.ION_VERIFY_BACKEND_URL ?? "http://127.0.0.1:8787";

// Explicit agent that bypasses system HTTP_PROXY
const directAgent = new http.Agent({ keepAlive: false });

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "vendor-react", test: /node_modules[\\/](react|react-dom)[\\/]/ },
            { name: "vendor-motion", test: /node_modules[\\/](framer-motion|lucide-react)[\\/]/ },
            { name: "vendor-wagmi", test: /node_modules[\\/](wagmi|@tanstack)[\\/]/ },
            { name: "vendor-viem", test: /node_modules[\\/](viem)[\\/]/ },
            { name: "vendor-ton", test: /node_modules[\\/](@ton|@tonconnect)[\\/]/ },
            { name: "vendor-ion-gateway", test: /node_modules[\\/](@ion-gateway)[\\/]/ },
            { name: "vendor-charts", test: /node_modules[\\/](lightweight-charts)[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3000,
    proxy: {
      "/api": {
        target: verifyBackendTarget,
        changeOrigin: true,
        agent: directAgent,
        headers: {
          connection: "close",
        },
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            // Remove proxy-related headers
            proxyReq.removeHeader("proxy-authorization");
            proxyReq.removeHeader("proxy-connection");
            proxyReq.setHeader("connection", "close");
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
        headers: {
          connection: "close",
        },
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("proxy-authorization");
            proxyReq.removeHeader("proxy-connection");
            proxyReq.setHeader("connection", "close");
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
});
