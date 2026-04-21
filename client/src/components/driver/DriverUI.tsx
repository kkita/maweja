/*
 * DriverUI — Couche UI driver de MAWEJA
 *
 * Construit sur les primitives partagées du Design System.
 * L'app driver est toujours en mode sombre.
 * Toutes les APIs existantes sont préservées pour la compatibilité.
 */
import { type ReactNode, type CSSProperties } from "react";
import { type LucideIcon } from "lucide-react";
import { motion } from "../../lib/motion";
import {
  AppButton, AppCard, AppEmptyState, AppSkeleton,
  AppBadge, type AppButtonVariant,
} from "../../design-system/primitives";
import { type StatusVariant } from "../../design-system/tokens";

function cx(...c: (string | undefined | false | null)[]): string {
  return c.filter(Boolean).join(" ");
}

/* ── Design tokens driver (backward compat — toujours dark) ─────────────── */
export const dt = {
  bg:       "#0e0e0e",
  surface:  "#191919",
  surface2: "#222222",
  surface3: "#2c2c2c",
  border:   "rgba(255,255,255,0.07)",
  border2:  "rgba(255,255,255,0.13)",
  green:    "#22c55e",
  orange:   "#f97316",
  amber:    "#f59e0b",
  blue:     "#60a5fa",
  red:      "#ef4444",
  accent:   "#E10000",
  text:     "#FFFFFF",
  text2:    "#9ca3af",
  text3:    "#6b7280",
} as const;

/* ── Status config driver ────────────────────────────────────────────────── */
export const DRIVER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "En attente",   color: dt.amber,  bg: "rgba(245,158,11,0.15)"  },
  confirmed: { label: "Confirmée",    color: dt.blue,   bg: "rgba(96,165,250,0.15)"  },
  preparing: { label: "Préparation",  color: "#c084fc", bg: "rgba(192,132,252,0.15)" },
  ready:     { label: "Prête ✓",      color: dt.green,  bg: "rgba(34,197,94,0.15)"   },
  picked_up: { label: "En livraison", color: dt.orange, bg: "rgba(249,115,22,0.15)"  },
  delivered: { label: "Livré ✓",      color: dt.green,  bg: "rgba(34,197,94,0.15)"   },
  cancelled: { label: "Annulé",       color: dt.red,    bg: "rgba(239,68,68,0.15)"   },
};

/* ── Driver status → StatusVariant mapping ───────────────────────────────── */
const DRIVER_STATUS_BADGE: Record<string, StatusVariant> = {
  pending:   "warning",
  confirmed: "info",
  preparing: "purple",
  ready:     "success",
  picked_up: "info",
  delivered: "success",
  cancelled: "error",
};

/* ── DBtn variant → AppButton variant mapping ────────────────────────────── */
type DBtnVariant = "accept" | "refuse" | "amber" | "blue" | "deliver" | "secondary" | "ghost" | "accent";
type DBtnSize = "sm" | "md" | "lg" | "xl";

/* ─────────────────────────────────────────────────────────────────────────── *
 * DBtn → AppButton (driver-specific styles for non-mappable variants)         *
 * ─────────────────────────────────────────────────────────────────────────── */
interface DBtnProps {
  label: string;
  icon?: LucideIcon;
  variant?: DBtnVariant;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  testId?: string;
  fullWidth?: boolean;
  size?: DBtnSize;
}

const DSIZE_MAP: Record<DBtnSize, string> = {
  sm: "px-4 py-2.5 text-xs rounded-xl gap-1.5",
  md: "px-5 py-3.5 text-sm rounded-2xl gap-2",
  lg: "px-6 py-4 text-sm rounded-2xl gap-2",
  xl: "px-6 py-5 text-base rounded-2xl gap-2.5",
};

const DVARIANT_STYLE: Record<DBtnVariant, string> = {
  accept:    "bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 font-bold",
  refuse:    "bg-red-500/10 text-red-400 border border-red-500/30 font-bold",
  amber:     "bg-amber-500 text-black shadow-lg shadow-amber-900/30 font-bold",
  blue:      "bg-blue-400 text-black shadow-lg shadow-blue-900/30 font-bold",
  deliver:   "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-900/30 font-bold",
  secondary: "bg-white/10 text-white border border-white/10 font-bold",
  ghost:     "text-zinc-400 font-semibold",
  accent:    "bg-brand text-white shadow-ds-brand font-bold",
};

export function DBtn({ label, icon: Icon, variant = "secondary", onClick, loading, disabled, testId, fullWidth, size = "md" }: DBtnProps) {
  const iconSize = size === "xl" ? 20 : size === "lg" ? 18 : 16;
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testId}
      className={cx(
        "flex items-center justify-center transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
        DVARIANT_STYLE[variant],
        DSIZE_MAP[size],
        fullWidth && "w-full",
      )}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : Icon && <Icon size={iconSize} />}
      <span>{label}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * DCard → AppCard (dark context)                                              *
 * ─────────────────────────────────────────────────────────────────────────── */
export function DCard({ children, className = "", style, onClick }: {
  children: ReactNode; className?: string; style?: CSSProperties; onClick?: () => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      className={cx(
        "rounded-2xl overflow-hidden",
        onClick && "cursor-pointer",
        className,
      )}
      style={{ background: dt.surface, border: `1px solid ${dt.border}`, ...style }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * DStatCard → AppStatCard (dark context)                                      *
 * ─────────────────────────────────────────────────────────────────────────── */
export function DStatCard({ label, value, icon: Icon, color = dt.text2, sub }: {
  label: string; value: string | number; icon?: LucideIcon; color?: string; sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 24, stiffness: 280 }}
      className="rounded-2xl p-4 flex flex-col"
      style={{ background: dt.surface, border: `1px solid ${dt.border}` }}
    >
      {Icon && (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}20` }}>
          <Icon size={17} style={{ color }} />
        </div>
      )}
      <p className="text-xl font-black text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-[11px] font-semibold mt-0.5" style={{ color: dt.text2 }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: dt.text3 }}>{sub}</p>}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * DSectionHeader                                                              *
 * ─────────────────────────────────────────────────────────────────────────── */
export function DSectionHeader({ title, badge, action, onAction }: {
  title: string; badge?: number; action?: string; onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <p className="font-black text-sm text-white">{title}</p>
        {badge != null && badge > 0 && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white bg-brand">{badge}</span>
        )}
      </div>
      {action && (
        <button onClick={onAction} className="text-xs font-semibold" style={{ color: dt.text2 }}>
          {action}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * DStatusBadge → AppBadge                                                     *
 * ─────────────────────────────────────────────────────────────────────────── */
export function DStatusBadge({ status }: { status: string }) {
  const cfg = DRIVER_STATUS[status];
  if (!cfg) {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ color: dt.text2, background: dt.surface2 }}>{status}</span>;
  }
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * DEmptyState → AppEmptyState (dark context)                                  *
 * ─────────────────────────────────────────────────────────────────────────── */
export function DEmptyState({ icon: Icon, title, description, action, onAction }: {
  icon: LucideIcon; title: string; description?: string; action?: string; onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 260 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{ background: dt.surface2 }}
      >
        <Icon size={32} style={{ color: dt.text3 }} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: "spring", damping: 24, stiffness: 280 }}
      >
        <p className="font-black text-base text-white mb-2">{title}</p>
        {description && (
          <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: dt.text2 }}>{description}</p>
        )}
        {action && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onAction}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-white bg-brand shadow-ds-brand"
          >
            {action}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * DSkeletonCard → AppSkeleton (dark context)                                  *
 * ─────────────────────────────────────────────────────────────────────────── */
export function DSkeletonCard() {
  return (
    <div className="rounded-2xl p-4 animate-pulse" style={{ background: dt.surface, border: `1px solid ${dt.border}` }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: dt.surface2 }} />
        <div className="flex-1">
          <div className="h-3.5 w-28 rounded mb-2" style={{ background: dt.surface2 }} />
          <div className="h-2.5 w-16 rounded" style={{ background: dt.surface3 }} />
        </div>
      </div>
      <div className="h-3 w-full rounded mb-2" style={{ background: dt.surface2 }} />
      <div className="h-3 w-3/4 rounded mb-4" style={{ background: dt.surface3 }} />
      <div className="h-10 w-full rounded-xl" style={{ background: dt.surface2 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * DInfoRow                                                                    *
 * ─────────────────────────────────────────────────────────────────────────── */
export function DInfoRow({ icon: Icon, label, value, color, onTap }: {
  icon: LucideIcon; label: string; value: string; color?: string; onTap?: () => void;
}) {
  const inner = (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: `1px solid ${dt.border}` }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color ?? dt.text3}18` }}>
        <Icon size={15} style={{ color: color ?? dt.text3 }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: dt.text3 }}>{label}</p>
        <p className="text-sm font-bold text-white leading-snug">{value}</p>
      </div>
      {onTap && (
        <div className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ color: dt.accent, background: `${dt.accent}15` }}>Appel</div>
      )}
    </div>
  );
  if (onTap) return <button onClick={onTap} className="w-full text-left active:opacity-70 transition-opacity">{inner}</button>;
  return inner;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * DPaymentBadge                                                               *
 * ─────────────────────────────────────────────────────────────────────────── */
export function DPaymentBadge({ method }: { method: string }) {
  const isCash = method === "cash";
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl"
      style={{
        background: isCash ? "rgba(34,197,94,0.12)" : "rgba(96,165,250,0.12)",
        border: `1px solid ${isCash ? "rgba(34,197,94,0.25)" : "rgba(96,165,250,0.25)"}`,
      }}
    >
      <span className="text-lg">{isCash ? "💵" : "📱"}</span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: isCash ? dt.green : dt.blue }}>
          {isCash ? "Paiement CASH" : method === "mobile_money" ? "Mobile Money" : "Carte bancaire"}
        </p>
        {isCash && <p className="text-[9px]" style={{ color: dt.text3 }}>À percevoir à la livraison</p>}
      </div>
    </div>
  );
}
