/* ─────────────────────────────────────────────────────────────
   MAWEJA — Notify : shim de compatibilité.
   L'implémentation réelle a été éclatée dans `./notify/` (Phase 4 #5).
   Ce fichier existe pour garantir que les imports `from "../lib/notify"`
   résolvent toujours la même API publique, que le bundler choisisse
   `notify.ts` (priorité fichier) ou `notify/index.ts` (dossier).
   ───────────────────────────────────────────────────────────── */
export * from "./notify/index";
