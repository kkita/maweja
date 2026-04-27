import { Store, RefreshCw, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { formatPrice } from "../../../lib/utils";
import type { RestaurantPayout } from "@shared/schema";

export default function PayoutsTab({
  payouts, payoutsLoading,
  genPeriod, setGenPeriod,
  genDateFrom, setGenDateFrom,
  genDateTo, setGenDateTo,
  generatePending, onGenerate,
  markPaidPending, onTogglePaid, onDelete,
}: {
  payouts: RestaurantPayout[];
  payoutsLoading: boolean;
  genPeriod: string; setGenPeriod: (v: string) => void;
  genDateFrom: string; setGenDateFrom: (v: string) => void;
  genDateTo: string; setGenDateTo: (v: string) => void;
  generatePending: boolean;
  onGenerate: () => void;
  markPaidPending: boolean;
  onTogglePaid: (id: number, isPaid: boolean) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="space-y-6">
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
        <button onClick={onGenerate} disabled={generatePending}
          data-testid="button-generate-payouts"
          className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2">
          {generatePending ? <><RefreshCw size={14} className="animate-spin" /> Génération...</> : <><RefreshCw size={14} /> Générer les paiements</>}
        </button>
        <p className="text-[11px] text-gray-400 mt-2">Calcule automatiquement les commissions MAWEJA et les montants nets à verser pour chaque restaurant actif sur la période.</p>
      </div>

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
                  onClick={() => onTogglePaid(p.id, !p.isPaid)}
                  disabled={markPaidPending}
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
                    {p.isPaid && <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-100 dark:border-emerald-900/40">PAYÉ</span>}
                    {!p.isPaid && <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold border border-amber-100 dark:border-amber-900/40">EN ATTENTE</span>}
                  </div>
                  <p className="text-xs text-gray-400">{p.orderCount} commandes · Commission MAWEJA: {formatPrice(p.mawejaCommission)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-green-600 text-sm">{formatPrice(p.netAmount)}</p>
                  <p className="text-[10px] text-gray-400">sur {formatPrice(p.grossAmount)}</p>
                </div>
                <button
                  onClick={() => { if (confirm(`Supprimer le paiement de ${p.restaurantName} ?`)) onDelete(p.id); }}
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
  );
}
