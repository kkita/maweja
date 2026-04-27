import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient, authFetch, authFetchJson } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { DollarSign, Store, BarChart3, ShoppingBag, BarChart2 } from "lucide-react";
import type { Finance, RestaurantPayout, Order, Restaurant } from "@shared/schema";
import AdminOrderDetailPopup from "../../components/AdminOrderDetailPopup";
import { computeAnalyseKPIs } from "../../components/admin/finance/kpiHelpers";
import PayoutsTab from "../../components/admin/finance/PayoutsTab";
import GeneralTab from "../../components/admin/finance/GeneralTab";
import ComptabiliteTab from "../../components/admin/finance/ComptabiliteTab";
import OrdersTrackingTab from "../../components/admin/finance/OrdersTrackingTab";
import AnalyseTab from "../../components/admin/finance/AnalyseTab";

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

  const [evalFrom, setEvalFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; });
  const [evalTo,   setEvalTo]   = useState(() => new Date().toISOString().split("T")[0]);
  const [cmpFrom,  setCmpFrom]  = useState(() => { const d = new Date(); d.setDate(d.getDate() - 14); return d.toISOString().split("T")[0]; });
  const [cmpTo,    setCmpTo]    = useState(() => { const d = new Date(); d.setDate(d.getDate() - 8); return d.toISOString().split("T")[0]; });
  const [storeTypeFilter, setStoreTypeFilter] = useState<"all" | "restaurant" | "boutique">("all");

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

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    queryFn: () => authFetchJson("/api/users"),
    enabled: activeTab === "analyse",
  });

  const analyseRestaurants = useMemo(() => (
    storeTypeFilter === "all"
      ? restaurants
      : restaurants.filter(r => (r as Restaurant & { storeType?: string }).storeType === storeTypeFilter)
  ), [restaurants, storeTypeFilter]);

  const analyseOrders = useMemo(() => {
    if (storeTypeFilter === "all") return allOrders;
    const ids = new Set(analyseRestaurants.map(r => r.id));
    return allOrders.filter(o => ids.has(o.restaurantId));
  }, [allOrders, analyseRestaurants, storeTypeFilter]);

  const evalKPIs = useMemo(() =>
    computeAnalyseKPIs(analyseOrders, analyseOrders, allUsers, analyseRestaurants, restaurantCommissionMap, evalFrom, evalTo),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analyseOrders, allUsers, analyseRestaurants, evalFrom, evalTo]
  );
  const cmpKPIs = useMemo(() =>
    computeAnalyseKPIs(analyseOrders, analyseOrders, allUsers, analyseRestaurants, restaurantCommissionMap, cmpFrom, cmpTo),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analyseOrders, allUsers, analyseRestaurants, cmpFrom, cmpTo]
  );

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
      revenuTotal, revEtab, revLivreur, commEtab, commLivraison, revServiceFee, totalPromoDiscount,
      reversementPartenaires: Math.round((revEtab + revLivreur) * 100) / 100,
      chiffreAffaires:        Math.round((commLivraison + revServiceFee) * 100) / 100,
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

  return (
    <AdminLayout title="Finance & Comptabilite">
      {selectedFinanceOrder && (
        <AdminOrderDetailPopup
          order={selectedFinanceOrder}
          onClose={() => setSelectedFinanceOrder(null)}
          restaurantName={restaurantMap.get(selectedFinanceOrder.restaurantId)}
        />
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setActiveTab("general")} data-testid="tab-finance-general"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "general" ? "bg-red-600 text-white shadow-lg" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>
          <DollarSign size={15} /> Comptabilité générale
        </button>
        <button onClick={() => setActiveTab("restaurants")} data-testid="tab-finance-restaurants"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "restaurants" ? "bg-red-600 text-white shadow-lg" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>
          <Store size={15} /> Paiements Restaurants
          {payouts.filter(p => !p.isPaid).length > 0 && (
            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded-full">{payouts.filter(p => !p.isPaid).length}</span>
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

      {activeTab === "restaurants" && (
        <PayoutsTab
          payouts={payouts}
          payoutsLoading={payoutsLoading}
          genPeriod={genPeriod} setGenPeriod={setGenPeriod}
          genDateFrom={genDateFrom} setGenDateFrom={setGenDateFrom}
          genDateTo={genDateTo} setGenDateTo={setGenDateTo}
          generatePending={generateMutation.isPending}
          onGenerate={() => generateMutation.mutate()}
          markPaidPending={markPaidMutation.isPending}
          onTogglePaid={(id, isPaid) => markPaidMutation.mutate({ id, isPaid })}
          onDelete={(id) => deletePayout.mutate(id)}
        />
      )}

      {activeTab === "general" && (
        <GeneralTab
          totalRevenue={totalRevenue} totalExpense={totalExpense} netProfit={netProfit} totalCommission={totalCommission}
          filter={filter} setFilter={setFilter}
          dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}
          showAddForm={showAddForm} setShowAddForm={setShowAddForm}
          newEntry={newEntry} setNewEntry={setNewEntry} onAdd={handleAdd}
          onExportCSV={exportCSV} onExportOrders={exportOrders}
          summary={summary} entries={entries}
        />
      )}

      {activeTab === "comptabilite" && (
        <ComptabiliteTab
          dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}
          comptaOrders={comptaOrders} ordersLoading={ordersLoading} comptaTotaux={comptaTotaux}
          restaurantMap={restaurantMap} restaurantCommissionMap={restaurantCommissionMap}
          onExportCSV={exportCSV} onExportOrders={exportOrders}
        />
      )}

      {activeTab === "orders" && (
        <OrdersTrackingTab
          filteredOrders={filteredOrders} ordersLoading={ordersLoading}
          totalFinanceRevenue={totalFinanceRevenue} totalMawejaGain={totalMawejaGain} totalDriverExpenses={totalDriverExpenses}
          orderSearch={orderSearch} setOrderSearch={setOrderSearch}
          orderStatusFilter={orderStatusFilter} setOrderStatusFilter={setOrderStatusFilter}
          getOrderFinancials={getOrderFinancials} restaurantMap={restaurantMap}
          onSelectOrder={setSelectedFinanceOrder}
        />
      )}

      {activeTab === "analyse" && (
        <AnalyseTab
          evalFrom={evalFrom} setEvalFrom={setEvalFrom} evalTo={evalTo} setEvalTo={setEvalTo}
          cmpFrom={cmpFrom} setCmpFrom={setCmpFrom} cmpTo={cmpTo} setCmpTo={setCmpTo}
          storeTypeFilter={storeTypeFilter} setStoreTypeFilter={setStoreTypeFilter}
          evalKPIs={evalKPIs} cmpKPIs={cmpKPIs} restaurants={restaurants}
        />
      )}
    </AdminLayout>
  );
}
