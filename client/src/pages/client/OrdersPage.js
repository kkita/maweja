import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { authFetch } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import { ChevronRight, Package } from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors } from "../../lib/utils";
export default function OrdersPage() {
    const { user } = useAuth();
    const [, navigate] = useLocation();
    const [tab, setTab] = useState("active");
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["/api/orders"],
        queryFn: () => authFetch("/api/orders").then((r) => r.json()),
        enabled: !!user,
    });
    const { data: restaurants = [] } = useQuery({
        queryKey: ["/api/restaurants"],
    });
    const restaurantMap = new Map(restaurants.map((r) => [r.id, r.name]));
    const activeStatuses = ["pending", "confirmed", "preparing", "ready", "picked_up"];
    const pastStatuses = ["delivered", "cancelled"];
    const activeOrders = orders.filter((o) => activeStatuses.includes(o.status));
    const pastOrders = orders.filter((o) => pastStatuses.includes(o.status));
    const displayedOrders = tab === "active" ? activeOrders : pastOrders;
    const getItemCount = (order) => {
        const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
        return items.reduce((sum, item) => sum + (item.qty || 1), 0);
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 mb-4", children: "Mes Commandes" }), _jsxs("div", { className: "flex gap-2 mb-6", children: [_jsxs("button", { "data-testid": "tab-active", onClick: () => setTab("active"), className: `flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${tab === "active"
                                    ? "bg-red-600 text-white shadow-lg shadow-red-200"
                                    : "bg-white text-gray-500 border border-gray-200"}`, children: ["En cours (", activeOrders.length, ")"] }), _jsxs("button", { "data-testid": "tab-history", onClick: () => setTab("history"), className: `flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${tab === "history"
                                    ? "bg-red-600 text-white shadow-lg shadow-red-200"
                                    : "bg-white text-gray-500 border border-gray-200"}`, children: ["Historique (", pastOrders.length, ")"] })] }), isLoading ? (_jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => (_jsx("div", { className: "bg-white rounded-2xl h-28 animate-pulse" }, i))) })) : displayedOrders.length === 0 ? (_jsxs("div", { className: "text-center pt-20", children: [_jsx("div", { className: "w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-4", children: _jsx(Package, { size: 36, className: "text-red-300" }) }), _jsx("h3", { className: "font-bold text-gray-900", children: "Aucune commande" }), _jsx("p", { className: "text-gray-500 text-sm mt-2", children: tab === "active"
                                    ? "Vous n'avez pas de commande en cours"
                                    : "Aucune commande dans l'historique" }), tab === "active" && (_jsx("button", { onClick: () => navigate("/"), "data-testid": "button-order-now", className: "mt-4 bg-red-600 text-white px-6 py-3 rounded-2xl font-semibold text-sm", children: "Commander maintenant" }))] })) : (_jsx("div", { className: "space-y-3", children: displayedOrders.map((order) => {
                            const itemCount = getItemCount(order);
                            const restaurantName = restaurantMap.get(order.restaurantId) || "Restaurant";
                            return (_jsxs("button", { onClick: () => navigate(`/order/${order.id}`), "data-testid": `order-card-${order.id}`, className: "w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all text-left", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-2", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "font-bold text-sm text-gray-900", children: order.orderNumber }), _jsx("span", { className: `text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`, children: statusLabels[order.status] })] }), _jsx(ChevronRight, { size: 16, className: "text-gray-300 flex-shrink-0" })] }), _jsx("p", { className: "text-xs text-gray-600 font-medium mb-1", children: restaurantName }), _jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-xs text-gray-500", children: formatDate(order.createdAt) }), _jsxs("span", { className: "text-xs text-gray-400", children: [itemCount, " article", itemCount > 1 ? "s" : ""] })] }), _jsx("span", { className: "font-bold text-red-600 text-sm", children: formatPrice(order.total) })] })] }, order.id));
                        }) }))] })] }));
}
//# sourceMappingURL=OrdersPage.js.map