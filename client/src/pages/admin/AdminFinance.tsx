import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient, authFetch , authFetchJson} from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { DollarSign, TrendingUp, TrendingDown, Download, Plus, X, ArrowUpRight, ArrowDownLeft, PieChart, BarChart3, FileSpreadsheet, Store, CheckCircle2, Clock, Trash2, RefreshCw } from "lucide-react";
import { formatPrice, formatDate } from "../../lib/utils";
import type { Finance, RestaurantPayout } from "@shared/schema";

export default function AdminFinance() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"general" | "restaurants">("general");
  const [filter, setFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: "revenue", category: "other", amount: 0, description: "" });

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
      toast({ title: "Entree financiere ajoutee" });
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
    downloadWithAuth(`/api/finance/export?${exportParams}`, `finances_maweja_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportOrders = () => {
    const exportParams = new URLSearchParams();
    if (dateFrom) exportParams.set("dateFrom", dateFrom);
    if (dateTo) exportParams.set("dateTo", dateTo);
    downloadWithAuth(`/api/orders/export?${exportParams}`, `commandes_maweja_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const categoryLabels: Record<string, string> = {
    order: "Commande", delivery_fee: "Frais livraison", commission: "Commission",
    driver_payment: "Paiement livreur", refund: "Remboursement",
    wallet_topup: "Recharge wallet", salary: "Salaire", marketing: "Marketing",
    equipment: "Equipement", other: "Autre",
  };

  return (
    <AdminLayout title="Finance & Comptabilite">

      {/* ── Main tab selector ── */}
      <div className="flex gap-2 mb-6">
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
          TAB: GENERAL ACCOUNTING (existing content)
      ══════════════════════════════════════════════════════ */}
      {activeTab === "general" && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center"><TrendingUp size={20} className="text-green-600" /></div>
            <span className="text-xs font-semibold text-green-600 flex items-center gap-0.5"><ArrowUpRight size={12} /></span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{formatPrice(totalRevenue)}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Revenus totaux</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center"><TrendingDown size={20} className="text-red-600" /></div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{formatPrice(totalExpense)}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Depenses totales</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center"><DollarSign size={20} className="text-blue-600" /></div>
          </div>
          <p className={`text-2xl font-black ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatPrice(netProfit)}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Benefice net</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
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
              {t === "all" ? "Tout" : t === "revenue" ? "Revenus" : "Depenses"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} data-testid="input-date-from" className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs" placeholder="Debut" />
          <span className="text-gray-400 text-xs">a</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} data-testid="input-date-to" className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs" placeholder="Fin" />
        </div>
        <button onClick={() => setShowAddForm(true)} data-testid="button-add-finance" className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-red-700 shadow-lg shadow-red-200">
          <Plus size={14} /> Ajouter
        </button>
        <button onClick={exportCSV} data-testid="button-export-finance" className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-green-700">
          <Download size={14} /> Export CSV
        </button>
        <button onClick={exportOrders} data-testid="button-export-orders" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-blue-700">
          <FileSpreadsheet size={14} /> Export Commandes
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Nouvelle entree financiere</h3>
            <button onClick={() => setShowAddForm(false)}><X size={20} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Type</label>
              <select value={newEntry.type} onChange={e => setNewEntry({ ...newEntry, type: e.target.value })} data-testid="select-finance-type" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                <option value="revenue">Revenu</option>
                <option value="expense">Depense</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Categorie</label>
              <select value={newEntry.category} onChange={e => setNewEntry({ ...newEntry, category: e.target.value })} data-testid="select-finance-category" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                <option value="order">Commande</option>
                <option value="commission">Commission</option>
                <option value="delivery_fee">Frais livraison</option>
                <option value="driver_payment">Paiement livreur</option>
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
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-red-600" /> Repartition par categorie</h3>
            <div className="space-y-3">
              {summary.byCategory.map((cat: any, i: number) => {
                const maxAmount = Math.max(...summary.byCategory.map((c: any) => Number(c.total)));
                const pct = maxAmount ? (Number(cat.total) / maxAmount) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{categoryLabels[cat.category] || cat.category}</span>
                      <span className={`font-bold ${cat.type === "revenue" ? "text-green-600" : "text-red-600"}`}>{formatPrice(Number(cat.total))}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${cat.type === "revenue" ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {summary.daily && summary.daily.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-green-600" /> Evolution journaliere</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {summary.daily.slice(-14).map((day: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
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
          <h3 className="font-bold text-gray-900 dark:text-white">Historique ({entries.length} entrees)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Categorie</th>
                <th className="px-5 py-3 text-left">Description</th>
                <th className="px-5 py-3 text-right">Montant</th>
                <th className="px-5 py-3 text-left">Reference</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 dark:divide-gray-800">
              {entries.slice(0, 50).map(e => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`finance-row-${e.id}`}>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${e.type === "revenue" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {e.type === "revenue" ? "Revenu" : "Depense"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm">{categoryLabels[e.category] || e.category}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{e.description}</td>
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
              <p className="text-sm">Aucune entree financiere</p>
              <p className="text-xs mt-1">Les transactions apparaitront ici automatiquement</p>
            </div>
          )}
        </div>
      </div>
      </>}
    </AdminLayout>
  );
}
