import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { authFetchJson } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import { ChevronRight, Package, Clock, Bike, Star, ShoppingBag } from "lucide-react";
import { formatPrice, formatDate } from "../../lib/utils";
const STATUS_CONFIG = {
    pending: { label: "En attente", color: "#92400E", bg: "#FEF3C7", dot: "#F59E0B" },
    confirmed: { label: "Confirmée", color: "#1E40AF", bg: "#DBEAFE", dot: "#3B82F6" },
    preparing: { label: "En préparation", color: "#7C3AED", bg: "#EDE9FE", dot: "#8B5CF6" },
    ready: { label: "Prête", color: "#065F46", bg: "#D1FAE5", dot: "#10B981" },
    picked_up: { label: "En livraison", color: "#0E7490", bg: "#CFFAFE", dot: "#06B6D4" },
    delivered: { label: "Livrée ✓", color: "#064E3B", bg: "#D1FAE5", dot: "#059669" },
    cancelled: { label: "Annulée", color: "#991B1B", bg: "#FEE2E2", dot: "#EF4444" },
};
const ACTIVE_PROGRESS = {
    pending: 10, confirmed: 30, preparing: 55, ready: 75, picked_up: 90,
};
function OrderProgressBar({ status }) {
    const pct = ACTIVE_PROGRESS[status] ?? 0;
    if (!pct)
        return null;
    return (_jsx("div", { className: "mt-3", children: _jsx("div", { className: "h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-700", style: { width: `${pct}%` } }) }) }));
}
export default function OrdersPage() {
    const { user } = useAuth();
    const [, navigate] = useLocation();
    const [tab, setTab] = useState("active");
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["/api/orders"],
        queryFn: () => authFetchJson("/api/orders"),
        enabled: !!user,
        refetchInterval: 15000,
    });
    const { data: restaurants = [] } = useQuery({ queryKey: ["/api/restaurants"] });
    const restaurantMap = new Map(restaurants.map(r => [r.id, r]));
    const activeStatuses = ["pending", "confirmed", "preparing", "ready", "picked_up"];
    const activeOrders = orders.filter(o => activeStatuses.includes(o.status));
    const pastOrders = orders.filter(o => !activeStatuses.includes(o.status));
    const displayed = tab === "active" ? activeOrders : pastOrders;
    const getItemCount = (order) => {
        const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
        return items.reduce((s, i) => s + (i.qty || 1), 0);
    };
    if (!user) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24", style: { fontFamily: "system-ui, -apple-system, sans-serif" }, children: [_jsx(ClientNav, {}), _jsxs("div", { className: "flex flex-col items-center justify-center pt-32 px-8 text-center", children: [_jsx("div", { className: "w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-5", children: _jsx(ShoppingBag, { size: 36, className: "text-red-400" }) }), _jsx("p", { className: "font-bold text-gray-900 dark:text-white text-lg", children: "Connexion requise" }), _jsx("p", { className: "text-gray-400 dark:text-gray-500 text-sm mt-1", children: "Connectez-vous pour voir vos commandes" }), _jsx("button", { onClick: () => navigate("/login"), className: "mt-6 bg-red-600 text-white px-6 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-transform", "data-testid": "button-login-orders", children: "Se connecter" })] })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24", style: { fontFamily: "system-ui, -apple-system, sans-serif" }, children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 pt-5", children: [_jsxs("div", { className: "mb-5", children: [_jsx("h1", { className: "font-bold text-gray-900 dark:text-white", style: { fontSize: 22 }, children: "Mes Commandes" }), _jsxs("p", { className: "text-gray-400 dark:text-gray-500 mt-0.5", style: { fontSize: 13 }, children: [activeOrders.length, " en cours \u00B7 ", pastOrders.length, " termin\u00E9e", pastOrders.length !== 1 ? "s" : ""] })] }), _jsx("div", { className: "flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl", children: [
                            { key: "active", label: "En cours", count: activeOrders.length },
                            { key: "history", label: "Historique", count: pastOrders.length },
                        ].map(t => (_jsxs("button", { onClick: () => setTab(t.key), "data-testid": `tab-${t.key}`, className: "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-all active:scale-95", style: {
                                fontSize: 13,
                                background: tab === t.key ? "#fff" : "transparent",
                                color: tab === t.key ? "#111827" : "#9CA3AF",
                                boxShadow: tab === t.key ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
                            }, children: [t.label, t.count > 0 && (_jsx("span", { className: "min-w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold px-1.5", style: {
                                        background: tab === t.key ? "#dc2626" : "#E5E7EB",
                                        color: tab === t.key ? "#fff" : "#6B7280",
                                    }, children: t.count }))] }, t.key))) }), isLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map(i => (_jsx("div", { className: "bg-white dark:bg-gray-900 rounded-3xl p-5", style: { boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }, children: _jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "w-14 h-14 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl flex-shrink-0" }), _jsxs("div", { className: "flex-1 space-y-2 pt-1", children: [_jsx("div", { className: "h-4 w-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" }), _jsx("div", { className: "h-3 w-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" }), _jsx("div", { className: "h-3 w-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" })] })] }) }, i))) })) : displayed.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center pt-16 text-center", children: [_jsx("div", { className: "w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-5", children: tab === "active" ? (_jsx(Bike, { size: 40, className: "text-gray-300" })) : (_jsx(Package, { size: 40, className: "text-gray-300" })) }), _jsx("p", { className: "font-bold text-gray-800 dark:text-gray-100 text-base", "data-testid": "text-empty-orders", children: tab === "active" ? "Aucune commande en cours" : "Aucune commande passée" }), _jsx("p", { className: "text-gray-400 dark:text-gray-500 text-sm mt-1", children: tab === "active" ? "Commandez chez l'un de nos restaurants" : "Vos commandes passées apparaîtront ici" }), tab === "active" && (_jsx("button", { onClick: () => navigate("/"), className: "mt-5 bg-red-600 text-white px-7 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-transform", "data-testid": "button-order-now", children: "D\u00E9couvrir les restaurants" }))] })) : (_jsx("div", { className: "space-y-3", children: displayed.map(order => {
                            const itemCount = getItemCount(order);
                            const restaurant = restaurantMap.get(order.restaurantId);
                            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                            const isActive = activeStatuses.includes(order.status);
                            return (_jsxs("button", { onClick: () => navigate(`/order/${order.id}`), "data-testid": `order-card-${order.id}`, className: "w-full bg-white dark:bg-gray-900 rounded-3xl p-4 text-left active:scale-[0.98] transition-transform", style: { boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }, children: [_jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center", children: restaurant?.logoUrl ? (_jsx("img", { src: restaurant.logoUrl, alt: restaurant.name, className: "w-full h-full object-cover", loading: "lazy" })) : restaurant?.image ? (_jsx("img", { src: restaurant.image, alt: restaurant.name ?? "", className: "w-full h-full object-cover", loading: "lazy" })) : (_jsx(ShoppingBag, { size: 22, className: "text-gray-300" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2 mb-1.5", children: [_jsx("p", { className: "font-bold text-gray-900 dark:text-white truncate", style: { fontSize: 14 }, children: restaurant?.name || "Restaurant" }), _jsx(ChevronRight, { size: 16, className: "text-gray-300 flex-shrink-0 mt-0.5" })] }), _jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold", style: { fontSize: 10, color: cfg.color, background: cfg.bg }, children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full flex-shrink-0", style: { background: cfg.dot } }), cfg.label] }), _jsxs("div", { className: "flex items-center gap-2 mt-2 flex-wrap", children: [_jsxs("div", { className: "flex items-center gap-1 text-gray-400 dark:text-gray-500", children: [_jsx(Clock, { size: 11, strokeWidth: 1.8 }), _jsx("span", { style: { fontSize: 11 }, children: formatDate(order.createdAt) })] }), _jsx("div", { className: "w-px h-3 bg-gray-200" }), _jsxs("span", { className: "text-gray-400 dark:text-gray-500", style: { fontSize: 11 }, children: [itemCount, " article", itemCount > 1 ? "s" : ""] }), _jsx("div", { className: "w-px h-3 bg-gray-200" }), _jsx("span", { className: "font-bold text-red-600", style: { fontSize: 13 }, children: formatPrice(order.total) })] })] })] }), isActive && _jsx(OrderProgressBar, { status: order.status }), order.status === "delivered" && (_jsxs("div", { className: "mt-3 flex items-center gap-1.5", children: [_jsx(Star, { size: 12, className: "fill-amber-400 text-amber-400" }), _jsx("span", { style: { fontSize: 11, color: "#92400E", fontWeight: 600 }, children: "Notez votre commande" })] }))] }, order.id));
                        }) }))] })] }));
}
//# sourceMappingURL=OrdersPage.js.map