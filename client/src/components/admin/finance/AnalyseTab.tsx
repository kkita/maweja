import { Calendar, Store, BarChart3, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";
import type { Restaurant } from "@shared/schema";
import KpiAnalCard from "./KpiAnalCard";

type KPIs = ReturnType<typeof import("./kpiHelpers").computeAnalyseKPIs>;

export default function AnalyseTab({
  evalFrom, setEvalFrom, evalTo, setEvalTo,
  cmpFrom, setCmpFrom, cmpTo, setCmpTo,
  storeTypeFilter, setStoreTypeFilter,
  evalKPIs, cmpKPIs, restaurants,
}: {
  evalFrom: string; setEvalFrom: (v: string) => void;
  evalTo: string; setEvalTo: (v: string) => void;
  cmpFrom: string; setCmpFrom: (v: string) => void;
  cmpTo: string; setCmpTo: (v: string) => void;
  storeTypeFilter: "all" | "restaurant" | "boutique";
  setStoreTypeFilter: (v: "all" | "restaurant" | "boutique") => void;
  evalKPIs: KPIs; cmpKPIs: KPIs; restaurants: Restaurant[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-red-600" />
          <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Indicateurs clés de performance</h3>
          <span className="text-[10px] text-zinc-400 ml-auto">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-1 align-middle" />hausse vs période comparative
            <span className="inline-block w-3 h-3 bg-red-500 rounded-sm mx-1 ml-3 align-middle" />baisse
          </span>
        </div>

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

        <div>
          <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Store size={10} /> Partenaires
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            <KpiAnalCard label="Nvx partenaires créés"       evalVal={evalKPIs.newPartners}                       cmpVal={cmpKPIs.newPartners}          mode="int" />
            <KpiAnalCard label="Partenaires avec commande"   evalVal={evalKPIs.partnersWithOrder}                 cmpVal={cmpKPIs.partnersWithOrder}    mode="int" />
            <KpiAnalCard label="Total partenaires"           evalVal={restaurants.length}                         cmpVal={null}                         mode="int" />
            <KpiAnalCard label="Partenaires actifs"          evalVal={restaurants.filter(r => r.isActive).length} cmpVal={null}                         mode="int" />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-zinc-400 italic">
        Note : les métriques de temps (service, acceptation, ramassage, attente, livraison) et de notation (produits, agents) nécessitent des données supplémentaires non encore collectées.
      </p>
    </div>
  );
}
