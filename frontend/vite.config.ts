import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  const verifyBackendTarget =
    process.env.ION_VERIFY_BACKEND_URL?.trim() || "http://127.0.0.1:8787";

  return {
  plugins: [react()],
  server: {
    port: 3000,
  },
  preview: {
    proxy: {
      "/api": {
        target: verifyBackendTarget,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  };
});
