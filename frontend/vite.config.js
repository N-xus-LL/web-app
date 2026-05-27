import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/users": "http://localhost:8080",
      "/items": "http://localhost:8080",
      "/locations": "http://localhost:8080",
      "/api": "http://localhost:8080",
      "/json": "http://localhost:8080"
    }
  }
});
