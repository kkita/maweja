import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { authFetch } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import { ClipboardList, ChevronRight, Package } from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors, paymentLabels } from "../../lib/utils";
import type { Order } from "@shared/schema";

export default function OrdersPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", { clientId: user?.id }],
    queryFn: () => authFetch(`/api/orders?clientId=${user?.id}`).then((r) => r.json()),
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Mes commandes</h2>

        {isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center pt-20">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Package size={36} className="text-red-300" />
            </div>
            <h3 className="font-bold text-gray-900">Aucune commande</h3>
            <p className="text-gray-500 text-sm mt-2">Passez votre premiere commande!</p>
            <button onClick={() => navigate("/")} data-testid="button-order-now" className="mt-4 bg-red-600 text-white px-6 py-3 rounded-2xl font-semibold text-sm">
              Commander maintenant
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => navigate(`/tracking/${order.id}`)}
                data-testid={`order-card-${order.id}`}
                className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-gray-900">{order.orderNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt!)}</p>
                    <p className="text-xs text-gray-400 mt-1">{paymentLabels[order.paymentMethod]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-600">{formatPrice(order.total)}</span>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
