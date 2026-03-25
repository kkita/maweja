import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { authFetchJson } from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { Package, MapPin, Clock, CheckCircle2, Truck, ChevronRight, RotateCcw } from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors } from "../../lib/utils";
import type { Order } from "@shared/schema";

const TAB_FILTERS: { key: string; label: string; status?: string[] }[] = [
  { key: "active", label: "En cours", status: ["picked_up", "on_way", "ready"] },
  { key: "delivered", label: "Livrés", status: ["delivered"] },
  { key: "all", label: "Tous" },
];

function OrderCard({ order, onTap }: { order: Order; onTap: () => void }) {
  const statusBg: Record<string, string> = {
    delivered: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
    picked_up: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    on_way: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
    ready: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    default: "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800",
  };
  const bg = statusBg[order.status] || statusBg.default;

  const icons: Record<string, any> = {
    delivered: CheckCircle2,
    picked_up: Truck,
    on_way: Truck,
    ready: Clock,
  };
  const StatusIcon = icons[order.status] || Package;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] cursor-pointer ${bg}`}
      data-testid={`driver-order-${order.id}`}
      onClick={onTap}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            order.status === "delivered" ? "bg-green-100 dark:bg-green-900/40" :
            order.status === "on_way" || order.status === "picked_up" ? "bg-blue-100 dark:bg-blue-900/40" :
            "bg-amber-100 dark:bg-amber-900/40"
          }`}>
            <StatusIcon size={18} className={
              order.status === "delivered" ? "text-green-600" :
              order.status === "on_way" || order.status === "picked_up" ? "text-blue-600" :
              "text-amber-600"
            } />
          </div>
          <div>
            <p className="font-black text-sm text-gray-900 dark:text-white">{order.orderNumber}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{formatDate(order.createdAt!)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${statusColors[order.status]}`}>
            {statusLabels[order.status]}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 mb-3">
        <MapPin size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{order.deliveryAddress}</p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Commission livreur</p>
          <p className="text-sm font-black text-gray-900 dark:text-white">
            {formatPrice(Math.round(order.total * 0.15))}
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal ml-1">/ {formatPrice(order.total)} total</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Articles</p>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{order.items?.length || 0} article{(order.items?.length || 0) > 1 ? "s" : ""}</p>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gray-200" />
        <div>
          <div className="h-3.5 w-24 bg-gray-200 rounded mb-1.5" />
          <div className="h-2.5 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
      <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded mb-4" />
      <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-800 rounded" />
    </div>
  );
}

export default function DriverOrders() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("active");

  const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ["/api/orders", { driverId: user?.id }],
    queryFn: () => authFetchJson(`/api/orders?driverId=${user?.id}`),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const filtered = orders.filter(o => {
    const tab = TAB_FILTERS.find(t => t.key === activeTab);
    if (!tab?.status) return true;
    return tab.status.includes(o.status);
  });

  const activeCount = orders.filter(o => ["picked_up", "on_way", "ready"].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const totalEarnings = orders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + Math.round(o.total * 0.15), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-28">
      <DriverNav />

      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Mes livraisons</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{orders.length} livraison{orders.length !== 1 ? "s" : ""} au total</p>
          </div>
          <button
            onClick={() => refetch()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 active:scale-90 transition-all shadow-sm"
            data-testid="button-refresh-orders"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "En cours", value: activeCount, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
            { label: "Livrés", value: deliveredCount, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
            { label: "Gains", value: `$${totalEarnings}`, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} rounded-2xl p-3 text-center`} data-testid={`stat-driver-${stat.label.toLowerCase()}`}>
              <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-5 bg-white dark:bg-gray-900 rounded-2xl p-1.5 border border-gray-100 dark:border-gray-800 shadow-sm">
          {TAB_FILTERS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-orders-${tab.key}`}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-red-600 text-white shadow-md shadow-red-200 dark:shadow-red-900/40"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune livraison</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {activeTab === "active" ? "Pas de livraison en cours" : "Aucune livraison dans cette catégorie"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} onTap={() => navigate(`/driver/order/${order.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
