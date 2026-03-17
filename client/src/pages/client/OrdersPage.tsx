import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { authFetchJson } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import { ChevronRight, Package, Clock, Bike, Star, ShoppingBag } from "lucide-react";
import { formatPrice, formatDate } from "../../lib/utils";
import type { Order, Restaurant } from "@shared/schema";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: "En attente",     color: "#92400E", bg: "#FEF3C7", dot: "#F59E0B" },
  confirmed:  { label: "Confirmée",      color: "#1E40AF", bg: "#DBEAFE", dot: "#3B82F6" },
  preparing:  { label: "En préparation", color: "#7C3AED", bg: "#EDE9FE", dot: "#8B5CF6" },
  ready:      { label: "Prête",          color: "#065F46", bg: "#D1FAE5", dot: "#10B981" },
  picked_up:  { label: "En livraison",   color: "#0E7490", bg: "#CFFAFE", dot: "#06B6D4" },
  delivered:  { label: "Livrée ✓",       color: "#064E3B", bg: "#D1FAE5", dot: "#059669" },
  cancelled:  { label: "Annulée",        color: "#991B1B", bg: "#FEE2E2", dot: "#EF4444" },
};

const ACTIVE_PROGRESS: Record<string, number> = {
  pending: 10, confirmed: 30, preparing: 55, ready: 75, picked_up: 90,
};

function OrderProgressBar({ status }: { status: string }) {
  const pct = ACTIVE_PROGRESS[status] ?? 0;
  if (!pct) return null;
  return (
    <div className="mt-3">
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"active" | "history">("active");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: () => authFetchJson("/api/orders"),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: restaurants = [] } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"] });
  const restaurantMap = new Map(restaurants.map(r => [r.id, r]));

  const activeStatuses = ["pending", "confirmed", "preparing", "ready", "picked_up"];
  const activeOrders = orders.filter(o => activeStatuses.includes(o.status));
  const pastOrders = orders.filter(o => !activeStatuses.includes(o.status));
  const displayed = tab === "active" ? activeOrders : pastOrders;

  const getItemCount = (order: Order) => {
    const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
    return (items as any[]).reduce((s: number, i: any) => s + (i.qty || 1), 0);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <ClientNav />
        <div className="flex flex-col items-center justify-center pt-32 px-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-5">
            <ShoppingBag size={36} className="text-red-400" />
          </div>
          <p className="font-bold text-gray-900 dark:text-white text-lg">Connexion requise</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Connectez-vous pour voir vos commandes</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 bg-red-600 text-white px-6 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
            data-testid="button-login-orders"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <ClientNav />

      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* ── Page title ─── */}
        <div className="mb-5">
          <h1 className="font-bold text-gray-900 dark:text-white" style={{ fontSize: 22 }}>Mes Commandes</h1>
          <p className="text-gray-400 dark:text-gray-500 mt-0.5" style={{ fontSize: 13 }}>
            {activeOrders.length} en cours · {pastOrders.length} terminée{pastOrders.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* ── Tabs ─── */}
        <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
          {[
            { key: "active",  label: "En cours",  count: activeOrders.length },
            { key: "history", label: "Historique", count: pastOrders.length  },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as "active" | "history")}
              data-testid={`tab-${t.key}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-all active:scale-95"
              style={{
                fontSize: 13,
                background: tab === t.key ? "#fff" : "transparent",
                color: tab === t.key ? "#111827" : "#9CA3AF",
                boxShadow: tab === t.key ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className="min-w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold px-1.5"
                  style={{
                    background: tab === t.key ? "#dc2626" : "#E5E7EB",
                    color: tab === t.key ? "#fff" : "#6B7280",
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ─── */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl p-5" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
                <div className="flex gap-3">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" />
                    <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" />
                    <div className="h-3 w-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-5">
              {tab === "active" ? (
                <Bike size={40} className="text-gray-300" />
              ) : (
                <Package size={40} className="text-gray-300" />
              )}
            </div>
            <p className="font-bold text-gray-800 dark:text-gray-100 text-base" data-testid="text-empty-orders">
              {tab === "active" ? "Aucune commande en cours" : "Aucune commande passée"}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {tab === "active" ? "Commandez chez l'un de nos restaurants" : "Vos commandes passées apparaîtront ici"}
            </p>
            {tab === "active" && (
              <button
                onClick={() => navigate("/")}
                className="mt-5 bg-red-600 text-white px-7 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
                data-testid="button-order-now"
              >
                Découvrir les restaurants
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(order => {
              const itemCount = getItemCount(order);
              const restaurant = restaurantMap.get(order.restaurantId);
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isActive = activeStatuses.includes(order.status);

              return (
                <button
                  key={order.id}
                  onClick={() => navigate(`/order/${order.id}`)}
                  data-testid={`order-card-${order.id}`}
                  className="w-full bg-white dark:bg-gray-900 rounded-3xl p-4 text-left active:scale-[0.98] transition-transform"
                  style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}
                >
                  <div className="flex gap-3">
                    {/* Restaurant image/logo */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {restaurant?.logoUrl ? (
                        <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : restaurant?.image ? (
                        <img src={restaurant.image} alt={restaurant.name ?? ""} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <ShoppingBag size={22} className="text-gray-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="font-bold text-gray-900 dark:text-white truncate" style={{ fontSize: 14 }}>
                          {restaurant?.name || "Restaurant"}
                        </p>
                        <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-0.5" />
                      </div>

                      {/* Status badge */}
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold"
                        style={{ fontSize: 10, color: cfg.color, background: cfg.bg }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                        {cfg.label}
                      </span>

                      {/* Meta */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                          <Clock size={11} strokeWidth={1.8} />
                          <span style={{ fontSize: 11 }}>{formatDate(order.createdAt!)}</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200" />
                        <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: 11 }}>
                          {itemCount} article{itemCount > 1 ? "s" : ""}
                        </span>
                        <div className="w-px h-3 bg-gray-200" />
                        <span className="font-bold text-red-600" style={{ fontSize: 13 }}>
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {isActive && <OrderProgressBar status={order.status} />}

                  {/* Rate hint for delivered */}
                  {order.status === "delivered" && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span style={{ fontSize: 11, color: "#92400E", fontWeight: 600 }}>
                        Notez votre commande
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
