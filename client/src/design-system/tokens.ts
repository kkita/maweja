/*
 * MAWEJA Design System — Tokens
 *
 * Source unique de vérité pour toutes les valeurs visuelles de l'application.
 * Utilisé par les primitives, AdminUI, ClientUI et DriverUI.
 *
 * Conventions :
 *  - Couleurs sémantiques → toujours via tokens, jamais hardcodées dans les composants
 *  - Le rouge MAWEJA (#E10000) est la couleur d'ACCENT, pas une couleur structurelle
 *  - Les surfaces s'adaptent automatiquement via Tailwind dark: variants
 */

/* ── Brand ────────────────────────────────────────────────────────────────── */
export const brand = {
  50:  "#fff1f1",
  100: "#ffe0e0",
  200: "#ffc7c7",
  300: "#ff9e9e",
  400: "#ff6464",
  500: "#E10000",   // MAWEJA red — couleur principale
  600: "#c00000",
  700: "#a00000",
  800: "#830000",
  900: "#6c0000",
  950: "#3f0000",
} as const;

/* ── Status colors ────────────────────────────────────────────────────────── */
export const status = {
  success: { text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "#10b981" },
  warning: { text: "text-amber-700 dark:text-amber-400",    bg: "bg-amber-50 dark:bg-amber-950/30",    dot: "#f59e0b" },
  info:    { text: "text-blue-700 dark:text-blue-400",      bg: "bg-blue-50 dark:bg-blue-950/30",      dot: "#3b82f6" },
  error:   { text: "text-rose-600 dark:text-rose-400",      bg: "bg-rose-50 dark:bg-rose-950/30",      dot: "#ef4444" },
  brand:   { text: "text-rose-600 dark:text-rose-400",      bg: "bg-rose-50 dark:bg-rose-950/30",      dot: brand[500] },
  gray:    { text: "text-zinc-500 dark:text-zinc-400",      bg: "bg-zinc-100 dark:bg-zinc-800",        dot: "#71717a" },
  purple:  { text: "text-purple-600 dark:text-purple-400",  bg: "bg-purple-50 dark:bg-purple-950/30",  dot: "#a855f7" },
  cyan:    { text: "text-cyan-700 dark:text-cyan-400",      bg: "bg-cyan-50 dark:bg-cyan-950/30",      dot: "#06b6d4" },
} as const;

export type StatusVariant = keyof typeof status;

/* ── Order status map (shared across admin, client, driver) ───────────────── */
export const ORDER_STATUS_MAP = {
  pending:   { label: "En attente",       variant: "warning"  as StatusVariant },
  confirmed: { label: "Confirmée",        variant: "info"     as StatusVariant },
  preparing: { label: "En préparation",   variant: "cyan"     as StatusVariant },
  ready:     { label: "Prête ✓",          variant: "success"  as StatusVariant },
  picked_up: { label: "En livraison",     variant: "info"     as StatusVariant },
  delivered: { label: "Livrée ✓",         variant: "success"  as StatusVariant },
  cancelled: { label: "Annulée",          variant: "error"    as StatusVariant },
  returned:  { label: "Retournée",        variant: "gray"     as StatusVariant },
} as const;

/* ── Surfaces ─────────────────────────────────────────────────────────────── */
export const surface = {
  page:     "bg-zinc-50 dark:bg-zinc-950",
  default:  "bg-white dark:bg-zinc-900",
  raised:   "bg-white dark:bg-zinc-900",
  sunken:   "bg-zinc-50 dark:bg-zinc-800/60",
  overlay:  "bg-white dark:bg-zinc-900",
} as const;

/* ── Border ───────────────────────────────────────────────────────────────── */
export const border = {
  default:  "border border-black/[0.06] dark:border-white/[0.07]",
  strong:   "border border-zinc-200 dark:border-zinc-700",
  subtle:   "border border-black/[0.04] dark:border-white/[0.05]",
  divider:  "border-b border-zinc-100 dark:border-zinc-800/60",
} as const;

/* ── Radius ───────────────────────────────────────────────────────────────── */
export const radius = {
  xs:   "rounded",        // 4px
  sm:   "rounded-lg",     // 8px
  md:   "rounded-xl",     // 12px
  lg:   "rounded-2xl",    // 16px
  xl:   "rounded-3xl",    // 24px
  full: "rounded-full",
} as const;

/* ── Elevation / Shadows ──────────────────────────────────────────────────── */
export const elevation = {
  none:  "",
  xs:    "shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
  sm:    "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
  md:    "shadow-[0_4px_16px_rgba(0,0,0,0.10)]",
  lg:    "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
  brand: "shadow-[0_4px_16px_rgba(225,0,0,0.25)]",
} as const;

/* ── Motion ───────────────────────────────────────────────────────────────── */
export const motion = {
  fast:   "duration-150",
  normal: "duration-200",
  slow:   "duration-300",
  spring: "cubic-bezier(.16,1,.3,1)",
} as const;

/* ── Typography ───────────────────────────────────────────────────────────── */
export const text = {
  primary:   "text-zinc-900 dark:text-zinc-50",
  secondary: "text-zinc-600 dark:text-zinc-400",
  muted:     "text-zinc-400 dark:text-zinc-600",
  brand:     "text-rose-600 dark:text-rose-400",
} as const;

/* ── Focus ring (accessibility) ───────────────────────────────────────────── */
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-900";
