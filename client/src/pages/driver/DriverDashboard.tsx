import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { Package, Clock, CheckCircle2, Truck, MapPin, ChevronRight } from "lucide-react";
import { formatPrice, statusLabels, statusColors } from "../../lib/utils";
import type { Order } from "@shared/schema";

export default function DriverDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: pendingOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", { status: "ready" }],
    queryFn: () => fetch("/api/orders?status=ready").then((r) => r.json()),
    refetchInterval: 5000,
  });

  const { data: myOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", { driverId: user?.id }],
    queryFn: () => fetch(`/api/orders?driverId=${user?.id}`).then((r) => r.json()),
    enabled: !!user,
  });

  const activeOrders = myOrders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const deliveredToday = myOrders.filter((o) => o.status === "delivered");

  const acceptOrder = async (orderId: number) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ driverId: user?.id, status: "picked_up" }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande acceptee!", description: "Rendez-vous au restaurant" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const updateStatus = async (orderId: number, status: string) => {
    await apiRequest(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    toast({ title: "Statut mis a jour" });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Bonjour {user?.name?.split(" ")[0]}</h2>
        <p className="text-sm text-gray-500 mb-6">Voici vos livraisons du jour</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Package size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{activeOrders.length}</p>
            <p className="text-[10px] text-gray-500 font-medium">En cours</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{deliveredToday.length}</p>
            <p className="text-[10px] text-gray-500 font-medium">Livrees</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Truck size={18} className="text-red-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{formatPrice(user?.walletBalance || 0)}</p>
            <p className="text-[10px] text-gray-500 font-medium">Gains</p>
          </div>
        </div>

        {activeOrders.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-sm text-gray-900 mb-3">Livraisons en cours</h3>
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm" data-testid={`active-order-${order.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{order.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <MapPin size={12} />
                    <span>{order.deliveryAddress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-600">{formatPrice(order.total)}</span>
                    {order.status === "picked_up" && (
                      <button
                        onClick={() => updateStatus(order.id, "delivered")}
                        data-testid={`deliver-${order.id}`}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold"
                      >
                        Marquer livree
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-bold text-sm text-gray-900 mb-3">Commandes disponibles</h3>
          {pendingOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
              <Clock size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aucune commande disponible</p>
              <p className="text-gray-400 text-xs mt-1">Les nouvelles commandes apparaitront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm" data-testid={`pending-order-${order.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{order.orderNumber}</span>
                    <span className="font-bold text-red-600">{formatPrice(order.total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                    <MapPin size={12} /> {order.deliveryAddress}
                  </p>
                  <button
                    onClick={() => acceptOrder(order.id)}
                    data-testid={`accept-order-${order.id}`}
                    className="w-full bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold"
                  >
                    Accepter la livraison
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
