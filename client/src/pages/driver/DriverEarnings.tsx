import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useAuth } from "../../lib/auth";
import { authFetchJson } from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { DollarSign, TrendingUp, Package, Clock, Calendar, EyeOff } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Order } from "@shared/schema";

type Period = "all" | "today" | "week" | "month" | "custom";

export default function DriverEarnings() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", { driverId: user?.id }],
    queryFn: () => authFetchJson(`/api/orders?driverId=${user?.id}`),
    enabled: !!user,
  });

  const { data: hideSetting } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings", "hideDeliveryFees"],
    queryFn: () => authFetchJson("/api/settings/hideDeliveryFees"),
  });

  const feesHidden = hideSetting?.value === "true";

  const filtered = useMemo(() => {
    const delivered = orders.filter(o => o.status === "delivered");
    if (period === "all") return delivered;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return delivered.filter(o => {
      const d = new Date(o.createdAt!);
      if (period === "today") return d >= startOfToday;
      if (period === "week") return d >= startOfWeek;
      if (period === "month") return d >= startOfMonth;
      if (period === "custom") {
        const from = customFrom ? new Date(customFrom) : new Date(0);
        const to = customTo ? new Date(customTo + "T23:59:59") : new Date();
        return d >= from && d <= to;
      }
      return true;
    });
  }, [orders, period, customFrom, customTo]);

  const totalEarnings = filtered.reduce((s, o) => s + o.deliveryFee, 0);
  const avgPerDelivery = filtered.length > 0 ? Math.round(totalEarnings / filtered.length) : 0;

  if (feesHidden) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24">
        <DriverNav />
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 border border-gray-100 dark:border-gray-800 shadow-sm text-center mt-8">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeOff size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Revenus masqués</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              L'affichage des frais de livraison est temporairement désactivé par l'administration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const periodLabels: Record<Period, string> = {
    all: "Tout",
    today: "Aujourd'hui",
    week: "Semaine",
    month: "Mois",
    custom: "Personnalise",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24">
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4" data-testid="text-earnings-title">Mes revenus</h2>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {(["all", "today", "week", "month", "custom"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              data-testid={`earnings-period-${p}`}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                period === p
                  ? "bg-red-600 text-white shadow-lg shadow-red-200"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Du</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                data-testid="input-earnings-from"
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Au</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                data-testid="input-earnings-to"
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm" />
            </div>
          </div>
        )}

        <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-3xl p-6 text-white mb-6 overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(220,38,38,0.30)" }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
          <p className="text-sm text-red-200 font-semibold">Revenus ({periodLabels[period].toLowerCase()})</p>
          <p className="text-4xl font-black mt-1 relative z-10" data-testid="text-total-earnings">{formatPrice(totalEarnings)}</p>
          <div className="flex items-center gap-1 mt-2 text-green-300 text-sm relative z-10">
            <TrendingUp size={14} />
            <span className="font-semibold">{filtered.length} livraison{filtered.length !== 1 ? "s" : ""} effectuée{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <Package size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white" data-testid="text-delivery-count">{filtered.length}</p>
            <p className="text-xs text-gray-500">Livraisons terminees</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <Clock size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{formatPrice(avgPerDelivery)}</p>
            <p className="text-xs text-gray-500">Moy. par livraison</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Historique des gains</h3>
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucun gain pour cette période</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map((o) => (
                <div key={o.id} className="p-4 flex items-center justify-between" data-testid={`earning-${o.id}`}>
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{o.orderNumber}</p>
                    <p className="text-xs text-gray-400">{o.deliveryAddress?.split(",")[0]}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(o.createdAt!).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
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
