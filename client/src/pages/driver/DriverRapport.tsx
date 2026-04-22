import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useAuth } from "../../lib/auth";
import { authFetchJson } from "../../lib/queryClient";
import { useLocation } from "wouter";
import DriverNav from "../../components/DriverNav";
import { dt, DEmptyState } from "../../components/driver/DriverUI";
import { FileText, Calendar, Package, DollarSign, TrendingUp, ArrowLeft, Banknote, Phone } from "lucide-react";
import { formatPrice, formatPaymentMethod } from "../../lib/utils";
import type { Order } from "@shared/schema";

type Period = "today" | "week" | "month" | "custom";

const PERIOD_LABELS: Record<Period, string> = {
  today:  "Aujourd'hui",
  week:   "Cette semaine",
  month:  "Ce mois",
  custom: "Personnalisé",
};

export default function DriverRapport() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
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
    const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter(o => {
      if (o.status !== "delivered") return false;
      const d = new Date(o.createdAt!);
      if (period === "today")  return d >= startOfToday;
      if (period === "week")   return d >= startOfWeek;
      if (period === "month")  return d >= startOfMonth;
      if (period === "custom") {
        const f = customFrom ? new Date(customFrom) : new Date(0);
        const t = customTo ? new Date(customTo + "T23:59:59") : new Date();
        return d >= f && d <= t;
      }
      return true;
    });
  }, [orders, period, customFrom, customTo]);

  const totalFees = filteredOrders.reduce((s, o) => s + o.deliveryFee, 0);
  const totalOrders = filteredOrders.length;
  const avg = totalOrders > 0 ? totalFees / totalOrders : 0;
  const cashTotal = filteredOrders.filter(o => o.paymentMethod === "cash").reduce((s, o) => s + o.deliveryFee, 0);

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

  return (
    <div className="min-h-screen pb-28 bg-driver-bg">
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/driver/earnings")}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 bg-driver-surface border border-driver-border text-driver-text3"
            data-testid="button-back-rapport"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-black text-driver-text" data-testid="text-rapport-title">Rapport</h2>
            <p className="text-xs mt-0.5 text-driver-text3">Résumé détaillé de vos livraisons</p>
          </div>
        </div>

        {/* Period pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {(["today", "week", "month", "custom"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              data-testid={`rapport-period-${p}`}
              className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: period === p ? dt.accent : "var(--driver-surface)",
                color: period === p ? "white" : "var(--driver-text2)",
                border: `1px solid ${period === p ? "transparent" : "var(--driver-border)"}`,
                boxShadow: period === p ? "0 4px 12px rgba(225,0,0,0.3)" : "none",
              }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Custom date */}
        {period === "custom" && (
          <div className="flex gap-3">
            {[
              { label: "Du", value: customFrom, set: setCustomFrom, testId: "input-rapport-from" },
              { label: "Au", value: customTo,   set: setCustomTo,   testId: "input-rapport-to" },
            ].map(({ label, value, set, testId }) => (
              <div key={label} className="flex-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide block mb-1.5 text-driver-text3">{label}</label>
                <input
                  type="date"
                  value={value}
                  onChange={e => set(e.target.value)}
                  data-testid={testId}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-driver-text focus:outline-none bg-driver-surface border border-driver-border"
                />
              </div>
            ))}
          </div>
        )}

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Package,    label: "Livraisons",     value: totalOrders,            color: dt.blue  },
            { icon: DollarSign, label: "Gains totaux",   value: formatPrice(totalFees), color: dt.green },
            { icon: TrendingUp, label: "Moy./livraison", value: formatPrice(avg),       color: dt.amber },
            { icon: Banknote,   label: "Cash reçu",      value: formatPrice(cashTotal), color: "#c084fc" },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-4 flex flex-col bg-driver-surface border border-driver-border"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}18` }}>
                <s.icon size={17} style={{ color: s.color }} />
              </div>
              <p className="text-xl font-black text-driver-text" data-testid={`rapport-${s.label.toLowerCase().replace(/[^a-z]/g, "-")}`}>{s.value}</p>
              <p className="text-[11px] font-semibold mt-0.5 text-driver-text3">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Daily breakdown */}
        {ordersByDay.length === 0 ? (
          <DEmptyState
            icon={Calendar}
            title="Aucune livraison"
            description="Aucune livraison effectuée pour cette période"
          />
        ) : (
          <div className="space-y-3">
            {ordersByDay.map(([day, data]) => (
              <div key={day} className="rounded-2xl overflow-hidden bg-driver-surface border border-driver-border">
                {/* Day header */}
                <div className="px-4 py-3 flex items-center justify-between bg-driver-s2">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} style={{ color: dt.accent }} />
                    <span className="text-xs font-bold text-driver-text capitalize">{day}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(96,165,250,0.15)", color: dt.blue }}>
                      {data.count} cmd
                    </span>
                    <span className="text-xs font-black" style={{ color: dt.green }}>{formatPrice(data.fees)}</span>
                  </div>
                </div>

                {/* Orders in day */}
                <div>
                  {data.orders.map((o, i) => {
                    const isCash = o.paymentMethod === "cash";
                    return (
                      <div
                        key={o.id}
                        className="px-4 py-3 flex items-center justify-between"
                        style={{ borderTop: i > 0 ? `1px solid var(--driver-border)` : "none" }}
                        data-testid={`rapport-order-${o.id}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: isCash ? "rgba(34,197,94,0.12)" : "rgba(96,165,250,0.12)" }}
                          >
                            {isCash ? <Banknote size={13} style={{ color: dt.green }} /> : <Phone size={13} style={{ color: dt.blue }} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-driver-text">{o.orderNumber}</p>
                            <p className="text-[10px] truncate text-driver-text3">{o.deliveryAddress?.split(",")[0]}</p>
                            <p className="text-[10px] font-medium text-driver-text3" data-testid={`rapport-payment-${o.id}`}>
                              {formatPaymentMethod(o.paymentMethod)}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-sm flex-shrink-0" style={{ color: dt.green }}>+{formatPrice(o.deliveryFee)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-[10px] pt-2 text-driver-text3">MAWEJA Agent — Ed Corporation</p>
      </div>
    </div>
  );
}
