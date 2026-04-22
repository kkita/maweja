import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useAuth } from "../../lib/auth";
import { authFetchJson } from "../../lib/queryClient";
import { useLocation } from "wouter";
import DriverNav from "../../components/DriverNav";
import { dt, DSkeletonCard, DEmptyState } from "../../components/driver/DriverUI";
import { DollarSign, TrendingUp, Package, Clock, Calendar, EyeOff, ChevronRight, Banknote, Phone, ArrowUpRight } from "lucide-react";
import { formatPrice, formatPaymentMethod } from "../../lib/utils";
import type { Order } from "@shared/schema";

type Period = "all" | "today" | "week" | "month" | "custom";

const PERIOD_LABELS: Record<Period, string> = {
  all:     "Tout",
  today:   "Aujourd'hui",
  week:    "Semaine",
  month:   "Mois",
  custom:  "Personnalisé",
};

function filterByPeriod(orders: Order[], period: Period, from: string, to: string): Order[] {
  const delivered = orders.filter(o => o.status === "delivered");
  if (period === "all") return delivered;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return delivered.filter(o => {
    const d = new Date(o.createdAt!);
    if (period === "today") return d >= startOfDay;
    if (period === "week")  return d >= startOfWeek;
    if (period === "month") return d >= startOfMonth;
    if (period === "custom") {
      const f = from ? new Date(from) : new Date(0);
      const t = to ? new Date(to + "T23:59:59") : new Date();
      return d >= f && d <= t;
    }
    return true;
  });
}

export default function DriverEarnings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState<Period>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", { driverId: user?.id }],
    queryFn: () => authFetchJson(`/api/orders?driverId=${user?.id}`),
    enabled: !!user,
  });

  const { data: hideSetting } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings", "hideDeliveryFees"],
    queryFn: () => authFetchJson("/api/settings/hideDeliveryFees"),
  });

  const feesHidden = hideSetting?.value === "true";
  const filtered = useMemo(() => filterByPeriod(orders, period, customFrom, customTo), [orders, period, customFrom, customTo]);
  const totalEarnings = filtered.reduce((s, o) => s + o.deliveryFee, 0);
  const avgPerDelivery = filtered.length > 0 ? totalEarnings / filtered.length : 0;
  const cashOrders = filtered.filter(o => o.paymentMethod === "cash").length;
  const cashTotal = filtered.filter(o => o.paymentMethod === "cash").reduce((s, o) => s + o.deliveryFee, 0);

  if (feesHidden) {
    return (
      <div className="min-h-screen pb-28 bg-driver-bg">
        <DriverNav />
        <div className="max-w-lg mx-auto px-4 py-8">
          <DEmptyState
            icon={EyeOff}
            title="Revenus masqués"
            description="L'affichage des frais de livraison est temporairement désactivé par l'administration."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-driver-bg">
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-driver-text" data-testid="text-earnings-title">Mes revenus</h2>
            <p className="text-xs mt-0.5 text-driver-text3">Suivi de vos gains</p>
          </div>
          <button
            onClick={() => navigate("/driver/rapport")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:opacity-70 bg-driver-surface border border-driver-border text-driver-text2"
            data-testid="button-view-rapport"
          >
            Rapport
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Period pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {(["all", "today", "week", "month", "custom"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              data-testid={`earnings-period-${p}`}
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

        {/* Custom date range */}
        {period === "custom" && (
          <div className="flex gap-3">
            {[
              { label: "Du", value: customFrom, set: setCustomFrom, testId: "input-earnings-from" },
              { label: "Au", value: customTo,   set: setCustomTo,   testId: "input-earnings-to" },
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

        {/* Hero card */}
        <div
          className="driver-hero-gradient rounded-3xl p-6 relative overflow-hidden border border-driver-accent/20"
          style={{ boxShadow: "0 8px 32px rgba(225,0,0,0.12)" }}
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full" style={{ background: "rgba(225,0,0,0.08)" }} />
          <p className="text-xs font-semibold uppercase tracking-wide text-driver-text3">Revenus — {PERIOD_LABELS[period].toLowerCase()}</p>
          <p className="text-4xl font-black text-driver-text mt-1 relative z-10" data-testid="text-total-earnings">{formatPrice(totalEarnings)}</p>
          <div className="flex items-center gap-1.5 mt-2 relative z-10">
            <TrendingUp size={14} style={{ color: dt.green }} />
            <span className="text-sm font-semibold" style={{ color: dt.green }}>
              {filtered.length} livraison{filtered.length !== 1 ? "s" : ""} effectuée{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Package,    label: "Livraisons",          value: filtered.length,              color: dt.blue  },
            { icon: Clock,      label: "Moy. par livraison",  value: formatPrice(avgPerDelivery),  color: dt.amber },
            { icon: Banknote,   label: "Reçu en cash",        value: formatPrice(cashTotal),       color: dt.green },
            { icon: DollarSign, label: "Courses cash",        value: cashOrders,                   color: "#c084fc"},
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-4 bg-driver-surface border border-driver-border"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: `${s.color}18` }}>
                <s.icon size={17} style={{ color: s.color }} />
              </div>
              <p className="text-xl font-black text-driver-text">{s.value}</p>
              <p className="text-xs font-semibold mt-0.5 text-driver-text3">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Earnings history */}
        <div className="rounded-2xl overflow-hidden bg-driver-surface border border-driver-border">
          <div className="px-4 py-3.5 border-b border-driver-border">
            <p className="font-black text-sm text-driver-text">Historique des gains</p>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div>
                    <div className="h-3 w-24 rounded mb-1.5 bg-driver-s2" />
                    <div className="h-2.5 w-32 rounded bg-driver-s3" />
                  </div>
                  <div className="h-4 w-16 rounded bg-driver-s2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-driver-text3">Aucun gain pour cette période</div>
          ) : (
            <div>
              {filtered.map((o, i) => {
                const isCash = o.paymentMethod === "cash";
                return (
                  <div
                    key={o.id}
                    className="px-4 py-3.5 flex items-center justify-between"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid var(--driver-border)` : "none" }}
                    data-testid={`earning-${o.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: isCash ? "rgba(34,197,94,0.12)" : "rgba(96,165,250,0.12)" }}
                      >
                        {isCash ? <Banknote size={14} style={{ color: dt.green }} /> : <Phone size={14} style={{ color: dt.blue }} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-driver-text">{o.orderNumber}</p>
                        <p className="text-[10px] truncate text-driver-text3">{o.deliveryAddress?.split(",")[0]}</p>
                        <p className="text-[10px] text-driver-text3">
                          {new Date(o.createdAt!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <ArrowUpRight size={13} style={{ color: dt.green }} />
                      <span className="font-black text-sm" style={{ color: dt.green }}>+{formatPrice(o.deliveryFee)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
