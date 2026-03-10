import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { onWSMessage } from "../../lib/websocket";
import { queryClient, authFetch } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Package, Truck, Users, DollarSign, TrendingUp, Clock, CheckCircle2, ArrowUpRight } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { statusLabels, statusColors, formatDate } from "../../lib/utils";
export default function AdminDashboard() {
    const { toast } = useToast();
    const { data: stats } = useQuery({ queryKey: ["/api/dashboard/stats"] });
    const { data: recentOrders = [] } = useQuery({
        queryKey: ["/api/orders"],
        queryFn: () => authFetch("/api/orders").then((r) => r.json()),
    });
    useEffect(() => {
        return onWSMessage((data) => {
            if (data.type === "new_order") {
                toast({ title: "Nouvelle commande!", description: `Commande ${data.order.orderNumber} recue` });
                queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
            }
            if (data.type === "order_updated") {
                queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
            }
        });
    }, [toast]);
    const statCards = [
        { label: "Commandes totales", value: stats?.orders?.total || 0, icon: Package, color: "bg-red-50 text-red-600", trend: "+15%" },
        { label: "Commandes actives", value: stats?.orders?.active || 0, icon: Clock, color: "bg-orange-50 text-orange-600", trend: "" },
        { label: "Livreurs en ligne", value: `${stats?.drivers?.online || 0}/${stats?.drivers?.total || 0}`, icon: Truck, color: "bg-green-50 text-green-600", trend: "" },
        { label: "Revenus", value: formatPrice(Number(stats?.orders?.revenue) || 0), icon: DollarSign, color: "bg-blue-50 text-blue-600", trend: "+22%" },
        { label: "Livrees", value: stats?.orders?.delivered || 0, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", trend: "" },
        { label: "Clients", value: stats?.clients?.total || 0, icon: Users, color: "bg-purple-50 text-purple-600", trend: "+8%" },
    ];
    return (_jsxs(AdminLayout, { title: "Dashboard", children: [_jsx("div", { className: "grid grid-cols-3 gap-4 mb-8", children: statCards.map((card) => (_jsxs("div", { className: "bg-white rounded-2xl p-5 border border-gray-100 shadow-sm", "data-testid": `stat-${card.label.toLowerCase().replace(/\s/g, "-")}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: `w-11 h-11 ${card.color.split(" ")[0]} rounded-xl flex items-center justify-center`, children: _jsx(card.icon, { size: 20, className: card.color.split(" ")[1] }) }), card.trend && (_jsxs("span", { className: "text-xs font-semibold text-green-600 flex items-center gap-0.5", children: [_jsx(ArrowUpRight, { size: 12 }), " ", card.trend] }))] }), _jsx("p", { className: "text-2xl font-black text-gray-900", children: card.value }), _jsx("p", { className: "text-xs text-gray-500 font-medium mt-1", children: card.label })] }, card.label))) }), _jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-100 flex items-center justify-between", children: [_jsx("h3", { className: "font-bold text-gray-900", children: "Commandes recentes" }), _jsxs("span", { className: "text-xs text-gray-400", children: [recentOrders.length, " commandes"] })] }), _jsx("div", { className: "divide-y divide-gray-50 max-h-96 overflow-y-auto", children: recentOrders.slice(0, 10).map((order) => (_jsxs("div", { className: "px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors", "data-testid": `recent-order-${order.id}`, children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-sm text-gray-900", children: order.orderNumber }), _jsx("p", { className: "text-xs text-gray-400", children: formatDate(order.createdAt) })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "font-bold text-sm", children: formatPrice(order.total) }), _jsx("span", { className: `text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`, children: statusLabels[order.status] })] })] }, order.id))) })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5", children: [_jsx("h3", { className: "font-bold text-gray-900 mb-4", children: "Performance" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { className: "text-gray-500", children: "Taux de livraison" }), _jsxs("span", { className: "font-bold", children: [stats?.orders?.total ? Math.round((Number(stats.orders.delivered) / Number(stats.orders.total)) * 100) : 0, "%"] })] }), _jsx("div", { className: "w-full bg-gray-100 rounded-full h-2", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full transition-all", style: { width: `${stats?.orders?.total ? (Number(stats.orders.delivered) / Number(stats.orders.total)) * 100 : 0}%` } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { className: "text-gray-500", children: "Livreurs actifs" }), _jsxs("span", { className: "font-bold", children: [stats?.drivers?.total ? Math.round((Number(stats.drivers.online) / Number(stats.drivers.total)) * 100) : 0, "%"] })] }), _jsx("div", { className: "w-full bg-gray-100 rounded-full h-2", children: _jsx("div", { className: "bg-blue-500 h-2 rounded-full transition-all", style: { width: `${stats?.drivers?.total ? (Number(stats.drivers.online) / Number(stats.drivers.total)) * 100 : 0}%` } }) })] })] })] }), _jsxs("div", { className: "bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-5 text-white", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(TrendingUp, { size: 18 }), _jsx("span", { className: "font-bold text-sm", children: "MAWEJA Pro" })] }), _jsx("p", { className: "text-2xl font-black", children: formatPrice(Number(stats?.orders?.revenue) || 0) }), _jsx("p", { className: "text-red-200 text-xs mt-1", children: "Chiffre d'affaires total" })] })] })] })] }));
}
//# sourceMappingURL=AdminDashboard.js.map