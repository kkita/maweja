import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { onWSMessage } from "../../lib/websocket";
import { queryClient, authFetchJson } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useI18n } from "../../lib/i18n";
import { Package, Truck, Users, DollarSign, TrendingUp, Clock, CheckCircle2, ArrowUpRight, Store, UtensilsCrossed, Zap, Activity } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { statusLabels, statusColors, formatDate } from "../../lib/utils";
import type { Order } from "@shared/schema";

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const duration = 900;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{typeof display === "number" && !Number.isNaN(display) ? display.toLocaleString() : display}{suffix}</>;
}

function StatCard({ label, value, icon: Icon, color, trend, delay = 0, isRevenue = false }: any) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const numVal = typeof value === "string" ? value : Number(value) || 0;

  return (
    <div
      data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}
      className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default group ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 ${color.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={20} className={color.text} />
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg flex items-center gap-0.5">
            <ArrowUpRight size={10} /> {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white">
        {typeof numVal === "string" ? numVal : isRevenue ? formatPrice(numVal) : <AnimatedNumber value={numVal} />}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{label}</p>
    </div>
  );
}

function LiveIndicator() {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full bg-green-500 transition-opacity duration-700 ${pulse ? "opacity-100" : "opacity-30"}`} />
      <span className="text-xs font-semibold text-green-600 dark:text-green-400">En direct</span>
    </div>
  );
}

function ProgressBar({ value, max, color = "bg-red-500", delay = 0 }: { value: number; max: number; color?: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 300);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
      <div className={`${color} h-2 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${width}%` }} />
    </div>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const { data: stats } = useQuery<any>({ queryKey: ["/api/dashboard/stats"] });
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: () => authFetchJson("/api/orders"),
  });

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "new_order") {
        toast({ title: "Nouvelle commande !", description: `Commande ${data.order?.orderNumber}` });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
      if (data.type === "order_updated") {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
    });
  }, [toast]);

  const statCards = [
    { label: t.admin.totalOrders, value: stats?.orders?.total || 0, icon: Package, color: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-600" }, trend: "+15%" },
    { label: t.admin.activeOrders, value: stats?.orders?.active || 0, icon: Activity, color: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600" } },
    { label: t.admin.driversOnline, value: `${stats?.drivers?.online || 0}/${stats?.drivers?.total || 0}`, icon: Truck, color: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-600" } },
    { label: t.admin.revenue, value: Number(stats?.orders?.revenue) || 0, icon: DollarSign, color: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600" }, trend: "+22%", isRevenue: true },
    { label: t.admin.delivered, value: stats?.orders?.delivered || 0, icon: CheckCircle2, color: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600" } },
    { label: t.admin.clients, value: stats?.clients?.total || 0, icon: Users, color: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600" }, trend: "+8%" },
  ];

  return (
    <AdminLayout title={t.admin.dashboard}>
      <div className={`transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}>

        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Vue d'ensemble de la plateforme MAWEJA</p>
          </div>
          <LiveIndicator />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((card, i) => (
            <StatCard key={card.label} {...card} delay={i * 80} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">{t.admin.recentOrders}</h3>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-full">{recentOrders.length} commandes</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-96 overflow-y-auto">
              {ordersLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-20" />
                    </div>
                    <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-lg w-20" />
                  </div>
                ))
              ) : recentOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group" data-testid={`recent-order-${order.id}`}>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt!)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{formatPrice(order.total)}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                  </div>
                </div>
              ))}
              {!ordersLoading && recentOrders.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune commande pour le moment</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <Zap size={15} className="text-red-600" /> {t.admin.performance}
              </h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{t.admin.deliveryRate}</span>
                    <span className="font-black text-gray-900 dark:text-white">
                      {(() => { const t = Number(stats?.orders?.total) || 0; const d = Number(stats?.orders?.delivered) || 0; return t > 0 ? Math.round((d / t) * 100) : 0; })()}%
                    </span>
                  </div>
                  <ProgressBar value={Number(stats?.orders?.delivered) || 0} max={Math.max(Number(stats?.orders?.total) || 0, 1)} color="bg-emerald-500" delay={200} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{t.admin.activeDrivers}</span>
                    <span className="font-black text-gray-900 dark:text-white">
                      {(() => { const t = Number(stats?.drivers?.total) || 0; const o = Number(stats?.drivers?.online) || 0; return t > 0 ? Math.round((o / t) * 100) : 0; })()}%
                    </span>
                  </div>
                  <ProgressBar value={Number(stats?.drivers?.online) || 0} max={Math.max(Number(stats?.drivers?.total) || 0, 1)} color="bg-blue-500" delay={400} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Taux de conversion</span>
                    <span className="font-black text-gray-900 dark:text-white">
                      {(() => { const t = Number(stats?.orders?.total) || 0; const d = Number(stats?.orders?.delivered) || 0; return t > 0 ? Math.min(100, Math.round((d / t) * 115)) : 0; })()}%
                    </span>
                  </div>
                  <ProgressBar value={Number(stats?.orders?.delivered) || 0} max={Math.max(Number(stats?.orders?.total) || 0, 1)} color="bg-red-500" delay={600} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-red-200 dark:shadow-none hover:shadow-xl hover:shadow-red-300 dark:hover:shadow-none transition-all duration-300 hover:-translate-y-0.5">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} />
                  <span className="font-bold text-sm">Revenu Total MAWEJA</span>
                </div>
                <p className="text-3xl font-black mb-1">{formatPrice(Number(stats?.orders?.revenue) || 0)}</p>
                <p className="text-red-200 text-xs">Toutes commandes livrees</p>
                <div className="mt-4 pt-4 border-t border-red-500/50 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-red-200 text-[10px] font-medium uppercase tracking-wider">Commandes</p>
                    <p className="text-lg font-black">{stats?.orders?.total || 0}</p>
                  </div>
                  <div>
                    <p className="text-red-200 text-[10px] font-medium uppercase tracking-wider">Clients</p>
                    <p className="text-lg font-black">{stats?.clients?.total || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <UtensilsCrossed size={15} className="text-red-600" />
              <h3 className="font-bold text-gray-900 dark:text-white">{t.admin.cuisineCategories}</h3>
            </div>
            <div className="p-5 space-y-4">
              {(() => {
                const breakdown = stats?.cuisineBreakdown || [];
                const total = breakdown.reduce((s: number, x: any) => s + Number(x.count), 0);
                if (breakdown.length === 0) return (
                  <div className="text-center py-8 text-gray-400">
                    <Store size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t.admin.noDataAvailable}</p>
                  </div>
                );
                return breakdown.map((c: any, i: number) => {
                  const pct = total > 0 ? Math.round((Number(c.count) / total) * 100) : 0;
                  const colors = ["bg-red-500", "bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500"];
                  return (
                    <div key={c.cuisine} data-testid={`cuisine-breakdown-${c.cuisine?.toLowerCase().replace(/\s/g, "-")}`}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-700 dark:text-gray-300 font-semibold">{c.cuisine}</span>
                        <span className="text-gray-400 text-xs font-medium">{c.count} restaurant{Number(c.count) > 1 ? "s" : ""} · {pct}%</span>
                      </div>
                      <ProgressBar value={Number(c.count)} max={total} color={colors[i % colors.length]} delay={i * 100} />
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Store size={15} className="text-red-600" />
              <h3 className="font-bold text-gray-900 dark:text-white">{t.admin.ordersByCategory}</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {(stats?.cuisineOrders || []).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t.admin.noOrdersByCategory}</p>
                </div>
              ) : (stats?.cuisineOrders || []).map((c: any) => (
                <div key={c.cuisine} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group" data-testid={`cuisine-orders-${c.cuisine?.toLowerCase().replace(/\s/g, "-")}`}>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">{c.cuisine}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.orderCount} commande{Number(c.orderCount) > 1 ? "s" : ""}</p>
                  </div>
                  <span className="font-black text-sm text-red-600">{formatPrice(Number(c.revenue))}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
