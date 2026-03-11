import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { authFetch } from "../../lib/queryClient";
import { Hotel, Car, Sparkles, Package, PartyPopper, Wrench, Bike, HelpCircle, Briefcase, ChevronRight, Clock, CheckCircle, AlertCircle, Loader2, X, Image } from "lucide-react";
const iconMap = {
    Hotel, Car, Sparkles, Package, PartyPopper, Wrench, Bike, HelpCircle, Briefcase,
};
const categoryColors = [
    "from-red-500 to-rose-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-purple-500 to-violet-600",
    "from-pink-500 to-fuchsia-600",
    "from-cyan-500 to-sky-600",
    "from-gray-500 to-slate-600",
];
const CATALOG_CATEGORIES = ["Coiffure", "Pedicure et Manicure", "Pedicure & Manicure", "Coiffure Homme", "Coiffure Femme"];
export default function ServicesPage() {
    const [, navigate] = useLocation();
    const { user } = useAuth();
    const { t } = useI18n();
    const [selectedCatalogCategory, setSelectedCatalogCategory] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const { data: categories = [], isLoading: catsLoading } = useQuery({
        queryKey: ["/api/service-categories"],
    });
    const { data: myRequests = [], isLoading: reqsLoading } = useQuery({
        queryKey: ["/api/service-requests"],
        queryFn: () => authFetch("/api/service-requests").then(r => r.json()),
        enabled: !!user,
    });
    const { data: allCatalogItems = [] } = useQuery({
        queryKey: ["/api/service-catalog"],
    });
    const activeCategories = categories.filter(c => c.isActive);
    const hasCatalog = (catName) => {
        return CATALOG_CATEGORIES.some(cc => catName.toLowerCase().includes(cc.toLowerCase()));
    };
    const catalogItemsForCategory = selectedCatalogCategory
        ? allCatalogItems.filter(item => item.categoryId === selectedCatalogCategory.id && item.isActive)
        : [];
    const handleCategoryClick = (cat) => {
        if (hasCatalog(cat.name)) {
            const items = allCatalogItems.filter(item => item.categoryId === cat.id && item.isActive);
            if (items.length > 0) {
                setSelectedCatalogCategory(cat);
                setSelectedItem(null);
                return;
            }
        }
        navigate(`/services/new?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`);
    };
    const handleSelectModel = (item) => {
        setSelectedItem(item);
    };
    const handleRequestQuote = () => {
        if (!selectedCatalogCategory)
            return;
        const params = new URLSearchParams({
            categoryId: String(selectedCatalogCategory.id),
            categoryName: selectedCatalogCategory.name,
        });
        if (selectedItem) {
            params.set("catalogItemId", String(selectedItem.id));
            params.set("catalogItemName", selectedItem.name);
            if (selectedItem.price)
                params.set("catalogItemPrice", selectedItem.price);
        }
        navigate(`/services/new?${params.toString()}`);
    };
    const statusConfig = {
        pending: { label: t.services.statusPending, color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
        reviewing: { label: t.services.statusReviewing, color: "text-blue-600", bg: "bg-blue-50", icon: Loader2 },
        accepted: { label: t.services.statusAccepted, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
        rejected: { label: t.services.statusRejected, color: "text-red-600", bg: "bg-red-50", icon: AlertCircle },
        completed: { label: t.services.statusCompleted, color: "text-gray-600", bg: "bg-gray-50", icon: CheckCircle },
    };
    if (selectedCatalogCategory) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("button", { onClick: () => { setSelectedCatalogCategory(null); setSelectedItem(null); }, className: "w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200", "data-testid": "button-back-catalog", children: _jsx(X, { size: 18 }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-gray-900", "data-testid": "text-catalog-title", children: selectedCatalogCategory.name }), _jsx("p", { className: "text-xs text-gray-500", children: t.services.catalog })] })] }), catalogItemsForCategory.length === 0 ? (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 p-8 text-center", children: [_jsx(Image, { size: 32, className: "text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-sm text-gray-500", children: t.services.noCatalogItems })] })) : (_jsx("div", { className: "grid grid-cols-2 gap-3 mb-6", children: catalogItemsForCategory.map(item => (_jsxs("button", { onClick: () => handleSelectModel(item), "data-testid": `catalog-item-${item.id}`, className: `bg-white rounded-2xl border-2 overflow-hidden text-left transition-all ${selectedItem?.id === item.id ? "border-red-500 shadow-lg shadow-red-100" : "border-gray-100 hover:border-red-200"}`, children: [_jsxs("div", { className: "relative h-32", children: [_jsx("img", { src: item.imageUrl, alt: item.name, className: "w-full h-full object-cover" }), selectedItem?.id === item.id && (_jsx("div", { className: "absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center", children: _jsx(CheckCircle, { size: 14, className: "text-white" }) }))] }), _jsxs("div", { className: "p-3", children: [_jsx("h4", { className: "font-bold text-xs text-gray-900 line-clamp-1", children: item.name }), item.description && _jsx("p", { className: "text-[10px] text-gray-500 mt-0.5 line-clamp-2", children: item.description }), item.price && _jsx("p", { className: "text-xs font-semibold text-red-600 mt-1", children: item.price })] })] }, item.id))) })), selectedItem && (_jsxs("div", { className: "bg-red-50 rounded-2xl border border-red-200 p-4 mb-4", children: [_jsx("p", { className: "text-xs font-semibold text-red-700 mb-1", children: t.services.selectedModel }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: selectedItem.imageUrl, alt: selectedItem.name, className: "w-12 h-12 rounded-xl object-cover" }), _jsxs("div", { children: [_jsx("p", { className: "font-bold text-sm text-gray-900", children: selectedItem.name }), selectedItem.price && _jsx("p", { className: "text-xs text-red-600 font-semibold", children: selectedItem.price })] })] })] })), _jsx("button", { onClick: handleRequestQuote, "data-testid": "button-request-quote", className: "w-full bg-red-600 text-white py-4 rounded-2xl text-sm font-bold hover:bg-red-700 shadow-xl shadow-red-200", children: t.services.requestQuote })] })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-2xl font-black text-gray-900", "data-testid": "text-services-title", children: t.services.title }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: t.services.subtitle })] }), catsLoading ? (_jsx("div", { className: "flex justify-center py-12", children: _jsx("div", { className: "w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" }) })) : (_jsx("div", { className: "grid grid-cols-2 gap-3 mb-8", children: activeCategories.map((cat, i) => {
                            const Icon = iconMap[cat.icon] || Briefcase;
                            const showCatalogBadge = hasCatalog(cat.name) && allCatalogItems.some(item => item.categoryId === cat.id && item.isActive);
                            return (_jsxs("button", { onClick: () => handleCategoryClick(cat), "data-testid": `card-service-${cat.id}`, className: "group relative bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden", children: [_jsx("div", { className: `w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[i % categoryColors.length]} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`, children: _jsx(Icon, { size: 22, className: "text-white" }) }), _jsx("h3", { className: "font-bold text-sm text-gray-900", children: cat.name }), _jsx("p", { className: "text-[11px] text-gray-400 mt-0.5 line-clamp-2", children: cat.description }), showCatalogBadge && (_jsx("span", { className: "inline-block mt-2 text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full", children: t.services.browseCatalog })), _jsx(ChevronRight, { size: 16, className: "absolute top-4 right-3 text-gray-300 group-hover:text-red-500 transition-colors" })] }, cat.id));
                        }) })), user && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold text-gray-900", "data-testid": "text-my-requests", children: t.services.myRequests }), _jsxs("span", { className: "text-xs text-gray-400 font-medium", children: [myRequests.length, " ", t.services.request, myRequests.length !== 1 ? "s" : ""] })] }), reqsLoading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx("div", { className: "w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" }) })) : myRequests.length === 0 ? (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3", children: _jsx(Briefcase, { size: 28, className: "text-gray-300" }) }), _jsx("p", { className: "text-sm font-semibold text-gray-900 mb-1", children: t.services.noRequests }), _jsx("p", { className: "text-xs text-gray-400", children: t.services.noRequestsDesc })] })) : (_jsx("div", { className: "space-y-3", children: myRequests.map(req => {
                                    const status = statusConfig[req.status] || statusConfig.pending;
                                    const StatusIcon = status.icon;
                                    return (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer", "data-testid": `request-card-${req.id}`, onClick: () => navigate(`/services/request/${req.id}`), children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-bold text-sm text-gray-900", children: req.categoryName }), _jsx("p", { className: "text-[11px] text-gray-400 mt-0.5", children: new Date(req.createdAt).toLocaleDateString("fr-CD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) })] }), _jsxs("span", { className: `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${status.bg} ${status.color}`, children: [_jsx(StatusIcon, { size: 12 }), status.label] })] }), _jsxs("div", { className: "flex items-center gap-4 text-[11px] text-gray-500", children: [req.serviceType && _jsxs("span", { children: [t.services.type, ": ", req.serviceType] }), req.budget && _jsxs("span", { children: [t.admin.budget, ": ", req.budget] }), _jsx("span", { className: "capitalize", children: req.contactMethod })] }), req.adminNotes && (_jsxs("div", { className: "mt-2 bg-blue-50 rounded-lg p-2", children: [_jsxs("p", { className: "text-[10px] font-semibold text-blue-700", children: [t.services.teamNote, ":"] }), _jsx("p", { className: "text-[11px] text-blue-600 mt-0.5", children: req.adminNotes })] }))] }, req.id));
                                }) }))] })), !user && (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 p-8 text-center", children: [_jsx("p", { className: "text-sm text-gray-500", children: t.services.loginToRequest }), _jsx("button", { onClick: () => navigate("/login"), "data-testid": "button-login-services", className: "mt-3 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700", children: t.common.login })] }))] })] }));
}
//# sourceMappingURL=ServicesPage.js.map