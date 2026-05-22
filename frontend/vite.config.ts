import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    headers: {
      "Cache-Control": "no-store",
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
