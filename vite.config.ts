import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { cartographer } from "@replit/vite-plugin-cartographer";

export default defineConfig({
  plugins: [
    react(),
    cartographer(),
  ],
  assetsInclude: ["**/*.mov", "**/*.MOV"],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "client", "src", "assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
