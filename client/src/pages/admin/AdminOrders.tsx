import { useState } from "react";
import { motion, AnimatePresence } from "../../lib/motion";
import AdminLayout from "../../components/AdminLayout";
import { formatPrice, formatDate, statusLabels, paymentLabels } from "../../lib/utils";
import {
  Package, ChevronDown, ChevronUp, Search, Filter, Plus, Download, Printer,
  Apple, Play, Globe,
} from "lucide-react";
import { FilterChip, AdminBtn, EmptyState } from "../../components/admin/AdminUI";
import { useAdminOrders } from "../../hooks/use-admin-orders";
import NewOrderModal from "../../components/admin/orders/NewOrderModal";
import OverrideModal from "../../components/admin/orders/OverrideModal";
import OrderDetailPanel from "../../components/admin/orders/OrderDetailPanel";
import type { Order } from "@shared/schema";

function DeviceIcon({ type }: { type?: string | null }) {
  switch (type) {
    case "ios":     return <Apple size={14} className="text-zinc-400" />;
    case "android": return <Play  size={14} className="text-green-500" />;
    default:        return <Globe size={14} className="text-blue-400" />;
  }
}

const statusFilters = ["all", "pending", "confirmed", "picked_up", "delivered", "returned", "cancelled"];

export default function AdminOrders() {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [overrideOrderId, setOverrideOrderId] = useState<number | null>(null);

  const {
    orders,
    filteredOrders,
    drivers,
    restaurants,
    deliveryZones,
    appSettings,
    filter, setFilter,
    selectedOrder, setSelectedOrder,
    filtersOpen, setFiltersOpen,
    searchQuery, setSearchQuery,
    restaurantFilter, setRestaurantFilter,
    paymentFilter, setPaymentFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    headerFlash,
    updateOrderStatus,
    assignDriver,
    handleExport,
    getRestaurantName,
  } = useAdminOrders();

  const handlePrint = () => window.print();

  const openOverride = (order: Order) => {
    setOverrideOrderId(order.id);
  };

  const parseItems = (items: any): any[] => {
    if (!items) return [];
    if (typeof items === "string") { try { return JSON.parse(items); } catch { return []; } }
    return items as any[];
  };

  return (
    <AdminLayout title="Gestion des commandes">
      {/* Header */}
      <div className={`flex items-center justify-between gap-4 mb-4 flex-wrap ${headerFlash ? "animate-pulse" : ""}`}>
        <h2 className="text-lg font-bold" data-testid="text-commandes-header">
          Commandes ({filteredOrders.length})
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <AdminBtn variant="primary" icon={Plus} onClick={() => setShowNewOrderModal(true)} testId="button-new-order">
            Nouvelle commande
          </AdminBtn>
          <AdminBtn variant="secondary" icon={Download} onClick={handleExport} testId="button-export">
            Exporter
          </AdminBtn>
          {selectedOrder && (
            <AdminBtn variant="secondary" icon={Printer} onClick={handlePrint} testId="button-print">
              Imprimer
            </AdminBtn>
          )}
          <AdminBtn variant="secondary" icon={Filter} onClick={() => setFiltersOpen(!filtersOpen)} testId="button-toggle-filters">
            Filtres {filtersOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </AdminBtn>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            style={{ originY: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-4 mb-4"
            data-testid="filter-panel"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Rechercher</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="N° commande..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    data-testid="input-search-order"
                    className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Restaurant</label>
                <select
                  value={restaurantFilter}
                  onChange={e => setRestaurantFilter(e.target.value)}
                  data-testid="select-restaurant-filter"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white"
                >
                  <option value="">Tous les restaurants</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Paiement</label>
                <select
                  value={paymentFilter}
                  onChange={e => setPaymentFilter(e.target.value)}
                  data-testid="select-payment-filter"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white"
                >
                  <option value="">Tous</option>
                  {Object.entries(paymentLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Du</label>
                  <input
                    type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    data-testid="input-date-from"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Au</label>
                  <input
                    type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    data-testid="input-date-to"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status chips */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-none">
        {statusFilters.map(s => (
          <FilterChip
            key={s}
            label={s === "all" ? "Toutes" : statusLabels[s]}
            active={filter === s}
            onClick={() => setFilter(s)}
            count={s === "all" ? orders.length : orders.filter(o => o.status === s).length}
          />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order list */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {filteredOrders.length === 0 && (
                <div data-testid="text-no-orders">
                  <EmptyState icon={Package} title="Aucune commande trouvée" description="Modifiez vos filtres ou attendez de nouvelles commandes." />
                </div>
              )}
              {filteredOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  data-testid={`admin-order-${order.id}`}
                  className={`w-full p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left ${
                    selectedOrder?.id === order.id ? "bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                      <Package size={18} className="text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{order.orderNumber}</p>
                        <DeviceIcon type={order.deviceType} />
                      </div>
                      <p className="text-xs text-zinc-400">{formatDate(order.createdAt!)}</p>
                      <p className="text-xs text-zinc-400">{getRestaurantName(order.restaurantId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">{formatPrice(order.total)}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                      order.status === "pending"   ? "bg-yellow-100 text-yellow-700" :
                      order.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                      order.status === "picked_up" ? "bg-purple-100 text-purple-700" :
                      order.status === "delivered" ? "bg-green-100 text-green-700" :
                      order.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {selectedOrder ? (
            <OrderDetailPanel
              order={selectedOrder}
              restaurants={restaurants}
              drivers={drivers}
              onPrint={handlePrint}
              onOpenOverride={openOverride}
              onUpdateStatus={updateOrderStatus}
              onAssignDriver={assignDriver}
            />
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-8 text-center">
              <Package size={40} className="text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Selectionnez une commande</p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden print invoice */}
      {selectedOrder && (
        <div id="print-invoice" className="hidden print:block">
          <div style={{ maxWidth: 600, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
            <h1 style={{ textAlign: "center", fontSize: 24, marginBottom: 4 }}>MAWEJA</h1>
            <p style={{ textAlign: "center", fontSize: 12, color: "#888", marginBottom: 20 }}>Facture</p>
            <hr />
            <div style={{ marginTop: 16 }}>
              <p><strong>Commande:</strong> {selectedOrder.orderNumber}</p>
              <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt!)}</p>
              <p><strong>Restaurant:</strong> {getRestaurantName(selectedOrder.restaurantId)}</p>
              <p><strong>Adresse:</strong> {selectedOrder.deliveryAddress}</p>
              <p><strong>Paiement:</strong> {paymentLabels[selectedOrder.paymentMethod]}</p>
            </div>
            <hr style={{ margin: "16px 0" }} />
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <th style={{ textAlign: "left", padding: "8px 0" }}>Article</th>
                  <th style={{ textAlign: "center", padding: "8px 0" }}>Qte</th>
                  <th style={{ textAlign: "right", padding: "8px 0" }}>Prix</th>
                </tr>
              </thead>
              <tbody>
                {parseItems(selectedOrder.items).map((item: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "6px 0" }}>{item.name}</td>
                    <td style={{ textAlign: "center", padding: "6px 0" }}>{item.qty}</td>
                    <td style={{ textAlign: "right", padding: "6px 0" }}>{formatPrice(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr style={{ margin: "16px 0" }} />
            <div style={{ textAlign: "right" }}>
              <p>Sous-total articles: {formatPrice(selectedOrder.subtotal)}</p>
              <p>Frais de livraison: {formatPrice(selectedOrder.deliveryFee)}{(selectedOrder as any).deliveryZone ? ` (${(selectedOrder as any).deliveryZone})` : ""}</p>
              <p>Frais de service: {formatPrice(selectedOrder.taxAmount)}</p>
              {selectedOrder.promoCode && <p>Promo ({selectedOrder.promoCode}): -{formatPrice(selectedOrder.promoDiscount)}</p>}
              {!selectedOrder.promoCode && selectedOrder.promoDiscount > 0 && <p>Réduction: -{formatPrice(selectedOrder.promoDiscount)}</p>}
              <p style={{ fontSize: 18, fontWeight: "bold", marginTop: 8 }}>Total à payer: {formatPrice(selectedOrder.total)}</p>
            </div>
            <hr style={{ margin: "16px 0" }} />
            <p style={{ textAlign: "center", fontSize: 11, color: "#999" }}>Merci pour votre commande - MAWEJA Delivery</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewOrderModal
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        restaurants={restaurants}
        deliveryZones={deliveryZones}
        appSettings={appSettings}
      />

      <OverrideModal
        orderId={overrideOrderId}
        orders={orders}
        onClose={() => setOverrideOrderId(null)}
      />
    </AdminLayout>
  );
}
