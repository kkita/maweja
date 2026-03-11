import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { onWSMessage } from "../../lib/websocket";
import { queryClient, authFetch } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useI18n } from "../../lib/i18n";
import { Package, Truck, Users, DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle, ArrowUpRight, Store, UtensilsCrossed } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { statusLabels, statusColors, formatDate } from "../../lib/utils";
import type { Order } from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { t } = useI18n();

  const { data: stats } = useQuery<any>({ queryKey: ["/api/dashboard/stats"] });
  const { data: recentOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: () => authFetch("/api/orders").then((r) => r.json()),
  });

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "new_order") {
        toast({ title: t.admin.orders + "!", description: `${t.common.order} ${data.order.orderNumber}` });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
      if (data.type === "order_updated") {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
    });
  }, [toast, t]);

  const statCards = [
    { label: t.admin.totalOrders, value: stats?.orders?.total || 0, icon: Package, color: "bg-red-50 text-red-600", trend: "+15%" },
    { label: t.admin.activeOrders, value: stats?.orders?.active || 0, icon: Clock, color: "bg-orange-50 text-orange-600", trend: "" },
    { label: t.admin.driversOnline, value: `${stats?.drivers?.online || 0}/${stats?.drivers?.total || 0}`, icon: Truck, color: "bg-green-50 text-green-600", trend: "" },
    { label: t.admin.revenue, value: formatPrice(Number(stats?.orders?.revenue) || 0), icon: DollarSign, color: "bg-blue-50 text-blue-600", trend: "+22%" },
    { label: t.admin.delivered, value: stats?.orders?.delivered || 0, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", trend: "" },
    { label: t.admin.clients, value: stats?.clients?.total || 0, icon: Users, color: "bg-purple-50 text-purple-600", trend: "+8%" },
  ];

  return (
    <AdminLayout title={t.admin.dashboard}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm" data-testid={`stat-${card.label.toLowerCase().replace(/\s/g, "-")}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 ${card.color.split(" ")[0]} rounded-xl flex items-center justify-center`}>
                <card.icon size={20} className={card.color.split(" ")[1]} />
              </div>
              {card.trend && (
                <span className="text-xs font-semibold text-green-600 flex items-center gap-0.5">
                  <ArrowUpRight size={12} /> {card.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">{t.admin.recentOrders}</h3>
            <span className="text-xs text-gray-400">{recentOrders.length} {t.common.orders}</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-96 overflow-y-auto">
            {recentOrders.slice(0, 10).map((order) => (
              <div key={order.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" data-testid={`recent-order-${order.id}`}>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.createdAt!)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">{formatPrice(order.total)}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4">{t.admin.performance}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">{t.admin.deliveryRate}</span>
                  <span className="font-bold">
                    {stats?.orders?.total ? Math.round((Number(stats.orders.delivered) / Number(stats.orders.total)) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats?.orders?.total ? (Number(stats.orders.delivered) / Number(stats.orders.total)) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">{t.admin.activeDrivers}</span>
                  <span className="font-bold">
                    {stats?.drivers?.total ? Math.round((Number(stats.drivers.online) / Number(stats.drivers.total)) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats?.drivers?.total ? (Number(stats.drivers.online) / Number(stats.drivers.total)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} />
              <span className="font-bold text-sm">MAWEJA Pro</span>
            </div>
            <p className="text-2xl font-black">{formatPrice(Number(stats?.orders?.revenue) || 0)}</p>
            <p className="text-red-200 text-xs mt-1">{t.admin.totalRevenue}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <UtensilsCrossed size={16} className="text-red-600" />
            <h3 className="font-bold text-gray-900 dark:text-white">{t.admin.cuisineCategories}</h3>
          </div>
          <div className="p-5 space-y-3">
            {(() => {
              const breakdown = stats?.cuisineBreakdown || [];
              const total = breakdown.reduce((s: number, x: any) => s + Number(x.count), 0);
              return breakdown.map((c: any) => {
              const pct = total > 0 ? Math.round((Number(c.count) / total) * 100) : 0;
              return (
                <div key={c.cuisine} data-testid={`cuisine-breakdown-${c.cuisine?.toLowerCase().replace(/\s/g, "-")}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{c.cuisine}</span>
                    <span className="text-gray-500 text-xs">{c.count} {t.common.restaurant}{Number(c.count) > 1 ? "s" : ""} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            });
            })()}
            {(!stats?.cuisineBreakdown || stats.cuisineBreakdown.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">{t.admin.noDataAvailable}</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Store size={16} className="text-red-600" />
            <h3 className="font-bold text-gray-900 dark:text-white">{t.admin.ordersByCategory}</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 dark:divide-gray-800">
            {(stats?.cuisineOrders || []).map((c: any) => (
              <div key={c.cuisine} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" data-testid={`cuisine-orders-${c.cuisine?.toLowerCase().replace(/\s/g, "-")}`}>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{c.cuisine}</p>
                  <p className="text-xs text-gray-400">{c.orderCount} {t.common.order}{Number(c.orderCount) > 1 ? "s" : ""}</p>
                </div>
                <span className="font-bold text-sm text-red-600">{formatPrice(Number(c.revenue))}</span>
              </div>
            ))}
            {(!stats?.cuisineOrders || stats.cuisineOrders.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-8">{t.admin.noOrdersByCategory}</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
