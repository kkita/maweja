import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Package, ChevronDown, ChevronUp, MapPin, Search, Filter, Printer, Download, Plus, Minus, X, Clock, Globe, Apple, Play } from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors, paymentLabels } from "../../lib/utils";
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
    }
    catch { }
}
function DeviceIcon({ type }) {
    switch (type) {
        case "ios":
            return _jsx(Apple, { size: 14, className: "text-gray-400" });
        case "android":
            return _jsx(Play, { size: 14, className: "text-green-500" });
        default:
            return _jsx(Globe, { size: 14, className: "text-blue-400" });
    }
}
export default function AdminOrders() {
    const { toast } = useToast();
    const [filter, setFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [restaurantFilter, setRestaurantFilter] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [headerFlash, setHeaderFlash] = useState(false);
    const prevCountRef = useRef(0);
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [newOrderRestaurant, setNewOrderRestaurant] = useState(null);
    const [newOrderItems, setNewOrderItems] = useState({});
    const [newOrderClientName, setNewOrderClientName] = useState("");
    const [newOrderClientPhone, setNewOrderClientPhone] = useState("");
    const [newOrderAddress, setNewOrderAddress] = useState("");
    const [newOrderPayment, setNewOrderPayment] = useState("cash");
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const { data: orders = [] } = useQuery({
        queryKey: ["/api/orders"],
        refetchInterval: 5000,
    });
    const { data: drivers = [] } = useQuery({
        queryKey: ["/api/drivers"],
        queryFn: () => authFetch("/api/drivers").then((r) => r.json()),
    });
    const { data: restaurants = [] } = useQuery({
        queryKey: ["/api/restaurants"],
    });
    const { data: menuItems = [] } = useQuery({
        queryKey: ["/api/restaurants", newOrderRestaurant, "menu"],
        queryFn: () => newOrderRestaurant
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
            if (updated)
                setSelectedOrder(updated);
        }
    }, [orders]);
    const filteredOrders = orders.filter((o) => {
        if (filter !== "all" && o.status !== filter)
            return false;
        if (searchQuery && !o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()))
            return false;
        if (restaurantFilter && o.restaurantId !== Number(restaurantFilter))
            return false;
        if (paymentFilter && o.paymentMethod !== paymentFilter)
            return false;
        if (dateFrom && o.createdAt && new Date(o.createdAt) < new Date(dateFrom))
            return false;
        if (dateTo && o.createdAt && new Date(o.createdAt) > new Date(dateTo + "T23:59:59"))
            return false;
        return true;
    });
    const updateOrderStatus = async (orderId, status) => {
        await apiRequest(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }) });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        toast({ title: "Statut mis a jour" });
    };
    const assignDriver = async (orderId, driverId) => {
        await apiRequest(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ driverId, status: "confirmed" }) });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        toast({ title: "Livreur assigne!" });
    };
    const handlePrint = () => {
        window.print();
    };
    const handleExport = () => {
        const params = new URLSearchParams();
        if (restaurantFilter)
            params.set("restaurantId", restaurantFilter);
        if (dateFrom)
            params.set("dateFrom", dateFrom);
        if (dateTo)
            params.set("dateTo", dateTo);
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
        }
        catch (e) {
            toast({ title: e.message || "Erreur", variant: "destructive" });
        }
        finally {
            setSubmittingOrder(false);
        }
    };
    const statusFilters = ["all", "pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"];
    const parseItems = (items) => {
        if (typeof items === "string")
            return JSON.parse(items);
        return items;
    };
    const parseAuditLog = (log) => {
        if (!log)
            return [];
        if (typeof log === "string") {
            try {
                return JSON.parse(log);
            }
            catch {
                return [];
            }
        }
        if (Array.isArray(log))
            return log;
        return [];
    };
    const getRestaurantName = (id) => {
        return restaurants.find((r) => r.id === id)?.name || `Restaurant #${id}`;
    };
    return (_jsxs(AdminLayout, { title: "Gestion des commandes", children: [_jsxs("div", { className: `flex items-center justify-between gap-4 mb-4 flex-wrap ${headerFlash ? "animate-pulse" : ""}`, children: [_jsxs("h2", { className: "text-lg font-bold", "data-testid": "text-commandes-header", children: ["Commandes (", filteredOrders.length, ")"] }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsxs("button", { onClick: () => setShowNewOrderModal(true), "data-testid": "button-new-order", className: "flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold", children: [_jsx(Plus, { size: 16 }), " Nouvelle commande"] }), _jsxs("button", { onClick: handleExport, "data-testid": "button-export", className: "flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold", children: [_jsx(Download, { size: 16 }), " Exporter"] }), selectedOrder && (_jsxs("button", { onClick: handlePrint, "data-testid": "button-print", className: "flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold", children: [_jsx(Printer, { size: 16 }), " Imprimer"] })), _jsxs("button", { onClick: () => setFiltersOpen(!filtersOpen), "data-testid": "button-toggle-filters", className: "flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold", children: [_jsx(Filter, { size: 16 }), " Filtres ", filtersOpen ? _jsx(ChevronUp, { size: 14 }) : _jsx(ChevronDown, { size: 14 })] })] })] }), filtersOpen && (_jsx("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4", "data-testid": "filter-panel", children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Rechercher" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "N\u00B0 commande...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), "data-testid": "input-search-order", className: "w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Restaurant" }), _jsxs("select", { value: restaurantFilter, onChange: (e) => setRestaurantFilter(e.target.value), "data-testid": "select-restaurant-filter", className: "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm", children: [_jsx("option", { value: "", children: "Tous les restaurants" }), restaurants.map((r) => (_jsx("option", { value: r.id, children: r.name }, r.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Paiement" }), _jsxs("select", { value: paymentFilter, onChange: (e) => setPaymentFilter(e.target.value), "data-testid": "select-payment-filter", className: "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm", children: [_jsx("option", { value: "", children: "Tous" }), Object.entries(paymentLabels).map(([k, v]) => (_jsx("option", { value: k, children: v }, k)))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Du" }), _jsx("input", { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), "data-testid": "input-date-from", className: "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Au" }), _jsx("input", { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), "data-testid": "input-date-to", className: "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" })] })] })] }) })), _jsx("div", { className: "flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar", children: statusFilters.map((s) => (_jsxs("button", { onClick: () => setFilter(s), "data-testid": `filter-${s}`, className: `flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === s ? "bg-red-600 text-white shadow-lg" : "bg-white text-gray-600 border border-gray-200"}`, children: [s === "all" ? "Toutes" : statusLabels[s], " (", s === "all" ? orders.length : orders.filter((o) => o.status === s).length, ")"] }, s))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2", children: _jsx("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden", children: _jsxs("div", { className: "divide-y divide-gray-50", children: [filteredOrders.length === 0 && (_jsx("div", { className: "p-8 text-center text-gray-400 text-sm", "data-testid": "text-no-orders", children: "Aucune commande trouvee" })), filteredOrders.map((order) => (_jsxs("button", { onClick: () => setSelectedOrder(order), "data-testid": `admin-order-${order.id}`, className: `w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left ${selectedOrder?.id === order.id ? "bg-red-50" : ""}`, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center", children: _jsx(Package, { size: 18, className: "text-red-600" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "font-bold text-sm", children: order.orderNumber }), _jsx(DeviceIcon, { type: order.deviceType })] }), _jsx("p", { className: "text-xs text-gray-400", children: formatDate(order.createdAt) }), _jsx("p", { className: "text-xs text-gray-400", children: getRestaurantName(order.restaurantId) })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "font-bold text-sm", children: formatPrice(order.total) }), _jsx("span", { className: `text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`, children: statusLabels[order.status] })] })] }, order.id)))] }) }) }), _jsx("div", { children: selectedOrder ? (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-4 flex-wrap", children: [_jsx("h3", { className: "font-bold text-lg", "data-testid": "text-selected-order-number", children: selectedOrder.orderNumber }), _jsxs("button", { onClick: handlePrint, "data-testid": "button-print-detail", className: "flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1", children: [_jsx(Printer, { size: 12 }), " Imprimer"] })] }), _jsxs("div", { className: "space-y-3 mb-4", children: [_jsxs("div", { className: "flex justify-between text-sm gap-2 flex-wrap", children: [_jsx("span", { className: "text-gray-500", children: "Statut" }), _jsx("span", { className: `font-bold px-2 py-0.5 rounded ${statusColors[selectedOrder.status]}`, children: statusLabels[selectedOrder.status] })] }), _jsxs("div", { className: "flex justify-between text-sm gap-2", children: [_jsx("span", { className: "text-gray-500", children: "Restaurant" }), _jsx("span", { className: "font-medium", children: getRestaurantName(selectedOrder.restaurantId) })] }), _jsxs("div", { className: "flex justify-between text-sm gap-2", children: [_jsx("span", { className: "text-gray-500", children: "Total" }), _jsx("span", { className: "font-bold text-red-600", children: formatPrice(selectedOrder.total) })] }), _jsxs("div", { className: "flex justify-between text-sm gap-2", children: [_jsx("span", { className: "text-gray-500", children: "Paiement" }), _jsx("span", { className: "font-medium", children: paymentLabels[selectedOrder.paymentMethod] })] }), _jsxs("div", { className: "flex justify-between text-sm gap-2", children: [_jsx("span", { className: "text-gray-500", children: "Appareil" }), _jsxs("span", { className: "flex items-center gap-1 font-medium", children: [_jsx(DeviceIcon, { type: selectedOrder.deviceType }), " ", selectedOrder.deviceType || "web"] })] }), _jsxs("div", { className: "text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Adresse" }), _jsxs("p", { className: "font-medium mt-1 flex items-start gap-1", children: [_jsx(MapPin, { size: 14, className: "text-red-500 mt-0.5 flex-shrink-0" }), " ", selectedOrder.deliveryAddress] })] })] }), _jsxs("div", { className: "border-t border-gray-100 pt-4 space-y-2 mb-4", children: [_jsx("p", { className: "text-xs font-semibold text-gray-500 uppercase", children: "Articles" }), parseItems(selectedOrder.items).map((item, i) => (_jsxs("div", { className: "flex justify-between text-sm gap-2", children: [_jsxs("span", { children: [item.qty, "x ", item.name] }), _jsx("span", { className: "font-medium", children: formatPrice(item.price * item.qty) })] }, i))), _jsxs("div", { className: "border-t border-gray-50 pt-2 mt-2 space-y-1", children: [_jsxs("div", { className: "flex justify-between text-xs text-gray-500 gap-2", children: [_jsx("span", { children: "Sous-total" }), _jsx("span", { children: formatPrice(selectedOrder.subtotal) })] }), _jsxs("div", { className: "flex justify-between text-xs text-gray-500 gap-2", children: [_jsx("span", { children: "Livraison" }), _jsx("span", { children: formatPrice(selectedOrder.deliveryFee) })] }), selectedOrder.taxAmount > 0 && (_jsxs("div", { className: "flex justify-between text-xs text-gray-500 gap-2", children: [_jsx("span", { children: "Taxes" }), _jsx("span", { children: formatPrice(selectedOrder.taxAmount) })] })), selectedOrder.promoCode && (_jsxs("div", { className: "flex justify-between text-xs text-green-600 gap-2", children: [_jsxs("span", { children: ["Promo (", selectedOrder.promoCode, ")"] }), _jsxs("span", { children: ["-", formatPrice(selectedOrder.promoDiscount)] })] })), _jsxs("div", { className: "flex justify-between text-sm font-bold text-red-600 pt-1 gap-2", children: [_jsx("span", { children: "Total" }), _jsx("span", { children: formatPrice(selectedOrder.total) })] })] })] }), selectedOrder.status === "cancelled" && selectedOrder.cancelReason && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4", children: [_jsx("p", { className: "text-xs font-semibold text-red-700 mb-1", children: "Raison d'annulation" }), _jsx("p", { className: "text-sm text-red-600", "data-testid": "text-cancel-reason", children: selectedOrder.cancelReason })] })), selectedOrder.rating && (_jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 mb-4", children: [_jsx("p", { className: "text-xs font-semibold text-yellow-700 mb-1", children: "Evaluation client" }), _jsx("div", { className: "flex items-center gap-1", "data-testid": "display-rating", children: [1, 2, 3, 4, 5].map((s) => (_jsx("span", { className: `text-lg ${s <= selectedOrder.rating ? "text-yellow-500" : "text-gray-300"}`, children: "\u2605" }, s))) }), selectedOrder.feedback && _jsx("p", { className: "text-sm text-yellow-700 mt-1", children: selectedOrder.feedback })] })), parseAuditLog(selectedOrder.auditLog).length > 0 && (_jsxs("div", { className: "border-t border-gray-100 pt-4 mb-4", children: [_jsx("p", { className: "text-xs font-semibold text-gray-500 uppercase mb-2", children: "Historique" }), _jsx("div", { className: "space-y-2", "data-testid": "audit-log", children: parseAuditLog(selectedOrder.auditLog).map((entry, i) => (_jsxs("div", { className: "flex items-start gap-2 text-xs", children: [_jsx(Clock, { size: 12, className: "text-gray-400 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-700", children: entry.action }), entry.by && _jsxs("span", { className: "text-gray-400", children: [" par ", entry.by] }), entry.role && _jsxs("span", { className: "text-gray-400", children: [" (", entry.role, ")"] }), entry.timestamp && (_jsx("span", { className: "text-gray-400 ml-1", children: formatDate(entry.timestamp) })), entry.details && _jsx("p", { className: "text-gray-400 mt-0.5", children: entry.details })] })] }, i))) })] })), _jsxs("div", { className: "border-t border-gray-100 pt-4 space-y-2", children: [_jsx("p", { className: "text-xs font-semibold text-gray-500 uppercase mb-2", children: "Actions" }), _jsx("select", { onChange: (e) => updateOrderStatus(selectedOrder.id, e.target.value), value: selectedOrder.status, "data-testid": "select-status", className: "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm", children: Object.entries(statusLabels).map(([k, v]) => (_jsx("option", { value: k, children: v }, k))) }), !selectedOrder.driverId && (_jsxs("select", { onChange: (e) => assignDriver(selectedOrder.id, Number(e.target.value)), defaultValue: "", "data-testid": "select-driver", className: "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm", children: [_jsx("option", { value: "", disabled: true, children: "Assigner un livreur" }), drivers.map((d) => (_jsxs("option", { value: d.id, children: [d.name, " ", d.isOnline ? "(En ligne)" : "(Hors ligne)"] }, d.id)))] }))] })] })) : (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center", children: [_jsx(Package, { size: 40, className: "text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-gray-500 text-sm", children: "Selectionnez une commande" })] })) })] }), selectedOrder && (_jsx("div", { id: "print-invoice", className: "hidden print:block", children: _jsxs("div", { style: { maxWidth: 600, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }, children: [_jsx("h1", { style: { textAlign: "center", fontSize: 24, marginBottom: 4 }, children: "MAWEJA" }), _jsx("p", { style: { textAlign: "center", fontSize: 12, color: "#888", marginBottom: 20 }, children: "Facture" }), _jsx("hr", {}), _jsxs("div", { style: { marginTop: 16 }, children: [_jsxs("p", { children: [_jsx("strong", { children: "Commande:" }), " ", selectedOrder.orderNumber] }), _jsxs("p", { children: [_jsx("strong", { children: "Date:" }), " ", formatDate(selectedOrder.createdAt)] }), _jsxs("p", { children: [_jsx("strong", { children: "Restaurant:" }), " ", getRestaurantName(selectedOrder.restaurantId)] }), _jsxs("p", { children: [_jsx("strong", { children: "Adresse:" }), " ", selectedOrder.deliveryAddress] }), _jsxs("p", { children: [_jsx("strong", { children: "Paiement:" }), " ", paymentLabels[selectedOrder.paymentMethod]] })] }), _jsx("hr", { style: { margin: "16px 0" } }), _jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: "1px solid #ddd" }, children: [_jsx("th", { style: { textAlign: "left", padding: "8px 0" }, children: "Article" }), _jsx("th", { style: { textAlign: "center", padding: "8px 0" }, children: "Qte" }), _jsx("th", { style: { textAlign: "right", padding: "8px 0" }, children: "Prix" })] }) }), _jsx("tbody", { children: parseItems(selectedOrder.items).map((item, i) => (_jsxs("tr", { style: { borderBottom: "1px solid #eee" }, children: [_jsx("td", { style: { padding: "6px 0" }, children: item.name }), _jsx("td", { style: { textAlign: "center", padding: "6px 0" }, children: item.qty }), _jsx("td", { style: { textAlign: "right", padding: "6px 0" }, children: formatPrice(item.price * item.qty) })] }, i))) })] }), _jsx("hr", { style: { margin: "16px 0" } }), _jsxs("div", { style: { textAlign: "right" }, children: [_jsxs("p", { children: ["Sous-total: ", formatPrice(selectedOrder.subtotal)] }), _jsxs("p", { children: ["Livraison: ", formatPrice(selectedOrder.deliveryFee)] }), selectedOrder.taxAmount > 0 && _jsxs("p", { children: ["Taxes: ", formatPrice(selectedOrder.taxAmount)] }), selectedOrder.promoCode && _jsxs("p", { children: ["Promo (", selectedOrder.promoCode, "): -", formatPrice(selectedOrder.promoDiscount)] }), _jsxs("p", { style: { fontSize: 18, fontWeight: "bold", marginTop: 8 }, children: ["Total: ", formatPrice(selectedOrder.total)] })] }), _jsx("hr", { style: { margin: "16px 0" } }), _jsx("p", { style: { textAlign: "center", fontSize: 11, color: "#999" }, children: "Merci pour votre commande - MAWEJA Delivery" })] }) })), showNewOrderModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", "data-testid": "modal-new-order", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 mx-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-4 flex-wrap", children: [_jsx("h2", { className: "text-lg font-bold", children: "Nouvelle commande" }), _jsx("button", { onClick: () => setShowNewOrderModal(false), "data-testid": "button-close-modal", className: "p-1 rounded-lg hover:bg-gray-100", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Restaurant" }), _jsxs("select", { value: newOrderRestaurant || "", onChange: (e) => {
                                                setNewOrderRestaurant(Number(e.target.value) || null);
                                                setNewOrderItems({});
                                            }, "data-testid": "select-new-order-restaurant", className: "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm", children: [_jsx("option", { value: "", children: "Choisir un restaurant" }), restaurants.map((r) => (_jsx("option", { value: r.id, children: r.name }, r.id)))] })] }), newOrderRestaurant && menuItems.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Articles" }), _jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto", children: menuItems.map((item) => (_jsxs("div", { className: "flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-xl", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium truncate", children: item.name }), _jsx("p", { className: "text-xs text-gray-400", children: formatPrice(item.price) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setNewOrderItems((prev) => ({
                                                                    ...prev,
                                                                    [item.id]: Math.max((prev[item.id] || 0) - 1, 0),
                                                                })), "data-testid": `button-decrease-${item.id}`, className: "w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg", children: _jsx(Minus, { size: 14 }) }), _jsx("span", { className: "text-sm font-bold w-6 text-center", "data-testid": `qty-${item.id}`, children: newOrderItems[item.id] || 0 }), _jsx("button", { onClick: () => setNewOrderItems((prev) => ({
                                                                    ...prev,
                                                                    [item.id]: (prev[item.id] || 0) + 1,
                                                                })), "data-testid": `button-increase-${item.id}`, className: "w-7 h-7 flex items-center justify-center bg-red-600 text-white rounded-lg", children: _jsx(Plus, { size: 14 }) })] })] }, item.id))) })] })), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Nom du client" }), _jsx("input", { type: "text", value: newOrderClientName, onChange: (e) => setNewOrderClientName(e.target.value), "data-testid": "input-client-name", className: "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm", placeholder: "Nom complet" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Telephone" }), _jsx("input", { type: "text", value: newOrderClientPhone, onChange: (e) => setNewOrderClientPhone(e.target.value), "data-testid": "input-client-phone", className: "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm", placeholder: "+243..." })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Adresse de livraison" }), _jsx("input", { type: "text", value: newOrderAddress, onChange: (e) => setNewOrderAddress(e.target.value), "data-testid": "input-delivery-address", className: "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm", placeholder: "Adresse complete" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Mode de paiement" }), _jsx("select", { value: newOrderPayment, onChange: (e) => setNewOrderPayment(e.target.value), "data-testid": "select-new-order-payment", className: "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm", children: Object.entries(paymentLabels).map(([k, v]) => (_jsx("option", { value: k, children: v }, k))) })] }), _jsxs("div", { className: "bg-gray-50 rounded-xl p-3 space-y-1", children: [_jsxs("div", { className: "flex justify-between text-sm gap-2", children: [_jsx("span", { className: "text-gray-500", children: "Sous-total" }), _jsx("span", { "data-testid": "text-new-subtotal", children: formatPrice(newOrderSubtotal) })] }), _jsxs("div", { className: "flex justify-between text-sm gap-2", children: [_jsx("span", { className: "text-gray-500", children: "Livraison" }), _jsx("span", { children: formatPrice(newOrderDeliveryFee) })] }), _jsxs("div", { className: "flex justify-between text-sm gap-2", children: [_jsx("span", { className: "text-gray-500", children: "Taxes (5%)" }), _jsx("span", { "data-testid": "text-new-tax", children: formatPrice(newOrderTax) })] }), _jsxs("div", { className: "flex justify-between text-sm font-bold text-red-600 pt-1 border-t border-gray-200 gap-2", children: [_jsx("span", { children: "Total" }), _jsx("span", { "data-testid": "text-new-total", children: formatPrice(newOrderTotal) })] })] }), _jsx("button", { onClick: submitNewOrder, disabled: submittingOrder, "data-testid": "button-submit-new-order", className: "w-full py-3 bg-red-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50", children: submittingOrder ? "Creation en cours..." : "Creer la commande" })] })] }) }))] }));
}
//# sourceMappingURL=AdminOrders.js.map