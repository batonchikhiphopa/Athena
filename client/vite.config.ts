import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiOrigin = process.env.ATHENA_DEV_API_ORIGIN ?? "http://127.0.0.1:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/config": apiOrigin,
      "/auth": apiOrigin,
      "/entries": apiOrigin,
      "/extractions": apiOrigin,
      "/analytics": apiOrigin,
      "/exports": apiOrigin,
      "/insights": apiOrigin,
      "/results": apiOrigin,
      "/self-reports": apiOrigin,
    },
  },
});
