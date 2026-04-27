import { Calendar, X, Download, FileSpreadsheet, BarChart3, DollarSign } from "lucide-react";
import { formatPrice, formatDate } from "../../../lib/utils";
import type { Order } from "@shared/schema";

type OrderExtras = { taxAmount?: number | null; promoDiscount?: number | null; loyaltyCreditDiscount?: number | null };

type Totaux = {
  revenuTotal: number; revEtab: number; revLivreur: number; commEtab: number;
  commLivraison: number; revServiceFee: number; totalPromoDiscount: number;
  reversementPartenaires: number; chiffreAffaires: number;
};

export default function ComptabiliteTab({
  dateFrom, setDateFrom, dateTo, setDateTo,
  comptaOrders, ordersLoading, comptaTotaux,
  restaurantMap, restaurantCommissionMap,
  onExportCSV, onExportOrders,
}: {
  dateFrom: string; setDateFrom: (v: string) => void;
  dateTo: string; setDateTo: (v: string) => void;
  comptaOrders: Order[]; ordersLoading: boolean; comptaTotaux: Totaux;
  restaurantMap: Map<number, string>;
  restaurantCommissionMap: Map<number, number>;
  onExportCSV: () => void; onExportOrders: () => void;
}) {
  return (
    <div className="space-y-5">
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
          <button onClick={onExportCSV} data-testid="button-export-finance" className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-300 dark:border-emerald-900/40 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition-colors">
            <Download size={13} /> Export Excel
          </button>
          <button onClick={onExportOrders} data-testid="button-export-orders" className="bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/25 dark:text-sky-300 dark:border-sky-900/40 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-sky-100 dark:hover:bg-sky-950/40 transition-colors">
            <FileSpreadsheet size={13} /> Export Commandes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/25 p-5 shadow-sm">
          <h3 className="font-black text-base mb-1 text-emerald-900 dark:text-emerald-50">Revenus totaux</h3>
          <p className="text-[10px] font-semibold text-emerald-700/80 dark:text-emerald-300/80 mb-0.5">= TOTAL NET</p>
          <p className="text-[10px] text-emerald-700/70 dark:text-emerald-300/70">+ Sous-total</p>
          <p className="text-[10px] text-emerald-700/70 dark:text-emerald-300/70">+ Frais de livraison 100% DU</p>
          <p className="text-[10px] text-emerald-700/70 dark:text-emerald-300/70">+ Frais de service 100%</p>
          <p className="text-2xl font-black mt-3 text-emerald-900 dark:text-emerald-50">{formatPrice(comptaTotaux.revenuTotal)}</p>
        </div>

        <div className="rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/25 p-5 shadow-sm">
          <h3 className="font-black text-base mb-1 text-rose-900 dark:text-rose-50">Reversement Partenaires</h3>
          <p className="text-[10px] font-semibold text-rose-700/80 dark:text-rose-300/80 mb-0.5">Établissements &amp; Livreurs</p>
          <p className="text-[10px] text-rose-700/70 dark:text-rose-300/70">= Revenus des Établissements + Revenus livreurs</p>
          <p className="text-2xl font-black mt-3 text-rose-900 dark:text-rose-50">
            <span className="text-sm font-semibold text-rose-700/70 dark:text-rose-300/70">{formatPrice(comptaTotaux.revEtab)} + {formatPrice(comptaTotaux.revLivreur)} = </span>
            {formatPrice(comptaTotaux.reversementPartenaires)}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/25 p-5 shadow-sm">
          <h3 className="font-black text-base mb-1 text-amber-900 dark:text-amber-50">Chiffre d'affaires</h3>
          <p className="text-[10px] font-semibold text-amber-700/80 dark:text-amber-300/80 mb-0.5">Commission Maweja + Frais de service</p>
          <p className="text-[10px] text-amber-700/70 dark:text-amber-300/70">= Commissions Maweja + Frais de service</p>
          <p className="text-2xl font-black mt-3 text-amber-900 dark:text-amber-50">
            <span className="text-sm font-semibold text-amber-700/70 dark:text-amber-300/70">{formatPrice(comptaTotaux.commLivraison)} + {formatPrice(comptaTotaux.revServiceFee)} = </span>
            {formatPrice(comptaTotaux.chiffreAffaires)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl bg-violet-50 dark:bg-violet-950/25 text-violet-900 dark:text-violet-50 p-4 shadow-sm border border-violet-100 dark:border-violet-900/40">
          <h4 className="font-black text-xs mb-1 leading-tight">Revenus des Établissements</h4>
          <p className="text-[9px] text-violet-700/70 dark:text-violet-300/70 mb-0.5">= Revenu des restaurants et des boutiques</p>
          <p className="text-[9px] text-violet-700/70 dark:text-violet-300/70 mb-0.5 italic">ou autre formule</p>
          <p className="text-[9px] text-violet-700/70 dark:text-violet-300/70">= Sous-total − % Commissions sur Établissements</p>
          <p className="text-lg font-black mt-2">{formatPrice(comptaTotaux.revEtab)}</p>
        </div>

        <div className="rounded-xl bg-sky-50 dark:bg-sky-950/25 text-sky-900 dark:text-sky-50 p-4 shadow-sm border border-sky-100 dark:border-sky-900/40">
          <h4 className="font-black text-xs mb-1 leading-tight">Revenus des Livreurs</h4>
          <p className="text-[9px] text-sky-700/70 dark:text-sky-300/70 mb-0.5">= Frais de livraison 100%</p>
          <p className="text-[9px] text-sky-700/70 dark:text-sky-300/70">× 80% part livreur</p>
          <p className="text-lg font-black mt-2">{formatPrice(comptaTotaux.revLivreur)}</p>
        </div>

        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-50 p-4 shadow-sm border border-emerald-100 dark:border-emerald-900/40">
          <h4 className="font-black text-xs mb-1 leading-tight">Commissions Établissements</h4>
          <p className="text-[9px] text-emerald-700/70 dark:text-emerald-300/70 mb-0.5">(Restaurants &amp; Boutiques)</p>
          <p className="text-[9px] text-emerald-700/70 dark:text-emerald-300/70">= Sommes des Commissions sur des Établissements</p>
          <p className="text-lg font-black mt-2">{formatPrice(comptaTotaux.commEtab)}</p>
        </div>

        <div className="rounded-xl bg-teal-50 dark:bg-teal-950/25 text-teal-900 dark:text-teal-50 p-4 shadow-sm border border-teal-100 dark:border-teal-900/40">
          <h4 className="font-black text-xs mb-1 leading-tight">Commissions Frais de livraison</h4>
          <p className="text-[9px] text-teal-700/70 dark:text-teal-300/70">= Sommes des Commissions sur frais de livraison</p>
          <p className="text-lg font-black mt-2">{formatPrice(comptaTotaux.commLivraison)}</p>
        </div>

        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/25 text-amber-900 dark:text-amber-50 p-4 shadow-sm border border-amber-100 dark:border-amber-900/40">
          <h4 className="font-black text-xs mb-1 leading-tight">Revenus Frais de service</h4>
          <p className="text-[9px] text-amber-700/70 dark:text-amber-300/70">= Sommes des frais de service</p>
          <p className="text-lg font-black mt-2">{formatPrice(comptaTotaux.revServiceFee)}</p>
        </div>
      </div>

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
                  const ox       = order as Order & OrderExtras;
                  const service  = ox.taxAmount ?? 0;
                  const promo    = ox.promoDiscount ?? 0;
                  const loyalty  = ox.loyaltyCreditDiscount ?? 0;
                  const rate     = restaurantCommissionMap.get(order.restaurantId) ?? 20;
                  const cEtab    = order.commission > 0 ? order.commission : Math.round(sub * rate / 100 * 100) / 100;
                  const revEtabOrder    = Math.round((sub - cEtab) * 100) / 100;
                  const revLivreurOrder = Math.round(delivery * 0.8 * 100) / 100;
                  const cLivraison      = Math.round(delivery * 0.2 * 100) / 100;
                  const partnerName     = restaurantMap.get(order.restaurantId) ?? "Partenaire";
                  const dateStr         = formatDate(order.createdAt!);

                  type Row = { type: "Revenu" | "Reversement" | "Dépense"; highlight?: boolean; desc: string; amount: number; sign: "+" | "-" };
                  const rows: Row[] = [
                    { type: "Revenu",      desc: "+ Sous-total",                                                  amount: sub,          sign: "+" },
                    { type: "Revenu",      desc: `+ Frais de livraison (100%)`,                                  amount: delivery,     sign: "+" },
                    ...(service > 0 ? [{ type: "Revenu" as const, desc: `+ Frais de service (100%)`,           amount: service,      sign: "+" as const }] : []),
                    { type: "Reversement", desc: `- Frais de livraison : ce qu'on doit au livreur (80% de ${formatPrice(delivery)})`, amount: revLivreurOrder, sign: "-" },
                    { type: "Reversement", desc: `- Revenu établissement : ${partnerName} (${100 - rate}% de ${formatPrice(sub)})`,     amount: revEtabOrder,    sign: "-" },
                    { type: "Revenu",      highlight: true, desc: `Commission sur l'établissement : le ${rate}% de sous-total ${formatPrice(sub)}`,   amount: cEtab,      sign: "+" },
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
  );
}
