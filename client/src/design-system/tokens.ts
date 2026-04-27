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
/**
 * Échelle d'ombres :
 *  - `xs/sm/md/lg`  → shadows neutres standard
 *  - `subtle`       → 1px hairline + halo discret (cartes flat premium)
 *  - `raised`       → carte légèrement détachée du fond
 *  - `hero`         → ombre "splash" pour les blocs hero / wallet / portfolio
 *  - `brand`        → halo coloré rouge MAWEJA
 */
export const elevation = {
  none:   "",
  xs:     "shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
  sm:     "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
  md:     "shadow-[0_4px_16px_rgba(0,0,0,0.10)]",
  lg:     "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
  subtle: "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.20),0_0_0_1px_rgba(255,255,255,0.04)]",
  raised: "shadow-[0_2px_6px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.10)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.40),0_8px_24px_-12px_rgba(0,0,0,0.50)]",
  hero:   "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25),0_8px_24px_-12px_rgba(225,0,0,0.18)] dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.70),0_10px_30px_-12px_rgba(225,0,0,0.30)]",
  brand:  "shadow-[0_4px_16px_rgba(225,0,0,0.25)]",
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
  muted:     "text-zinc-500 dark:text-zinc-500",
  /** Pour les meta très discrètes (timestamps, hints). */
  faint:     "text-zinc-400 dark:text-zinc-600",
  brand:     "text-rose-600 dark:text-rose-400",
} as const;

/**
 * Échelle typographique "display" — pour les hero (Wallet, Gains driver, splash).
 *  - sm   : ~28px (mobile hero secondaire)
 *  - md   : ~32px (titre wallet, soldes)
 *  - lg   : ~40px (compteur principal)
 *  - xl   : ~52px (splash, présentation)
 *  - hero : ~clamp(48px → 88px) (presentation page brand)
 *
 * Toujours combiné avec `font-black tracking-tight` et `leading-none`.
 */
export const display = {
  sm:   "text-[28px] sm:text-[32px] font-black tracking-tight leading-none",
  md:   "text-[32px] sm:text-[36px] font-black tracking-tight leading-[0.95]",
  lg:   "text-[40px] sm:text-[48px] font-black tracking-tighter leading-[0.92]",
  xl:   "text-[48px] sm:text-[64px] font-black tracking-tighter leading-[0.9]",
  hero: "text-[clamp(3rem,10vw,9rem)] font-black tracking-tighter leading-none",
} as const;

/* ── Focus ring (accessibility) ───────────────────────────────────────────── */
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-900";

/* ── Palette nommée (dataviz, tiers, status step) ─────────────────────────── *
 * Source unique pour toutes les valeurs hex utilisées par recharts, gradients
 * dataviz, badges de tier wallet et indicateurs d'étapes de tracking.
 * Les pages métier doivent importer ces tokens au lieu de coder en dur.
 * ─────────────────────────────────────────────────────────────────────────── */
export const palette = {
  /* Couleurs sémantiques (badges, ProgressRing, indicateurs) */
  semantic: {
    success:     "#10b981",  // emerald-500
    successDark: "#059669",  // emerald-600
    warning:     "#f59e0b",  // amber-500
    danger:      "#ef4444",  // red-500
    info:        "#3b82f6",  // blue-500
    cyan:        "#06b6d4",  // cyan-500
    neutral:     "#9ca3af",  // gray-400
    neutralStrong: "#6b7280", // gray-500
  },
  /* Tiers wallet : Bronze → Argent → Or → Platine */
  tier: {
    bronze:   { color: "#CD7F32", bg: "rgba(205,127,50,0.12)" },
    silver:   { color: "#A8A9AD", bg: "rgba(168,169,173,0.12)" },
    gold:     { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    platinum: { color: "#818CF8", bg: "rgba(129,140,248,0.12)" },
  },
  /* Couleurs d'étape pour TrackingPage (suivi commande) */
  step: {
    pending:   "#F59E0B",
    confirmed: "#3B82F6",
    picked_up: "#06B6D4",
    delivered: "#E10000",
    done:      "#10B981",
    idle:      "#D1D5DB",
    border:    "#E5E7EB",
  },
  /* Recharts — palette brand monochrome (PIE) */
  chart: {
    brand: ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca",
            "#b91c1c", "#991b1b", "#7f1d1d", "#450a0a", "#fee2e2"],
    /* Recharts — spectrum multicolore (séries comparatives) */
    spectrum: ["#dc2626", "#f59e0b", "#10b981", "#3b82f6",
               "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"],
    /* Axes & grilles recharts */
    axis: "#9ca3af",
    grid: "#f3f4f6",
    primary:   "#dc2626",
    secondary: "#3b82f6",
    muted:     "#9ca3af",
  },
  /* Or premium (gradients hero wallet card) */
  gold: {
    light: "#FFFBEB",
    soft:  "#FEF3C7",
    base:  "#F59E0B",
    bright:"#FBBF24",
    pale:  "#FDE68A",
    chip:  "#d4af37",
    shine: "#f5d76e",
  },
  /* Mockup hardware (PresentationPage TV/laptop/phone bezels) ─────────────── *
   * Source unique pour les fonds décoratifs de la page de présentation        *
   * (mockups iframe). Les valeurs sont volontairement « techno-noir » et      *
   * n'ont pas d'équivalent Tailwind direct car elles évoquent un boîtier      *
   * physique.                                                                 *
   * ─────────────────────────────────────────────────────────────────────── */
  mockup: {
    phoneBezel:    "rgb(17,17,17)",
    phoneFrame:    "rgb(51,51,51)",
    phoneEdge:     "rgb(85,85,85)",
    laptopScreen:  "rgb(26,26,26)",
    laptopBezel:   "rgb(45,45,45)",
    laptopBase:    "rgb(34,34,34)",
    pageBg1:       "rgb(10,10,10)",
    pageBg2:       "rgb(13,13,13)",
    pageBg3:       "rgb(8,8,8)",
    textOn:        "rgb(255,255,255)",
    textMuted:     "rgb(136,136,136)",
    brandDeep:     "rgb(127,29,29)",
    successCode:   "rgb(22,163,74)",
    warningCode:   "rgb(217,119,6)",
  },
  /* Brand deepest — fond opaque utilisé sous les dégradés du portefeuille    *
   * (WalletPage). Plus sombre que brand[950] pour donner une profondeur      *
   * « cuir » sur le PAN de carte.                                            */
  brandDeepest:    "rgb(26,0,0)",
  /* Wallet — palette spécifique au PAN « gold » (carte fidélité)             *
   * et au texte neutre noir profond. Regroupé pour éviter la dispersion      *
   * des littéraux décoratifs.                                                */
  wallet: {
    goldDeep1:    "rgb(28,20,0)",
    goldDeep2:    "rgb(61,40,0)",
    goldDeep3:    "rgb(124,79,0)",
    neutralInk:   "rgb(26,26,26)",
  },
} as const;

/* ── Tints ────────────────────────────────────────────────────────────────── *
 * Helpers pour produire des rgba() à opacité variable à partir des couleurs  *
 * canoniques de la marque. À utiliser exclusivement pour les surfaces        *
 * décoratives (gradients, halos, glassmorphism, KPI iconBg) afin d'éviter    *
 * la prolifération de littéraux rgba() dans les pages.                       */
export const tints = {
  /** Rouge MAWEJA (#E10000) — usage : halos brand, bordures glow, chips. */
  brand:  (a: number) => `rgba(225, 0, 0, ${a})`,
  /** Blanc — usage : glass overlays, séparateurs subtils sur fond sombre. */
  white:  (a: number) => `rgba(255, 255, 255, ${a})`,
  /** Noir — usage : ombres profondes, masques sous gradients. */
  black:  (a: number) => `rgba(0, 0, 0, ${a})`,
  /** Orange (warning #F59E0B) — usage : halos warning sur fond sombre. */
  amber:  (a: number) => `rgba(245, 158, 11, ${a})`,
  /** Bleu info (#3B82F6) — usage : iconBg KPI info. */
  info:   (a: number) => `rgba(59, 130, 246, ${a})`,
  /** Violet (#A855F7) — usage : iconBg KPI reviewing. */
  purple: (a: number) => `rgba(168, 85, 247, ${a})`,
  /** Vert succès (#10B981) — usage : iconBg KPI success. */
  success:(a: number) => `rgba(16, 185, 129, ${a})`,
  /** Gold (#F59E0B) — usage : tints amber décoratifs (wallet, badges). */
  gold:   (a: number) => `rgba(245, 158, 11, ${a})`,
  /** Gold deep (#B46400) — usage : ombres carte gold du wallet. */
  goldShadow: (a: number) => `rgba(180, 100, 0, ${a})`,
  /** Orange chaud (#FF7800) — usage : halos décoratifs sur fond brand. */
  orange: (a: number) => `rgba(255, 120, 0, ${a})`,
  /** Rouge danger (#EF4444) — usage : tints urgent / expiré. */
  danger: (a: number) => `rgba(239, 68, 68, ${a})`,
  /** Gris muted (#9CA3AF) — usage : fond de chip neutralisé (used / inactif). */
  mutedGray: (a: number) => `rgba(156, 163, 175, ${a})`,
} as const;

/* ── Disabled / static neutral surfaces ───────────────────────────────────── */
export const neutralSurface = {
  /** Bouton désactivé (loading sans valeur). */
  disabled:    "rgb(204, 204, 204)",
  /** Orange-500 (#F97316) — fin de gradient urgence. */
  dangerWarm:  "rgb(249, 115, 22)",
} as const;

/* ── Neutral chip surfaces (boutons copie / feedback) ─────────────────────── *
 * Utilisé pour les états de feedback inline (copy-to-clipboard) qui          *
 * basculent entre un fond neutre et un fond succès tinté.                    */
export const chipSurface = {
  neutralBg:     "rgb(249, 250, 251)",  // gray-50
  neutralBorder: "rgb(229, 231, 235)",  // gray-200
  successBg:     "rgb(220, 252, 231)",  // emerald-100
  successBorder: "rgb(134, 239, 172)",  // emerald-300
  reviewing:     "rgb(168, 85, 247)",   // purple-500 (iconColor KPI reviewing)
} as const;
