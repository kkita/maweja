/*
 * ClientUI — Couche UI client de MAWEJA
 *
 * Construit sur les primitives partagées du Design System.
 * Toutes les APIs existantes sont préservées pour la compatibilité.
 */
import type React from "react";
import { Star, Clock, ChevronRight, Tag } from "lucide-react";
import { motion, AnimatePresence } from "../../lib/motion";
import { resolveImg } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import type { Restaurant } from "@shared/schema";
import {
  AppButton, AppCard, AppBadge, AppEmptyState, AppSkeleton, AppSectionHeader,
  type AppButtonVariant, type AppButtonSize,
} from "../../design-system/primitives";
import { type StatusVariant } from "../../design-system/tokens";

function cx(...c: (string | undefined | false | null)[]): string {
  return c.filter(Boolean).join(" ");
}

/* ── Design tokens client ──────────────────────────────────────────────────
 * Note : l'ancienne table `ct` (rouge/bg/textPrimary…) est dépréciée.
 * Toutes les valeurs vivent désormais dans `design-system/tokens.ts`
 * (palette, status, surface, text, brand) et dans tailwind.config.ts (`brand-*`).
 * ────────────────────────────────────────────────────────────────────────── */

/* ── MBadge variant → StatusVariant mapping ─────────────────────────────── */
type MBadgeVariant = "red" | "green" | "amber" | "blue" | "gray" | "cyan";
const MBADGE_MAP: Record<MBadgeVariant, StatusVariant> = {
  red:   "error",
  green: "success",
  amber: "warning",
  blue:  "info",
  cyan:  "cyan",
  gray:  "gray",
};

/* ── Status mapping for orders (backward compat) ────────────────────────── */
export const ORDER_STATUS: Record<string, { label: string; variant: MBadgeVariant }> = {
  pending:   { label: "En attente",       variant: "amber" },
  confirmed: { label: "Confirmée",        variant: "blue"  },
  preparing: { label: "En préparation",   variant: "cyan"  },
  ready:     { label: "Prête",            variant: "cyan"  },
  picked_up: { label: "En livraison",     variant: "blue"  },
  delivered: { label: "Livrée ✓",         variant: "green" },
  cancelled: { label: "Annulée",          variant: "red"   },
  returned:  { label: "Retournée",        variant: "gray"  },
};

/* ─────────────────────────────────────────────────────────────────────────── *
 * MBtn → AppButton                                                            *
 * ─────────────────────────────────────────────────────────────────────────── */
type MBtnVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";

interface MBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: MBtnVariant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  "data-testid"?: string;
}

export function MBtn({ variant = "primary", size = "md", fullWidth, loading, icon, children, className = "", disabled, ...props }: MBtnProps) {
  const sizeMap: Record<"sm" | "md" | "lg", AppButtonSize> = { sm: "sm", md: "md", lg: "lg" };
  const variantMap: Record<MBtnVariant, AppButtonVariant> = {
    primary: "primary", secondary: "secondary", ghost: "ghost", danger: "danger", outline: "outline",
  };
  const customSizeCls = { sm: "rounded-[14px]", md: "rounded-[16px]", lg: "rounded-[18px]" }[size];
  return (
    <AppButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      fullWidth={fullWidth}
      loading={loading}
      disabled={disabled}
      testId={props["data-testid"]}
      onClick={props.onClick as () => void}
      className={cx(customSizeCls, className)}
    >
      {!loading && icon}
      {children}
    </AppButton>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * MCard → AppCard                                                             *
 * ─────────────────────────────────────────────────────────────────────────── */
interface MCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padded?: boolean;
  "data-testid"?: string;
}

export function MCard({ children, className = "", onClick, padded = false, ...rest }: MCardProps) {
  return (
    <AppCard
      onClick={onClick}
      padding={padded ? "md" : false}
      rounded="xl"
      testId={rest["data-testid"]}
      className={cx("shadow-ds-xs", className)}
    >
      {children}
    </AppCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * MSectionHeader → AppSectionHeader                                           *
 * ─────────────────────────────────────────────────────────────────────────── */
interface MSectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void; testId?: string };
  icon?: React.ReactNode;
}

export function MSectionHeader({ title, subtitle, action, icon }: MSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <div className="flex items-center gap-2">
        {icon && <span className="text-brand">{icon}</span>}
        <div>
          <h2 className="font-black text-gray-900 dark:text-white leading-tight" style={{ fontSize: 16, letterSpacing: "-0.3px" }}>{title}</h2>
          {subtitle && <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          data-testid={action.testId}
          className="flex items-center gap-0.5 text-brand font-semibold active:opacity-70 transition-opacity"
          style={{ fontSize: 12 }}
        >
          {action.label}
          <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * MBadge → AppBadge                                                           *
 * ─────────────────────────────────────────────────────────────────────────── */
export function MBadge({ variant = "gray", children, dot }: {
  variant?: MBadgeVariant; children: React.ReactNode; dot?: boolean;
}) {
  return (
    <AppBadge variant={MBADGE_MAP[variant]} dot={dot} pulse={dot} size="sm">
      {children}
    </AppBadge>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * MEmptyState → AppEmptyState                                                 *
 * ─────────────────────────────────────────────────────────────────────────── */
export function MEmptyState({
  icon, title, description, action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; testId?: string };
}) {
  return (
    <AppEmptyState icon={icon as any} title={title} description={description} action={action} size="lg" />
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * SkeletonPulse → AppSkeleton                                                 *
 * ─────────────────────────────────────────────────────────────────────────── */
export function SkeletonPulse({ className = "" }: { className?: string }) {
  return <AppSkeleton className={className} />;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * RestaurantCardSkeleton                                                      *
 * ─────────────────────────────────────────────────────────────────────────── */
export function RestaurantCardSkeleton() {
  return (
    <MCard className="mb-4">
      <div className="p-3">
        <AppSkeleton className="w-full h-[180px] rounded-2xl" />
      </div>
      <div className="px-4 pb-4 flex gap-3">
        <AppSkeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 pt-1 space-y-2">
          <AppSkeleton className="h-4 w-36 rounded-full" />
          <AppSkeleton className="h-3 w-24 rounded-full" />
          <AppSkeleton className="h-3 w-28 rounded-full" />
        </div>
      </div>
    </MCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * SmallCardSkeleton                                                           *
 * ─────────────────────────────────────────────────────────────────────────── */
export function SmallCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[148px]">
      <AppSkeleton className="w-full h-[110px] rounded-2xl mb-2" />
      <AppSkeleton className="h-3 w-24 rounded-full mb-1.5" />
      <AppSkeleton className="h-2.5 w-16 rounded-full" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * RestaurantCard                                                              *
 * ─────────────────────────────────────────────────────────────────────────── */
interface RestaurantCardProps {
  r: Restaurant;
  onClick: () => void;
  promoLabel?: string;
}

export function RestaurantCard({ r, onClick, promoLabel }: RestaurantCardProps) {
  return (
    <motion.div whileTap={{ scale: 0.984 }} style={{ borderRadius: 20 }}>
    <MCard className="mb-3.5" onClick={onClick} data-testid={`restaurant-card-${r.id}`}>
      <div className="relative px-3 pt-3">
        <div className="relative w-full h-[196px] rounded-[18px] overflow-hidden">
          <img src={resolveImg(r.image)} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
          {(promoLabel || (r.discountPercent && r.discountPercent > 0)) && (
            <div
              className={cx(
                "absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-white text-[10px] font-extrabold shadow-[0_2px_8px_rgba(0,0,0,0.25)]",
                promoLabel ? "bg-brand-500" : "bg-emerald-500",
              )}
            >
              <Tag size={9} /> {promoLabel || `-${r.discountPercent}%`}
            </div>
          )}
          {r.isFeatured && !promoLabel && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 dark:bg-zinc-900/90 text-amber-700 dark:text-amber-300 rounded-full px-2.5 py-1 backdrop-blur-sm border border-amber-200/70 dark:border-amber-800/40" style={{ fontSize: 9.5, fontWeight: 800, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
              <Star size={8} className="fill-amber-500 text-amber-500" /> Partenaire
            </div>
          )}
          {!r.isActive && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-[18px]">
              <span className="text-white font-black text-sm bg-black/40 px-4 py-1.5 rounded-full tracking-wider">FERMÉ</span>
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full px-2 py-0.5 bg-black/35" style={{ backdropFilter: "blur(6px)" }}>
            <Star size={9} className="text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="text-white font-bold" style={{ fontSize: 10.5 }}>{r.rating || "—"}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 shadow-ds-xs">
          {r.logoUrl ? (
            <img src={resolveImg(r.logoUrl)} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <span className="text-white font-black text-base">{r.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 dark:text-white leading-tight truncate" style={{ fontSize: 14.5, letterSpacing: "-0.2px" }}>{r.name}</p>
          {r.cuisine && <p className="text-gray-400 dark:text-gray-500 text-xs truncate mt-0.5">{r.cuisine}</p>}
          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
            {r.deliveryTime && (
              <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                <Clock size={10} strokeWidth={2} className="flex-shrink-0" />
                <span style={{ fontSize: 11 }}>{r.deliveryTime}</span>
              </div>
            )}
            {r.deliveryFee !== undefined && (
              <>
                <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: 11 }}>
                  {r.deliveryFee === 0 ? "Livraison gratuite" : `${r.deliveryFee} $ livraison`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </MCard>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * BoutiqueCard                                                                *
 * ─────────────────────────────────────────────────────────────────────────── */
export function BoutiqueCard({ b, onClick }: { b: Restaurant; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      data-testid={`boutique-card-${b.id}`}
      className="flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[18px] overflow-hidden text-left shadow-ds-xs"
      style={{ width: 148, border: "1px solid rgba(0,0,0,0.05)" }}
    >
      <div className="relative h-[108px]">
        <img src={resolveImg(b.image)} alt={b.name} className="w-full h-full object-cover" loading="lazy" />
        {!b.isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-[9px] font-black bg-black/40 px-2.5 py-1 rounded-full">FERMÉ</span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="font-bold text-gray-900 dark:text-white text-xs truncate leading-tight">{b.name}</p>
        {b.cuisine && <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{b.cuisine}</p>}
        <div className="flex items-center gap-1.5 mt-1.5">
          <Star size={9} className="text-amber-400 fill-amber-400 flex-shrink-0" />
          <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">{b.rating || "—"}</span>
          {b.deliveryTime && <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">{b.deliveryTime}</span>}
        </div>
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * MPill                                                                       *
 * ─────────────────────────────────────────────────────────────────────────── */
export function MPill({ active, onClick, children, testId }: {
  active: boolean; onClick: () => void; children: React.ReactNode; testId?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      data-testid={testId}
      className={cx(
        "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold transition-colors",
        active
          ? "bg-brand text-white shadow-ds-brand"
          : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300",
      )}
      style={{
        fontSize: 12.5,
        border: active ? "1.5px solid var(--brand-500)" : "1.5px solid transparent",
        boxShadow: active ? undefined : "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {children}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * MPageHeader                                                                 *
 * ─────────────────────────────────────────────────────────────────────────── */
export function MPageHeader({ title, onBack, action, subtitle, transparent }: {
  title: string; onBack?: () => void; action?: React.ReactNode; subtitle?: string; transparent?: boolean;
}) {
  return (
    <div
      className={cx("sticky top-0 z-40 px-4", !transparent && "bg-white dark:bg-zinc-950 border-b border-black/[0.04] dark:border-white/[0.06]")}
      style={{ paddingTop: "max(env(safe-area-inset-top), 12px)", paddingBottom: 12 }}
    >
      <div className="max-w-lg mx-auto flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            data-testid="button-back"
            className="w-10 h-10 bg-gray-50 dark:bg-zinc-800/60 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-gray-300">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-gray-900 dark:text-white truncate" style={{ fontSize: 18, letterSpacing: "-0.4px" }}>{title}</h1>
          {subtitle && <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * MTabBar                                                                     *
 * ─────────────────────────────────────────────────────────────────────────── */
export function MTabBar({ tabs, active, onSelect }: {
  tabs: { key: string; label: string }[]; active: string; onSelect: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800/60 rounded-[14px] p-1">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onSelect(tab.key)}
          data-testid={`tab-${tab.key}`}
          className={cx(
            "flex-1 py-2 rounded-[11px] font-semibold transition-all duration-200",
            active === tab.key
              ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-ds-xs"
              : "text-gray-400 dark:text-gray-500",
          )}
          style={{ fontSize: 12.5 }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * PromoCard                                                                   *
 * ─────────────────────────────────────────────────────────────────────────── */
export function PromoCard({ r, promoLabel, onClick }: { r: Restaurant; promoLabel?: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      data-testid={`promo-card-${r.id}`}
      className="flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[20px] overflow-hidden text-left"
      style={{ width: 176, boxShadow: "0 4px 20px rgba(0,0,0,0.10)", border: "1px solid rgba(0,0,0,0.05)" }}
    >
      <div className="relative h-[120px]">
        <img src={resolveImg(r.image)} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
        <div className="absolute top-2.5 left-2.5 bg-brand text-white font-black rounded-full px-2.5 py-1 flex items-center gap-1" style={{ fontSize: 9.5, boxShadow: "0 2px 8px rgba(225,0,0,0.4)" }}>
          <Tag size={8} /> {promoLabel || "PROMO"}
        </div>
        {r.rating && (
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 bg-black/40" style={{ backdropFilter: "blur(6px)" }}>
            <Star size={8} className="text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="text-white font-bold" style={{ fontSize: 9.5 }}>{r.rating}</span>
          </div>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="font-bold text-gray-900 dark:text-white text-xs truncate leading-tight">{r.name}</p>
        {r.cuisine && <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{r.cuisine}</p>}
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * BoutiqueGridCard — 2-column grid variant                                    *
 * ─────────────────────────────────────────────────────────────────────────── */
export function BoutiqueGridCard({ b, onClick }: { b: Restaurant; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      data-testid={`boutique-grid-card-${b.id}`}
      className="w-full bg-white dark:bg-zinc-900 rounded-[20px] overflow-hidden text-left"
      style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.05)" }}
    >
      <div className="relative h-[110px]">
        <img src={resolveImg(b.image)} alt={b.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        {!b.isActive && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="text-white font-black tracking-wider bg-black/40 px-2.5 py-1 rounded-full" style={{ fontSize: 9 }}>FERMÉ</span>
          </div>
        )}
        {b.rating && (
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 bg-black/40" style={{ backdropFilter: "blur(6px)" }}>
            <Star size={8} className="text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="text-white font-bold" style={{ fontSize: 9.5 }}>{b.rating}</span>
          </div>
        )}
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <p className="font-bold text-gray-900 dark:text-white text-[12px] truncate leading-tight">{b.name}</p>
        {b.cuisine && <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{b.cuisine}</p>}
        {b.deliveryTime && (
          <div className="flex items-center gap-1 mt-1.5">
            <Clock size={9} className="text-gray-400 flex-shrink-0" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{b.deliveryTime}</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * FeaturedRestaurantCard — horizontal scroll "Coup de cœur"                  *
 * ─────────────────────────────────────────────────────────────────────────── */
export function FeaturedRestaurantCard({ r, onClick }: { r: Restaurant; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      data-testid={`featured-card-${r.id}`}
      className="flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[22px] overflow-hidden text-left"
      style={{ width: 210, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.04)" }}
    >
      <div className="relative h-[136px]">
        <img src={resolveImg(r.image)} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/95 dark:bg-zinc-900/90 text-amber-700 dark:text-amber-300 font-black rounded-full px-2.5 py-1 backdrop-blur-sm border border-amber-200/70 dark:border-amber-800/40" style={{ fontSize: 9, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
          <Star size={8} className="fill-amber-500 text-amber-500" /> Coup de cœur
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 flex items-end justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            {r.logoUrl ? (
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                <img src={resolveImg(r.logoUrl)} alt={r.name} className="w-full h-full object-cover" />
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="text-white font-black text-[13px] truncate leading-tight drop-shadow">{r.name}</p>
              {r.cuisine && <p className="text-white/70 text-[10px] truncate">{r.cuisine}</p>}
            </div>
          </div>
          {r.rating && (
            <div className="flex items-center gap-1 flex-shrink-0 bg-black/35 rounded-full px-1.5 py-0.5 ml-2" style={{ backdropFilter: "blur(6px)" }}>
              <Star size={8} className="text-amber-400 fill-amber-400" />
              <span className="text-white font-bold" style={{ fontSize: 9.5 }}>{r.rating}</span>
            </div>
          )}
        </div>
      </div>
      <div className="px-3 py-2.5 flex items-center gap-2">
        {r.deliveryTime && (
          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
            <Clock size={10} strokeWidth={2} />
            <span style={{ fontSize: 10.5 }}>{r.deliveryTime}</span>
          </div>
        )}
        {r.deliveryFee !== undefined && (
          <>
            <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
            <span className="text-[10.5px] text-gray-400 dark:text-gray-500">
              {r.deliveryFee === 0 ? "Livraison gratuite" : `${r.deliveryFee} $`}
            </span>
          </>
        )}
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * ServiceCategoryItem                                                         *
 * ─────────────────────────────────────────────────────────────────────────── */
const SERVICE_EMOJIS: Record<string, string> = {
  fastfood: "🍔", "fast food": "🍔", delivery: "🛵", livraison: "🛵",
  grocery: "🛍️", épicerie: "🛍️", pizza: "🍕", promo: "🏷️",
  restaurant: "🍽️", shop: "🛒", boutique: "🛒", hotel: "🏨",
  transport: "🚗", coiffure: "💇", salon: "💇", massage: "💆",
  nettoyage: "🧹", ménage: "🧹", coursier: "📦", services: "🔧",
  all: "✦", tout: "✦",
};

function getServiceEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(SERVICE_EMOJIS)) {
    if (lower.includes(k)) return v;
  }
  return "✦";
}

export function ServiceCategoryItem({ name, imageUrl, emoji, active, onClick, testId }: {
  name: string; imageUrl?: string | null; emoji?: string;
  active?: boolean; onClick: () => void; testId?: string;
}) {
  const fallbackEmoji = emoji || getServiceEmoji(name);
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      data-testid={testId}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
      style={{ width: 70 }}
    >
      <div
        className={cx(
          "w-14 h-14 rounded-[18px] overflow-hidden flex items-center justify-center transition-all",
          !imageUrl && "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900",
          active && "ring-2 ring-brand ring-offset-2 ring-offset-white dark:ring-offset-zinc-950",
        )}
        style={{
          boxShadow: active ? "0 4px 16px rgba(225,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {imageUrl
          ? <img src={resolveImg(imageUrl)} alt={name} className="w-full h-full object-cover" loading="lazy" />
          : <span className="text-gray-700 dark:text-gray-200" style={{ fontSize: 26 }}>{fallbackEmoji}</span>}
      </div>
      <span
        className={cx("text-center leading-tight font-medium", active ? "text-brand" : "text-gray-600 dark:text-gray-400")}
        style={{ fontSize: 10, width: 70, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}
      >
        {name}
      </span>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * BottomSheet → AppDrawer (position="bottom")                                 *
 * ─────────────────────────────────────────────────────────────────────────── */
export function BottomSheet({ open, onClose, children, title }: {
  open: boolean; onClose: () => void; children: React.ReactNode; title?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-[28px] overflow-hidden"
            style={{ boxShadow: "0 -8px 48px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 dark:bg-zinc-700 rounded-full" />
            </div>
            {title && (
              <div className="px-5 pb-3 pt-2 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-black text-gray-900 dark:text-white text-base">{title}</h3>
              </div>
            )}
            <div className="pb-[env(safe-area-inset-bottom)] pb-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
