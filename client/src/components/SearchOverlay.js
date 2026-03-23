import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, X, ArrowLeft, Star, Clock, Zap } from "lucide-react";
import { resolveImg } from "../lib/queryClient";
const TRENDING = ["Poulet", "Pizza", "Sushi", "Burger", "Transport", "Coiffure"];
export default function SearchOverlay({ onClose }) {
    const [, navigate] = useLocation();
    const [query, setQuery] = useState("");
    const inputRef = useRef(null);
    const { data: restaurants = [] } = useQuery({ queryKey: ["/api/restaurants"] });
    const { data: categories = [] } = useQuery({ queryKey: ["/api/service-categories"] });
    /* Auto-focus with a short delay so animation finishes first */
    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 120);
        return () => clearTimeout(t);
    }, []);
    /* Lock body scroll while overlay is open */
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);
    const q = query.toLowerCase().trim();
    const filteredRestaurants = q
        ? restaurants.filter(r => r.name?.toLowerCase().includes(q) ||
            r.cuisine?.toLowerCase().includes(q) ||
            r.address?.toLowerCase().includes(q)).slice(0, 8)
        : [];
    const filteredServices = q
        ? categories.filter(c => c.isActive && c.name.toLowerCase().includes(q)).slice(0, 5)
        : [];
    const hasResults = filteredRestaurants.length > 0 || filteredServices.length > 0;
    const goTo = (path) => {
        onClose();
        navigate(path);
    };
    return (_jsxs("div", { className: "fixed inset-0 z-[200] flex flex-col", style: { background: "#fff" }, "data-testid": "search-overlay", children: [_jsxs("div", { className: "flex items-center gap-3 px-4 pb-3 flex-shrink-0", style: {
                    background: "#dc2626",
                    boxShadow: "0 4px 24px rgba(220,38,38,0.3)",
                    /* iOS safe area (notch / Dynamic Island) */
                    paddingTop: "max(16px, env(safe-area-inset-top))",
                }, children: [_jsx("button", { onClick: onClose, className: "w-9 h-9 flex items-center justify-center rounded-full bg-white/20 active:scale-90 transition-transform flex-shrink-0", "data-testid": "button-close-search-overlay", children: _jsx(ArrowLeft, { size: 18, className: "text-white" }) }), _jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { size: 15, className: "absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none", style: { color: "#dc2626" } }), _jsx("input", { ref: inputRef, type: "text", value: query, onChange: e => setQuery(e.target.value), placeholder: "Plat, restaurant, service\u2026", "data-testid": "input-search-overlay", className: "w-full rounded-2xl py-2.5 text-[14px] font-medium placeholder-gray-400 outline-none border-none", style: {
                                    background: "rgba(255,255,255,0.97)",
                                    color: "#111827",
                                    paddingLeft: 40,
                                    paddingRight: query.length > 0 ? 36 : 14,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                } }), query.length > 0 && (_jsx("button", { onClick: () => { setQuery(""); inputRef.current?.focus(); }, className: "absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 active:scale-90 transition-transform", "data-testid": "button-clear-overlay-search", children: _jsx(X, { size: 11, className: "text-gray-500" }) }))] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0d0d0d]", children: [!q && (_jsxs("div", { className: "px-4 pt-5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Zap, { size: 13, className: "text-amber-500" }), _jsx("p", { className: "text-[11px] font-black text-gray-400 uppercase tracking-widest", children: "Tendances" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: TRENDING.map(term => (_jsx("button", { onClick: () => setQuery(term), "data-testid": `trending-${term.toLowerCase()}`, className: "px-4 py-2 rounded-full text-sm font-semibold bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 active:scale-95 transition-all", style: { boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb" }, children: term }, term))) }), _jsx("div", { className: "mt-5 space-y-2", children: restaurants.slice(0, 3).map(r => (_jsxs("button", { onClick: () => goTo(`/restaurant/${r.id}`), className: "w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-2xl active:scale-[0.98] transition-all text-left", style: { boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }, "data-testid": `suggestion-restaurant-${r.id}`, children: [r.imageUrl ? (_jsx("img", { src: resolveImg(r.imageUrl), alt: r.name || "", className: "w-12 h-12 rounded-xl object-cover flex-shrink-0" })) : (_jsx("div", { className: "w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-xl", children: "\uD83C\uDF7D\uFE0F" })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-bold text-sm text-gray-900 dark:text-white truncate", children: r.name }), _jsx("p", { className: "text-xs text-gray-400 truncate", children: r.cuisine })] }), _jsx(Search, { size: 13, className: "text-gray-300 flex-shrink-0" })] }, r.id))) })] })), q && !hasResults && (_jsxs("div", { className: "flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center", children: [_jsx("div", { className: "w-20 h-20 rounded-3xl flex items-center justify-center mb-5", style: { background: "linear-gradient(135deg,#fef2f2,#fee2e2)" }, children: _jsx(Search, { size: 32, className: "text-red-300" }) }), _jsx("p", { className: "font-black text-gray-900 dark:text-white text-base mb-1", children: "Aucun r\u00E9sultat" }), _jsxs("p", { className: "text-sm text-gray-400", children: ["Aucun r\u00E9sultat pour ", _jsxs("span", { className: "font-semibold text-gray-600 dark:text-gray-300", children: ["\"", query, "\""] })] }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Essayez un autre mot-cl\u00E9" })] })), filteredServices.length > 0 && (_jsxs("div", { className: "px-4 pt-4", children: [_jsx("p", { className: "text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2", children: "Services" }), _jsx("div", { className: "space-y-2", children: filteredServices.map(cat => (_jsxs("button", { onClick: () => goTo(`/services?cat=${cat.id}`), "data-testid": `result-service-${cat.id}`, className: "w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-2xl active:scale-[0.98] transition-all text-left", style: { boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }, children: [cat.imageUrl ? (_jsx("img", { src: resolveImg(cat.imageUrl), alt: cat.name, className: "w-11 h-11 rounded-xl object-contain bg-gray-50 border border-gray-100 flex-shrink-0 p-1" })) : (_jsx("div", { className: "w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 text-xl", children: "\uD83D\uDD27" })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-bold text-sm text-gray-900 dark:text-white", children: cat.name }), cat.description && _jsx("p", { className: "text-xs text-gray-400 truncate", children: cat.description })] }), _jsx("div", { className: "w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0", children: _jsx(Search, { size: 12, className: "text-red-500" }) })] }, cat.id))) })] })), filteredRestaurants.length > 0 && (_jsxs("div", { className: "px-4 pt-4", style: { paddingBottom: "max(40px, env(safe-area-inset-bottom))" }, children: [_jsx("p", { className: "text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2", children: "Restaurants & \u00C9tablissements" }), _jsx("div", { className: "space-y-3", children: filteredRestaurants.map(r => (_jsxs("button", { onClick: () => goTo(`/restaurant/${r.id}`), "data-testid": `result-restaurant-${r.id}`, className: "w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-2xl active:scale-[0.98] transition-all text-left", style: { boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }, children: [r.imageUrl ? (_jsx("img", { src: resolveImg(r.imageUrl), alt: r.name || "", className: "w-16 h-14 rounded-xl object-cover flex-shrink-0" })) : (_jsx("div", { className: "w-16 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-2xl", children: "\uD83C\uDF7D\uFE0F" })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-black text-[14px] text-gray-900 dark:text-white truncate", children: r.name }), _jsx("p", { className: "text-xs text-gray-400 truncate mb-1", children: r.cuisine }), _jsxs("div", { className: "flex items-center gap-3", children: [r.rating && (_jsxs("span", { className: "text-[11px] font-bold text-amber-500 flex items-center gap-0.5", children: [_jsx(Star, { size: 9, fill: "currentColor" }), " ", r.rating] })), r.deliveryTime && (_jsxs("span", { className: "text-[11px] text-gray-400 flex items-center gap-0.5", children: [_jsx(Clock, { size: 9 }), " ", r.deliveryTime, " min"] })), r.deliveryFee !== undefined && r.deliveryFee !== null && (_jsx("span", { className: "text-[11px] text-gray-400", children: Number(r.deliveryFee) === 0 ? "Livraison gratuite" : `$${r.deliveryFee}` }))] })] })] }, r.id))) })] }))] })] }));
}
//# sourceMappingURL=SearchOverlay.js.map