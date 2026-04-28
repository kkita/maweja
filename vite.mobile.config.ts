import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const MOBILE_MODE = process.env.VITE_MOBILE_MODE || "client";

export default defineConfig({
  plugins: [react()],
  base: "./",
  assetsInclude: ["**/*.mp4"],
  define: {
    "import.meta.env.VITE_MOBILE_MODE": JSON.stringify(MOBILE_MODE),
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(process.env.VITE_API_BASE_URL || ""),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "client", "src", "assets"),
    },
    extensions: [".ts", ".tsx", ".mts", ".mjs", ".js", ".jsx", ".json"],
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, `mobile/${MOBILE_MODE}/www`),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
