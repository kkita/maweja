import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import {
  Package, ChevronDown, ChevronUp, Truck, MapPin, Search, Filter,
  Monitor, Smartphone, Printer, Download, Plus, Minus, X, Clock,
  CreditCard, Globe, Apple, Play
} from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors, paymentLabels } from "../../lib/utils";
import type { Order, User, Restaurant, MenuItem } from "@shared/schema";

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 440;
    gain.gain.value = 0.3;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
}

function DeviceIcon({ type }: { type?: string | null }) {
  switch (type) {
    case "ios":
      return <Apple size={14} className="text-gray-400" />;
    case "android":
      return <Play size={14} className="text-green-500" />;
    default:
      return <Globe size={14} className="text-blue-400" />;
  }
}

export default function AdminOrders() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [headerFlash, setHeaderFlash] = useState(false);
  const prevCountRef = useRef<number>(0);

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderRestaurant, setNewOrderRestaurant] = useState<number | null>(null);
  const [newOrderItems, setNewOrderItems] = useState<Record<number, number>>({});
  const [newOrderClientName, setNewOrderClientName] = useState("");
  const [newOrderClientPhone, setNewOrderClientPhone] = useState("");
  const [newOrderAddress, setNewOrderAddress] = useState("");
  const [newOrderPayment, setNewOrderPayment] = useState("cash");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000,
  });

  const { data: drivers = [] } = useQuery<User[]>({
    queryKey: ["/api/drivers"],
    queryFn: () => authFetch("/api/drivers").then((r) => r.json()),
  });

  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/restaurants", newOrderRestaurant, "menu"],
    queryFn: () =>
      newOrderRestaurant
        ? authFetch(`/api/restaurants/${newOrderRestaurant}/menu`).then((r) => r.json())
        : Promise.resolve([]),
    enabled: !!newOrderRestaurant,
  });

  useEffect(() => {
    if (orders.length > 0 && prevCountRef.current > 0 && orders.length > prevCountRef.current) {
      playNotificationSound();
      setHeaderFlash(true);
      setTimeout(() => setHeaderFlash(false), 1500);
    }
    prevCountRef.current = orders.length;
  }, [orders.length]);

  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  const filteredOrders = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (searchQuery && !o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (restaurantFilter && o.restaurantId !== Number(restaurantFilter)) return false;
    if (paymentFilter && o.paymentMethod !== paymentFilter) return false;
    if (dateFrom && o.createdAt && new Date(o.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && o.createdAt && new Date(o.createdAt) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const updateOrderStatus = async (orderId: number, status: string) => {
    await apiRequest(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }) });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    toast({ title: "Statut mis a jour" });
  };

  const assignDriver = async (orderId: number, driverId: number) => {
    await apiRequest(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ driverId, status: "confirmed" }) });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    toast({ title: "Livreur assigne!" });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (restaurantFilter) params.set("restaurantId", restaurantFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const url = `/api/orders/export${params.toString() ? "?" + params.toString() : ""}`;
    window.open(url, "_blank");
  };

  const newOrderSubtotal = Object.entries(newOrderItems).reduce((sum, [id, qty]) => {
    const item = menuItems.find((m) => m.id === Number(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);
  const newOrderDeliveryFee = 2500;
  const newOrderTax = Math.round(newOrderSubtotal * 0.05);
  const newOrderTotal = newOrderSubtotal + newOrderDeliveryFee + newOrderTax;

  const submitNewOrder = async () => {
    if (!newOrderRestaurant || !newOrderClientName || !newOrderClientPhone || !newOrderAddress) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    const itemsArr = Object.entries(newOrderItems)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = menuItems.find((m) => m.id === Number(id));
        return { menuItemId: Number(id), name: item?.name || "", price: item?.price || 0, qty };
      });
    if (itemsArr.length === 0) {
      toast({ title: "Ajoutez au moins un article", variant: "destructive" });
      return;
    }
    setSubmittingOrder(true);
    try {
      await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          restaurantId: newOrderRestaurant,
          items: itemsArr,
          subtotal: newOrderSubtotal,
          deliveryFee: newOrderDeliveryFee,
          taxAmount: newOrderTax,
          total: newOrderTotal,
          paymentMethod: newOrderPayment,
          deliveryAddress: newOrderAddress,
          clientName: newOrderClientName,
          clientPhone: newOrderClientPhone,
          commission: 0,
          promoDiscount: 0,
          deviceType: "web",
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande creee!" });
      setShowNewOrderModal(false);
      setNewOrderRestaurant(null);
      setNewOrderItems({});
      setNewOrderClientName("");
      setNewOrderClientPhone("");
      setNewOrderAddress("");
      setNewOrderPayment("cash");
    } catch (e: any) {
      toast({ title: e.message || "Erreur", variant: "destructive" });
    } finally {
      setSubmittingOrder(false);
    }
  };

  const statusFilters = ["all", "pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"];

  const parseItems = (items: any): any[] => {
    if (typeof items === "string") return JSON.parse(items);
    return items as any[];
  };

  const parseAuditLog = (log: any): Array<{ action: string; by: string; byId?: number; role?: string; timestamp: string; details?: string }> => {
    if (!log) return [];
    if (typeof log === "string") {
      try { return JSON.parse(log); } catch { return []; }
    }
    if (Array.isArray(log)) return log;
    return [];
  };

  const getRestaurantName = (id: number) => {
    return restaurants.find((r) => r.id === id)?.name || `Restaurant #${id}`;
  };

  return (
    <AdminLayout title="Gestion des commandes">
      <div className={`flex items-center justify-between gap-4 mb-4 flex-wrap ${headerFlash ? "animate-pulse" : ""}`}>
        <h2 className="text-lg font-bold" data-testid="text-commandes-header">
          Commandes ({filteredOrders.length})
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowNewOrderModal(true)}
            data-testid="button-new-order"
            className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold"
          >
            <Plus size={16} /> Nouvelle commande
          </button>
          <button
            onClick={handleExport}
            data-testid="button-export"
            className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold"
          >
            <Download size={16} /> Exporter
          </button>
          {selectedOrder && (
            <button
              onClick={handlePrint}
              data-testid="button-print"
              className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold"
            >
              <Printer size={16} /> Imprimer
            </button>
          )}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            data-testid="button-toggle-filters"
            className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold"
          >
            <Filter size={16} /> Filtres {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 mb-4" data-testid="filter-panel">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Rechercher</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="N° commande..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-order"
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Restaurant</label>
              <select
                value={restaurantFilter}
                onChange={(e) => setRestaurantFilter(e.target.value)}
                data-testid="select-restaurant-filter"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
              >
                <option value="">Tous les restaurants</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Paiement</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                data-testid="select-payment-filter"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
              >
                <option value="">Tous</option>
                {Object.entries(paymentLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Du</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  data-testid="input-date-from"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Au</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  data-testid="input-date-to"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            data-testid={`filter-${s}`}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === s ? "bg-red-600 text-white shadow-lg" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            }`}
          >
            {s === "all" ? "Toutes" : statusLabels[s]} ({s === "all" ? orders.length : orders.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50 dark:divide-gray-800 dark:divide-gray-800">
              {filteredOrders.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm" data-testid="text-no-orders">
                  Aucune commande trouvee
                </div>
              )}
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  data-testid={`admin-order-${order.id}`}
                  className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
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
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt!)}</p>
                      <p className="text-xs text-gray-400">{getRestaurantName(order.restaurantId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">{formatPrice(order.total)}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          {selectedOrder ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sticky top-24">
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <h3 className="font-bold text-lg" data-testid="text-selected-order-number">{selectedOrder.orderNumber}</h3>
                <button
                  onClick={handlePrint}
                  data-testid="button-print-detail"
                  className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1"
                >
                  <Printer size={12} /> Imprimer
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm gap-2 flex-wrap">
                  <span className="text-gray-500 dark:text-gray-400">Statut</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${statusColors[selectedOrder.status]}`}>
                    {statusLabels[selectedOrder.status]}
                  </span>
                </div>
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Restaurant</span>
                  <span className="font-medium">{getRestaurantName(selectedOrder.restaurantId)}</span>
                </div>
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Total</span>
                  <span className="font-bold text-red-600">{formatPrice(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Paiement</span>
                  <span className="font-medium">{paymentLabels[selectedOrder.paymentMethod]}</span>
                </div>
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Appareil</span>
                  <span className="flex items-center gap-1 font-medium">
                    <DeviceIcon type={selectedOrder.deviceType} /> {selectedOrder.deviceType || "web"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Adresse</span>
                  <p className="font-medium mt-1 flex items-start gap-1">
                    <MapPin size={14} className="text-red-500 mt-0.5 flex-shrink-0" /> {selectedOrder.deliveryAddress}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">Articles</p>
                {parseItems(selectedOrder.items).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm gap-2">
                    <span>{item.qty}x {item.name}</span>
                    <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-50 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500 gap-2">
                    <span>Sous-total</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 gap-2">
                    <span>Livraison</span>
                    <span>{formatPrice(selectedOrder.deliveryFee)}</span>
                  </div>
                  {selectedOrder.taxAmount > 0 && (
                    <div className="flex justify-between text-xs text-gray-500 gap-2">
                      <span>Taxes</span>
                      <span>{formatPrice(selectedOrder.taxAmount)}</span>
                    </div>
                  )}
                  {selectedOrder.promoCode && (
                    <div className="flex justify-between text-xs text-green-600 gap-2">
                      <span>Promo ({selectedOrder.promoCode})</span>
                      <span>-{formatPrice(selectedOrder.promoDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-red-600 pt-1 gap-2">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.status === "cancelled" && selectedOrder.cancelReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">
                  <p className="text-xs font-semibold text-red-700 mb-1">Raison d'annulation</p>
                  <p className="text-sm text-red-600" data-testid="text-cancel-reason">{selectedOrder.cancelReason}</p>
                </div>
              )}

              {selectedOrder.rating && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 mb-4">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">Evaluation client</p>
                  <div className="flex items-center gap-1" data-testid="display-rating">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`text-lg ${s <= selectedOrder.rating! ? "text-yellow-500" : "text-gray-300"}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  {selectedOrder.feedback && <p className="text-sm text-yellow-700 mt-1">{selectedOrder.feedback}</p>}
                </div>
              )}

              {parseAuditLog(selectedOrder.auditLog).length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Historique</p>
                  <div className="space-y-2" data-testid="audit-log">
                    {parseAuditLog(selectedOrder.auditLog).map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <Clock size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-700">{entry.action}</span>
                          {entry.by && <span className="text-gray-400"> par {entry.by}</span>}
                          {entry.role && <span className="text-gray-400"> ({entry.role})</span>}
                          {entry.timestamp && (
                            <span className="text-gray-400 ml-1">
                              {formatDate(entry.timestamp)}
                            </span>
                          )}
                          {entry.details && <p className="text-gray-400 dark:text-gray-500 mt-0.5">{entry.details}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Actions</p>
                <select
                  onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                  value={selectedOrder.status}
                  data-testid="select-status"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                >
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>

                {!selectedOrder.driverId && (
                  <select
                    onChange={(e) => assignDriver(selectedOrder.id, Number(e.target.value))}
                    defaultValue=""
                    data-testid="select-driver"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                  >
                    <option value="" disabled>Assigner un livreur</option>
                    {drivers.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.isOnline ? "(En ligne)" : "(Hors ligne)"}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 text-center">
              <Package size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Selectionnez une commande</p>
            </div>
          )}
        </div>
      </div>

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
              <p>Sous-total: {formatPrice(selectedOrder.subtotal)}</p>
              <p>Livraison: {formatPrice(selectedOrder.deliveryFee)}</p>
              {selectedOrder.taxAmount > 0 && <p>Taxes: {formatPrice(selectedOrder.taxAmount)}</p>}
              {selectedOrder.promoCode && <p>Promo ({selectedOrder.promoCode}): -{formatPrice(selectedOrder.promoDiscount)}</p>}
              <p style={{ fontSize: 18, fontWeight: "bold", marginTop: 8 }}>Total: {formatPrice(selectedOrder.total)}</p>
            </div>
            <hr style={{ margin: "16px 0" }} />
            <p style={{ textAlign: "center", fontSize: 11, color: "#999" }}>Merci pour votre commande - MAWEJA Delivery</p>
          </div>
        </div>
      )}

      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="modal-new-order">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 mx-4">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <h2 className="text-lg font-bold">Nouvelle commande</h2>
              <button
                onClick={() => setShowNewOrderModal(false)}
                data-testid="button-close-modal"
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Restaurant</label>
                <select
                  value={newOrderRestaurant || ""}
                  onChange={(e) => {
                    setNewOrderRestaurant(Number(e.target.value) || null);
                    setNewOrderItems({});
                  }}
                  data-testid="select-new-order-restaurant"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                >
                  <option value="">Choisir un restaurant</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {newOrderRestaurant && menuItems.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Articles</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {menuItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setNewOrderItems((prev) => ({
                                ...prev,
                                [item.id]: Math.max((prev[item.id] || 0) - 1, 0),
                              }))
                            }
                            data-testid={`button-decrease-${item.id}`}
                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold w-6 text-center" data-testid={`qty-${item.id}`}>
                            {newOrderItems[item.id] || 0}
                          </span>
                          <button
                            onClick={() =>
                              setNewOrderItems((prev) => ({
                                ...prev,
                                [item.id]: (prev[item.id] || 0) + 1,
                              }))
                            }
                            data-testid={`button-increase-${item.id}`}
                            className="w-7 h-7 flex items-center justify-center bg-red-600 text-white rounded-lg"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Nom du client</label>
                  <input
                    type="text"
                    value={newOrderClientName}
                    onChange={(e) => setNewOrderClientName(e.target.value)}
                    data-testid="input-client-name"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    placeholder="Nom complet"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Telephone</label>
                  <input
                    type="text"
                    value={newOrderClientPhone}
                    onChange={(e) => setNewOrderClientPhone(e.target.value)}
                    data-testid="input-client-phone"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    placeholder="+243..."
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Adresse de livraison</label>
                <input
                  type="text"
                  value={newOrderAddress}
                  onChange={(e) => setNewOrderAddress(e.target.value)}
                  data-testid="input-delivery-address"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                  placeholder="Adresse complete"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Mode de paiement</label>
                <select
                  value={newOrderPayment}
                  onChange={(e) => setNewOrderPayment(e.target.value)}
                  data-testid="select-new-order-payment"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                >
                  {Object.entries(paymentLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
                  <span data-testid="text-new-subtotal">{formatPrice(newOrderSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Livraison</span>
                  <span>{formatPrice(newOrderDeliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Taxes (5%)</span>
                  <span data-testid="text-new-tax">{formatPrice(newOrderTax)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-red-600 pt-1 border-t border-gray-200 gap-2">
                  <span>Total</span>
                  <span data-testid="text-new-total">{formatPrice(newOrderTotal)}</span>
                </div>
              </div>

              <button
                onClick={submitNewOrder}
                disabled={submittingOrder}
                data-testid="button-submit-new-order"
                className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {submittingOrder ? "Creation en cours..." : "Creer la commande"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
