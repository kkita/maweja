import { build } from "esbuild";
import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";

async function main() {
  console.log("📦 MAWEJA — Build de production...\n");

  if (!existsSync("dist")) {
    mkdirSync("dist", { recursive: true });
  }

  // 0. Migration du schéma de base de données
  console.log("[0/2] Synchronisation du schéma DB (drizzle-kit push)...");
  try {
    execSync("npx drizzle-kit push --force", { stdio: "inherit" });
    console.log("   ✓ Schéma DB synchronisé\n");
  } catch (e) {
    console.warn("   ⚠ drizzle-kit push a échoué (ignoré en cas de DB non disponible):", (e as Error).message);
  }

  // 1. Build du frontend (Vite)
  console.log("[1/2] Build frontend (Vite)...");
  execSync("npx vite build", { stdio: "inherit" });
  console.log("   ✓ Frontend → dist/public/\n");

  // 2. Build du backend (esbuild)
  console.log("[2/2] Build backend (esbuild)...");
  await build({
    entryPoints: ["server/index.ts"],
    bundle: true,
    outfile: "dist/index.cjs",
    platform: "node",
    format: "cjs",
    target: "node20",
    packages: "external",
    define: {
      "import.meta.dirname": "__dirname",
    },
    alias: {
      "@shared": "./shared",
    },
  });
  console.log("   ✓ Backend → dist/index.cjs\n");

  console.log("✅ Build terminé avec succès !");
}

main().catch((err) => {
  console.error("❌ Erreur de build:", err);
  process.exit(1);
});
