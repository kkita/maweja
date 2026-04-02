import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useAuth } from "../../lib/auth";
import { authFetchJson } from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { FileText, Calendar, Package, DollarSign, TrendingUp, ChevronDown } from "lucide-react";
import { formatPrice, formatPaymentMethod } from "../../lib/utils";
import type { Order } from "@shared/schema";

type Period = "today" | "week" | "month" | "custom";

export default function DriverRapport() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", { driverId: user?.id }],
    queryFn: () => authFetchJson(`/api/orders?driverId=${user?.id}`),
    enabled: !!user,
  });

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter(o => {
      if (o.status !== "delivered") return false;
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

  const totalDeliveryFees = filteredOrders.reduce((s, o) => s + o.deliveryFee, 0);
  const totalOrders = filteredOrders.length;
  const avgPerOrder = totalOrders > 0 ? parseFloat((totalDeliveryFees / totalOrders).toFixed(2)) : 0;

  const ordersByDay = useMemo(() => {
    const map: Record<string, { count: number; fees: number; orders: Order[] }> = {};
    filteredOrders.forEach(o => {
      const day = new Date(o.createdAt!).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
      if (!map[day]) map[day] = { count: 0, fees: 0, orders: [] };
      map[day].count++;
      map[day].fees += o.deliveryFee;
      map[day].orders.push(o);
    });
    return Object.entries(map).reverse();
  }, [filteredOrders]);

  const periodLabels: Record<Period, string> = {
    today: "Aujourd'hui",
    week: "Cette semaine",
    month: "Ce mois",
    custom: "Personnalise",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-28">
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white" data-testid="text-rapport-title">Rapport</h2>
            <p className="text-xs text-gray-500">Résumé de vos livraisons</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["today", "week", "month", "custom"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              data-testid={`rapport-period-${p}`}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Du</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                data-testid="input-rapport-from"
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Au</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                data-testid="input-rapport-to"
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Package size={16} className="text-blue-600" />
            </div>
            <p className="text-lg font-black text-blue-700" data-testid="rapport-total-orders">{totalOrders}</p>
            <p className="text-[10px] text-gray-500 font-semibold">Livraisons</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <DollarSign size={16} className="text-emerald-600" />
            </div>
            <p className="text-lg font-black text-emerald-700" data-testid="rapport-total-fees">{formatPrice(totalDeliveryFees)}</p>
            <p className="text-[10px] text-gray-500 font-semibold">Total gains</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <TrendingUp size={16} className="text-orange-600" />
            </div>
            <p className="text-lg font-black text-orange-700" data-testid="rapport-avg">{formatPrice(avgPerOrder)}</p>
            <p className="text-[10px] text-gray-500 font-semibold">Moy./livraison</p>
          </div>
        </div>

        {ordersByDay.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-800">
            <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-semibold">Aucune livraison pour cette période</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ordersByDay.map(([day, data]) => (
              <div key={day} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-red-500" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 capitalize">{day}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{data.count} cmd</span>
                    <span className="text-xs font-black text-emerald-600">{formatPrice(data.fees)}</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {data.orders.map(o => (
                    <div key={o.id} className="px-4 py-3 flex items-center justify-between" data-testid={`rapport-order-${o.id}`}>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{o.orderNumber}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{o.deliveryAddress?.split(",")[0]}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-medium" data-testid={`rapport-payment-${o.id}`}>{formatPaymentMethod(o.paymentMethod)}</p>
                      </div>
                      <span className="font-black text-sm text-emerald-600">+{formatPrice(o.deliveryFee)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-[10px] text-gray-400 mt-6">Made By Khevin Andrew Kita - Ed Corporation</p>
      </div>
    </div>
  );
}
