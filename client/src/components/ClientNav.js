import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLocation } from "wouter";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { authFetchJson, queryClient } from "../lib/queryClient";
import { Bell, ShoppingBag, MapPin, Search, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { onWSMessage } from "../lib/websocket";
import { handleWSEvent } from "../lib/notify";
import { useI18n } from "../lib/i18n";
import SearchOverlay from "./SearchOverlay";
import AddressPickerModal from "./AddressPickerModal";
const logoRed = "/maweja-logo-red.png";
const SESSION_KEY = "maweja_delivery_address";
export default function ClientNav() {
    const [location, navigate] = useLocation();
    const { itemCount } = useCart();
    const { user } = useAuth();
    const { t } = useI18n();
    const [scrolled, setScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
    /* ── Address state ──────────────────────────────────────────────── */
    const [sessionAddress, setSessionAddress] = useState(() => sessionStorage.getItem(SESSION_KEY) || "");
    const [showAddressPicker, setShowAddressPicker] = useState(false);
    const [showChangeConfirm, setShowChangeConfirm] = useState(false);
    /* ── Dark mode tracking ─────────────────────────────────────────── */
    useEffect(() => {
        const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")));
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => obs.disconnect();
    }, []);
    /* ── Scroll detection ───────────────────────────────────────────── */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 70);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    /* ── Pre-fill from user profile if nothing in session ──────────── */
    useEffect(() => {
        if (!sessionAddress && user?.address) {
            setSessionAddress(user.address);
            sessionStorage.setItem(SESSION_KEY, user.address);
        }
    }, [user]);
    /* ── Notifications ──────────────────────────────────────────────── */
    const { data: notifications = [] } = useQuery({
        queryKey: ["/api/notifications", user?.id],
        queryFn: () => authFetchJson(`/api/notifications/${user?.id}`),
        enabled: !!user,
        refetchInterval: 15000,
    });
    useEffect(() => {
        return onWSMessage((data) => {
            if (["chat_message", "notification", "order_status", "order_updated"].includes(data.type)) {
                queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
                queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
                queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            }
            handleWSEvent(data);
        });
    }, []);
    const unreadCount = notifications.filter(n => !n.isRead && n.type !== "chat").length;
    const handleProtectedNav = (path) => {
        const protectedPaths = ["/orders", "/settings", "/notifications", "/addresses"];
        if (!user && protectedPaths.includes(path))
            navigate("/login");
        else
            navigate(path);
    };
    /* ── Address handlers ───────────────────────────────────────────── */
    const handleAddressClick = () => {
        if (sessionAddress) {
            setShowChangeConfirm(true);
        }
        else {
            setShowAddressPicker(true);
        }
    };
    const handleAddressConfirmed = (address) => {
        setSessionAddress(address);
        sessionStorage.setItem(SESSION_KEY, address);
        setShowAddressPicker(false);
    };
    /* ─── Header colors ─────────────────────────────────────────────── */
    const headerBg = scrolled ? "#dc2626" : isDark ? "#0d0d0d" : "#ffffff";
    const headerShadow = scrolled
        ? "0 4px 24px rgba(220,38,38,0.3)"
        : isDark ? "0 1px 0 rgba(255,255,255,0.06)" : "0 1px 0 rgba(0,0,0,0.06)";
    const navItems = [
        { path: "/", icon: "home", label: "Accueil" },
        { path: "/orders", icon: "orders", label: "Commandes", badge: unreadCount },
        { path: "/settings", icon: "profile", label: "Profil" },
    ];
    return (_jsxs(_Fragment, { children: [searchOpen && _jsx(SearchOverlay, { onClose: () => setSearchOpen(false) }), showAddressPicker && (_jsx(AddressPickerModal, { initialAddress: sessionAddress, onConfirm: handleAddressConfirmed, onClose: () => setShowAddressPicker(false) })), showChangeConfirm && (_jsx("div", { className: "fixed inset-0 z-[100] flex items-end sm:items-center justify-center", style: { background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }, onClick: () => setShowChangeConfirm(false), children: _jsxs("div", { className: "w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-6", style: { boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }, onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", style: { background: "#FEE2E2" }, children: _jsx(MapPin, { size: 18, style: { color: "#EC0000" } }) }), _jsxs("div", { children: [_jsx("p", { className: "font-bold text-gray-900 dark:text-white text-sm", children: "Adresse actuelle" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-xs mt-0.5 leading-snug line-clamp-2", children: sessionAddress })] })] }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 text-sm mb-5", children: "Voulez-vous changer votre adresse de livraison ?" }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => setShowChangeConfirm(false), className: "flex-1 py-3 rounded-2xl font-semibold text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 active:scale-95 transition-transform", "data-testid": "button-keep-address", children: "Non, garder" }), _jsxs("button", { onClick: () => {
                                        setShowChangeConfirm(false);
                                        setShowAddressPicker(true);
                                    }, className: "flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-1.5 active:scale-95 transition-transform", style: { background: "#EC0000" }, "data-testid": "button-change-address", children: ["Oui, changer", _jsx(ChevronRight, { size: 15 })] })] })] }) })), _jsx("header", { className: "sticky top-0 z-50", style: {
                    background: headerBg,
                    transition: "background 0.38s cubic-bezier(0.4,0,0.2,1)",
                    boxShadow: headerShadow,
                }, children: _jsxs("div", { className: "max-w-lg mx-auto px-4 relative", style: { height: 56 }, children: [_jsxs("div", { className: "absolute inset-0 px-4 flex items-center gap-3", style: {
                                opacity: scrolled ? 0 : 1,
                                transform: scrolled ? "translateY(-12px) scale(0.96)" : "translateY(0) scale(1)",
                                transition: "opacity 0.26s cubic-bezier(0.4,0,0.2,1), transform 0.28s cubic-bezier(0.4,0,0.2,1)",
                                pointerEvents: scrolled ? "none" : "auto",
                            }, children: [_jsx("div", { className: "flex-shrink-0 w-9 h-9", children: _jsx("img", { src: logoRed, alt: "Maweja", className: "w-full h-full object-contain" }) }), _jsxs("button", { className: "flex-1 flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-opacity active:opacity-70 min-w-0", style: { background: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6" }, onClick: handleAddressClick, "data-testid": "button-address-pill", children: [_jsx(MapPin, { size: 14, className: "text-red-500 flex-shrink-0" }), sessionAddress ? (_jsx("span", { className: "truncate text-[12px] font-medium", style: { color: isDark ? "rgba(255,255,255,0.85)" : "#111827" }, children: sessionAddress })) : (_jsx("span", { className: "truncate text-[13px]", style: { color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }, children: "Entrez votre adresse" }))] }), _jsxs("button", { className: "relative w-9 h-9 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform", onClick: () => handleProtectedNav("/notifications"), "data-testid": "button-notifications-header", children: [_jsx(Bell, { size: 22, style: { color: "#dc2626" }, strokeWidth: 1.8 }), unreadCount > 0 && (_jsx("span", { className: "absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center", "data-testid": "badge-notif", children: unreadCount > 9 ? "9+" : unreadCount }))] }), _jsxs("button", { className: "relative w-9 h-9 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform", onClick: () => navigate("/cart"), "data-testid": "button-cart-header", children: [_jsx(ShoppingBag, { size: 22, style: { color: "#dc2626" }, strokeWidth: 1.8 }), itemCount > 0 && (_jsx("span", { className: "absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center", "data-testid": "badge-cart-header", children: itemCount > 9 ? "9+" : itemCount }))] })] }), _jsx("div", { className: "absolute inset-0 px-4 flex items-center", style: {
                                opacity: scrolled ? 1 : 0,
                                transform: scrolled ? "translateY(0) scale(1)" : "translateY(12px) scale(0.96)",
                                transition: "opacity 0.28s cubic-bezier(0.4,0,0.2,1) 0.07s, transform 0.30s cubic-bezier(0.4,0,0.2,1) 0.07s",
                                pointerEvents: scrolled ? "auto" : "none",
                            }, children: _jsxs("button", { className: "flex-1 flex items-center gap-2.5 active:scale-[0.97] transition-transform", style: {
                                    background: "rgba(255,255,255,0.97)",
                                    borderRadius: 14,
                                    paddingLeft: 14,
                                    paddingRight: 14,
                                    height: 38,
                                    boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                                }, onClick: () => setSearchOpen(true), "data-testid": "button-open-search", children: [_jsx(Search, { size: 15, style: { color: "#dc2626", flexShrink: 0 } }), _jsx("span", { style: { fontSize: 14, fontWeight: 500, color: "#9ca3af", flex: 1, textAlign: "left" }, children: "Plat, restaurant, service\u2026" })] }) })] }) }), _jsx("nav", { className: "fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 flex items-center justify-around px-6 pt-2 border-t border-gray-100 dark:border-gray-800/60", style: {
                    boxShadow: "0 -2px 16px rgba(0,0,0,0.06)",
                    paddingBottom: "max(20px, env(safe-area-inset-bottom))",
                }, children: navItems.map((item) => {
                    const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                    const activeColor = "#dc2626";
                    const inactiveColor = "#9CA3AF";
                    const color = isActive ? activeColor : inactiveColor;
                    return (_jsxs("button", { onClick: () => handleProtectedNav(item.path), "data-testid": `nav-${item.path.replace(/\//g, "") || "home"}`, className: "relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] active:scale-90 transition-transform duration-150", children: [item.icon === "home" && (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: isActive ? activeColor : "none", stroke: color, strokeWidth: isActive ? 0 : 1.8, strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" }), _jsx("path", { d: "M9 21V12h6v9", fill: "none", stroke: isActive ? "white" : color, strokeWidth: "1.8" })] })), item.icon === "orders" && (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: isActive ? activeColor : "none", stroke: color, strokeWidth: isActive ? 0 : 1.8, strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "3", y: "2", width: "18", height: "20", rx: "3" }), _jsx("path", { d: "M7 7h10M7 11h7M7 15h5", fill: "none", stroke: isActive ? "white" : color, strokeWidth: "1.8", strokeLinecap: "round" })] })), item.icon === "profile" && (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: isActive ? activeColor : "none", stroke: color, strokeWidth: isActive ? 0 : 1.8, strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "12", cy: "8", r: "4", fill: isActive ? activeColor : "none", stroke: isActive ? "transparent" : color, strokeWidth: "1.8" }), _jsx("path", { d: "M4 20c0-4 3.6-7 8-7s8 3 8 7", fill: "none", stroke: isActive ? "white" : color, strokeWidth: "1.8", strokeLinecap: "round" })] })), _jsx("span", { style: {
                                    fontSize: 10,
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? activeColor : inactiveColor,
                                    letterSpacing: "0.01em",
                                    lineHeight: 1,
                                }, children: item.label }), item.badge > 0 && (_jsx("span", { className: "absolute -top-0.5 right-1 bg-red-600 text-white text-[8px] font-black min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center", "data-testid": `badge-${item.path.replace(/\//g, "") || "home"}`, children: item.badge > 99 ? "99+" : item.badge }))] }, item.path));
                }) })] }));
}
//# sourceMappingURL=ClientNav.js.map