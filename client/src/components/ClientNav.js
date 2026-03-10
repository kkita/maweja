import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLocation } from "wouter";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { authFetch } from "../lib/queryClient";
import { Home, ShoppingBag, ClipboardList, Wallet, LogOut, LogIn, MessageCircle } from "lucide-react";
import logoImg from "@assets/image_1772833363714.png";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "../lib/queryClient";
import { onWSMessage } from "../lib/websocket";
export default function ClientNav() {
    const [location, navigate] = useLocation();
    const { itemCount } = useCart();
    const { user, logout } = useAuth();
    const { data: unreadChatCounts = {} } = useQuery({
        queryKey: ["/api/chat/unread", user?.id],
        queryFn: () => authFetch(`/api/chat/unread/${user?.id}`).then(r => r.json()),
        enabled: !!user,
        refetchInterval: 10000,
    });
    useEffect(() => {
        return onWSMessage((data) => {
            if (data.type === "chat_message" || data.type === "notification") {
                queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
                queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            }
        });
    }, []);
    const unreadMsgCount = Object.values(unreadChatCounts).reduce((s, n) => s + n, 0);
    const links = user
        ? [
            { path: "/", icon: Home, label: "Accueil", badge: 0 },
            { path: "/cart", icon: ShoppingBag, label: "Panier", badge: itemCount },
            { path: "/orders", icon: ClipboardList, label: "Commandes", badge: 0 },
            { path: "/wallet", icon: Wallet, label: "Wallet", badge: 0 },
        ]
        : [
            { path: "/", icon: Home, label: "Accueil", badge: 0 },
            { path: "/cart", icon: ShoppingBag, label: "Panier", badge: itemCount },
        ];
    return (_jsxs(_Fragment, { children: [_jsx("header", { className: "sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-4 py-3", children: _jsxs("div", { className: "max-w-lg mx-auto flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("img", { src: logoImg, alt: "MAWEJA", className: "w-9 h-9 rounded-xl object-cover" }), _jsxs("div", { children: [_jsx("h1", { className: "text-lg font-black text-gray-900 leading-tight", children: "MAWEJA" }), _jsx("p", { className: "text-[10px] text-gray-400 font-medium -mt-0.5", children: "Kinshasa, RDC" })] })] }), _jsx("div", { className: "flex items-center gap-3", children: user ? (_jsxs(_Fragment, { children: [unreadMsgCount > 0 && (_jsxs("div", { className: "relative", children: [_jsx(MessageCircle, { size: 18, className: "text-gray-400" }), _jsx("span", { className: "absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] font-bold min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center", "data-testid": "badge-unread-messages", children: unreadMsgCount > 9 ? "9+" : unreadMsgCount })] })), _jsx("span", { className: "text-xs text-gray-500 font-medium", "data-testid": "text-username", children: user.name?.split(" ")[0] }), _jsx("button", { onClick: logout, className: "text-gray-400 hover:text-red-600 transition-colors", "data-testid": "button-logout", children: _jsx(LogOut, { size: 18 }) })] })) : (_jsxs("button", { onClick: () => navigate("/login"), className: "flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-red-700 transition-all", "data-testid": "button-login", children: [_jsx(LogIn, { size: 14 }), "Connexion"] })) })] }) }), _jsx("nav", { className: "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe", children: _jsx("div", { className: "max-w-lg mx-auto flex", children: links.map((l) => {
                        const isActive = location === l.path;
                        return (_jsxs("button", { onClick: () => navigate(l.path), "data-testid": `nav-${l.label.toLowerCase()}`, className: `flex-1 flex flex-col items-center py-2.5 relative transition-colors ${isActive ? "text-red-600" : "text-gray-400"}`, children: [_jsxs("div", { className: "relative", children: [_jsx(l.icon, { size: 20, strokeWidth: isActive ? 2.5 : 1.5 }), l.badge > 0 && (_jsx("span", { className: "absolute -top-2 -right-2.5 bg-red-600 text-white text-[9px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center", "data-testid": `badge-${l.label.toLowerCase()}`, children: l.badge > 99 ? "99+" : l.badge }))] }), _jsx("span", { className: "text-[10px] font-semibold mt-1", children: l.label })] }, l.path));
                    }) }) })] }));
}
//# sourceMappingURL=ClientNav.js.map