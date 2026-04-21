import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

const plugins: any[] = [react()];

if (!isProduction) {
  const { cartographer } = await import("@replit/vite-plugin-cartographer");
  plugins.push(cartographer());
}

export default defineConfig({
  plugins,
  assetsInclude: ["**/*.mov", "**/*.MOV", "**/*.mp4", "**/*.MP4"],
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — always needed
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // TanStack Query + Wouter — core runtime
          if (id.includes("node_modules/@tanstack/") || id.includes("node_modules/wouter")) {
            return "vendor-query";
          }
          // Radix UI + Shadcn — shared UI primitives
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
          // Pure Leaflet (no React dependency) — safe to isolate.
          // react-leaflet and @react-leaflet/core are intentionally NOT manually
          // chunked: they call React.createContext() at module evaluation time and
          // must be co-bundled with their importing lazy page chunks (which already
          // depend on vendor-react). Putting them here caused a TDZ crash in prod
          // because vendor-leaflet could be evaluated before vendor-react.
          if (id.includes("node_modules/leaflet/")) {
            return "vendor-leaflet";
          }
          // Framer-motion — shared animation library used by ClientUI, AdminUI, etc.
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-motion";
          }
          // NOTE: recharts/d3 are intentionally NOT manually chunked.
          // d3 has circular internal deps that cause TDZ errors when split
          // via manualChunks. Let Vite/Rollup resolve init order automatically.

          // Lucide icons — shared icon set
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
          // Date utilities
          if (id.includes("node_modules/date-fns") || id.includes("node_modules/dayjs")) {
            return "vendor-dates";
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
