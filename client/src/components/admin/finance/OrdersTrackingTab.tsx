import { TrendingUp, TrendingDown, ShoppingBag, Banknote, CreditCard, Phone, Wallet } from "lucide-react";
import { formatPrice, formatDate, formatPaymentMethod, statusColors, statusLabels } from "../../../lib/utils";
import type { Order } from "@shared/schema";
import { AppSkeleton } from "../../../design-system/primitives";

const PAYMENT_ICONS: Record<string, any> = { cash: Banknote, card: CreditCard, mobile_money: Phone };

type OrderFin = {
  subtotal: number; deliveryFee: number; serviceFee: number; partnerFee: number;
  driverExpense: number; mawejaDeliveryMargin: number; mawejaGain: number; commissionRate: number;
};

export default function OrdersTrackingTab({
  filteredOrders, ordersLoading,
  totalFinanceRevenue, totalMawejaGain, totalDriverExpenses,
  orderSearch, setOrderSearch,
  orderStatusFilter, setOrderStatusFilter,
  getOrderFinancials, restaurantMap, onSelectOrder,
}: {
  filteredOrders: Order[]; ordersLoading: boolean;
  totalFinanceRevenue: number; totalMawejaGain: number; totalDriverExpenses: number;
  orderSearch: string; setOrderSearch: (v: string) => void;
  orderStatusFilter: string; setOrderStatusFilter: (v: string) => void;
  getOrderFinancials: (o: Order) => OrderFin;
  restaurantMap: Map<number, string>;
  onSelectOrder: (o: Order) => void;
}) {
  return (
    <>
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

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {ordersLoading ? (
          <div className="space-y-0 divide-y divide-zinc-50 dark:divide-zinc-800">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="px-5 py-4 flex items-center justify-between">
                <div className="space-y-2">
                  <AppSkeleton className="h-3.5 w-28" shimmer />
                  <AppSkeleton className="h-2.5 w-20" shimmer />
                </div>
                <AppSkeleton className="h-5 w-16" shimmer />
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
                  onClick={() => onSelectOrder(order)}
                  data-testid={`finance-order-row-${order.id}`}
                >
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

                  <div className="grid grid-cols-5 gap-1.5 ml-10">
                    <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl px-3 py-2 border border-gray-100 dark:border-gray-700/50">
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Articles</p>
                      <p className="text-xs font-black text-gray-800 dark:text-white mt-0.5">{formatPrice(fin.subtotal)}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl px-3 py-2 border border-orange-100 dark:border-orange-900/30">
                      <p className="text-[9px] text-orange-500 font-semibold uppercase tracking-wide">Livraison</p>
                      <p className="text-xs font-black text-orange-700 dark:text-orange-400 mt-0.5">{formatPrice(fin.deliveryFee)}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl px-3 py-2 border border-blue-100 dark:border-blue-900/30">
                      <p className="text-[9px] text-blue-500 font-semibold uppercase tracking-wide">Service</p>
                      <p className="text-xs font-black text-blue-700 dark:text-blue-400 mt-0.5">{formatPrice(fin.serviceFee)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 rounded-xl px-3 py-2 border border-red-100 dark:border-red-900/30">
                      <p className="text-[9px] text-red-500 font-semibold uppercase tracking-wide">Livreur 80%</p>
                      <p className="text-xs font-black text-red-700 dark:text-red-400 mt-0.5">-{formatPrice(fin.driverExpense)}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl px-3 py-2 border border-purple-100 dark:border-purple-900/30">
                      <p className="text-[9px] text-purple-500 font-semibold uppercase tracking-wide">Partenaire {fin.commissionRate}%</p>
                      <p className="text-xs font-black text-purple-700 dark:text-purple-400 mt-0.5">{formatPrice(fin.partnerFee)}</p>
                    </div>
                  </div>

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
    </>
  );
}
