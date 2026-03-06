import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Package, ChevronDown, Truck, MapPin, Search } from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors, paymentLabels } from "../../lib/utils";
import type { Order, User } from "@shared/schema";

export default function AdminOrders() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"], refetchInterval: 5000 });
  const { data: drivers = [] } = useQuery<User[]>({ queryKey: ["/api/drivers"], queryFn: () => authFetch("/api/drivers").then((r) => r.json()) });

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const updateOrderStatus = async (orderId: number, status: string) => {
    await apiRequest(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }) });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    toast({ title: "Statut mis a jour" });
  };

  const assignDriver = async (orderId: number, driverId: number) => {
    await apiRequest(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ driverId, status: "confirmed" }) });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    toast({ title: "Livreur assigne!" });
  };

  const statusFilters = ["all", "pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"];

  return (
    <AdminLayout title="Gestion des commandes">
      <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            data-testid={`filter-${s}`}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === s ? "bg-red-600 text-white shadow-lg" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {s === "all" ? "Toutes" : statusLabels[s]} ({s === "all" ? orders.length : orders.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  data-testid={`admin-order-${order.id}`}
                  className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left ${
                    selectedOrder?.id === order.id ? "bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                      <Package size={18} className="text-red-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt!)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">{formatPrice(order.total)}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h3 className="font-bold text-lg mb-4">{selectedOrder.orderNumber}</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Statut</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${statusColors[selectedOrder.status]}`}>
                    {statusLabels[selectedOrder.status]}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold text-red-600">{formatPrice(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paiement</span>
                  <span className="font-medium">{paymentLabels[selectedOrder.paymentMethod]}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Adresse</span>
                  <p className="font-medium mt-1 flex items-start gap-1"><MapPin size={14} className="text-red-500 mt-0.5" /> {selectedOrder.deliveryAddress}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">Articles</p>
                {(typeof selectedOrder.items === "string" ? JSON.parse(selectedOrder.items) : selectedOrder.items as any[]).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.qty}x {item.name}</span>
                    <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Actions</p>
                <select
                  onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                  value={selectedOrder.status}
                  data-testid="select-status"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                >
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>

                {!selectedOrder.driverId && (
                  <select
                    onChange={(e) => assignDriver(selectedOrder.id, Number(e.target.value))}
                    defaultValue=""
                    data-testid="select-driver"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  >
                    <option value="" disabled>Assigner un livreur</option>
                    {drivers.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.isOnline ? "(En ligne)" : "(Hors ligne)"}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <Package size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Selectionnez une commande</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
