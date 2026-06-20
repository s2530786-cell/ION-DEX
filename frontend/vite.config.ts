/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// WSL2 backend: use WSL IP with explicit agent to bypass system HTTP_PROXY
const WSL_IP = "172.28.184.176";
const verifyBackendTarget = process.env.ION_VERIFY_BACKEND_URL ?? `http://${WSL_IP}:8787`;
const directAgent = new http.Agent({ keepAlive: false });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.test.{ts,tsx}"],
    css: true,
    testTimeout: 20_000,
  },
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
