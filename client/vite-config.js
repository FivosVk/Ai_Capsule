import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During local development, `npm run dev` in /client serves the React app on
// its own port (5173) and proxies API calls to the Express server on 5000,
// so you can develop with fast refresh without building on every change.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
      "/login": "http://localhost:5000",
      "/auth": "http://localhost:5000",
    },
  },
});