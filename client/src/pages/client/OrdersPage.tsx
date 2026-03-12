import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { authFetch , authFetchJson} from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import { ChevronRight, Package } from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors } from "../../lib/utils";
import type { Order } from "@shared/schema";
import type { Restaurant } from "@shared/schema";

export default function OrdersPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"active" | "history">("active");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: () => authFetchJson("/api/orders"),
    enabled: !!user,
  });

  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const restaurantMap = new Map(restaurants.map((r) => [r.id, r.name]));

  const activeStatuses = ["pending", "confirmed", "preparing", "ready", "picked_up"];
  const pastStatuses = ["delivered", "cancelled"];

  const activeOrders = orders.filter((o) => activeStatuses.includes(o.status));
  const pastOrders = orders.filter((o) => pastStatuses.includes(o.status));
  const displayedOrders = tab === "active" ? activeOrders : pastOrders;

  const getItemCount = (order: Order) => {
    const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
    return (items as any[]).reduce((sum: number, item: any) => sum + (item.qty || 1), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mes Commandes</h2>

        <div className="flex gap-2 mb-6">
          <button
            data-testid="tab-active"
            onClick={() => setTab("active")}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              tab === "active"
                ? "bg-red-600 text-white shadow-lg shadow-red-200"
                : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
            }`}
          >
            En cours ({activeOrders.length})
          </button>
          <button
            data-testid="tab-history"
            onClick={() => setTab("history")}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              tab === "history"
                ? "bg-red-600 text-white shadow-lg shadow-red-200"
                : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
            }`}
          >
            Historique ({pastOrders.length})
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="text-center pt-20">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-950 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Package size={36} className="text-red-300" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Aucune commande</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              {tab === "active"
                ? "Vous n'avez pas de commande en cours"
                : "Aucune commande dans l'historique"}
            </p>
            {tab === "active" && (
              <button
                onClick={() => navigate("/")}
                data-testid="button-order-now"
                className="mt-4 bg-red-600 text-white px-6 py-3 rounded-2xl font-semibold text-sm"
              >
                Commander maintenant
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedOrders.map((order) => {
              const itemCount = getItemCount(order);
              const restaurantName = restaurantMap.get(order.restaurantId) || "Restaurant";
              return (
                <button
                  key={order.id}
                  onClick={() => navigate(`/order/${order.id}`)}
                  data-testid={`order-card-${order.id}`}
                  className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">{order.orderNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">{restaurantName}</p>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.createdAt!)}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{itemCount} article{itemCount > 1 ? "s" : ""}</span>
                    </div>
                    <span className="font-bold text-red-600 text-sm">{formatPrice(order.total)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
