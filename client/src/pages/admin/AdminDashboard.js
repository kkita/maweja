import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "../../components/AdminLayout";
import { onWSMessage } from "../../lib/websocket";
import { queryClient, authFetchJson } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useI18n } from "../../lib/i18n";
import { Package, Truck, Users, DollarSign, TrendingUp, CheckCircle2, ArrowUpRight, Store, UtensilsCrossed, Zap, Activity, ChevronRight, ShoppingBag, Layers, AlertCircle, BarChart2, Calendar, } from "lucide-react";
import { formatPrice, statusLabels, statusColors, formatDate } from "../../lib/utils";
function AnimatedNumber({ value }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (value === 0) {
            setDisplay(0);
            return;
        }
        let start = 0;
        const duration = 900;
        const step = value / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= value) {
                setDisplay(value);
                clearInterval(timer);
            }
            else
                setDisplay(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return _jsx(_Fragment, { children: display.toLocaleString() });
}
function StatCard({ label, value, icon: Icon, color, trend, delay = 0, isRevenue = false, subtitle }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);
    const numVal = typeof value === "string" ? value : Number(value) || 0;
    return (_jsxs("div", { "data-testid": `stat-${label.toLowerCase().replace(/\s+/g, "-")}`, className: `bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default group ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`, style: { transitionDelay: `${delay}ms` }, children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("div", { className: `w-11 h-11 ${color.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`, children: _jsx(Icon, { size: 20, className: color.text }) }), trend && (_jsxs("span", { className: "text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg flex items-center gap-0.5", children: [_jsx(ArrowUpRight, { size: 10 }), " ", trend] }))] }), _jsx("p", { className: "text-2xl font-black text-gray-900 dark:text-white leading-none mb-1", children: typeof numVal === "string" ? numVal : isRevenue ? formatPrice(numVal) : _jsx(AnimatedNumber, { value: numVal }) }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 font-medium", children: label }), subtitle && _jsx("p", { className: "text-[10px] text-gray-400 dark:text-gray-500 mt-0.5", children: subtitle })] }));
}
function LiveIndicator() {
    const [pulse, setPulse] = useState(true);
    useEffect(() => {
        const t = setInterval(() => setPulse(p => !p), 1500);
        return () => clearInterval(t);
    }, []);
    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-2 h-2 rounded-full bg-emerald-500 transition-opacity duration-700 ${pulse ? "opacity-100" : "opacity-30"}` }), _jsx("span", { className: "text-xs font-semibold text-emerald-600 dark:text-emerald-400", children: "En direct" })] }));
}
function ProgressBar({ value, max, color = "bg-red-500", delay = 0 }) {
    const [width, setWidth] = useState(0);
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    useEffect(() => {
        const t = setTimeout(() => setWidth(pct), delay + 300);
        return () => clearTimeout(t);
    }, [pct, delay]);
    return (_jsx("div", { className: "w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden", children: _jsx("div", { className: `${color} h-2 rounded-full transition-all duration-1000 ease-out`, style: { width: `${width}%` } }) }));
}
const QUICK_ACTIONS = [
    { label: "Commandes", icon: ShoppingBag, color: "bg-red-50 dark:bg-red-950/30 text-red-600", href: "/admin/orders" },
    { label: "Restaurants", icon: Store, color: "bg-orange-50 dark:bg-orange-950/30 text-orange-600", href: "/admin/restaurants" },
    { label: "Livreurs", icon: Truck, color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600", href: "/admin/drivers" },
    { label: "Services", icon: Layers, color: "bg-purple-50 dark:bg-purple-950/30 text-purple-600", href: "/admin/services" },
];
export default function AdminDashboard() {
    const { toast } = useToast();
    const { t } = useI18n();
    const [, navigate] = useLocation();
    const [loaded, setLoaded] = useState(false);
    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-CD", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 50);
        return () => clearTimeout(timer);
    }, []);
    const { data: stats } = useQuery({ queryKey: ["/api/dashboard/stats"] });
    const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
        queryKey: ["/api/orders"],
        queryFn: () => authFetchJson("/api/orders"),
    });
    useEffect(() => {
        return onWSMessage((data) => {
            if (data.type === "new_order") {
                toast({ title: "Nouvelle commande !", description: `Commande ${data.order?.orderNumber}` });
                queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
            }
            if (data.type === "order_updated") {
                queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
            }
        });
    }, [toast]);
    const todayOrders = Number(stats?.orders?.todayOrders) || 0;
    const todayRevenue = Number(stats?.orders?.todayRevenue) || 0;
    const pendingCount = Number(stats?.orders?.pending) || 0;
    const cancelledCount = Number(stats?.orders?.cancelled) || 0;
    const statCards = [
        {
            label: t.admin.totalOrders, value: stats?.orders?.total || 0, icon: Package,
            color: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-600" }, trend: "+15%",
            subtitle: `${todayOrders} aujourd'hui`,
        },
        {
            label: t.admin.activeOrders, value: stats?.orders?.active || 0, icon: Activity,
            color: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600" },
            subtitle: pendingCount > 0 ? `${pendingCount} en attente` : undefined,
        },
        {
            label: t.admin.driversOnline, value: `${stats?.drivers?.online || 0}/${stats?.drivers?.total || 0}`, icon: Truck,
            color: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600" },
            subtitle: `${stats?.drivers?.total || 0} livreurs inscrits`,
        },
        {
            label: t.admin.revenue, value: Number(stats?.orders?.revenue) || 0, icon: DollarSign,
            color: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600" }, trend: "+22%", isRevenue: true,
            subtitle: `${formatPrice(todayRevenue)} aujourd'hui`,
        },
        {
            label: t.admin.delivered, value: stats?.orders?.delivered || 0, icon: CheckCircle2,
            color: { bg: "bg-teal-50 dark:bg-teal-950/30", text: "text-teal-600" },
            subtitle: cancelledCount > 0 ? `${cancelledCount} annulées` : undefined,
        },
        {
            label: t.admin.clients, value: stats?.clients?.total || 0, icon: Users,
            color: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600" }, trend: "+8%",
            subtitle: `${stats?.restaurants?.active || 0}/${stats?.restaurants?.total || 0} restaurants actifs`,
        },
    ];
    return (_jsx(AdminLayout, { title: t.admin.dashboard, children: _jsxs("div", { className: `transition-all duration-500 space-y-6 ${loaded ? "opacity-100" : "opacity-0"}`, children: [_jsxs("div", { className: "relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-3xl p-6 text-white overflow-hidden shadow-xl shadow-red-200/50 dark:shadow-none", children: [_jsx("div", { className: "absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-20 translate-x-20" }), _jsx("div", { className: "absolute bottom-0 left-0 w-36 h-36 rounded-full bg-white/5 translate-y-16 -translate-x-16" }), _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "flex items-start justify-between gap-4 mb-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Calendar, { size: 13, className: "text-red-300" }), _jsx("span", { className: "text-red-200 text-xs font-medium", children: dateCapitalized })] }), _jsx("h2", { className: "text-2xl font-black leading-tight", children: "Vue d'ensemble" }), _jsx("p", { className: "text-red-200 text-sm mt-1", children: "Plateforme MAWEJA \u2022 Kinshasa, RDC" })] }), _jsx(LiveIndicator, {})] }), _jsx("div", { className: "grid grid-cols-3 gap-3 mt-2", children: [
                                        { label: "Aujourd'hui", value: todayOrders, suffix: " cmd" },
                                        { label: "Revenue/jour", value: formatPrice(todayRevenue), isStr: true },
                                        { label: "En attente", value: pendingCount, suffix: " cmd" },
                                    ].map((item) => (_jsxs("div", { className: "bg-white/10 rounded-2xl p-3 backdrop-blur-sm", children: [_jsx("p", { className: "text-white font-black text-lg leading-none", children: item.isStr ? item.value : `${item.value}${item.suffix || ""}` }), _jsx("p", { className: "text-red-200 text-[10px] font-semibold mt-1", children: item.label })] }, item.label))) })] })] }), pendingCount > 0 && (_jsxs("div", { className: "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all", onClick: () => navigate("/admin/orders"), "data-testid": "alert-pending-orders", children: [_jsx("div", { className: "w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center flex-shrink-0", children: _jsx(AlertCircle, { size: 18, className: "text-amber-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("p", { className: "font-bold text-sm text-amber-800 dark:text-amber-400", children: [pendingCount, " commande", pendingCount > 1 ? "s" : "", " en attente de confirmation"] }), _jsx("p", { className: "text-xs text-amber-600 dark:text-amber-500 mt-0.5", children: "Cliquez pour g\u00E9rer les commandes" })] }), _jsx(ChevronRight, { size: 16, className: "text-amber-500" })] })), _jsxs("div", { children: [_jsxs("h3", { className: "font-black text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2", children: [_jsx(Zap, { size: 14, className: "text-red-600" }), " Acc\u00E8s rapide"] }), _jsx("div", { className: "grid grid-cols-4 gap-2.5", children: QUICK_ACTIONS.map(({ label, icon: Icon, color, href }) => (_jsxs("button", { onClick: () => navigate(href), "data-testid": `quick-action-${label.toLowerCase()}`, className: "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3.5 flex flex-col items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 shadow-sm group", children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`, children: _jsx(Icon, { size: 18 }) }), _jsx("span", { className: "text-[10px] font-bold text-gray-700 dark:text-gray-300", children: label })] }, label))) })] }), _jsxs("div", { children: [_jsxs("h3", { className: "font-black text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2", children: [_jsx(BarChart2, { size: 14, className: "text-red-600" }), " Indicateurs cl\u00E9s"] }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-3 gap-3", children: statCards.map((card, i) => (_jsx(StatCard, { ...card, delay: i * 60 }, card.label))) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-5", children: [_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Package, { size: 14, className: "text-red-600" }), _jsx("h3", { className: "font-bold text-gray-900 dark:text-white", children: t.admin.recentOrders })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-medium text-gray-400 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-full", children: recentOrders.length }), _jsxs("button", { onClick: () => navigate("/admin/orders"), className: "text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5", "data-testid": "link-all-orders", children: ["Voir tout ", _jsx(ChevronRight, { size: 12 })] })] })] }), _jsxs("div", { className: "divide-y divide-gray-50 dark:divide-gray-800 max-h-96 overflow-y-auto", children: [ordersLoading ? ([...Array(5)].map((_, i) => (_jsxs("div", { className: "px-5 py-3 flex items-center justify-between animate-pulse", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" }), _jsx("div", { className: "h-3 bg-gray-100 dark:bg-gray-800 rounded w-20" })] }), _jsx("div", { className: "h-6 bg-gray-100 dark:bg-gray-800 rounded-lg w-20" })] }, i)))) : recentOrders.slice(0, 10).map((order) => (_jsxs("div", { className: "px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer", onClick: () => navigate("/admin/orders"), "data-testid": `recent-order-${order.id}`, children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-sm text-gray-900 dark:text-white group-hover:text-red-600 transition-colors", children: order.orderNumber }), _jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: formatDate(order.createdAt) })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "font-bold text-sm text-gray-900 dark:text-white", children: formatPrice(order.total) }), _jsx("span", { className: `text-[10px] font-bold px-2.5 py-1 rounded-lg ${statusColors[order.status]}`, children: statusLabels[order.status] })] })] }, order.id))), !ordersLoading && recentOrders.length === 0 && (_jsxs("div", { className: "text-center py-12 text-gray-400", children: [_jsx(Package, { size: 32, className: "mx-auto mb-2 opacity-30" }), _jsx("p", { className: "text-sm", children: "Aucune commande pour le moment" })] }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 hover:shadow-md transition-shadow", children: [_jsxs("h3", { className: "font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2", children: [_jsx(Zap, { size: 15, className: "text-red-600" }), " ", t.admin.performance] }), _jsx("div", { className: "space-y-4", children: [
                                                {
                                                    label: t.admin.deliveryRate,
                                                    value: (() => { const tot = Number(stats?.orders?.total) || 0; const d = Number(stats?.orders?.delivered) || 0; return tot > 0 ? Math.round((d / tot) * 100) : 0; })(),
                                                    color: "bg-emerald-500",
                                                    max: 100,
                                                    delay: 200,
                                                },
                                                {
                                                    label: t.admin.activeDrivers,
                                                    value: Number(stats?.drivers?.online) || 0,
                                                    color: "bg-blue-500",
                                                    max: Math.max(Number(stats?.drivers?.total) || 1, 1),
                                                    display: (() => { const tot = Number(stats?.drivers?.total) || 0; const o = Number(stats?.drivers?.online) || 0; return tot > 0 ? Math.round((o / tot) * 100) : 0; })(),
                                                    delay: 400,
                                                },
                                                {
                                                    label: "Restaurants actifs",
                                                    value: Number(stats?.restaurants?.active) || 0,
                                                    color: "bg-orange-500",
                                                    max: Math.max(Number(stats?.restaurants?.total) || 1, 1),
                                                    display: (() => { const tot = Number(stats?.restaurants?.total) || 0; const a = Number(stats?.restaurants?.active) || 0; return tot > 0 ? Math.round((a / tot) * 100) : 0; })(),
                                                    delay: 600,
                                                },
                                            ].map(({ label, value, color, max, display, delay }) => (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1.5", children: [_jsx("span", { className: "text-gray-500 dark:text-gray-400 font-medium", children: label }), _jsxs("span", { className: "font-black text-gray-900 dark:text-white", children: [display ?? value, "%"] })] }), _jsx(ProgressBar, { value: value, max: max, color: color, delay: delay })] }, label))) })] }), _jsxs("div", { className: "bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-red-200/50 dark:shadow-none hover:shadow-xl hover:shadow-red-300/50 dark:hover:shadow-none transition-all duration-300 hover:-translate-y-0.5", children: [_jsx("div", { className: "absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" }), _jsx("div", { className: "absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" }), _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TrendingUp, { size: 16 }), _jsx("span", { className: "font-bold text-sm", children: "Revenu Total MAWEJA" })] }), _jsx("p", { className: "text-3xl font-black mb-0.5", children: formatPrice(Number(stats?.orders?.revenue) || 0) }), _jsx("p", { className: "text-red-200 text-xs", children: "Toutes commandes livr\u00E9es" }), _jsxs("div", { className: "mt-4 pt-4 border-t border-red-500/50 grid grid-cols-3 gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-red-200 text-[10px] font-medium uppercase tracking-wider", children: "Total" }), _jsx("p", { className: "text-lg font-black", children: stats?.orders?.total || 0 })] }), _jsxs("div", { children: [_jsx("p", { className: "text-red-200 text-[10px] font-medium uppercase tracking-wider", children: "Clients" }), _jsx("p", { className: "text-lg font-black", children: stats?.clients?.total || 0 })] }), _jsxs("div", { children: [_jsx("p", { className: "text-red-200 text-[10px] font-medium uppercase tracking-wider", children: "Livr\u00E9es" }), _jsx("p", { className: "text-lg font-black", children: stats?.orders?.delivered || 0 })] })] })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-5", children: [_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2", children: [_jsx(UtensilsCrossed, { size: 14, className: "text-red-600" }), _jsx("h3", { className: "font-bold text-gray-900 dark:text-white", children: t.admin.cuisineCategories })] }), _jsx("div", { className: "p-5 space-y-4", children: (() => {
                                        const breakdown = stats?.cuisineBreakdown || [];
                                        const total = breakdown.reduce((s, x) => s + Number(x.count), 0);
                                        if (breakdown.length === 0)
                                            return (_jsxs("div", { className: "text-center py-8 text-gray-400", children: [_jsx(Store, { size: 28, className: "mx-auto mb-2 opacity-30" }), _jsx("p", { className: "text-sm", children: t.admin.noDataAvailable })] }));
                                        const colors = ["bg-red-500", "bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-pink-500"];
                                        return breakdown.map((c, i) => {
                                            const pct = total > 0 ? Math.round((Number(c.count) / total) * 100) : 0;
                                            return (_jsxs("div", { "data-testid": `cuisine-breakdown-${c.cuisine?.toLowerCase().replace(/\s/g, "-")}`, children: [_jsxs("div", { className: "flex justify-between text-sm mb-1.5", children: [_jsx("span", { className: "text-gray-700 dark:text-gray-300 font-semibold", children: c.cuisine }), _jsxs("span", { className: "text-gray-400 text-xs font-medium", children: [c.count, " \u00B7 ", pct, "%"] })] }), _jsx(ProgressBar, { value: Number(c.count), max: total, color: colors[i % colors.length], delay: i * 100 })] }, c.cuisine));
                                        });
                                    })() })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2", children: [_jsx(Store, { size: 14, className: "text-red-600" }), _jsx("h3", { className: "font-bold text-gray-900 dark:text-white", children: t.admin.ordersByCategory })] }), _jsx("div", { className: "divide-y divide-gray-50 dark:divide-gray-800", children: (stats?.cuisineOrders || []).length === 0 ? (_jsxs("div", { className: "text-center py-12 text-gray-400", children: [_jsx(Package, { size: 28, className: "mx-auto mb-2 opacity-30" }), _jsx("p", { className: "text-sm", children: t.admin.noOrdersByCategory })] })) : (stats?.cuisineOrders || []).map((c) => (_jsxs("div", { className: "px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group", "data-testid": `cuisine-orders-${c.cuisine?.toLowerCase().replace(/\s/g, "-")}`, children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-sm text-gray-900 dark:text-white group-hover:text-red-600 transition-colors", children: c.cuisine }), _jsxs("p", { className: "text-xs text-gray-400 mt-0.5", children: [c.orderCount, " commande", Number(c.orderCount) > 1 ? "s" : ""] })] }), _jsx("span", { className: "font-black text-sm text-red-600", children: formatPrice(Number(c.revenue)) })] }, c.cuisine))) })] })] })] }) }));
}
//# sourceMappingURL=AdminDashboard.js.map