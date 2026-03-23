import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { authFetchJson } from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { Package, MapPin, Clock, CheckCircle2, Truck, RotateCcw } from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors } from "../../lib/utils";
const TAB_FILTERS = [
    { key: "active", label: "En cours", status: ["picked_up", "on_way", "ready"] },
    { key: "delivered", label: "Livrés", status: ["delivered"] },
    { key: "all", label: "Tous" },
];
function OrderCard({ order }) {
    const statusBg = {
        delivered: "bg-green-50 border-green-200",
        picked_up: "bg-blue-50 border-blue-200",
        on_way: "bg-orange-50 border-orange-200",
        ready: "bg-amber-50 border-amber-200",
        default: "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800",
    };
    const bg = statusBg[order.status] || statusBg.default;
    const icons = {
        delivered: CheckCircle2,
        picked_up: Truck,
        on_way: Truck,
        ready: Clock,
    };
    const StatusIcon = icons[order.status] || Package;
    return (_jsxs("div", { className: `rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] ${bg}`, "data-testid": `driver-order-${order.id}`, children: [_jsxs("div", { className: "flex items-start justify-between gap-2 mb-3", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: `w-9 h-9 rounded-xl flex items-center justify-center ${order.status === "delivered" ? "bg-green-100" :
                                    order.status === "on_way" || order.status === "picked_up" ? "bg-blue-100" :
                                        "bg-amber-100"}`, children: _jsx(StatusIcon, { size: 18, className: order.status === "delivered" ? "text-green-600" :
                                        order.status === "on_way" || order.status === "picked_up" ? "text-blue-600" :
                                            "text-amber-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-black text-sm text-gray-900 dark:text-white", children: order.orderNumber }), _jsx("p", { className: "text-[10px] text-gray-400 dark:text-gray-500 font-medium", children: formatDate(order.createdAt) })] })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx("span", { className: `text-[10px] font-bold px-2.5 py-1 rounded-lg ${statusColors[order.status]}`, children: statusLabels[order.status] }) })] }), _jsxs("div", { className: "flex items-start gap-2 mb-3", children: [_jsx(MapPin, { size: 13, className: "text-red-400 mt-0.5 flex-shrink-0" }), _jsx("p", { className: "text-xs text-gray-600 dark:text-gray-300 line-clamp-2", children: order.deliveryAddress })] }), _jsxs("div", { className: "flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[10px] text-gray-400 dark:text-gray-500 font-medium", children: "Commission livreur" }), _jsxs("p", { className: "text-sm font-black text-gray-900 dark:text-white", children: [formatPrice(Math.round(order.total * 0.15)), _jsxs("span", { className: "text-[10px] text-gray-400 dark:text-gray-500 font-normal ml-1", children: ["/ ", formatPrice(order.total), " total"] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-[10px] text-gray-400 dark:text-gray-500 font-medium", children: "Articles" }), _jsxs("p", { className: "text-sm font-bold text-gray-700 dark:text-gray-200", children: [order.items?.length || 0, " article", (order.items?.length || 0) > 1 ? "s" : ""] })] })] })] }));
}
function SkeletonCard() {
    return (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "w-9 h-9 rounded-xl bg-gray-200" }), _jsxs("div", { children: [_jsx("div", { className: "h-3.5 w-24 bg-gray-200 rounded mb-1.5" }), _jsx("div", { className: "h-2.5 w-16 bg-gray-100 dark:bg-gray-800 rounded" })] })] }), _jsx("div", { className: "h-3 w-full bg-gray-100 dark:bg-gray-800 rounded mb-4" }), _jsx("div", { className: "h-3 w-2/3 bg-gray-100 dark:bg-gray-800 rounded" })] }));
}
export default function DriverOrders() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("active");
    const { data: orders = [], isLoading, refetch } = useQuery({
        queryKey: ["/api/orders", { driverId: user?.id }],
        queryFn: () => authFetchJson(`/api/orders?driverId=${user?.id}`),
        enabled: !!user,
        refetchInterval: 10000,
    });
    const filtered = orders.filter(o => {
        const tab = TAB_FILTERS.find(t => t.key === activeTab);
        if (!tab?.status)
            return true;
        return tab.status.includes(o.status);
    });
    const activeCount = orders.filter(o => ["picked_up", "on_way", "ready"].includes(o.status)).length;
    const deliveredCount = orders.filter(o => o.status === "delivered").length;
    const totalEarnings = orders
        .filter(o => o.status === "delivered")
        .reduce((sum, o) => sum + Math.round(o.total * 0.15), 0);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-28", children: [_jsx(DriverNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-5", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-black text-gray-900 dark:text-white", children: "Mes livraisons" }), _jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5", children: [orders.length, " livraison", orders.length !== 1 ? "s" : "", " au total"] })] }), _jsx("button", { onClick: () => refetch(), className: "w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 active:scale-90 transition-all shadow-sm", "data-testid": "button-refresh-orders", children: _jsx(RotateCcw, { size: 15 }) })] }), _jsx("div", { className: "grid grid-cols-3 gap-2 mb-5", children: [
                            { label: "En cours", value: activeCount, color: "text-blue-600", bg: "bg-blue-50" },
                            { label: "Livrés", value: deliveredCount, color: "text-green-600", bg: "bg-green-50" },
                            { label: "Gains", value: `$${totalEarnings}`, color: "text-red-600", bg: "bg-red-50" },
                        ].map((stat, i) => (_jsxs("div", { className: `${stat.bg} rounded-2xl p-3 text-center`, "data-testid": `stat-driver-${stat.label.toLowerCase()}`, children: [_jsx("p", { className: `text-xl font-black ${stat.color}`, children: stat.value }), _jsx("p", { className: "text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 font-semibold mt-0.5", children: stat.label })] }, i))) }), _jsx("div", { className: "flex gap-2 mb-5 bg-white dark:bg-gray-900 rounded-2xl p-1.5 border border-gray-100 dark:border-gray-800 shadow-sm", children: TAB_FILTERS.map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.key), "data-testid": `tab-orders-${tab.key}`, className: `flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.key
                                ? "bg-red-600 text-white shadow-md shadow-red-200"
                                : "text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:bg-gray-800/60:bg-gray-800"}`, children: tab.label }, tab.key))) }), isLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => _jsx(SkeletonCard, {}, i)) })) : filtered.length === 0 ? (_jsxs("div", { className: "text-center py-20", children: [_jsx("div", { className: "w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Package, { size: 32, className: "text-gray-300" }) }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium", children: "Aucune livraison" }), _jsx("p", { className: "text-gray-400 dark:text-gray-500 text-sm mt-1", children: activeTab === "active" ? "Pas de livraison en cours" : "Aucune livraison dans cette catégorie" })] })) : (_jsx("div", { className: "space-y-3", children: filtered.map((order) => (_jsx(OrderCard, { order: order }, order.id))) }))] })] }));
}
//# sourceMappingURL=DriverOrders.js.map