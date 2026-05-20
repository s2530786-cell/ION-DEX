import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiProxyTarget = process.env.VITE_ION_API_PROXY ?? "http://127.0.0.1:8787";

function vendorChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) {
    return undefined;
  }
  if (
    id.includes("wagmi") ||
    id.includes("viem") ||
    id.includes("@tanstack/react-query")
  ) {
    return "vendor-wallet";
  }
  if (id.includes("@ton") || id.includes("tonconnect")) {
    return "vendor-ton";
  }
  if (id.includes("lightweight-charts")) {
    return "vendor-charts";
  }
  if (id.includes("framer-motion")) {
    return "vendor-motion";
  }
  if (id.includes("lucide-react")) {
    return "vendor-icons";
  }
  return "vendor-misc";
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          return vendorChunk(id);
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3001,
    strictPort: true,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
