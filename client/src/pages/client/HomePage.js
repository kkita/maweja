import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import AdBanner from "../../components/AdBanner";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { Star, Clock, MapPin, Search, ChevronRight, Flame, ChefHat, X } from "lucide-react";
import { formatPrice } from "../../lib/utils";
const categories = [
    { name: "Tous", nameEn: "All", cuisine: null },
    { name: "Burgers", nameEn: "Burgers", cuisine: "Burgers" },
    { name: "Congolais", nameEn: "Congolese", cuisine: "Congolais" },
    { name: "Grillades", nameEn: "Grills", cuisine: "Grillades" },
    { name: "Fast Food", nameEn: "Fast Food", cuisine: "Fast Food" },
    { name: "Gastronomique", nameEn: "Fine Dining", cuisine: "Gastronomique" },
    { name: "Libanais", nameEn: "Lebanese", cuisine: "Libanais" },
    { name: "International", nameEn: "International", cuisine: "International" },
    { name: "Supermarche", nameEn: "Supermarket", cuisine: "Supermarche" },
];
export default function HomePage() {
    const [, navigate] = useLocation();
    const { user } = useAuth();
    const { t, lang } = useI18n();
    const { data: restaurants = [], isLoading } = useQuery({ queryKey: ["/api/restaurants"] });
    const [activeCategory, setActiveCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAll, setShowAll] = useState(false);
    const availableCuisines = new Set(restaurants.map(r => r.cuisine));
    const visibleCategories = categories.filter(c => c.cuisine === null || availableCuisines.has(c.cuisine));
    const filtered = restaurants.filter(r => {
        if (activeCategory && r.cuisine !== activeCategory)
            return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
        }
        return true;
    });
    const displayedRestaurants = showAll || activeCategory || searchQuery.trim() ? filtered : filtered.slice(0, 6);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "mb-6", children: [_jsxs("p", { className: "text-gray-500 text-sm font-medium", children: [t.client.hello, " ", user?.name?.split(" ")[0], " \uD83D\uDC4B"] }), _jsx("h2", { className: "text-2xl font-black text-gray-900 mt-1", children: t.client.whatToEat })] }), _jsxs("div", { className: "relative mb-6", children: [_jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400", size: 18 }), _jsx("input", { type: "text", placeholder: t.client.searchPlaceholder, value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), "data-testid": "input-search", className: "w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm" }), searchQuery && (_jsx("button", { onClick: () => setSearchQuery(""), className: "absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600", "data-testid": "button-clear-search", children: _jsx(X, { size: 16 }) }))] }), _jsx(AdBanner, {}), _jsxs("div", { className: "bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-5 mb-6 text-white relative overflow-hidden", children: [_jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex items-center gap-1 mb-2", children: [_jsx(Flame, { size: 16 }), _jsx("span", { className: "text-xs font-bold uppercase tracking-wider", children: t.client.specialOffer })] }), _jsx("h3", { className: "text-xl font-bold", children: t.client.freeDelivery }), _jsx("p", { className: "text-red-100 text-sm mt-1", children: t.client.firstOrder }), _jsx("button", { className: "mt-3 bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-bold", "data-testid": "button-promo", children: t.client.orderNow })] }), _jsx("div", { className: "absolute right-0 top-0 w-32 h-full bg-red-500/30 rounded-l-full" })] }), _jsx("div", { className: "flex gap-2 overflow-x-auto no-scrollbar mb-6 -mx-1 px-1", children: visibleCategories.map((c) => {
                            const isActive = activeCategory === c.cuisine;
                            return (_jsx("button", { onClick: () => { setActiveCategory(isActive ? null : c.cuisine); setShowAll(false); }, "data-testid": `category-${c.name.toLowerCase().replace(/\s/g, "-")}`, className: `flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${isActive
                                    ? "bg-red-600 text-white shadow-lg shadow-red-200"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-red-300 hover:text-red-600"}`, children: lang === "en" ? c.nameEn : c.name }, c.name));
                        }) }), _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold text-gray-900", children: activeCategory ? activeCategory : searchQuery ? t.client.results : t.client.popularRestaurants }), !showAll && !activeCategory && !searchQuery && filtered.length > 6 && (_jsxs("button", { onClick: () => setShowAll(true), className: "text-red-600 text-xs font-semibold flex items-center gap-0.5", "data-testid": "button-see-all", children: [t.common.seeAll, " ", _jsx(ChevronRight, { size: 14 })] })), (showAll || activeCategory || searchQuery) && (_jsxs("span", { className: "text-xs text-gray-400 font-medium", "data-testid": "text-result-count", children: [filtered.length, " ", t.common.restaurant, filtered.length !== 1 ? "s" : ""] }))] }), isLoading ? (_jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => (_jsx("div", { className: "bg-white rounded-2xl h-48 animate-pulse" }, i))) })) : displayedRestaurants.length === 0 ? (_jsxs("div", { className: "bg-white rounded-2xl p-12 text-center border border-gray-100", "data-testid": "text-no-results", children: [_jsx(Search, { size: 40, className: "text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-gray-500 font-medium", children: t.client.noRestaurant }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: searchQuery ? t.client.tryOtherSearch : t.client.noInCategory }), _jsx("button", { onClick: () => { setActiveCategory(null); setSearchQuery(""); setShowAll(false); }, className: "mt-4 text-red-600 text-sm font-semibold", "data-testid": "button-reset-filters", children: t.client.seeAllRestaurants })] })) : (_jsx("div", { className: "space-y-4", children: displayedRestaurants.map((r) => (_jsxs("button", { onClick: () => navigate(`/restaurant/${r.id}`), "data-testid": `restaurant-card-${r.id}`, className: "w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all text-left", children: [_jsxs("div", { className: "relative h-36", children: [_jsx("img", { src: r.image, alt: r.name, className: "w-full h-full object-cover" }), _jsxs("div", { className: "absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-sm", children: [_jsx(Star, { size: 12, className: "text-yellow-500 fill-yellow-500" }), _jsx("span", { className: "text-xs font-bold text-gray-900", children: r.rating })] }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3", children: _jsx("span", { className: "text-white text-xs font-medium px-2 py-1 bg-red-600/80 rounded-lg", children: r.cuisine }) })] }), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [r.logoUrl ? (_jsx("img", { src: r.logoUrl, alt: `${r.name} logo`, className: "w-9 h-9 rounded-xl object-cover border border-gray-100 flex-shrink-0", "data-testid": `restaurant-logo-${r.id}` })) : (_jsx("div", { className: "w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 border border-red-100", children: _jsx("span", { className: "text-red-600 font-black text-sm", children: r.name.charAt(0) }) })), _jsxs("div", { className: "min-w-0", children: [_jsx("h4", { className: "font-bold text-gray-900", children: r.name }), _jsx("p", { className: "text-gray-500 text-xs line-clamp-1", children: r.description })] })] }), _jsxs("div", { className: "flex items-center gap-4 mt-3 flex-wrap", children: [_jsxs("div", { className: "flex items-center gap-1 text-gray-500", "data-testid": `restaurant-prep-time-${r.id}`, children: [_jsx(ChefHat, { size: 12 }), _jsxs("span", { className: "text-xs font-medium", children: [t.client.prep, ": ", r.prepTime || r.deliveryTime] })] }), _jsxs("div", { className: "flex items-center gap-1 text-gray-500", children: [_jsx(Clock, { size: 12 }), _jsx("span", { className: "text-xs font-medium", children: r.deliveryTime })] }), _jsxs("div", { className: "flex items-center gap-1 text-gray-500", children: [_jsx(MapPin, { size: 12 }), _jsx("span", { className: "text-xs font-medium", children: r.address.split(",")[0] })] }), _jsxs("div", { className: "ml-auto text-xs font-semibold text-red-600", children: [formatPrice(r.deliveryFee), " ", t.client.deliveryFee] })] })] })] }, r.id))) }))] })] }));
}
//# sourceMappingURL=HomePage.js.map