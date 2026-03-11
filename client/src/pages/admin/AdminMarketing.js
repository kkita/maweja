import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "../../lib/queryClient";
import { formatPrice } from "../../lib/utils";
import AdminLayout from "../../components/AdminLayout";
import { TrendingUp, Clock, Star, DollarSign, CheckCircle, XCircle, ShoppingBag, Truck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
const PIE_COLORS = ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca", "#b91c1c", "#991b1b", "#7f1d1d"];
const paymentLabels = {
    mobile_money: "Mobile Money",
    cash: "Cash",
    illico_cash: "Illico Cash",
    wallet: "Wallet",
    card: "Carte",
    google_pay: "Google Pay",
    pos: "POS",
    credit_card: "Carte Credit",
    loyalty: "Fidelite",
};
function getDefaultDates() {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return {
        dateFrom: from.toISOString().split("T")[0],
        dateTo: to.toISOString().split("T")[0],
    };
}
export default function AdminMarketing() {
    const defaults = getDefaultDates();
    const [dateFrom, setDateFrom] = useState(defaults.dateFrom);
    const [dateTo, setDateTo] = useState(defaults.dateTo);
    const { data, isLoading } = useQuery({
        queryKey: ["/api/analytics/marketing", dateFrom, dateTo],
        queryFn: () => authFetch(`/api/analytics/marketing?dateFrom=${dateFrom}&dateTo=${dateTo}`).then((r) => r.json()),
    });
    const hourData = (data?.ordersByHour || []).map((val, i) => ({ hour: `${i}h`, orders: val }));
    const pieData = Object.entries(data?.paymentBreakdown || {}).map(([key, value]) => ({
        name: paymentLabels[key] || key,
        value,
    }));
    const totalPie = pieData.reduce((s, p) => s + p.value, 0);
    const renderStars = (rating) => {
        const full = Math.floor(rating);
        const stars = [];
        for (let i = 0; i < 5; i++) {
            stars.push(_jsx(Star, { size: 14, className: i < full ? "text-yellow-400 fill-yellow-400" : "text-gray-300" }, i));
        }
        return _jsx("div", { className: "flex items-center gap-0.5", children: stars });
    };
    const Skeleton = () => (_jsxs("div", { className: "space-y-6", "data-testid": "loading-skeleton", children: [_jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: Array.from({ length: 8 }).map((_, i) => (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-2/3 mb-3" }), _jsx("div", { className: "h-8 bg-gray-200 rounded w-1/2" })] }, i))) }), _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: Array.from({ length: 4 }).map((_, i) => (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-1/3 mb-4" }), _jsx("div", { className: "h-64 bg-gray-100 rounded-xl" })] }, i))) })] }));
    const kpis = data?.kpis;
    const kpiCards = kpis
        ? [
            { label: "Commandes totales", value: kpis.totalOrders.toString(), icon: TrendingUp, color: "text-red-600 bg-red-50" },
            { label: "Taux de livraison a temps", value: `${kpis.onTimeRate}%`, icon: Clock, color: "text-blue-600 bg-blue-50" },
            { label: "Satisfaction client", value: `${kpis.avgRating}/5`, icon: Star, color: "text-yellow-600 bg-yellow-50" },
            { label: "Chiffre d'affaires", value: formatPrice(kpis.totalRevenue), icon: DollarSign, color: "text-green-600 bg-green-50" },
            { label: "Commandes livrees", value: kpis.deliveredOrders.toString(), icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
            { label: "Commandes annulees", value: kpis.cancelledOrders.toString(), icon: XCircle, color: "text-red-600 bg-red-50" },
            { label: "Panier moyen", value: formatPrice(kpis.avgOrderAmount), icon: ShoppingBag, color: "text-purple-600 bg-purple-50" },
            { label: "Cout moyen livraison", value: formatPrice(kpis.avgDeliveryCost), icon: Truck, color: "text-orange-600 bg-orange-50" },
        ]
        : [];
    return (_jsx(AdminLayout, { title: "Marketing & Analytics", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-4", "data-testid": "date-filter", children: [_jsx("label", { className: "text-sm font-medium text-gray-600", children: "Du" }), _jsx("input", { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), className: "border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent", "data-testid": "input-date-from" }), _jsx("label", { className: "text-sm font-medium text-gray-600", children: "Au" }), _jsx("input", { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), className: "border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent", "data-testid": "input-date-to" })] }), isLoading ? (_jsx(Skeleton, {})) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: kpiCards.map((kpi, i) => {
                                const Icon = kpi.icon;
                                return (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5", "data-testid": `kpi-card-${i}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-3", children: [_jsx("span", { className: "text-xs font-medium text-gray-500", children: kpi.label }), _jsx("div", { className: `w-8 h-8 rounded-xl flex items-center justify-center ${kpi.color}`, children: _jsx(Icon, { size: 16 }) })] }), _jsx("p", { className: "text-xl font-bold text-gray-900", "data-testid": `kpi-value-${i}`, children: kpi.value })] }, i));
                            }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 mb-4", children: "Tendance Revenus & Commandes" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: data?.dailyTrend || [], children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f3f4f6" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 11 }, stroke: "#9ca3af" }), _jsx(YAxis, { tick: { fontSize: 11 }, stroke: "#9ca3af" }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "orders", fill: "#dc2626", radius: [6, 6, 0, 0], name: "Commandes" }), _jsx(Bar, { dataKey: "revenue", fill: "#9ca3af", radius: [6, 6, 0, 0], name: "Revenus" })] }) })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 mb-4", children: "Commandes par Heure" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: hourData, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "redGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#dc2626", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#dc2626", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f3f4f6" }), _jsx(XAxis, { dataKey: "hour", tick: { fontSize: 11 }, stroke: "#9ca3af" }), _jsx(YAxis, { tick: { fontSize: 11 }, stroke: "#9ca3af" }), _jsx(Tooltip, {}), _jsx(Area, { type: "monotone", dataKey: "orders", stroke: "#dc2626", fill: "url(#redGrad)", strokeWidth: 2, name: "Commandes" })] }) })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 mb-4", children: "Top 10 Produits" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: (data?.topProducts || []).slice(0, 10), layout: "vertical", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "redBarGrad", x1: "0", y1: "0", x2: "1", y2: "0", children: [_jsx("stop", { offset: "0%", stopColor: "#dc2626", stopOpacity: 1 }), _jsx("stop", { offset: "100%", stopColor: "#f87171", stopOpacity: 1 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f3f4f6" }), _jsx(XAxis, { type: "number", tick: { fontSize: 11 }, stroke: "#9ca3af" }), _jsx(YAxis, { dataKey: "name", type: "category", width: 120, tick: { fontSize: 11 }, stroke: "#9ca3af" }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "count", fill: "url(#redBarGrad)", radius: [0, 6, 6, 0], name: "Quantite" })] }) })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 mb-4", children: "Modes de Paiement" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, cx: "50%", cy: "50%", outerRadius: 100, dataKey: "value", label: ({ name, value }) => `${name} ${totalPie > 0 ? Math.round((value / totalPie) * 100) : 0}%`, children: pieData.map((_, i) => (_jsx(Cell, { fill: PIE_COLORS[i % PIE_COLORS.length] }, i))) }), _jsx(Tooltip, {})] }) })] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 mb-4", children: "Top Clients" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", "data-testid": "table-top-clients", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-100", children: [_jsx("th", { className: "text-left py-3 px-4 text-gray-500 font-medium", children: "Rang" }), _jsx("th", { className: "text-left py-3 px-4 text-gray-500 font-medium", children: "Nom" }), _jsx("th", { className: "text-left py-3 px-4 text-gray-500 font-medium", children: "Email" }), _jsx("th", { className: "text-right py-3 px-4 text-gray-500 font-medium", children: "Commandes" }), _jsx("th", { className: "text-right py-3 px-4 text-gray-500 font-medium", children: "Total depense" }), _jsx("th", { className: "text-right py-3 px-4 text-gray-500 font-medium", children: "Panier moyen" })] }) }), _jsx("tbody", { children: (data?.topClients || []).map((client, i) => (_jsxs("tr", { className: i % 2 === 0 ? "bg-gray-50/50" : "bg-white", "data-testid": `row-client-${client.id}`, children: [_jsx("td", { className: "py-3 px-4 font-semibold text-gray-900", children: i + 1 }), _jsx("td", { className: "py-3 px-4 text-gray-900", children: client.name }), _jsx("td", { className: "py-3 px-4 text-gray-500", children: client.email }), _jsx("td", { className: "py-3 px-4 text-right text-gray-900", children: client.orderCount }), _jsx("td", { className: "py-3 px-4 text-right text-gray-900", children: formatPrice(client.totalSpent) }), _jsx("td", { className: "py-3 px-4 text-right text-gray-900", children: formatPrice(client.avgOrder) })] }, client.id))) })] }) })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 mb-4", children: "Performance des Livreurs" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", "data-testid": "table-driver-performance", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-100", children: [_jsx("th", { className: "text-left py-3 px-4 text-gray-500 font-medium", children: "Nom" }), _jsx("th", { className: "text-right py-3 px-4 text-gray-500 font-medium", children: "Livraisons" }), _jsx("th", { className: "text-right py-3 px-4 text-gray-500 font-medium", children: "Taux ponctualite" }), _jsx("th", { className: "text-left py-3 px-4 text-gray-500 font-medium", children: "Note moyenne" }), _jsx("th", { className: "text-center py-3 px-4 text-gray-500 font-medium", children: "Statut" })] }) }), _jsx("tbody", { children: (data?.driverPerformance || []).map((driver, i) => {
                                                    const rateColor = driver.onTimeRate > 80
                                                        ? "text-green-600"
                                                        : driver.onTimeRate >= 50
                                                            ? "text-orange-500"
                                                            : "text-red-600";
                                                    return (_jsxs("tr", { className: i % 2 === 0 ? "bg-gray-50/50" : "bg-white", "data-testid": `row-driver-${driver.id}`, children: [_jsx("td", { className: "py-3 px-4 text-gray-900 font-medium", children: driver.name }), _jsx("td", { className: "py-3 px-4 text-right text-gray-900", children: driver.deliveries }), _jsxs("td", { className: `py-3 px-4 text-right font-semibold ${rateColor}`, children: [driver.onTimeRate, "%"] }), _jsx("td", { className: "py-3 px-4", children: _jsxs("div", { className: "flex items-center gap-1", children: [renderStars(driver.avgRating), _jsx("span", { className: "text-gray-500 ml-1", children: driver.avgRating.toFixed(1) })] }) }), _jsx("td", { className: "py-3 px-4 text-center", children: _jsxs("span", { className: `inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${driver.isOnline
                                                                        ? "bg-green-50 text-green-700"
                                                                        : "bg-gray-100 text-gray-500"}`, "data-testid": `status-driver-${driver.id}`, children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full ${driver.isOnline ? "bg-green-500" : "bg-gray-400"}` }), driver.isOnline ? "En ligne" : "Hors ligne"] }) })] }, driver.id));
                                                }) })] }) })] })] }))] }) }));
}
//# sourceMappingURL=AdminMarketing.js.map