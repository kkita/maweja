import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { authFetchJson, apiRequest, queryClient } from "../../lib/queryClient";
import { ArrowLeft, Bell, Check, Package, Tag, Info } from "lucide-react";
import ClientNav from "../../components/ClientNav";
function notifIcon(type) {
    if (type === "order")
        return _jsx(Package, { size: 18, className: "text-blue-500" });
    if (type === "promo")
        return _jsx(Tag, { size: 18, className: "text-amber-500" });
    return _jsx(Info, { size: 18, className: "text-gray-400 dark:text-gray-500" });
}
function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1)
        return "À l'instant";
    if (min < 60)
        return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)
        return `Il y a ${h}h`;
    return `Il y a ${Math.floor(h / 24)}j`;
}
export default function NotificationsPage() {
    const [, navigate] = useLocation();
    const { user } = useAuth();
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ["/api/notifications", user?.id],
        queryFn: () => authFetchJson(`/api/notifications/${user?.id}`),
        enabled: !!user,
        refetchInterval: 15000,
    });
    /* ── Fix: correct apiRequest signature (url, options) ── */
    const markRead = useMutation({
        mutationFn: (id) => apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        },
    });
    const markAllRead = useMutation({
        mutationFn: () => apiRequest(`/api/notifications/read-all/${user?.id}`, { method: "PATCH" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        },
    });
    /* ── Auto-mark-all-read when page opens with unread notifs ── */
    useEffect(() => {
        if (!user)
            return;
        const unread = notifications.filter(n => !n.isRead && n.type !== "chat");
        if (unread.length > 0 && !markAllRead.isPending) {
            const t = setTimeout(() => {
                markAllRead.mutate();
            }, 1200);
            return () => clearTimeout(t);
        }
    }, [user?.id, notifications.length]);
    const unreadCount = notifications.filter(n => !n.isRead && n.type !== "chat").length;
    const visibleNotifs = notifications.filter(n => n.type !== "chat");
    if (!user) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] flex flex-col", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-8 text-center", children: [_jsx(Bell, { size: 48, className: "text-gray-300 mb-4" }), _jsx("p", { className: "font-bold text-gray-700 dark:text-gray-200", children: "Connexion requise" }), _jsx("p", { className: "text-gray-400 dark:text-gray-500 text-sm mt-1", children: "Connectez-vous pour voir vos notifications" }), _jsx("button", { onClick: () => navigate("/login"), className: "mt-6 bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform", "data-testid": "button-login-notif", children: "Se connecter" })] })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-28", style: { fontFamily: "system-ui, -apple-system, sans-serif" }, children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 pt-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-5", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => navigate("/"), className: "w-9 h-9 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center", style: { boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }, "data-testid": "button-back-notif", children: _jsx(ArrowLeft, { size: 18, className: "text-gray-700 dark:text-gray-200" }) }), _jsxs("div", { children: [_jsx("h1", { className: "font-bold text-gray-900 dark:text-white", style: { fontSize: 18 }, children: "Notifications" }), unreadCount > 0 && (_jsxs("p", { className: "text-red-600 font-medium", style: { fontSize: 12 }, children: [unreadCount, " non lue", unreadCount > 1 ? "s" : ""] }))] })] }), unreadCount > 0 && (_jsxs("button", { onClick: () => markAllRead.mutate(), disabled: markAllRead.isPending, className: "flex items-center gap-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 px-3 py-1.5 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50", style: { fontSize: 12 }, "data-testid": "button-mark-all-read", children: [_jsx(Check, { size: 13 }), markAllRead.isPending ? "…" : "Tout lire"] }))] }), isLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map(i => (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl p-4 flex gap-3", children: [_jsx("div", { className: "w-11 h-11 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl flex-shrink-0" }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx("div", { className: "h-3 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full w-3/4" }), _jsx("div", { className: "h-2.5 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full w-1/2" })] })] }, i))) })) : visibleNotifs.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center", children: [_jsx("div", { className: "w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4", children: _jsx(Bell, { size: 32, className: "text-gray-300" }) }), _jsx("p", { className: "font-bold text-gray-700 dark:text-gray-200 text-sm", children: "Aucune notification" }), _jsx("p", { className: "text-gray-400 dark:text-gray-500 text-xs mt-1", children: "Vous serez notifi\u00E9 ici de vos commandes et offres" })] })) : (_jsx("div", { className: "space-y-2", children: visibleNotifs.map(n => (_jsxs("button", { onClick: () => {
                                if (!n.isRead)
                                    markRead.mutate(n.id);
                                if (n.type === "order")
                                    navigate("/orders");
                            }, "data-testid": `notification-${n.id}`, className: "w-full bg-white dark:bg-gray-900 rounded-2xl p-4 flex gap-3 text-left active:scale-[0.98] transition-transform", style: {
                                boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                                borderLeft: !n.isRead ? "3px solid #dc2626" : "3px solid transparent",
                            }, children: [_jsx("div", { className: `w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.isRead ? "bg-red-50 dark:bg-red-900/30" : "bg-gray-50 dark:bg-gray-800/60"}`, children: notifIcon(n.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("p", { className: `text-sm leading-snug ${!n.isRead ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-200"}`, children: n.title || "Notification" }), !n.isRead && (_jsx("span", { className: "flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-1" }))] }), n.message && (_jsx("p", { className: "text-gray-500 dark:text-gray-400 text-xs mt-0.5 leading-relaxed line-clamp-2", children: n.message })), _jsx("p", { className: "text-gray-300 dark:text-gray-600 text-[10px] mt-1 font-medium", children: timeAgo(n.createdAt || new Date()) })] })] }, n.id))) }))] })] }));
}
//# sourceMappingURL=NotificationsPage.js.map