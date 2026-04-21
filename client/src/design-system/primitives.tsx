/*
 * MAWEJA Design System — Primitives
 *
 * Composants de base partagés par AdminUI, ClientUI et DriverUI.
 * S'adaptent automatiquement au mode clair/sombre via dark: variants.
 *
 * AppCard        — conteneur de surface
 * AppButton      — bouton multi-variant
 * AppBadge       — étiquette de statut
 * AppEmptyState  — état vide (animé via framer-motion)
 * AppSkeleton    — placeholder de chargement
 * AppSectionHeader — en-tête de section
 * AppStatCard    — carte de métrique
 * AppDrawer      — panneau latéral / feuille du bas (animé via AnimatePresence)
 * DriverDarkScope — wrapper dark forcé pour les pages driver
 */

import { type ReactNode, useEffect, useState, type CSSProperties } from "react";
import { X, Inbox, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { border, elevation, focusRing, motion as motionTokens, radius, status, surface, text, type StatusVariant } from "./tokens";
import {
  motion,
  AnimatePresence,
  backdropVariants,
  drawerRightVariants,
  drawerBottomVariants,
} from "../lib/motion";

function cx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AppCard                                                                     *
 * ─────────────────────────────────────────────────────────────────────────── */
export interface AppCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  /** "default" = surface + border + shadow | "flat" = border only | "ghost" = transparent */
  variant?: "default" | "flat" | "ghost";
  padding?: boolean | "sm" | "md" | "lg";
  rounded?: keyof typeof radius;
  testId?: string;
  style?: CSSProperties;
}

export function AppCard({
  children, className = "", onClick, variant = "default",
  padding = false, rounded = "lg", testId, style,
}: AppCardProps) {
  const Tag = onClick ? "button" : "div";
  const padMap = { true: "p-5", sm: "p-3", md: "p-4", lg: "p-6", false: "" };
  const padClass = typeof padding === "boolean" ? padMap[String(padding) as "true" | "false"] : padMap[padding];
  const variantClass = {
    default: cx(surface.default, border.default, elevation.xs),
    flat:    cx(surface.default, border.strong),
    ghost:   "bg-transparent",
  }[variant];

  return (
    <Tag
      onClick={onClick}
      data-testid={testId}
      style={style}
      className={cx(
        radius[rounded],
        "overflow-hidden",
        variantClass,
        padClass,
        onClick && cx("w-full text-left active:scale-[0.98] transition-transform", motionTokens.fast),
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AppButton                                                                   *
 * ─────────────────────────────────────────────────────────────────────────── */
export type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "success";
export type AppButtonSize = "xs" | "sm" | "md" | "lg";

export interface AppButtonProps {
  children?: ReactNode;
  onClick?: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  testId?: string;
  type?: "button" | "submit" | "reset";
}

const BTN_VARIANTS: Record<AppButtonVariant, string> = {
  primary:   "bg-brand text-white hover:bg-brand-600 shadow-ds-brand font-bold",
  secondary: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-semibold",
  ghost:     "bg-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 font-semibold",
  danger:    "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 font-semibold",
  outline:   "bg-transparent border-2 border-brand text-brand hover:bg-brand-50 dark:hover:bg-brand-950/20 font-semibold",
  success:   "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 font-semibold",
};

const BTN_SIZES: Record<AppButtonSize, string> = {
  xs: "px-2.5 py-1.5 text-[11px] rounded-lg gap-1",
  sm: "px-3.5 py-2 text-[12px] rounded-xl gap-1.5",
  md: "px-5 py-3 text-[13px] rounded-xl gap-2",
  lg: "px-6 py-3.5 text-[14px] rounded-2xl gap-2",
};

export function AppButton({
  children, onClick, variant = "primary", size = "md",
  loading, icon: Icon, iconRight: IconRight,
  fullWidth, disabled, className = "", testId, type = "button",
}: AppButtonProps) {
  const iconSize = { xs: 11, sm: 12, md: 14, lg: 15 }[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testId}
      className={cx(
        "inline-flex items-center justify-center transition-all",
        "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
        motionTokens.normal,
        focusRing,
        BTN_VARIANTS[variant],
        BTN_SIZES[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading
        ? <Loader2 size={iconSize} className="animate-spin" />
        : Icon && <Icon size={iconSize} strokeWidth={2} />}
      {children}
      {!loading && IconRight && <IconRight size={iconSize} strokeWidth={2} />}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AppBadge                                                                    *
 * ─────────────────────────────────────────────────────────────────────────── */
export interface AppBadgeProps {
  variant?: StatusVariant;
  dot?: boolean;
  pulse?: boolean;
  size?: "xs" | "sm";
  children: ReactNode;
  className?: string;
}

export function AppBadge({ variant = "gray", dot, pulse, size = "xs", children, className = "" }: AppBadgeProps) {
  const s = status[variant];
  return (
    <span
      className={cx(
        "inline-flex items-center font-semibold leading-none",
        size === "xs" ? "gap-1 px-2 py-1 text-[11px] rounded-md" : "gap-1.5 px-2.5 py-1 text-[12px] rounded-lg",
        s.text, s.bg,
        className,
      )}
    >
      {dot && (
        <span
          className={cx("flex-shrink-0 rounded-full", size === "xs" ? "w-1.5 h-1.5" : "w-2 h-2", pulse && "animate-pulse")}
          style={{ background: s.dot }}
        />
      )}
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AppEmptyState — avec animations d'entrée sobres                            *
 * ─────────────────────────────────────────────────────────────────────────── */
export interface AppEmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; testId?: string };
  size?: "sm" | "md" | "lg";
}

export function AppEmptyState({ icon, title, description, action, size = "md" }: AppEmptyStateProps) {
  const isLucide = typeof icon === "function";
  const Icon = isLucide ? (icon as LucideIcon) : null;
  const iconNode = !isLucide ? (icon as ReactNode) : null;
  const iconSize = { sm: 20, md: 24, lg: 32 }[size];
  const boxCls = { sm: "w-12 h-12 rounded-2xl", md: "w-16 h-16 rounded-2xl", lg: "w-20 h-20 rounded-3xl" }[size];
  const py = { sm: "py-10", md: "py-14", lg: "py-20" }[size];

  return (
    <div className={cx("flex flex-col items-center justify-center px-6 text-center", py)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className={cx(boxCls, "bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center mb-4 flex-shrink-0")}
      >
        {Icon
          ? <Icon size={iconSize} className="text-zinc-300 dark:text-zinc-600" />
          : iconNode ?? <Inbox size={iconSize} className="text-zinc-300 dark:text-zinc-600" />}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300, delay: 0.06 }}
        className="flex flex-col items-center"
      >
        <p className={cx("font-bold", text.primary, size === "sm" ? "text-[13px]" : "text-sm")}>{title}</p>
        {description && (
          <p className={cx("mt-1.5 max-w-xs leading-relaxed", text.muted, size === "sm" ? "text-[11px]" : "text-xs")}>{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            data-testid={action.testId}
            className={cx(
              "mt-5 font-bold text-white bg-brand hover:bg-brand-600 shadow-ds-brand",
              "transition-all active:scale-95",
              size === "sm" ? "px-5 py-2 text-[12px] rounded-xl" : "px-6 py-3 text-sm rounded-2xl",
            )}
          >
            {action.label}
          </button>
        )}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AppSkeleton                                                                 *
 * ─────────────────────────────────────────────────────────────────────────── */
export interface AppSkeletonProps {
  className?: string;
  shimmer?: boolean;
  style?: CSSProperties;
}

export function AppSkeleton({ className = "", shimmer = false, style }: AppSkeletonProps) {
  return (
    <div
      style={style}
      className={cx(
        "rounded-xl",
        shimmer ? "skeleton-shimmer" : "animate-pulse bg-zinc-100 dark:bg-zinc-800",
        className,
      )}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AppSectionHeader                                                            *
 * ─────────────────────────────────────────────────────────────────────────── */
export interface AppSectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  count?: number;
  action?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

export function AppSectionHeader({
  title, subtitle, icon: Icon, iconColor, iconBg, count, action, size = "md", className = "",
}: AppSectionHeaderProps) {
  const isSmall = size === "sm";
  return (
    <div className={cx("flex items-center justify-between", isSmall ? "mb-3" : "mb-4", className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div
            className={cx("flex-shrink-0 flex items-center justify-center", isSmall ? "w-7 h-7 rounded-lg" : "w-8 h-8 rounded-xl")}
            style={{ background: iconBg ?? "rgba(225,0,0,0.1)" }}
          >
            <Icon size={isSmall ? 13 : 15} style={{ color: iconColor ?? "#E10000" }} strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className={cx("font-bold truncate", text.primary, isSmall ? "text-[13px]" : "text-sm")}>{title}</h3>
          {subtitle && <p className={cx("text-[11px] mt-0.5 truncate", text.muted)}>{subtitle}</p>}
        </div>
        {count !== undefined && (
          <span className="flex-shrink-0 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-2">{action}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AppStatCard                                                                 *
 * ─────────────────────────────────────────────────────────────────────────── */
export interface AppStatCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  sub?: string;
  trend?: { value: number; label: string };
  animated?: boolean;
  onClick?: () => void;
  testId?: string;
  className?: string;
}

function AnimatedNum({ value }: { value: number }) {
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
  return <>{display.toLocaleString()}</>;
}

export function AppStatCard({
  label, value, icon: Icon, iconColor, iconBg, sub, trend, animated = true, onClick, testId, className = "",
}: AppStatCardProps) {
  const isTrendPositive = trend && trend.value >= 0;
  return (
    <AppCard onClick={onClick} testId={testId} rounded="lg" padding="md" className={cx(onClick && "hover:shadow-ds-sm transition-shadow", className)}>
      <div className="flex items-start justify-between mb-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg ?? "rgba(225,0,0,0.1)" }}
        >
          {Icon && <Icon size={18} style={{ color: iconColor ?? "#E10000" }} strokeWidth={2} />}
        </div>
        {trend && (
          <span className={cx(
            "inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-1 rounded-lg",
            isTrendPositive
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400",
          )}>
            {isTrendPositive ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className={cx("text-2xl font-black tracking-tight leading-none", text.primary)}>
        {typeof value === "number" && animated ? <AnimatedNum value={value} /> : value}
      </p>
      <p className={cx("text-[12px] font-medium mt-1.5 leading-tight", text.secondary)}>{label}</p>
      {sub && <p className={cx("text-[11px] mt-0.5", text.muted)}>{sub}</p>}
      {trend && <p className={cx("text-[10px] mt-1", text.muted)}>{trend.label}</p>}
    </AppCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * AppDrawer — AnimatePresence pour entrée/sortie fluide                       *
 * Panneau latéral (desktop) ou feuille du bas (mobile)                       *
 * ─────────────────────────────────────────────────────────────────────────── */
export interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  position?: "right" | "bottom";
  width?: string;
  testId?: string;
}

export function AppDrawer({ open, onClose, title, subtitle, children, position = "right", width = "max-w-lg", testId }: AppDrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isRight = position === "right";
  const panelVariants = isRight ? drawerRightVariants : drawerBottomVariants;

  const panelCls = isRight
    ? cx("relative ml-auto h-full w-full", width, surface.overlay, "shadow-2xl flex flex-col")
    : cx("relative mt-auto w-full max-h-[92dvh]", surface.overlay, "shadow-2xl flex flex-col rounded-t-3xl");

  return (
    <AnimatePresence>
      {open && (
        <div
          className={cx("fixed inset-0 z-50", isRight ? "flex" : "flex flex-col")}
          data-testid={testId}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Panel */}
          <div className={isRight ? `relative ml-auto flex h-full w-full ${width}` : "relative mt-auto w-full max-h-[92dvh]"}>
            <motion.div
              className={panelCls}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {(title || subtitle) && (
                <div className={cx("flex items-start justify-between px-6 py-5 flex-shrink-0", border.divider)}>
                  <div className="min-w-0">
                    {title && <h2 className={cx("font-black text-[15px] truncate", text.primary)}>{title}</h2>}
                    {subtitle && <p className={cx("text-[11px] mt-0.5", text.muted)}>{subtitle}</p>}
                  </div>
                  <button
                    onClick={onClose}
                    data-testid="button-close-drawer"
                    className={cx(
                      "ml-4 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700",
                      "text-zinc-500 dark:text-zinc-400 transition-colors",
                      focusRing,
                    )}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * DriverDarkScope                                                              *
 * Wrapper qui force le mode sombre pour les pages driver (toujours dark).     *
 * ─────────────────────────────────────────────────────────────────────────── */
export function DriverDarkScope({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("dark", className)}>
      {children}
    </div>
  );
}
