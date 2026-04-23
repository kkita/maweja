import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "../../components/AdminLayout";
import { queryClient, authFetchJson, STALE } from "../../lib/queryClient";
import { useI18n } from "../../lib/i18n";
import {
  Package, Truck, Users, DollarSign, Store, TrendingUp, UtensilsCrossed,
  ShoppingBag, Layers, AlertCircle, ArrowRight, Wallet, Tag, Bell, BellRing,
  Activity, CircleDot,
} from "lucide-react";
import { formatPrice, statusLabels, statusColors, formatDate } from "../../lib/utils";
import type { Order, Restaurant } from "@shared/schema";
import AdminOrderDetailPopup from "../../components/AdminOrderDetailPopup";
import {
  AnimatedNumber, LiveDot, AdminProgressBar, SectionCard,
  AdminBadge, EmptyState,
} from "../../components/admin/AdminUI";
import NotifPanel from "../../components/admin/AdminNotifPanel";
import AdminLiveToast from "../../components/admin/AdminLiveToast";
import { useAdminNotifs } from "../../hooks/use-admin-notifs";

/* ─── Quick Actions ────────────────────────────────────────────────────────── */
/* ── SoftKPI : carte plate, fond pastel léger, type "badge statut" ── */
const SOFT_TONES: Record<string, { bg: string; ring: string; iconBg: string; icon: string; value: string }> = {
  rose:    { bg: "bg-rose-50 dark:bg-rose-950/25",       ring: "border-rose-100 dark:border-rose-900/40",       iconBg: "bg-rose-100 dark:bg-rose-900/40",       icon: "text-rose-600 dark:text-rose-300",       value: "text-rose-900 dark:text-rose-50" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/25", ring: "border-emerald-100 dark:border-emerald-900/40", iconBg: "bg-emerald-100 dark:bg-emerald-900/40", icon: "text-emerald-600 dark:text-emerald-300", value: "text-emerald-900 dark:text-emerald-50" },
  sky:     { bg: "bg-sky-50 dark:bg-sky-950/25",         ring: "border-sky-100 dark:border-sky-900/40",         iconBg: "bg-sky-100 dark:bg-sky-900/40",         icon: "text-sky-600 dark:text-sky-300",         value: "text-sky-900 dark:text-sky-50" },
  violet:  { bg: "bg-violet-50 dark:bg-violet-950/25",   ring: "border-violet-100 dark:border-violet-900/40",   iconBg: "bg-violet-100 dark:bg-violet-900/40",   icon: "text-violet-600 dark:text-violet-300",   value: "text-violet-900 dark:text-violet-50" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-950/25",     ring: "border-amber-100 dark:border-amber-900/40",     iconBg: "bg-amber-100 dark:bg-amber-900/40",     icon: "text-amber-600 dark:text-amber-300",     value: "text-amber-900 dark:text-amber-50" },
};

function SoftKPI({ tone, label, value, sub, icon: Icon, testId }: { tone: keyof typeof SOFT_TONES; label: string; value: string | number; sub?: string; icon: any; testId?: string }) {
  const t = SOFT_TONES[tone];
  return (
    <div className={`rounded-2xl border ${t.bg} ${t.ring} p-4 transition-all hover:shadow-sm`} data-testid={testId}>
      <div className="flex items-start justify-between mb-2.5">
        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide leading-tight">{label}</span>
        <div className={`w-8 h-8 rounded-xl ${t.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={15} className={t.icon} />
        </div>
      </div>
      <p className={`font-black tracking-tight ${t.value}`} style={{ fontSize: 22 }}>{value}</p>
      {sub && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">{sub}</p>}
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "Commandes", icon: ShoppingBag, color: "bg-rose-600", href: "/admin/orders" },
  { label: "Restaurants", icon: Store, color: "bg-orange-500", href: "/admin/restaurants" },
  { label: "Agents", icon: Truck, color: "bg-rose-700", href: "/admin/drivers" },
  { label: "Services", icon: Layers, color: "bg-indigo-500", href: "/admin/services" },
  { label: "Finance", icon: Wallet, color: "bg-emerald-600", href: "/admin/finance" },
  { label: "Promotions", icon: Tag, color: "bg-amber-500", href: "/admin/promotions" },
];

/* ─── Main Component ────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [loaded, setLoaded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const {
    notifs, notifPanelOpen, notifRinging, liveToast, setLiveToast,
    unreadCount, openPanel, closePanel, dismissNotif, markAllRead, clearAll,
  } = useAdminNotifs();

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-CD", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const { data: stats } = useQuery<any>({ queryKey: ["/api/dashboard/stats"], staleTime: STALE.dynamic });
  const { data: restaurants = [] } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"], staleTime: STALE.semi });
  const restaurantMap = new Map(restaurants.map(r => [r.id, r.name]));
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: () => authFetchJson("/api/orders"),
    staleTime: STALE.dynamic,
  });

  /* ── computed stats ── */
  const todayOrders     = Number(stats?.orders?.todayOrders) || 0;
  const todayRevenue    = Number(stats?.orders?.todayRevenue) || 0;
  const pendingCount    = Number(stats?.orders?.pending) || 0;
  const cancelledCount  = Number(stats?.orders?.cancelled) || 0;
  const totalOrders     = Number(stats?.orders?.total) || 0;
  const deliveredOrders = Number(stats?.orders?.delivered) || 0;
  const deliveryRate    = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
  const driversOnline   = Number(stats?.drivers?.online) || 0;
  const driversTotal    = Number(stats?.drivers?.total) || 0;
  const restaurantsActive = Number(stats?.restaurants?.active) || 0;
  const restaurantsTotal  = Number(stats?.restaurants?.total) || 0;
  const totalClients    = Number(stats?.clients?.total) || 0;
  const totalRevenue    = Number(stats?.orders?.revenue) || 0;

  return (
    <AdminLayout title={t.admin.dashboard}>

      {selectedOrder && (
        <AdminOrderDetailPopup
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          restaurantName={restaurantMap.get(selectedOrder.restaurantId)}
        />
      )}

      <NotifPanel
        open={notifPanelOpen}
        onClose={closePanel}
        notifs={notifs}
        onDismiss={dismissNotif}
        onMarkAllRead={markAllRead}
        onClearAll={clearAll}
        onNavigate={navigate}
      />

      <AdminLiveToast
        toast={liveToast}
        onClose={() => setLiveToast(null)}
        onNavigate={navigate}
      />

      <div className={`space-y-6 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}>

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LiveDot />
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">En direct</span>
              <span className="text-zinc-300 dark:text-zinc-700 text-xs">·</span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{dateCapitalized}</span>
            </div>
            <h2 className="text-[22px] font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Vue d'ensemble</h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">Plateforme MAWEJA · Kinshasa, RDC</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openPanel}
              data-testid="button-notifications-bell"
              className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm"
            >
              {notifRinging
                ? <BellRing size={16} className="text-rose-600 animate-[bounce_0.4s_ease-in-out_infinite]" />
                : <Bell size={16} className={unreadCount > 0 ? "text-rose-600" : "text-zinc-400"} />
              }
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center" data-testid="notif-badge-count">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Alert banner ── */}
        {pendingCount > 0 && (
          <div
            className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/30 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-amber-100/60 dark:hover:bg-amber-950/30 transition-all group"
            onClick={() => navigate("/admin/orders")}
            data-testid="alert-pending-orders"
          >
            <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle size={13} className="text-amber-600" />
            </div>
            <p className="font-semibold text-[12px] text-amber-800 dark:text-amber-400 flex-1">
              {pendingCount} commande{pendingCount > 1 ? "s" : ""} en attente de confirmation
            </p>
            <ArrowRight size={13} className="text-amber-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </div>
        )}

        {/* ── KPI Grid (cartes pastel claires, style badges Commandes) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SoftKPI tone="rose"    label="Commandes aujourd'hui" value={todayOrders}              sub={`${totalOrders} au total`}                 icon={ShoppingBag} testId="stat-commandes-du-jour" />
          <SoftKPI tone="emerald" label="Revenu du jour"        value={formatPrice(todayRevenue)} sub={`${formatPrice(totalRevenue)} total`}      icon={DollarSign}  testId="stat-revenu-du-jour" />
          <SoftKPI tone="sky"     label="Agents en ligne"       value={`${driversOnline}/${driversTotal}`} sub={`${driversTotal} inscrits`}        icon={Truck}       testId="stat-agents-en-ligne" />
          <SoftKPI tone="violet"  label="Clients actifs"        value={totalClients}              sub={`${restaurantsActive} restaurants actifs`} icon={Users}       testId="stat-clients-actifs" />
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {QUICK_ACTIONS.map(({ label, icon: Icon, color, href }) => (
            <button
              key={label}
              onClick={() => navigate(href)}
              data-testid={`quick-action-${label.toLowerCase()}`}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm hover:-translate-y-0.5 transition-all active:scale-[0.97] group"
            >
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                <Icon size={16} className="text-white" />
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          <SectionCard
            title={t.admin.recentOrders}
            icon={Package}
            count={recentOrders.length}
            action={
              <button onClick={() => navigate("/admin/orders")} className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-0.5" data-testid="link-all-orders">
                Voir tout <ArrowRight size={11} />
              </button>
            }
            noPad
            className="lg:col-span-3"
          >
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[420px] overflow-y-auto">
              {ordersLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center justify-between animate-pulse">
                    <div className="space-y-2">
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full w-24" />
                      <div className="h-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-full w-16" />
                    </div>
                    <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-16" />
                  </div>
                ))
              ) : recentOrders.length === 0 ? (
                <EmptyState icon={Package} title="Aucune commande" description="Les commandes apparaîtront ici." />
              ) : (
                recentOrders.slice(0, 10).map(order => (
                  <div
                    key={order.id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                    data-testid={`recent-order-${order.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package size={13} className="text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 transition-colors">{order.orderNumber}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{formatDate(order.createdAt!)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-[13px] text-zinc-900 dark:text-zinc-100">{formatPrice(order.total)}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 rounded-2xl p-5 text-white relative overflow-hidden border border-zinc-700/50">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/[0.04]" />
              <div className="absolute -bottom-5 -left-5 w-20 h-20 rounded-full bg-rose-500/10" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={13} className="text-rose-400" />
                  <span className="text-[11px] font-semibold text-zinc-400">Revenu Total</span>
                </div>
                <p className="text-3xl font-black tracking-tight">{formatPrice(totalRevenue)}</p>
                <p className="text-zinc-500 text-[11px] mt-0.5">Commandes livrées uniquement</p>
                <div className="mt-4 pt-3 border-t border-zinc-700/50 grid grid-cols-3 gap-2">
                  {[
                    { label: "Total", val: totalOrders },
                    { label: "Livrées", val: deliveredOrders },
                    { label: "Annulées", val: cancelledCount },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider">{label}</p>
                      <p className="text-lg font-black text-white"><AnimatedNumber value={val} /></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <SectionCard title={t.admin.performance} icon={Activity}>
              <div className="space-y-4">
                {[
                  { label: t.admin.deliveryRate, value: deliveryRate, max: 100, color: "bg-emerald-500", delay: 200, display: deliveryRate },
                  { label: t.admin.activeDrivers, value: driversOnline, max: Math.max(driversTotal, 1), color: "bg-blue-500", delay: 400, display: driversTotal > 0 ? Math.round((driversOnline / driversTotal) * 100) : 0 },
                  { label: "Restaurants actifs", value: restaurantsActive, max: Math.max(restaurantsTotal, 1), color: "bg-amber-500", delay: 600, display: restaurantsTotal > 0 ? Math.round((restaurantsActive / restaurantsTotal) * 100) : 0 },
                ].map(({ label, value, color, max, display, delay }) => (
                  <div key={label}>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium">{label}</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{display}%</span>
                    </div>
                    <AdminProgressBar value={value} max={max} color={color} delay={delay} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ── Bottom analytics grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <SectionCard title={t.admin.cuisineCategories} icon={UtensilsCrossed}>
            {(() => {
              const breakdown = stats?.cuisineBreakdown || [];
              const total = breakdown.reduce((s: number, x: any) => s + Number(x.count), 0);
              if (breakdown.length === 0) return <EmptyState icon={Store} title="Aucune donnée" description="Les données s'afficheront ici." />;
              const colors = ["bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-blue-500", "bg-purple-500"];
              return (
                <div className="space-y-3.5">
                  {breakdown.map((c: any, i: number) => {
                    const pct = total > 0 ? Math.round((Number(c.count) / total) * 100) : 0;
                    return (
                      <div key={c.cuisine} data-testid={`cuisine-breakdown-${c.cuisine?.toLowerCase().replace(/\s/g, "-")}`}>
                        <div className="flex justify-between text-[12px] mb-1.5">
                          <span className="text-zinc-600 dark:text-zinc-300 font-medium">{c.cuisine}</span>
                          <span className="text-zinc-400 text-[11px] font-medium">{c.count} · {pct}%</span>
                        </div>
                        <AdminProgressBar value={Number(c.count)} max={total} color={colors[i % colors.length]} delay={i * 80} />
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </SectionCard>

          <SectionCard title={t.admin.ordersByCategory} icon={Store} noPad>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {(stats?.cuisineOrders || []).length === 0 ? (
                <div className="p-5">
                  <EmptyState icon={Package} title="Aucune donnée" description="Les ventes par catégorie apparaîtront ici." />
                </div>
              ) : (stats?.cuisineOrders || []).map((c: any) => (
                <div
                  key={c.cuisine}
                  className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group"
                  data-testid={`cuisine-orders-${c.cuisine?.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                      <CircleDot size={11} className="text-rose-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 transition-colors">{c.cuisine}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{c.orderCount} commande{Number(c.orderCount) > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <span className="font-black text-[13px] text-rose-600">{formatPrice(Number(c.revenue))}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

      </div>
    </AdminLayout>
  );
}
