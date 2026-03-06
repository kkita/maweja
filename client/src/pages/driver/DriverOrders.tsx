import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import DriverNav from "../../components/DriverNav";
import { Package, MapPin } from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors } from "../../lib/utils";
import type { Order } from "@shared/schema";

export default function DriverOrders() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", { driverId: user?.id }],
    queryFn: () => fetch(`/api/orders?driverId=${user?.id}`).then((r) => r.json()),
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Mes livraisons</h2>
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center pt-20">
            <Package size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune livraison pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm" data-testid={`driver-order-${order.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{order.orderNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2"><MapPin size={12} /> {order.deliveryAddress}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{formatDate(order.createdAt!)}</span>
                  <span className="font-bold text-red-600">{formatPrice(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
