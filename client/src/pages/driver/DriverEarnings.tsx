import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { authFetch , authFetchJson} from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { DollarSign, TrendingUp, Package, Clock } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Order } from "@shared/schema";

export default function DriverEarnings() {
  const { user } = useAuth();

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", { driverId: user?.id }],
    queryFn: () => authFetchJson(`/api/orders?driverId=${user?.id}`),
    enabled: !!user,
  });

  const delivered = orders.filter((o) => o.status === "delivered");
  const totalEarnings = delivered.reduce((s, o) => s + o.deliveryFee, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Mes revenus</h2>

        <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-3xl p-6 text-white mb-6 overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(220,38,38,0.30)" }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
          <p className="text-sm text-red-200 font-semibold">Revenus totaux</p>
          <p className="text-4xl font-black mt-1 relative z-10">{formatPrice(totalEarnings)}</p>
          <div className="flex items-center gap-1 mt-2 text-green-300 text-sm relative z-10">
            <TrendingUp size={14} />
            <span className="font-semibold">{delivered.length} livraison{delivered.length !== 1 ? "s" : ""} effectuée{delivered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <Package size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{delivered.length}</p>
            <p className="text-xs text-gray-500">Livraisons terminees</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <Clock size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{delivered.length > 0 ? Math.round(totalEarnings / delivered.length) : 0}</p>
            <p className="text-xs text-gray-500">Moy. par livraison ($)</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900">Historique des gains</h3>
          </div>
          {delivered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucun gain pour le moment</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {delivered.map((o) => (
                <div key={o.id} className="p-4 flex items-center justify-between" data-testid={`earning-${o.id}`}>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{o.orderNumber}</p>
                    <p className="text-xs text-gray-400">{o.deliveryAddress?.split(",")[0]}</p>
                  </div>
                  <span className="font-bold text-green-600">+{formatPrice(o.deliveryFee)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
