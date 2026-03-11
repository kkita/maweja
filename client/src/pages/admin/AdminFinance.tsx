import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { DollarSign, TrendingUp, TrendingDown, Download, Plus, X, ArrowUpRight, ArrowDownLeft, PieChart, BarChart3, FileSpreadsheet } from "lucide-react";
import { formatPrice, formatDate } from "../../lib/utils";
import type { Finance } from "@shared/schema";

export default function AdminFinance() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: "revenue", category: "other", amount: 0, description: "" });

  const queryParams = new URLSearchParams();
  if (filter !== "all") queryParams.set("type", filter);
  if (dateFrom) queryParams.set("dateFrom", dateFrom);
  if (dateTo) queryParams.set("dateTo", dateTo);

  const { data: entries = [] } = useQuery<Finance[]>({
    queryKey: ["/api/finance", filter, dateFrom, dateTo],
    queryFn: () => authFetch(`/api/finance?${queryParams}`).then(r => r.json()),
  });

  const summaryParams = new URLSearchParams();
  if (dateFrom) summaryParams.set("dateFrom", dateFrom);
  if (dateTo) summaryParams.set("dateTo", dateTo);

  const { data: summary } = useQuery<any>({
    queryKey: ["/api/finance/summary", dateFrom, dateTo],
    queryFn: () => authFetch(`/api/finance/summary?${summaryParams}`).then(r => r.json()),
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

  const exportCSV = () => {
    const exportParams = new URLSearchParams();
    if (filter !== "all") exportParams.set("type", filter);
    if (dateFrom) exportParams.set("dateFrom", dateFrom);
    if (dateTo) exportParams.set("dateTo", dateTo);
    window.open(`/api/finance/export?${exportParams}`, "_blank");
  };

  const exportOrders = () => {
    const exportParams = new URLSearchParams();
    if (dateFrom) exportParams.set("dateFrom", dateFrom);
    if (dateTo) exportParams.set("dateTo", dateTo);
    window.open(`/api/orders/export?${exportParams}`, "_blank");
  };

  const categoryLabels: Record<string, string> = {
    order: "Commande", delivery_fee: "Frais livraison", commission: "Commission",
    driver_payment: "Paiement livreur", refund: "Remboursement",
    wallet_topup: "Recharge wallet", salary: "Salaire", marketing: "Marketing",
    equipment: "Equipement", other: "Autre",
  };

  return (
    <AdminLayout title="Finance & Comptabilite">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center"><TrendingUp size={20} className="text-green-600" /></div>
            <span className="text-xs font-semibold text-green-600 flex items-center gap-0.5"><ArrowUpRight size={12} /></span>
          </div>
          <p className="text-2xl font-black text-gray-900">{formatPrice(totalRevenue)}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Revenus totaux</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center"><TrendingDown size={20} className="text-red-600" /></div>
          </div>
          <p className="text-2xl font-black text-gray-900">{formatPrice(totalExpense)}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Depenses totales</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center"><DollarSign size={20} className="text-blue-600" /></div>
          </div>
          <p className={`text-2xl font-black ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatPrice(netProfit)}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Benefice net</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center"><PieChart size={20} className="text-purple-600" /></div>
          </div>
          <p className="text-2xl font-black text-gray-900">{formatPrice(totalCommission)}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Commissions</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-2">
          {["all", "revenue", "expense"].map(t => (
            <button key={t} onClick={() => setFilter(t)} data-testid={`filter-finance-${t}`}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === t ? "bg-red-600 text-white shadow-lg" : "bg-white text-gray-600 border border-gray-200"}`}>
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Nouvelle entree financiere</h3>
            <button onClick={() => setShowAddForm(false)}><X size={20} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
              <select value={newEntry.type} onChange={e => setNewEntry({ ...newEntry, type: e.target.value })} data-testid="select-finance-type" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                <option value="revenue">Revenu</option>
                <option value="expense">Depense</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Categorie</label>
              <select value={newEntry.category} onChange={e => setNewEntry({ ...newEntry, category: e.target.value })} data-testid="select-finance-category" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
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
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Montant ($)</label>
              <input type="number" value={newEntry.amount} onChange={e => setNewEntry({ ...newEntry, amount: Number(e.target.value) })} data-testid="input-finance-amount" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
              <input type="text" value={newEntry.description} onChange={e => setNewEntry({ ...newEntry, description: e.target.value })} data-testid="input-finance-desc" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>
          <button onClick={handleAdd} data-testid="button-save-finance" className="mt-4 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700">Enregistrer</button>
        </div>
      )}

      {summary?.byCategory && summary.byCategory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
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
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${cat.type === "revenue" ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {summary.daily && summary.daily.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Historique ({entries.length} entrees)</h3>
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
            <tbody className="divide-y divide-gray-50">
              {entries.slice(0, 50).map(e => (
                <tr key={e.id} className="hover:bg-gray-50" data-testid={`finance-row-${e.id}`}>
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
                  <td className="px-5 py-3 text-xs text-gray-500">{formatDate(e.createdAt!)}</td>
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
    </AdminLayout>
  );
}
