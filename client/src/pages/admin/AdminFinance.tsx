import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient, authFetch, authFetchJson } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { DollarSign, TrendingUp, TrendingDown, Download, Plus, X, ArrowUpRight, PieChart, BarChart3, FileSpreadsheet, Store, CheckCircle2, Clock, Trash2, RefreshCw, ShoppingBag, Banknote, CreditCard, Phone, Wallet, BarChart2, Calendar } from "lucide-react";
import { formatPrice, formatDate, formatPaymentMethod, statusColors, statusLabels } from "../../lib/utils";
import type { Finance, RestaurantPayout, Order, Restaurant } from "@shared/schema";
import AdminOrderDetailPopup from "../../components/AdminOrderDetailPopup";

/* ─────────────────────────────────────────────────────────────────────────────
   Analyse KPI helpers
───────────────────────────────────────────────────────────────────────────── */
function computeAnalyseKPIs(
  orders: Order[],
  allOrders: Order[],
  users: any[],
  restaurants: Restaurant[],
  restaurantCommissionMap: Map<number, number>,
  fromStr: string,
  toStr: string,
) {
  const from = fromStr ? new Date(fromStr).getTime() : 0;
  const to   = toStr   ? new Date(toStr + "T23:59:59").getTime() : Infinity;

  const periodOrders    = orders.filter(o => o.createdAt && new Date(o.createdAt).getTime() >= from && new Date(o.createdAt).getTime() <= to);
  const activeOrders    = periodOrders.filter(o => o.status !== "cancelled");
  const deliveredOrders = periodOrders.filter(o => o.status === "delivered");
  const cancelledOrders = periodOrders.filter(o => o.status === "cancelled");

  const totalOrders     = periodOrders.length;
  const totalSales      = activeOrders.reduce((s, o) => s + o.total, 0);
  const completedOrders = deliveredOrders.length;
  const cancelledCount  = cancelledOrders.length;
  const lostSales       = cancelledOrders.reduce((s, o) => s + o.total, 0);

  const activeClientIds  = new Set(activeOrders.map(o => o.clientId).filter(Boolean));
  const activeCustomers  = activeClientIds.size;
  const activeDriverIds  = new Set(deliveredOrders.map(o => o.driverId).filter(Boolean));
  const activeDriversCount = activeDriverIds.size;

  const mawejaRevenue = deliveredOrders.reduce((s, o) => {
    const sub   = o.subtotal ?? 0;
    const rate  = restaurantCommissionMap.get(o.restaurantId) ?? 20;
    const comm  = o.commission > 0 ? o.commission : Math.round(sub * rate / 100 * 100) / 100;
    const delMg = Math.round(o.deliveryFee * 0.2 * 100) / 100;
    const svc   = (o as any).taxAmount ?? 0;
    return s + comm + delMg + svc;
  }, 0);

  const mawejaLostRevenue = cancelledOrders.reduce((s, o) => {
    const sub  = o.subtotal ?? 0;
    const rate = restaurantCommissionMap.get(o.restaurantId) ?? 20;
    const comm = o.commission > 0 ? o.commission : Math.round(sub * rate / 100 * 100) / 100;
    return s + comm + Math.round(o.deliveryFee * 0.2 * 100) / 100;
  }, 0);

  const totalDriverEarnings = deliveredOrders.reduce((s, o) => s + Math.round(o.deliveryFee * 0.8 * 100) / 100, 0);
  const earningsPerDriver    = activeDriversCount > 0 ? totalDriverEarnings / activeDriversCount : null;
  const deliveriesPerDriver  = activeDriversCount > 0 ? completedOrders / activeDriversCount : null;
  const completedPerCustomer = activeCustomers > 0 ? completedOrders / activeCustomers : null;
  const cancelledPerCustomer = activeCustomers > 0 ? cancelledCount / activeCustomers : null;
  const salesPerCustomer     = activeCustomers > 0 ? totalSales / activeCustomers : null;

  const newRegisteredUsers = users.filter(u => {
    if (!u.createdAt || u.role !== "client") return false;
    const t = new Date(u.createdAt).getTime();
    return t >= from && t <= to;
  }).length;

  const newPartners = restaurants.filter(r => {
    if (!(r as any).createdAt) return false;
    const t = new Date((r as any).createdAt).getTime();
    return t >= from && t <= to;
  }).length;

  // Clients who placed their first-ever order during this period
  const clientFirstOrder = new Map<number, number>();
  allOrders.forEach(o => {
    if (o.clientId && o.createdAt) {
      const t = new Date(o.createdAt).getTime();
      if (!clientFirstOrder.has(o.clientId) || t < clientFirstOrder.get(o.clientId)!) {
        clientFirstOrder.set(o.clientId, t);
      }
    }
  });
  const firstOrderInPeriod = Array.from(clientFirstOrder.values()).filter(t => t >= from && t <= to).length;

  const partnersWithOrder = new Set(deliveredOrders.map(o => o.restaurantId)).size;

  return {
    totalOrders, totalSales, completedOrders, cancelledCount, lostSales,
    mawejaRevenue, mawejaLostRevenue,
    activeCustomers, activeDriversCount,
    earningsPerDriver, deliveriesPerDriver,
    completedPerCustomer, cancelledPerCustomer, salesPerCustomer,
    newRegisteredUsers, newPartners, firstOrderInPeriod, partnersWithOrder,
  };
}

function pct(ev: number | null, cmp: number | null): number | null {
  if (ev === null || cmp === null || cmp === 0) return null;
  return ((ev - cmp) / Math.abs(cmp)) * 100;
}

function fmtVal(v: number | null, mode: "int" | "price" | "dec2" = "int"): string {
  if (v === null || v === undefined) return "--";
  if (mode === "price") return formatPrice(v);
  if (mode === "dec2")  return v.toFixed(2);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

function KpiAnalCard({ label, evalVal, cmpVal, mode = "int" }: {
  label: string; evalVal: number | null; cmpVal: number | null;
  mode?: "int" | "price" | "dec2";
}) {
  const d = pct(evalVal, cmpVal);
  const isUp   = d !== null && d > 0;
  const isDown = d !== null && d < 0;
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 flex flex-col gap-1">
      <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide leading-tight">{label}</p>
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-sm font-black text-zinc-900 dark:text-white">{fmtVal(evalVal, mode)}</span>
        {d !== null ? (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${
            isUp ? "bg-green-100 text-green-700" : isDown ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-500"
          }`}>
            {d > 0 ? "+" : ""}{d.toFixed(2)}%
          </span>
        ) : (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-400">N/A</span>
        )}
      </div>
    </div>
  );
}

export default function AdminFinance() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"general" | "comptabilite" | "restaurants" | "orders" | "analyse">("general");
  const [selectedFinanceOrder, setSelectedFinanceOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState("delivered");
  const [orderSearch, setOrderSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: "revenue", category: "other", amount: 0, description: "" });

  // ── Analyse KPI state ─────────────────────────────────────────────────────
  const [evalFrom, setEvalFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; });
  const [evalTo,   setEvalTo]   = useState(() => new Date().toISOString().split("T")[0]);
  const [cmpFrom,  setCmpFrom]  = useState(() => { const d = new Date(); d.setDate(d.getDate() - 14); return d.toISOString().split("T")[0]; });
  const [cmpTo,    setCmpTo]    = useState(() => { const d = new Date(); d.setDate(d.getDate() - 8); return d.toISOString().split("T")[0]; });
  const [storeTypeFilter, setStoreTypeFilter] = useState<"all" | "restaurant" | "boutique">("all");

  // ── Restaurant payouts state ──────────────────────────────────────
  const [genPeriod, setGenPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [genDateFrom, setGenDateFrom] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [genDateTo, setGenDateTo] = useState(() => {
    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
  });

  const { data: payouts = [], isLoading: payoutsLoading } = useQuery<RestaurantPayout[]>({
    queryKey: ["/api/restaurant-payouts"],
    queryFn: () => authFetchJson("/api/restaurant-payouts"),
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("/api/restaurant-payouts/generate", {
      method: "POST",
      body: JSON.stringify({ period: genPeriod, dateFrom: genDateFrom, dateTo: genDateTo }),
    }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-payouts"] });
      toast({ title: `${data.created} paiement(s) généré(s)`, description: `Période: ${genPeriod}` });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, isPaid }: { id: number; isPaid: boolean }) =>
      apiRequest(`/api/restaurant-payouts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPaid, paidAt: isPaid ? new Date().toISOString() : null }),
      }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/restaurant-payouts"] }); },
    onError: () => toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" }),
  });

  const deletePayout = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/restaurant-payouts/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/restaurant-payouts"] }); },
    onError: () => toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" }),
  });

  const queryParams = new URLSearchParams();
  if (filter !== "all") queryParams.set("type", filter);
  if (dateFrom) queryParams.set("dateFrom", dateFrom);
  if (dateTo) queryParams.set("dateTo", dateTo);

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: () => authFetchJson("/api/orders"),
  });

  const { data: restaurants = [] } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"] });
  const restaurantMap = new Map(restaurants.map((r: Restaurant) => [r.id, r.name]));
  const restaurantCommissionMap = new Map(restaurants.map((r: Restaurant) => [r.id, (r as any).restaurantCommissionRate ?? 20]));

  // ── Analyse KPI queries ───────────────────────────────────────────────────
  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    queryFn: () => authFetchJson("/api/users"),
    enabled: activeTab === "analyse",
  });

  const evalKPIs = useMemo(() =>
    computeAnalyseKPIs(allOrders, allOrders, allUsers, restaurants, restaurantCommissionMap, evalFrom, evalTo),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allOrders, allUsers, restaurants, evalFrom, evalTo]
  );
  const cmpKPIs = useMemo(() =>
    computeAnalyseKPIs(allOrders, allOrders, allUsers, restaurants, restaurantCommissionMap, cmpFrom, cmpTo),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allOrders, allUsers, restaurants, cmpFrom, cmpTo]
  );

  // ── Comptabilité (Général tab) computed values ────────────────────────────
  const comptaOrders = useMemo(() => allOrders.filter(o => {
    if (o.status !== "delivered") return false;
    if (dateFrom && o.createdAt && new Date(o.createdAt) < new Date(dateFrom)) return false;
    if (dateTo   && o.createdAt && new Date(o.createdAt) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  }), [allOrders, dateFrom, dateTo]);

  const comptaTotaux = useMemo(() => {
    let revenuTotal = 0, revEtab = 0, revLivreur = 0, commEtab = 0, commLivraison = 0, revServiceFee = 0, totalPromoDiscount = 0;
    for (const o of comptaOrders) {
      const sub      = o.subtotal ?? 0;
      const delivery = o.deliveryFee ?? 0;
      const service  = (o as any).taxAmount ?? 0;
      const promo    = (o as any).promoDiscount ?? 0;
      const loyalty  = (o as any).loyaltyCreditDiscount ?? 0;
      const rate     = restaurantCommissionMap.get(o.restaurantId) ?? 20;
      const cEtab    = o.commission > 0 ? o.commission : Math.round(sub * rate / 100 * 100) / 100;
      revenuTotal += sub + delivery + service;
      revEtab     += Math.round((sub - cEtab) * 100) / 100;
      revLivreur  += Math.round(delivery * 0.8 * 100) / 100;
      commEtab    += cEtab;
      commLivraison  += Math.round(delivery * 0.2 * 100) / 100;
      revServiceFee  += service;
      totalPromoDiscount += promo + loyalty;
    }
    return {
      revenuTotal,
      revEtab,
      revLivreur,
      commEtab,
      commLivraison,
      revServiceFee,
      totalPromoDiscount,
      reversementPartenaires: Math.round((revEtab + revLivreur) * 100) / 100,
      chiffreAffaires: Math.round((commLivraison + revServiceFee) * 100) / 100,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comptaOrders, restaurants]);

  const { data: entries = [] } = useQuery<Finance[]>({
    queryKey: ["/api/finance", filter, dateFrom, dateTo],
    queryFn: () => authFetchJson(`/api/finance?${queryParams}`),
  });

  const summaryParams = new URLSearchParams();
  if (dateFrom) summaryParams.set("dateFrom", dateFrom);
  if (dateTo) summaryParams.set("dateTo", dateTo);

  const { data: summary } = useQuery<any>({
    queryKey: ["/api/finance/summary", dateFrom, dateTo],
    queryFn: () => authFetchJson(`/api/finance/summary?${summaryParams}`),
  });

  const totalRevenue = Number(summary?.summary?.totalRevenue) || 0;
  const totalExpense = Number(summary?.summary?.totalExpense) || 0;
  const netProfit = totalRevenue - totalExpense;
  const totalCommission = Number(summary?.summary?.totalCommission) || 0;


  const handleAdd = async () => {
    if (!newEntry.amount || !newEntry.description) { toast({ title: "Remplissez tous les champs", variant: "destructive" }); return; }
    try {
      await apiRequest("/api/finance", { method: "POST", body: JSON.stringify(newEntry) });
      queryClient.invalidateQueries({ queryKey: ["/api/finance"] });
      setShowAddForm(false);
      setNewEntry({ type: "revenue", category: "other", amount: 0, description: "" });
      toast({ title: "Entrée financière ajoutée" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const downloadWithAuth = async (url: string, filename: string) => {
    try {
      const res = await authFetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Erreur export" }));
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast({ title: "Erreur", description: "Impossible de telecharger le fichier", variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const exportParams = new URLSearchParams();
    if (filter !== "all") exportParams.set("type", filter);
    if (dateFrom) exportParams.set("dateFrom", dateFrom);
    if (dateTo) exportParams.set("dateTo", dateTo);
    downloadWithAuth(`/api/finance/export?${exportParams}`, `finances_maweja_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportOrders = () => {
    const exportParams = new URLSearchParams();
    if (dateFrom) exportParams.set("dateFrom", dateFrom);
    if (dateTo) exportParams.set("dateTo", dateTo);
    downloadWithAuth(`/api/orders/export?${exportParams}`, `commandes_maweja_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const categoryLabels: Record<string, string> = {
    order: "Commande", delivery_fee: "Frais livraison", commission: "Commission",
    driver_payment: "Paiement agent", refund: "Remboursement",
    wallet_topup: "Recharge wallet", salary: "Salaire", marketing: "Marketing",
    equipment: "Equipement", other: "Autre",
  };

  const filteredOrders = allOrders.filter(o => {
    if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
    if (orderSearch && !o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) &&
        !(o.orderName || "").toLowerCase().includes(orderSearch.toLowerCase())) return false;
    return true;
  });

  const getOrderFinancials = (order: Order) => {
    const subtotal = order.subtotal ?? 0;
    const deliveryFee = order.deliveryFee ?? 0;
    const serviceFee = (order as any).taxAmount ?? 0;
    const commissionRate = restaurantCommissionMap.get(order.restaurantId) ?? 20;
    const partnerFee = order.commission > 0 ? order.commission : Math.round(subtotal * commissionRate / 100 * 100) / 100;
    const driverExpense = Math.round(deliveryFee * 0.8 * 100) / 100;
    const mawejaDeliveryMargin = Math.round(deliveryFee * 0.2 * 100) / 100;
    const mawejaGain = mawejaDeliveryMargin + serviceFee + partnerFee;
    return { subtotal, deliveryFee, serviceFee, partnerFee, driverExpense, mawejaDeliveryMargin, mawejaGain, commissionRate };
  };

  const totalFinanceRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalMawejaGain = filteredOrders.reduce((s, o) => s + getOrderFinancials(o).mawejaGain, 0);
  const totalDriverExpenses = filteredOrders.reduce((s, o) => s + getOrderFinancials(o).driverExpense, 0);
  const totalDeliveryFees = filteredOrders.reduce((s, o) => s + o.deliveryFee, 0);

  const PAYMENT_ICONS: Record<string, any> = { cash: Banknote, card: CreditCard, mobile_money: Phone };

  return (
    <AdminLayout title="Finance & Comptabilite">
      {selectedFinanceOrder && (
        <AdminOrderDetailPopup
          order={selectedFinanceOrder}
          onClose={() => setSelectedFinanceOrder(null)}
          restaurantName={restaurantMap.get(selectedFinanceOrder.restaurantId)}
        />
      )}

      {/* ── Main tab selector ── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setActiveTab("general")} data-testid="tab-finance-general"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "general" ? "bg-red-600 text-white shadow-lg" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>
          <DollarSign size={15} /> Comptabilité générale
        </button>
        <button onClick={() => setActiveTab("restaurants")} data-testid="tab-finance-restaurants"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "restaurants" ? "bg-red-600 text-white shadow-lg" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>
          <Store size={15} /> Paiements Restaurants
          {payouts.filter(p => !p.isPaid).length > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{payouts.filter(p => !p.isPaid).length}</span>
          )}
        </button>
        <button onClick={() => setActiveTab("comptabilite")} data-testid="tab-finance-comptabilite"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "comptabilite" ? "bg-red-600 text-white shadow-lg" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>
          <BarChart3 size={15} /> Comptabilité
        </button>
        <button onClick={() => setActiveTab("orders")} data-testid="tab-finance-orders"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "orders" ? "bg-red-600 text-white shadow-lg" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>
          <ShoppingBag size={15} /> Suivi Commandes
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === "orders" ? "bg-white/25 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
            {allOrders.filter(o => o.status === "delivered").length}
          </span>
        </button>
        <button onClick={() => setActiveTab("analyse")} data-testid="tab-finance-analyse"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "analyse" ? "bg-red-600 text-white shadow-lg" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>
          <BarChart2 size={15} /> Analyse KPI
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: RESTAURANTS PAYOUTS
      ══════════════════════════════════════════════════════ */}
      {activeTab === "restaurants" && (
        <div className="space-y-6">
          {/* Generate payouts */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <RefreshCw size={16} className="text-red-600" /> Générer les paiements restaurants
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Période (libellé)</label>
                <input type="text" value={genPeriod} onChange={e => setGenPeriod(e.target.value)}
                  data-testid="input-payout-period"
                  placeholder="ex: 2026-03"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Du</label>
                <input type="date" value={genDateFrom} onChange={e => setGenDateFrom(e.target.value)}
                  data-testid="input-payout-date-from"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Au</label>
                <input type="date" value={genDateTo} onChange={e => setGenDateTo(e.target.value)}
                  data-testid="input-payout-date-to"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
              data-testid="button-generate-payouts"
              className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2">
              {generateMutation.isPending ? <><RefreshCw size={14} className="animate-spin" /> Génération...</> : <><RefreshCw size={14} /> Générer les paiements</>}
            </button>
            <p className="text-[11px] text-gray-400 mt-2">Calcule automatiquement les commissions MAWEJA et les montants nets à verser pour chaque restaurant actif sur la période.</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
              <p className="text-2xl font-black text-gray-900 dark:text-white">{payouts.length}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Total paiements</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950 rounded-2xl border border-orange-100 dark:border-orange-800 shadow-sm p-4">
              <p className="text-2xl font-black text-orange-600">{payouts.filter(p => !p.isPaid).length}</p>
              <p className="text-xs text-orange-600 mt-1 font-medium">En attente</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-100 dark:border-green-800 shadow-sm p-4">
              <p className="text-2xl font-black text-green-600">{payouts.filter(p => p.isPaid).length}</p>
              <p className="text-xs text-green-600 mt-1 font-medium">Payés</p>
            </div>
          </div>

          {/* Payouts list */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">Liste des paiements ({payouts.length})</h3>
            </div>
            {payoutsLoading ? (
              <div className="p-12 text-center text-gray-400 text-sm">Chargement...</div>
            ) : payouts.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Store size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun paiement généré</p>
                <p className="text-xs mt-1">Utilisez le formulaire ci-dessus pour générer les paiements d'une période.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {payouts.map(p => (
                  <div key={p.id} className={`px-5 py-4 flex items-center gap-4 ${p.isPaid ? "opacity-70" : ""}`} data-testid={`payout-row-${p.id}`}>
                    <button
                      onClick={() => markPaidMutation.mutate({ id: p.id, isPaid: !p.isPaid })}
                      disabled={markPaidMutation.isPending}
                      data-testid={`toggle-payout-${p.id}`}
                      className="flex-shrink-0"
                      title={p.isPaid ? "Marquer comme non payé" : "Marquer comme payé"}
                    >
                      {p.isPaid
                        ? <CheckCircle2 size={22} className="text-green-500" />
                        : <Clock size={22} className="text-orange-400" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{p.restaurantName}</p>
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full font-mono">{p.period}</span>
                        {p.isPaid && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">PAYÉ</span>}
                        {!p.isPaid && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">EN ATTENTE</span>}
                      </div>
                      <p className="text-xs text-gray-400">{p.orderCount} commandes · Commission MAWEJA: {formatPrice(p.mawejaCommission)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-green-600 text-sm">{formatPrice(p.netAmount)}</p>
                      <p className="text-[10px] text-gray-400">sur {formatPrice(p.grossAmount)}</p>
                    </div>
                    <button
                      onClick={() => { if (confirm(`Supprimer le paiement de ${p.restaurantName} ?`)) deletePayout.mutate(p.id); }}
                      data-testid={`delete-payout-${p.id}`}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: FINANCE GÉNÉRALE (KPIs + charts + entries)
      ══════════════════════════════════════════════════════ */}
      {activeTab === "general" && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center"><TrendingUp size={20} className="text-green-600" /></div>
            <span className="text-xs font-semibold text-green-600 flex items-center gap-0.5"><ArrowUpRight size={12} /></span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{formatPrice(totalRevenue)}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Revenus totaux</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center"><TrendingDown size={20} className="text-red-600" /></div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{formatPrice(totalExpense)}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Dépenses totales</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center"><DollarSign size={20} className="text-blue-600" /></div>
          </div>
          <p className={`text-2xl font-black ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatPrice(netProfit)}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Bénéfice net</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center"><PieChart size={20} className="text-purple-600" /></div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{formatPrice(totalCommission)}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Commissions</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-2">
          {["all", "revenue", "expense"].map(t => (
            <button key={t} onClick={() => setFilter(t)} data-testid={`filter-finance-${t}`}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === t ? "bg-red-600 text-white shadow-lg" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>
              {t === "all" ? "Tout" : t === "revenue" ? "Revenus" : "Dépenses"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} data-testid="input-date-from" className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs dark:text-white" />
          <span className="text-gray-400 text-xs">à</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} data-testid="input-date-to" className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs dark:text-white" />
        </div>
        <button onClick={() => setShowAddForm(v => !v)} data-testid="button-add-finance" className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-red-700 shadow-lg shadow-red-200">
          <Plus size={14} /> Ajouter
        </button>
        <button onClick={exportCSV} data-testid="button-export-finance" className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-green-700">
          <Download size={14} /> Export Excel
        </button>
        <button onClick={exportOrders} data-testid="button-export-orders" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-blue-700">
          <FileSpreadsheet size={14} /> Export Commandes
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold dark:text-white">Nouvelle entrée financière</h3>
            <button onClick={() => setShowAddForm(false)}><X size={20} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Type</label>
              <select value={newEntry.type} onChange={e => setNewEntry({ ...newEntry, type: e.target.value })} data-testid="select-finance-type" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                <option value="revenue">Revenu</option>
                <option value="expense">Dépense</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Catégorie</label>
              <select value={newEntry.category} onChange={e => setNewEntry({ ...newEntry, category: e.target.value })} data-testid="select-finance-category" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                <option value="order">Commande</option>
                <option value="commission">Commission</option>
                <option value="delivery_fee">Frais livraison</option>
                <option value="driver_payment">Paiement agent</option>
                <option value="salary">Salaire</option>
                <option value="marketing">Marketing</option>
                <option value="equipment">Equipement</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Montant ($)</label>
              <input type="number" value={newEntry.amount} onChange={e => setNewEntry({ ...newEntry, amount: Number(e.target.value) })} data-testid="input-finance-amount" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Description</label>
              <input type="text" value={newEntry.description} onChange={e => setNewEntry({ ...newEntry, description: e.target.value })} data-testid="input-finance-desc" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
            </div>
          </div>
          <button onClick={handleAdd} data-testid="button-save-finance" className="mt-4 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700">Enregistrer</button>
        </div>
      )}

      {summary?.byCategory && summary.byCategory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-red-600" /> Répartition par catégorie</h3>
            <div className="space-y-3">
              {summary.byCategory.map((cat: any, i: number) => {
                const maxAmount = Math.max(...summary.byCategory.map((c: any) => Number(c.total)));
                const pctBar = maxAmount ? (Number(cat.total) / maxAmount) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{categoryLabels[cat.category] || cat.category}</span>
                      <span className={`font-bold ${cat.type === "revenue" ? "text-green-600" : "text-red-600"}`}>{formatPrice(Number(cat.total))}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${cat.type === "revenue" ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${pctBar}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {summary.daily && summary.daily.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-green-600" /> Évolution journalière</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {summary.daily.slice(-14).map((day: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                    <span className="text-xs text-gray-500 font-medium">{day.date}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-green-600">+{formatPrice(Number(day.revenue))}</span>
                      <span className="text-xs font-bold text-red-600">-{formatPrice(Number(day.expense))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">Historique ({entries.length} entrées)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Catégorie</th>
                <th className="px-5 py-3 text-left">Description</th>
                <th className="px-5 py-3 text-right">Montant</th>
                <th className="px-5 py-3 text-left">Référence</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {entries.slice(0, 50).map(e => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`finance-row-${e.id}`}>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${e.type === "revenue" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {e.type === "revenue" ? "Revenu" : "Dépense"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm dark:text-gray-300">{categoryLabels[e.category] || e.category}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{e.description}</td>
                  <td className={`px-5 py-3 text-sm text-right font-bold ${e.type === "revenue" ? "text-green-600" : "text-red-600"}`}>
                    {e.type === "revenue" ? "+" : "-"}{formatPrice(e.amount)}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">{e.reference || "-"}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(e.createdAt!)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune entrée financière</p>
              <p className="text-xs mt-1">Les transactions apparaîtront ici automatiquement</p>
            </div>
          )}
        </div>
      </div>
      </>}

      {/* ══════════════════════════════════════════════════════
          TAB: COMPTABILITÉ — accounting view per order
      ══════════════════════════════════════════════════════ */}
      {activeTab === "comptabilite" && (
      <div className="space-y-5">

        {/* ── Toolbar: date filter + export ─────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
            <Calendar size={13} className="text-gray-400" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} data-testid="input-date-from"
              className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none" />
            <span className="text-gray-400">→</span>
            <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   data-testid="input-date-to"
              className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-gray-400 hover:text-red-500 ml-1"><X size={12} /></button>
            )}
          </div>
          <span className="text-xs text-gray-500">{comptaOrders.length} commande{comptaOrders.length !== 1 ? "s" : ""} livrée{comptaOrders.length !== 1 ? "s" : ""}</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportCSV} data-testid="button-export-finance" className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-green-700">
              <Download size={13} /> Export Excel
            </button>
            <button onClick={exportOrders} data-testid="button-export-orders" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-blue-700">
              <FileSpreadsheet size={13} /> Export Commandes
            </button>
          </div>
        </div>

        {/* ── ROW 1: 3 main summary boxes ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Revenus totaux */}
          <div className="rounded-2xl border-2 border-green-700 bg-green-600 text-white p-5 shadow-lg">
            <h3 className="font-black text-base mb-1">Revenus totaux</h3>
            <p className="text-[10px] font-semibold opacity-80 mb-0.5">= TOTAL NET</p>
            <p className="text-[10px] opacity-70">+ Sous-total</p>
            <p className="text-[10px] opacity-70">+ Frais de livraison 100% DU</p>
            <p className="text-[10px] opacity-70">+ Frais de service 100%</p>
            <p className="text-2xl font-black mt-3">{formatPrice(comptaTotaux.revenuTotal)}</p>
          </div>

          {/* Reversement Partenaires */}
          <div className="rounded-2xl border-2 border-red-800 bg-red-600 text-white p-5 shadow-lg">
            <h3 className="font-black text-base mb-1">Reversement Partenaires</h3>
            <p className="text-[10px] font-semibold opacity-80 mb-0.5">Établissements &amp; Livreurs</p>
            <p className="text-[10px] opacity-70">= Revenus des Établissements + Revenus livreurs</p>
            <p className="text-2xl font-black mt-3">
              <span className="text-sm font-semibold opacity-80">{formatPrice(comptaTotaux.revEtab)} + {formatPrice(comptaTotaux.revLivreur)} = </span>
              {formatPrice(comptaTotaux.reversementPartenaires)}
            </p>
          </div>

          {/* Chiffre d'affaires */}
          <div className="rounded-2xl border-2 border-green-700 bg-green-600 text-white p-5 shadow-lg">
            <h3 className="font-black text-base mb-1">Chiffre d'affaires</h3>
            <p className="text-[10px] font-semibold opacity-80 mb-0.5">Commission Maweja + Frais de service</p>
            <p className="text-[10px] opacity-70">= Commissions Maweja + Frais de service</p>
            <p className="text-2xl font-black mt-3">
              <span className="text-sm font-semibold opacity-80">{formatPrice(comptaTotaux.commLivraison)} + {formatPrice(comptaTotaux.revServiceFee)} = </span>
              {formatPrice(comptaTotaux.chiffreAffaires)}
            </p>
          </div>
        </div>

        {/* ── ROW 2: 5 detail boxes ────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Revenus Établissements – dark red */}
          <div className="rounded-xl bg-red-700 text-white p-4 shadow-md">
            <h4 className="font-black text-xs mb-1 leading-tight">Revenus des Établissements</h4>
            <p className="text-[9px] opacity-70 mb-0.5">= Revenu des restaurants et des boutiques</p>
            <p className="text-[9px] opacity-70 mb-0.5 italic">ou autre formule</p>
            <p className="text-[9px] opacity-70">= Sous-total − % Commissions sur Établissements</p>
            <p className="text-lg font-black mt-2">{formatPrice(comptaTotaux.revEtab)}</p>
          </div>

          {/* Revenus Livreurs – light pink */}
          <div className="rounded-xl bg-red-200 text-red-900 p-4 shadow-md">
            <h4 className="font-black text-xs mb-1 leading-tight">Revenus des Livreurs</h4>
            <p className="text-[9px] opacity-70 mb-0.5">= Frais de livraison 100%</p>
            <p className="text-[9px] opacity-70">× 80% part livreur</p>
            <p className="text-lg font-black mt-2">{formatPrice(comptaTotaux.revLivreur)}</p>
          </div>

          {/* Commissions Établissements – light green */}
          <div className="rounded-xl bg-green-100 text-green-900 p-4 shadow-md border border-green-200">
            <h4 className="font-black text-xs mb-1 leading-tight">Commissions Établissements</h4>
            <p className="text-[9px] opacity-70 mb-0.5">(Restaurants &amp; Boutiques)</p>
            <p className="text-[9px] opacity-70">= Sommes des Commissions sur des Établissements</p>
            <p className="text-lg font-black mt-2">{formatPrice(comptaTotaux.commEtab)}</p>
          </div>

          {/* Commissions Frais livraison – light green */}
          <div className="rounded-xl bg-green-100 text-green-900 p-4 shadow-md border border-green-200">
            <h4 className="font-black text-xs mb-1 leading-tight">Commissions Frais de livraison</h4>
            <p className="text-[9px] opacity-70">= Sommes des Commissions sur frais de livraison</p>
            <p className="text-lg font-black mt-2">{formatPrice(comptaTotaux.commLivraison)}</p>
          </div>

          {/* Revenus Frais de service – light green */}
          <div className="rounded-xl bg-green-100 text-green-900 p-4 shadow-md border border-green-200">
            <h4 className="font-black text-xs mb-1 leading-tight">Revenus Frais de service</h4>
            <p className="text-[9px] opacity-70">= Sommes des frais de service</p>
            <p className="text-lg font-black mt-2">{formatPrice(comptaTotaux.revServiceFee)}</p>
          </div>
        </div>

        {/* ── Historical accounting table ──────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <BarChart3 size={15} className="text-red-600" />
              Historiques ({comptaOrders.length} entrée{comptaOrders.length !== 1 ? "s" : ""})
            </h3>
          </div>

          {ordersLoading ? (
            <div className="p-10 text-center text-sm text-gray-400">Chargement...</div>
          ) : comptaOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <DollarSign size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune commande livrée sur la période</p>
              <p className="text-xs mt-1">Ajustez le filtre de dates ci-dessus</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left w-32">N commande</th>
                    <th className="px-4 py-3 text-left w-28">TYPE</th>
                    <th className="px-4 py-3 text-left">DESCRIPTION</th>
                    <th className="px-4 py-3 text-right w-28">MONTANT</th>
                    <th className="px-4 py-3 text-left w-32">RÉFÉRENCE</th>
                    <th className="px-4 py-3 text-left w-28">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {comptaOrders.slice(0, 80).map(order => {
                    const sub      = order.subtotal ?? 0;
                    const delivery = order.deliveryFee ?? 0;
                    const service  = (order as any).taxAmount ?? 0;
                    const promo    = (order as any).promoDiscount ?? 0;
                    const loyalty  = (order as any).loyaltyCreditDiscount ?? 0;
                    const rate     = restaurantCommissionMap.get(order.restaurantId) ?? 20;
                    const cEtab    = order.commission > 0 ? order.commission : Math.round(sub * rate / 100 * 100) / 100;
                    const revEtabOrder  = Math.round((sub - cEtab) * 100) / 100;
                    const revLivreurOrder = Math.round(delivery * 0.8 * 100) / 100;
                    const cLivraison    = Math.round(delivery * 0.2 * 100) / 100;
                    const partnerName   = restaurantMap.get(order.restaurantId) ?? "Partenaire";
                    const dateStr       = formatDate(order.createdAt!);

                    type Row = { type: "Revenu" | "Reversement" | "Dépense"; highlight?: boolean; desc: string; amount: number; sign: "+" | "-" };
                    const rows: Row[] = [
                      { type: "Revenu",      desc: "+ Sous-total",                                                  amount: sub,          sign: "+" },
                      { type: "Revenu",      desc: `+ Frais de livraison (100%)`,                                  amount: delivery,     sign: "+" },
                      ...(service > 0 ? [{ type: "Revenu" as const,      desc: `+ Frais de service (100%)`,                               amount: service,      sign: "+" as const }] : []),
                      { type: "Reversement", desc: `- Frais de livraison : ce qu'on doit au livreur (80% de ${formatPrice(delivery)})`, amount: revLivreurOrder, sign: "-" },
                      { type: "Reversement", desc: `- Revenu établissement : ${partnerName} (${100 - rate}% de ${formatPrice(sub)})`,     amount: revEtabOrder,   sign: "-" },
                      { type: "Revenu",      highlight: true, desc: `Commission sur l'établissement : le ${rate}% de sous-total ${formatPrice(sub)}`, amount: cEtab,     sign: "+" },
                      { type: "Revenu",      highlight: true, desc: `Commission sur le frais de livraison : le 20% de frais de livraison ${formatPrice(delivery)}`, amount: cLivraison, sign: "+" },
                      ...(promo > 0   ? [{ type: "Dépense" as const, highlight: true, desc: `- Remise code promo : Réduction sur le Sous-total`, amount: promo,   sign: "-" as const }] : []),
                      ...(loyalty > 0 ? [{ type: "Dépense" as const, highlight: true, desc: `- Remise fidélité / crédit wallet`,                  amount: loyalty, sign: "-" as const }] : []),
                    ];

                    return rows.map((row, ri) => (
                      <tr key={`${order.id}-${ri}`}
                        className={`border-b border-gray-50 dark:border-gray-800 ${row.highlight ? "bg-yellow-50 dark:bg-yellow-900/10" : "hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"}`}
                        data-testid={ri === 0 ? `compta-order-${order.id}` : undefined}>
                        <td className="px-4 py-2 font-mono text-xs text-gray-700 dark:text-gray-300 font-bold">
                          {ri === 0 ? order.orderNumber : ""}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`text-[10px] font-bold italic ${
                            row.type === "Revenu"
                              ? row.highlight ? "text-amber-600" : "text-blue-600"
                              : row.type === "Reversement" ? "text-red-500"
                              : "text-amber-700"
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">{row.desc}</td>
                        <td className={`px-4 py-2 text-xs font-bold text-right tabular-nums ${
                          row.sign === "+" ? "text-gray-900 dark:text-white" : "text-red-600"
                        }`}>
                          $ {row.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-[10px] text-gray-400 font-mono">
                          {ri === 0 ? order.orderNumber : ""}
                        </td>
                        <td className="px-4 py-2 text-[10px] text-gray-500">
                          {ri === 0 ? dateStr : ""}
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
              {comptaOrders.length > 80 && (
                <p className="text-center text-xs text-gray-400 py-4">Affichage des 80 premières commandes. Utilisez le filtre de dates pour affiner.</p>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: SUIVI COMMANDES (financial order tracking)
      ══════════════════════════════════════════════════════ */}
      {activeTab === "orders" && <>

        {/* KPI summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-xl font-black text-gray-900 dark:text-white">{filteredOrders.length}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">Total commandes</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 p-4">
            <p className="text-xl font-black text-blue-700 dark:text-blue-400">{formatPrice(totalFinanceRevenue)}</p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">Chiffre d'affaires</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-2xl border border-green-100 dark:border-green-900/40 p-4">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp size={13} className="text-green-600" />
              <p className="text-[11px] text-green-600 dark:text-green-400 font-bold">Gain MAWEJA</p>
            </div>
            <p className="text-xl font-black text-green-700 dark:text-green-400">{formatPrice(totalMawejaGain)}</p>
            <p className="text-[10px] text-green-500 mt-0.5">livraison 20% + service + commission</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-100 dark:border-red-900/40 p-4">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingDown size={13} className="text-red-600" />
              <p className="text-[11px] text-red-600 dark:text-red-400 font-bold">Dépenses totales</p>
            </div>
            <p className="text-xl font-black text-red-700 dark:text-red-400">{formatPrice(totalDriverExpenses)}</p>
            <p className="text-[10px] text-red-500 mt-0.5">livreurs 80% × livraison</p>
          </div>
        </div>

        {/* Maweja net banner */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-white/80 text-[11px] font-semibold">Bénéfice net MAWEJA</p>
            <p className="text-white font-black text-2xl">{formatPrice(totalMawejaGain - totalDriverExpenses)}</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-[10px]">sur {filteredOrders.length} commande{filteredOrders.length !== 1 ? "s" : ""}</p>
            <p className="text-white/80 text-xs font-semibold mt-0.5">CA: {formatPrice(totalFinanceRevenue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Rechercher commande ou client…"
            value={orderSearch}
            onChange={e => setOrderSearch(e.target.value)}
            data-testid="input-order-search-finance"
            className="flex-1 min-w-48 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <select
            value={orderStatusFilter}
            onChange={e => setOrderStatusFilter(e.target.value)}
            data-testid="select-order-status-finance"
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="delivered">Livrées</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmées</option>
            <option value="picked_up">En cours de livraison</option>
            <option value="cancelled">Annulées</option>
            <option value="returned">Retournées</option>
          </select>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{filteredOrders.length} résultat{filteredOrders.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Orders list */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {ordersLoading ? (
            <div className="space-y-0 divide-y divide-gray-50 dark:divide-gray-800">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="px-5 py-4 flex items-center justify-between animate-pulse">
                  <div className="space-y-2">
                    <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-28" />
                    <div className="h-2.5 bg-gray-50 dark:bg-gray-700 rounded w-20" />
                  </div>
                  <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-16" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-14 text-center">
              <ShoppingBag size={40} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
              <p className="text-sm text-gray-400">Aucune commande trouvée</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[700px] overflow-y-auto">
              {filteredOrders.slice(0, 100).map(order => {
                const fin = getOrderFinancials(order);
                const PayIcon = PAYMENT_ICONS[order.paymentMethod] || Wallet;
                const restaurantName = restaurantMap.get(order.restaurantId) ?? "Partenaire";
                return (
                  <div
                    key={order.id}
                    className="px-5 py-4 hover:bg-gray-50/70 dark:hover:bg-white/[0.02] cursor-pointer transition-colors group"
                    onClick={() => setSelectedFinanceOrder(order)}
                    data-testid={`finance-order-row-${order.id}`}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex items-center justify-center flex-shrink-0">
                          <ShoppingBag size={13} className="text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-[13px] text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">{order.orderNumber}</p>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <p className="text-[10px] text-gray-400">{formatDate(order.createdAt!)}</p>
                            <p className="text-[10px] text-gray-400">• {restaurantName}</p>
                            {order.orderName && <p className="text-[10px] text-gray-400">• {order.orderName}</p>}
                            <div className="flex items-center gap-1">
                              <PayIcon size={10} className="text-blue-400" />
                              <p className="text-[10px] text-blue-500 font-medium">{formatPaymentMethod(order.paymentMethod)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-[9px] text-gray-400 font-medium">TOTAL CLIENT</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white">{formatPrice(order.total)}</p>
                      </div>
                    </div>

                    {/* Financial breakdown grid */}
                    <div className="grid grid-cols-5 gap-1.5 ml-10">
                      {/* Articles */}
                      <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl px-3 py-2 border border-gray-100 dark:border-gray-700/50">
                        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Articles</p>
                        <p className="text-xs font-black text-gray-800 dark:text-white mt-0.5">{formatPrice(fin.subtotal)}</p>
                      </div>
                      {/* Frais livraison */}
                      <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl px-3 py-2 border border-orange-100 dark:border-orange-900/30">
                        <p className="text-[9px] text-orange-500 font-semibold uppercase tracking-wide">Livraison</p>
                        <p className="text-xs font-black text-orange-700 dark:text-orange-400 mt-0.5">{formatPrice(fin.deliveryFee)}</p>
                      </div>
                      {/* Frais de service */}
                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl px-3 py-2 border border-blue-100 dark:border-blue-900/30">
                        <p className="text-[9px] text-blue-500 font-semibold uppercase tracking-wide">Service</p>
                        <p className="text-xs font-black text-blue-700 dark:text-blue-400 mt-0.5">{formatPrice(fin.serviceFee)}</p>
                      </div>
                      {/* Dépense Livreur */}
                      <div className="bg-red-50 dark:bg-red-950/20 rounded-xl px-3 py-2 border border-red-100 dark:border-red-900/30">
                        <p className="text-[9px] text-red-500 font-semibold uppercase tracking-wide">Livreur 80%</p>
                        <p className="text-xs font-black text-red-700 dark:text-red-400 mt-0.5">-{formatPrice(fin.driverExpense)}</p>
                      </div>
                      {/* Frais Partenaire */}
                      <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl px-3 py-2 border border-purple-100 dark:border-purple-900/30">
                        <p className="text-[9px] text-purple-500 font-semibold uppercase tracking-wide">Partenaire {fin.commissionRate}%</p>
                        <p className="text-xs font-black text-purple-700 dark:text-purple-400 mt-0.5">{formatPrice(fin.partnerFee)}</p>
                      </div>
                    </div>

                    {/* Maweja gain footer */}
                    <div className="ml-10 mt-1.5 flex items-center justify-between">
                      <p className="text-[9px] text-gray-400">Gain net Maweja = livraison 20% ({formatPrice(fin.mawejaDeliveryMargin)}) + service ({formatPrice(fin.serviceFee)}) + partenaire ({formatPrice(fin.partnerFee)})</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-green-600 font-semibold">Gain Maweja</span>
                        <span className="text-xs font-black text-green-700 dark:text-green-400">{formatPrice(fin.mawejaGain)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>}

      {/* ══════════════════════════════════════════════════════
          TAB: ANALYSE KPI COMPARATIVE
      ══════════════════════════════════════════════════════ */}
      {activeTab === "analyse" && (
        <div className="space-y-5">

          {/* ── 3-column header controls ────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Période d'évaluation */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-red-200 dark:border-red-800 shadow-sm overflow-hidden">
              <div className="bg-red-600 px-4 py-2 flex items-center gap-2">
                <Calendar size={14} className="text-white" />
                <span className="text-white font-bold text-sm">Période d'évaluation</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 mb-1 block">Du</label>
                    <input type="date" value={evalFrom} onChange={e => setEvalFrom(e.target.value)} data-testid="input-eval-from"
                      className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 mb-1 block">Au</label>
                    <input type="date" value={evalTo} onChange={e => setEvalTo(e.target.value)} data-testid="input-eval-to"
                      className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400">{evalKPIs.totalOrders} commandes sur la période</p>
              </div>
            </div>

            {/* Type filter */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
              <div className="bg-zinc-800 dark:bg-zinc-700 px-4 py-2 flex items-center gap-2">
                <Store size={14} className="text-white" />
                <span className="text-white font-bold text-sm">Type de partenaire</span>
              </div>
              <div className="p-4 space-y-2">
                {(["all", "restaurant", "boutique"] as const).map(t => (
                  <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      storeTypeFilter === t ? "border-red-600 bg-red-600" : "border-zinc-300 group-hover:border-red-400"
                    }`} onClick={() => setStoreTypeFilter(t)}>
                      {storeTypeFilter === t && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium capitalize">
                      {t === "all" ? "Tout" : t === "restaurant" ? "Restaurants" : "Boutiques"}
                    </span>
                  </label>
                ))}
                <p className="text-[10px] text-zinc-400 pt-1">{restaurants.length} partenaires actifs</p>
              </div>
            </div>

            {/* Période comparative */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-300 dark:border-zinc-600 shadow-sm overflow-hidden">
              <div className="bg-zinc-600 px-4 py-2 flex items-center gap-2">
                <Calendar size={14} className="text-white" />
                <span className="text-white font-bold text-sm">Période comparative</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 mb-1 block">Du</label>
                    <input type="date" value={cmpFrom} onChange={e => setCmpFrom(e.target.value)} data-testid="input-cmp-from"
                      className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400/30" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 mb-1 block">Au</label>
                    <input type="date" value={cmpTo} onChange={e => setCmpTo(e.target.value)} data-testid="input-cmp-to"
                      className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400/30" />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400">{cmpKPIs.totalOrders} commandes sur la période</p>
              </div>
            </div>
          </div>

          {/* ── KPI Grid ─────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-red-600" />
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Indicateurs clés de performance</h3>
              <span className="text-[10px] text-zinc-400 ml-auto">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-1 align-middle" />hausse vs période comparative
                <span className="inline-block w-3 h-3 bg-red-500 rounded-sm mx-1 ml-3 align-middle" />baisse
              </span>
            </div>

            {/* Cluster 1: Orders */}
            <div className="mb-4">
              <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <ShoppingBag size={10} /> Commandes
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <KpiAnalCard label="Total Commandes"          evalVal={evalKPIs.totalOrders}         cmpVal={cmpKPIs.totalOrders}         mode="int" />
                <KpiAnalCard label="Commandes Livrées"        evalVal={evalKPIs.completedOrders}     cmpVal={cmpKPIs.completedOrders}     mode="int" />
                <KpiAnalCard label="Commandes Annulées"       evalVal={evalKPIs.cancelledCount}      cmpVal={cmpKPIs.cancelledCount}      mode="int" />
                <KpiAnalCard label="Livrées / Client actif"   evalVal={evalKPIs.completedPerCustomer}cmpVal={cmpKPIs.completedPerCustomer}mode="dec2" />
                <KpiAnalCard label="Annulées / Client actif"  evalVal={evalKPIs.cancelledPerCustomer}cmpVal={cmpKPIs.cancelledPerCustomer}mode="dec2" />
                <KpiAnalCard label="Ventes / Client actif"    evalVal={evalKPIs.salesPerCustomer}    cmpVal={cmpKPIs.salesPerCustomer}    mode="price" />
              </div>
            </div>

            {/* Cluster 2: Revenue */}
            <div className="mb-4">
              <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <DollarSign size={10} /> Revenus
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                <KpiAnalCard label="Ventes totales"           evalVal={evalKPIs.totalSales}          cmpVal={cmpKPIs.totalSales}          mode="price" />
                <KpiAnalCard label="Revenu MAWEJA"            evalVal={evalKPIs.mawejaRevenue}       cmpVal={cmpKPIs.mawejaRevenue}       mode="price" />
                <KpiAnalCard label="Ventes perdues"           evalVal={evalKPIs.lostSales}           cmpVal={cmpKPIs.lostSales}           mode="price" />
                <KpiAnalCard label="Revenu perdu MAWEJA"      evalVal={evalKPIs.mawejaLostRevenue}   cmpVal={cmpKPIs.mawejaLostRevenue}   mode="price" />
              </div>
            </div>

            {/* Cluster 3: Customers & Drivers */}
            <div className="mb-4">
              <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <TrendingUp size={10} /> Clients & Agents
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <KpiAnalCard label="Clients actifs"           evalVal={evalKPIs.activeCustomers}     cmpVal={cmpKPIs.activeCustomers}     mode="int" />
                <KpiAnalCard label="Agents actifs"            evalVal={evalKPIs.activeDriversCount}  cmpVal={cmpKPIs.activeDriversCount}  mode="int" />
                <KpiAnalCard label="Livraisons / Agent actif" evalVal={evalKPIs.deliveriesPerDriver} cmpVal={cmpKPIs.deliveriesPerDriver} mode="dec2" />
                <KpiAnalCard label="Gains / Agent actif"      evalVal={evalKPIs.earningsPerDriver}   cmpVal={cmpKPIs.earningsPerDriver}   mode="price" />
                <KpiAnalCard label="Nvx utilisateurs inscrits" evalVal={evalKPIs.newRegisteredUsers} cmpVal={cmpKPIs.newRegisteredUsers}  mode="int" />
                <KpiAnalCard label="Clients 1ère commande"    evalVal={evalKPIs.firstOrderInPeriod}  cmpVal={cmpKPIs.firstOrderInPeriod}  mode="int" />
              </div>
            </div>

            {/* Cluster 4: Partners */}
            <div>
              <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Store size={10} /> Partenaires
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                <KpiAnalCard label="Nvx partenaires créés"      evalVal={evalKPIs.newPartners}          cmpVal={cmpKPIs.newPartners}          mode="int" />
                <KpiAnalCard label="Partenaires avec commande"   evalVal={evalKPIs.partnersWithOrder}    cmpVal={cmpKPIs.partnersWithOrder}    mode="int" />
                <KpiAnalCard label="Total partenaires"           evalVal={restaurants.length}            cmpVal={null}                         mode="int" />
                <KpiAnalCard label="Partenaires actifs"          evalVal={restaurants.filter(r => r.isActive).length} cmpVal={null}          mode="int" />
              </div>
            </div>
          </div>

          {/* ── Note ─────────────────────────────────────────────────────── */}
          <p className="text-[10px] text-zinc-400 italic">
            Note : les métriques de temps (service, acceptation, ramassage, attente, livraison) et de notation (produits, agents) nécessitent des données supplémentaires non encore collectées.
          </p>
        </div>
      )}
    </AdminLayout>
  );
}
