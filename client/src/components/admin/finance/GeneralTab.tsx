import { TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, Plus, X, Download, FileSpreadsheet, BarChart3 } from "lucide-react";
import { EmptyState } from "../AdminUI";
import { formatPrice, formatDate } from "../../../lib/utils";
import type { Finance } from "@shared/schema";
import { CATEGORY_LABELS } from "./kpiHelpers";

type NewEntry = { type: string; category: string; amount: number; description: string };

type SummaryCategory = { category: string; type: "revenue" | "expense"; total: number | string };
type SummaryDay = { date: string; revenue: number | string; expense: number | string };
type FinanceSummary = { byCategory?: SummaryCategory[]; daily?: SummaryDay[] };

export default function GeneralTab({
  totalRevenue, totalExpense, netProfit, totalCommission,
  filter, setFilter,
  dateFrom, setDateFrom, dateTo, setDateTo,
  showAddForm, setShowAddForm,
  newEntry, setNewEntry, onAdd,
  onExportCSV, onExportOrders,
  summary, entries,
}: {
  totalRevenue: number; totalExpense: number; netProfit: number; totalCommission: number;
  filter: string; setFilter: (v: string) => void;
  dateFrom: string; setDateFrom: (v: string) => void;
  dateTo: string; setDateTo: (v: string) => void;
  showAddForm: boolean; setShowAddForm: (v: boolean | ((prev: boolean) => boolean)) => void;
  newEntry: NewEntry; setNewEntry: (v: NewEntry) => void; onAdd: () => void;
  onExportCSV: () => void; onExportOrders: () => void;
  summary: FinanceSummary | null | undefined; entries: Finance[];
}) {
  return (
    <>
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
        <button onClick={onExportCSV} data-testid="button-export-finance" className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-300 dark:border-emerald-900/40 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition-colors">
          <Download size={14} /> Export Excel
        </button>
        <button onClick={onExportOrders} data-testid="button-export-orders" className="bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/25 dark:text-sky-300 dark:border-sky-900/40 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-sky-100 dark:hover:bg-sky-950/40 transition-colors">
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
          <button onClick={onAdd} data-testid="button-save-finance" className="mt-4 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700">Enregistrer</button>
        </div>
      )}

      {summary?.byCategory && summary.byCategory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-red-600" /> Répartition par catégorie</h3>
            <div className="space-y-3">
              {summary.byCategory.map((cat, i) => {
                const maxAmount = Math.max(...summary.byCategory!.map(c => Number(c.total)));
                const pctBar = maxAmount ? (Number(cat.total) / maxAmount) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{CATEGORY_LABELS[cat.category] || cat.category}</span>
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
                {summary.daily.slice(-14).map((day, i) => (
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
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${e.type === "revenue" ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40" : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40"}`}>
                      {e.type === "revenue" ? "Revenu" : "Dépense"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm dark:text-gray-300">{CATEGORY_LABELS[e.category] || e.category}</td>
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
            <EmptyState
              icon={DollarSign}
              title="Aucune entrée financière"
              description="Les transactions apparaîtront ici automatiquement"
            />
          )}
        </div>
      </div>
    </>
  );
}
