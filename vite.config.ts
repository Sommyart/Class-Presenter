import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Local dev: forward /_api/* to `vercel dev` (or any server running the API function).
  server: { proxy: { "/_api": "http://localhost:3000" } },
  build: { chunkSizeWarningLimit: 1500 },
});
