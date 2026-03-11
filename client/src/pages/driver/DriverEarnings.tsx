import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { authFetch } from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { DollarSign, TrendingUp, Package, Clock } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Order } from "@shared/schema";

export default function DriverEarnings() {
  const { user } = useAuth();

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", { driverId: user?.id }],
    queryFn: () => authFetch(`/api/orders?driverId=${user?.id}`).then((r) => r.json()),
    enabled: !!user,
  });

  const delivered = orders.filter((o) => o.status === "delivered");
  const totalEarnings = delivered.reduce((s, o) => s + o.deliveryFee, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Mes revenus</h2>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 text-white mb-6">
          <p className="text-sm text-gray-400">Revenus totaux</p>
          <p className="text-4xl font-black mt-1">{formatPrice(totalEarnings)}</p>
          <div className="flex items-center gap-1 mt-2 text-green-400 text-sm">
            <TrendingUp size={14} />
            <span className="font-medium">+12% cette semaine</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-950 rounded-xl flex items-center justify-center mb-2">
              <Package size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{delivered.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Livraisons terminees</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center mb-2">
              <Clock size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{delivered.length > 0 ? Math.round(totalEarnings / delivered.length) : 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Moy. par livraison ($)</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Historique des gains</h3>
          </div>
          {delivered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Aucun gain pour le moment</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {delivered.map((o) => (
                <div key={o.id} className="p-4 flex items-center justify-between" data-testid={`earning-${o.id}`}>
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{o.orderNumber}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{o.deliveryAddress?.split(",")[0]}</p>
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
