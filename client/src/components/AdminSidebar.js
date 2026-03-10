import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { authFetch } from "../lib/queryClient";
import { LayoutDashboard, Package, Users, Truck, Store, MessageCircle, DollarSign, Settings, LogOut, Shield, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import logoImg from "@assets/image_1772833363714.png";
export default function AdminSidebar() {
    const [location, navigate] = useLocation();
    const { user, logout } = useAuth();
    const { data: notifications = [] } = useQuery({
        queryKey: ["/api/notifications", user?.id],
        queryFn: () => authFetch(`/api/notifications/${user?.id}`).then((r) => r.json()),
        enabled: !!user,
        refetchInterval: 10000,
    });
    const { data: unreadChatCounts = {} } = useQuery({
        queryKey: ["/api/chat/unread", user?.id],
        queryFn: () => authFetch(`/api/chat/unread/${user?.id}`).then(r => r.json()),
        enabled: !!user,
        refetchInterval: 5000,
    });
    const unreadNotifCount = notifications.filter((n) => !n.isRead && n.type !== "chat").length;
    const unreadChatCount = Object.values(unreadChatCounts).reduce((s, n) => s + n, 0);
    const { data: pendingVerifications = [] } = useQuery({
        queryKey: ["/api/admin/verifications"],
        refetchInterval: 10000,
    });
    const links = [
        { path: "/", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/admin/orders", icon: Package, label: "Commandes" },
        { path: "/admin/drivers", icon: Truck, label: "Livreurs" },
        { path: "/admin/verifications", icon: Shield, label: "Verifications" },
        { path: "/admin/restaurants", icon: Store, label: "Restaurants" },
        { path: "/admin/customers", icon: Users, label: "Clients" },
        { path: "/admin/chat", icon: MessageCircle, label: "Messages" },
        { path: "/admin/finance", icon: DollarSign, label: "Finance" },
        { path: "/admin/marketing", icon: BarChart3, label: "Marketing" },
        { path: "/admin/settings", icon: Settings, label: "Parametres" },
    ];
    const getBadge = (label) => {
        if (label === "Messages" && unreadChatCount > 0) {
            return { count: unreadChatCount, color: "bg-red-600" };
        }
        if (label === "Dashboard" && unreadNotifCount > 0) {
            return { count: unreadNotifCount, color: "bg-red-600" };
        }
        if (label === "Verifications" && pendingVerifications.length > 0) {
            return { count: pendingVerifications.length, color: "bg-orange-500" };
        }
        return null;
    };
    return (_jsxs("aside", { className: "w-64 bg-white border-r border-gray-100 h-screen flex flex-col fixed left-0 top-0 z-40", children: [_jsx("div", { className: "p-6 border-b border-gray-100", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: logoImg, alt: "MAWEJA", className: "w-10 h-10 rounded-xl object-cover" }), _jsxs("div", { children: [_jsx("h1", { className: "text-lg font-black text-gray-900", children: "MAWEJA" }), _jsx("p", { className: "text-[10px] text-gray-400 font-semibold uppercase tracking-wider", children: "Admin Panel" })] })] }) }), _jsx("nav", { className: "flex-1 p-4 space-y-1", children: links.map((l) => {
                    const isActive = location === l.path;
                    const badge = getBadge(l.label);
                    return (_jsxs("button", { onClick: () => navigate(l.path), "data-testid": `admin-nav-${l.label.toLowerCase()}`, className: `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                            ? "bg-red-50 text-red-700 font-semibold"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`, children: [_jsx(l.icon, { size: 18, strokeWidth: isActive ? 2.5 : 1.5 }), l.label, badge && (_jsx("span", { className: `ml-auto ${badge.color} text-white text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center`, "data-testid": `badge-${l.label.toLowerCase()}`, children: badge.count > 99 ? "99+" : badge.count }))] }, l.path));
                }) }), _jsx("div", { className: "p-4 border-t border-gray-100", children: _jsxs("div", { className: "flex items-center gap-3 px-4 py-3", children: [_jsx("div", { className: "w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center", children: _jsx("span", { className: "text-red-600 font-bold text-sm", children: user?.name?.[0] }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-gray-900 truncate", children: user?.name }), _jsx("p", { className: "text-[10px] text-gray-400", children: "Administrateur" })] }), _jsx("button", { onClick: logout, className: "text-gray-400 hover:text-red-600 transition-colors", "data-testid": "admin-logout", children: _jsx(LogOut, { size: 16 }) })] }) })] }));
}
//# sourceMappingURL=AdminSidebar.js.map