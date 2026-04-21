/*
 * AdminUI — Couche UI admin de MAWEJA
 *
 * Construit sur les primitives partagées du Design System.
 * Toutes les APIs existantes sont préservées pour la compatibilité.
 * Animations premium via framer-motion (sobres, performantes, reduced-motion safe).
 */
import { type ReactNode, useState, useEffect, useRef } from "react";
import {
  ChevronUp, ChevronDown, ChevronsUpDown, Search, X, Inbox,
} from "lucide-react";
import {
  AppButton, AppBadge, AppCard, AppDrawer,
  AppEmptyState, AppSkeleton, AppSectionHeader, AppStatCard,
} from "../../design-system/primitives";
import { border, text, focusRing, motion as motionTokens } from "../../design-system/tokens";
import type { StatusVariant } from "../../design-system/tokens";
import {
  motion, AnimatePresence,
  kpiStaggerVariants, kpiItemVariants,
  staggerContainerVariants, staggerItemVariants,
} from "../../lib/motion";

function cx(...c: (string | undefined | false | null)[]): string {
  return c.filter(Boolean).join(" ");
}

/* ── Design tokens admin (backward compat) ─────────────────────────────── */
export const adminTokens = {
  card:      "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800",
  cardHover: "hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-ds-xs",
  radius:    "rounded-xl",
  radiusLg:  "rounded-2xl",
  input:     "bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 dark:focus:border-brand-500 transition-all",
  badge: {
    base:   "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold",
    gray:   "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
    red:    "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
    amber:  "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
    green:  "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
    blue:   "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
  },
} as const;

/* ── AdminBadge variant → StatusVariant mapping ─────────────────────────── */
type AdminBadgeVariant = "gray" | "red" | "amber" | "green" | "blue" | "purple";
const ADMIN_BADGE_MAP: Record<AdminBadgeVariant, StatusVariant> = {
  gray:   "gray",
  red:    "error",
  amber:  "warning",
  green:  "success",
  blue:   "info",
  purple: "purple",
};

/* ─────────────────────────────────────────────────────────────────────────── *
 * AnimatedNumber                                                              *
 * ─────────────────────────────────────────────────────────────────────────── */
export function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let cur = 0;
    const step = value / (700 / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * LiveDot                                                                     *
 * ─────────────────────────────────────────────────────────────────────────── */
export function LiveDot({ color = "bg-emerald-500" }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AdminProgressBar                                                            *
 * ─────────────────────────────────────────────────────────────────────────── */
export function AdminProgressBar({ value, max, color = "bg-brand-500", delay = 0, height = "h-1.5" }: {
  value: number; max: number; color?: string; delay?: number; height?: string;
}) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 100);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className={cx("w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden", height)}>
      <div className={cx(color, height, "rounded-full transition-all duration-1000 ease-out")} style={{ width: `${width}%` }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * KPICard → AppStatCard (avec animation d'entrée)                            *
 * ─────────────────────────────────────────────────────────────────────────── */
interface KPICardProps {
  label: string;
  value: number | string;
  icon: any;
  iconColor?: string;
  iconBg?: string;
  sub?: string;
  animated?: boolean;
  trend?: { value: number; label: string };
  onClick?: () => void;
  testId?: string;
}

export function KPICard({ label, value, icon: Icon, iconColor = "#E10000", iconBg = "rgba(225,0,0,0.08)", sub, animated = true, trend, onClick, testId }: KPICardProps) {
  return (
    <motion.div variants={kpiItemVariants}>
      <AppStatCard
        label={label}
        value={value}
        icon={Icon}
        iconColor={iconColor}
        iconBg={iconBg}
        sub={sub}
        animated={animated}
        trend={trend}
        onClick={onClick}
        testId={testId}
      />
    </motion.div>
  );
}

/**
 * Conteneur stagger pour KPICard.
 * Usage : <KPIGrid cols={3}><KPICard .../><KPICard .../></KPIGrid>
 */
export function KPIGrid({ children, cols = 4, className = "" }: { children: ReactNode; cols?: 2 | 3 | 4 | 5; className?: string }) {
  const colMap = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  };
  return (
    <motion.div
      className={cx("grid gap-4", colMap[cols], className)}
      variants={kpiStaggerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * SectionCard → AppCard + AppSectionHeader                                    *
 * ─────────────────────────────────────────────────────────────────────────── */
interface SectionCardProps {
  title: string;
  icon?: any;
  iconColor?: string;
  iconBg?: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  noPad?: boolean;
  className?: string;
}

export function SectionCard({ title, icon, iconColor, iconBg, count, action, children, noPad, className = "" }: SectionCardProps) {
  return (
    <AppCard rounded="lg" className={className}>
      <div className={cx("px-5 py-4", border.divider)}>
        <AppSectionHeader
          title={title}
          icon={icon}
          iconColor={iconColor}
          iconBg={iconBg}
          count={count}
          action={action}
          size="sm"
          className="mb-0"
        />
      </div>
      <div className={noPad ? "" : "p-5"}>{children}</div>
    </AppCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AdminBadge → AppBadge                                                       *
 * ─────────────────────────────────────────────────────────────────────────── */
export function AdminBadge({ variant = "gray", children, dot }: {
  variant?: AdminBadgeVariant; children: ReactNode; dot?: boolean;
}) {
  return (
    <AppBadge variant={ADMIN_BADGE_MAP[variant]} dot={dot} size="xs">
      {children}
    </AppBadge>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * DrawerPanel → AppDrawer                                                     *
 * ─────────────────────────────────────────────────────────────────────────── */
interface DrawerPanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  width?: string;
  testId?: string;
}

export function DrawerPanel({ open, onClose, title, subtitle, children, width = "max-w-lg", testId }: DrawerPanelProps) {
  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      width={width}
      position="right"
      testId={testId}
    >
      {children}
    </AppDrawer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * EmptyState — avec animations d'entrée                                      *
 * Garde action?: ReactNode pour compatibilité (les pages passent du JSX)      *
 * ─────────────────────────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon = Inbox, title = "Aucune donnée", description = "Rien à afficher ici pour le moment.", action }: {
  icon?: any; title?: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 260 }}
        className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center mb-4"
      >
        <Icon size={24} className="text-zinc-300 dark:text-zinc-600" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300, delay: 0.07 }}
        className="flex flex-col items-center"
      >
        <p className={cx("font-semibold text-[13px]", text.secondary)}>{title}</p>
        <p className={cx("text-[11px] mt-1 max-w-xs leading-relaxed", text.muted)}>{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * SkeletonRows → AppSkeleton                                                  *
 * ─────────────────────────────────────────────────────────────────────────── */
export function SkeletonRows({ count = 5, cols = 4 }: { count?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className={cx("border-b border-zinc-100 dark:border-zinc-800/60")}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <AppSkeleton className="h-3" style={{ width: `${60 + (j * 7 + i * 11) % 30}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * SortableCol                                                                 *
 * ─────────────────────────────────────────────────────────────────────────── */
export function SortableCol({ label, field, sort, onSort }: {
  label: string; field: string; sort: { field: string; dir: "asc" | "desc" }; onSort: (field: string) => void;
}) {
  const active = sort.field === field;
  return (
    <th
      className={cx(
        "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide cursor-pointer select-none transition-colors group",
        text.secondary,
        "hover:text-zinc-700 dark:hover:text-zinc-200",
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={cx("transition-colors", active ? "text-brand-500" : "text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400")}>
          {active ? (sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronsUpDown size={12} />}
        </span>
      </div>
    </th>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * FilterChip — active state avec layout animation                            *
 * ─────────────────────────────────────────────────────────────────────────── */
export function FilterChip({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={cx(
        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors",
        motionTokens.normal,
        active
          ? "text-white shadow-ds-brand"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200",
      )}
    >
      {/* Fond animé via layoutId pour transition fluide entre tabs */}
      {active && (
        <motion.span
          layoutId="filter-chip-active"
          className="absolute inset-0 rounded-lg bg-brand"
          transition={{ type: "spring", damping: 28, stiffness: 380 }}
        />
      )}
      <span className="relative z-10">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cx(
          "relative z-10 text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none",
          active ? "bg-white/25 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500",
        )}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AdminSearchInput                                                            *
 * ─────────────────────────────────────────────────────────────────────────── */
export function AdminSearchInput({ value, onChange, placeholder = "Rechercher…", className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={cx("relative", className)}>
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          "w-full pl-8 pr-8 py-2 rounded-lg text-[12px] transition-all",
          "bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60",
          "text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400",
          focusRing,
        )}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X size={12} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AdminBtn → AppButton                                                        *
 * ─────────────────────────────────────────────────────────────────────────── */
type AdminBtnVariant = "primary" | "secondary" | "ghost" | "danger";
type AdminBtnSize = "sm" | "md";

export function AdminBtn({ children, onClick, variant = "primary", size = "md", icon, loading, className = "", testId }: {
  children?: ReactNode; onClick?: () => void; variant?: AdminBtnVariant;
  size?: AdminBtnSize; icon?: any; loading?: boolean; className?: string; testId?: string;
}) {
  const sizeMap: Record<AdminBtnSize, "xs" | "sm"> = { sm: "xs", md: "sm" };
  return (
    <AppButton
      onClick={onClick}
      variant={variant}
      size={sizeMap[size]}
      icon={icon}
      loading={loading}
      className={className}
      testId={testId}
    >
      {children}
    </AppButton>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AdminPageHeader                                                             *
 * ─────────────────────────────────────────────────────────────────────────── */
export function AdminPageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <motion.div
      className="flex items-start justify-between mb-6"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
    >
      <div>
        <h1 className={cx("text-xl font-black tracking-tight", text.primary)}>{title}</h1>
        {description && <p className={cx("text-[12px] mt-0.5", text.muted)}>{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AnimatedList — stagger-anime une liste d'éléments                          *
 * Wrapper léger autour des variantes stagger de framer-motion.               *
 * ─────────────────────────────────────────────────────────────────────────── */
export function AnimatedList({
  children,
  className,
  stagger = 0.04,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: 0.02 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedListItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerItemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * TabContent — transition fluide lors du changement d'onglet/filtre           *
 * ─────────────────────────────────────────────────────────────────────────── */
export function TabContent({ children, tabKey, className }: { children: ReactNode; tabKey: string | number; className?: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={{ type: "spring", damping: 28, stiffness: 340 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
