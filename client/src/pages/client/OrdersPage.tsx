import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { authFetchJson } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import { ChevronRight, Package, Bike, Star, ShoppingBag, Clock } from "lucide-react";
import { formatPrice, formatDate } from "../../lib/utils";
import type { Order, Restaurant } from "@shared/schema";
import { MCard, MBadge, ORDER_STATUS, MTabBar, MEmptyState, MPageHeader, SkeletonPulse } from "../../components/client/ClientUI";

const ACTIVE_STEPS: Record<string, number> = {
  pending: 15, confirmed: 40, preparing: 65, ready: 75, picked_up: 85,
};

function OrderProgressBar({ status }: { status: string }) {
  const pct = ACTIVE_STEPS[status];
  if (!pct) return null;
  return (
    <div className="mt-3.5 mb-0.5">
      <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #E10000, #FF4444)" }}
        />
      </div>
    </div>
  );
}

function OrderCard({ order, restaurant, onClick }: { order: Order; restaurant?: Restaurant; onClick: () => void }) {
  const items: any[] = (() => { try { return typeof order.items === "string" ? JSON.parse(order.items) : (order.items as any[]); } catch { return []; } })();
  const itemCount = (items as any[]).reduce((s: number, i: any) => s + (i.qty || 1), 0);
  const status = ORDER_STATUS[order.status] || { label: order.status, variant: "gray" as const };
  const isActive = ["pending", "confirmed", "preparing", "ready", "picked_up"].includes(order.status);

  return (
    <MCard className="mb-3" onClick={onClick} data-testid={`order-card-${order.id}`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
              {restaurant?.name || (order as any).restaurantName || "Restaurant"}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
              {itemCount} article{itemCount > 1 ? "s" : ""} · {formatDate(order.createdAt!)}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <MBadge variant={status.variant} dot={isActive}>{status.label}</MBadge>
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
          </div>
        </div>

        {/* Progress bar for active orders */}
        {isActive && <OrderProgressBar status={order.status} />}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
            {isActive ? <Bike size={13} className="text-[#E10000]" /> : <Package size={13} />}
            <span style={{ fontSize: 11 }}>
              {isActive ? "En cours de traitement" : order.status === "delivered" ? "Commande livrée" : "Commande terminée"}
            </span>
          </div>
          <span className="font-black text-gray-900 dark:text-white" style={{ fontSize: 14 }}>
            {formatPrice(typeof order.total === "string" ? parseFloat(order.total) : order.total)}
          </span>
        </div>
      </div>
    </MCard>
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

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0a0a0a] pb-28">
        <ClientNav />
        <MEmptyState
          icon={<ShoppingBag size={36} />}
          title="Connexion requise"
          description="Connectez-vous pour voir vos commandes"
          action={{ label: "Se connecter", onClick: () => navigate("/login"), testId: "button-login-orders" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0a0a0a] pb-28" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <ClientNav />
      <MPageHeader title="Mes commandes" subtitle={orders.length > 0 ? `${orders.length} commande${orders.length > 1 ? "s" : ""}` : undefined} />

      <div className="max-w-lg mx-auto px-4 pt-4">

        {/* Active order count banner */}
        {activeOrders.length > 0 && (
          <div
            className="flex items-center gap-3 bg-[#E10000]/10 dark:bg-[#E10000]/15 rounded-[16px] px-4 py-3 mb-4 border border-[#E10000]/15"
            data-testid="active-orders-banner"
          >
            <div className="w-8 h-8 bg-[#E10000] rounded-full flex items-center justify-center flex-shrink-0">
              <Bike size={16} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#E10000] text-sm">
                {activeOrders.length} commande{activeOrders.length > 1 ? "s" : ""} en cours
              </p>
              <p className="text-[#E10000]/70 text-xs mt-0.5">Suivez vos livraisons en temps réel</p>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="mb-4">
          <MTabBar
            tabs={[
              { key: "active", label: `En cours${activeOrders.length > 0 ? ` (${activeOrders.length})` : ""}` },
              { key: "history", label: `Historique${pastOrders.length > 0 ? ` (${pastOrders.length})` : ""}` },
            ]}
            active={tab}
            onSelect={k => setTab(k as "active" | "history")}
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-[#141414] rounded-[20px] p-4" style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.06)" }}>
                <div className="flex justify-between mb-3">
                  <div className="space-y-2">
                    <SkeletonPulse className="h-4 w-36" />
                    <SkeletonPulse className="h-3 w-24" />
                  </div>
                  <SkeletonPulse className="h-6 w-20 rounded-full" />
                </div>
                <SkeletonPulse className="h-1.5 w-full rounded-full mt-4" />
                <div className="flex justify-between mt-4">
                  <SkeletonPulse className="h-3 w-28" />
                  <SkeletonPulse className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          tab === "active" ? (
            <MEmptyState
              icon={<Clock size={36} />}
              title="Aucune commande en cours"
              description="Vos commandes actives apparaîtront ici"
              action={{ label: "Commander maintenant", onClick: () => navigate("/"), testId: "button-order-now" }}
            />
          ) : (
            <MEmptyState
              icon={<Package size={36} />}
              title="Aucun historique"
              description="Vos commandes passées apparaîtront ici"
              action={{ label: "Découvrir les restaurants", onClick: () => navigate("/"), testId: "button-discover" }}
            />
          )
        ) : (
          displayed.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              restaurant={restaurantMap.get(order.restaurantId!)}
              onClick={() => navigate(
                activeStatuses.includes(order.status) ? `/tracking/${order.id}` : `/orders/${order.id}`
              )}
            />
          ))
        )}

        {/* Re-order section for history */}
        {tab === "history" && pastOrders.length > 0 && (
          <div className="mt-2">
            <p className="text-gray-400 dark:text-gray-500 text-xs text-center">
              Appuyez sur une commande pour voir les détails et noter votre expérience
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
