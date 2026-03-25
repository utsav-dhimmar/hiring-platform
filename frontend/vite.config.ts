import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import path from "path";

const target = process.env.VITE_API_URL || "http://localhost:8000";

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envDir: path.resolve(__dirname, ".."), // bcause .env is in the root directory
  server: {
    proxy: {
      "/api": {
        target,
        changeOrigin: true,
      },
    },
  },
});
