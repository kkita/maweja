import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { authFetchJson, resolveImg } from "../../lib/queryClient";
import { Hotel, Car, Sparkles, Package, PartyPopper, Wrench, Bike, HelpCircle, Briefcase, Clock, CheckCircle, AlertCircle, Loader2, ArrowLeft, Image, Scissors, X } from "lucide-react";
const iconMap = {
    Hotel, Car, Sparkles, Package, PartyPopper, Wrench, Bike, HelpCircle, Briefcase, Scissors,
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
export default function ServicesPage() {
    const [, navigate] = useLocation();
    const { user } = useAuth();
    const { t } = useI18n();
    const [selectedCatalogCategory, setSelectedCatalogCategory] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);
    const { data: categories = [], isLoading: catsLoading } = useQuery({
        queryKey: ["/api/service-categories"],
    });
    const { data: myRequests = [], isLoading: reqsLoading } = useQuery({
        queryKey: ["/api/service-requests"],
        queryFn: () => authFetchJson("/api/service-requests"),
        enabled: !!user,
    });
    const { data: allCatalogItems = [] } = useQuery({
        queryKey: ["/api/service-catalog"],
    });
    const activeCategories = categories.filter(c => c.isActive);
    // Auto-open a category when navigated from HomePage with ?cat=ID
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const catId = params.get("cat");
        if (!catId || categories.length === 0)
            return;
        const cat = categories.find(c => c.id === Number(catId));
        if (cat && !selectedCatalogCategory) {
            setSelectedCatalogCategory(cat);
            // Clean the URL param without reloading
            const url = new URL(window.location.href);
            url.searchParams.delete("cat");
            window.history.replaceState({}, "", url.pathname);
        }
    }, [categories]);
    const catalogItemsForCategory = selectedCatalogCategory
        ? allCatalogItems.filter(item => item.categoryId === selectedCatalogCategory.id && item.isActive)
        : [];
    const categoryHasCatalogItems = (catId) => allCatalogItems.some(item => item.categoryId === catId && item.isActive);
    const catalogItemCount = (catId) => allCatalogItems.filter(item => item.categoryId === catId && item.isActive).length;
    const handleCategoryClick = (cat) => {
        if (categoryHasCatalogItems(cat.id)) {
            setSelectedCatalogCategory(cat);
            setSelectedItem(null);
            setPreviewItem(null);
            return;
        }
        sessionStorage.setItem("maweja_service_request", JSON.stringify({
            categoryId: cat.id,
            categoryName: cat.name,
            catalogItemId: null,
            catalogItemName: null,
            catalogItemPrice: null,
            catalogItemImage: null,
        }));
        navigate("/services/new");
    };
    const handleSelectModel = (item) => {
        setSelectedItem(prev => prev?.id === item.id ? null : item);
    };
    const handleRequestQuote = () => {
        if (!selectedCatalogCategory)
            return;
        const catalogData = {
            categoryId: selectedCatalogCategory.id,
            categoryName: selectedCatalogCategory.name,
            catalogItemId: selectedItem?.id || null,
            catalogItemName: selectedItem?.name || null,
            catalogItemPrice: selectedItem?.price || null,
            catalogItemImage: selectedItem?.imageUrl || null,
        };
        sessionStorage.setItem("maweja_service_request", JSON.stringify(catalogData));
        navigate("/services/new");
    };
    const statusConfig = {
        pending: { label: t.services.statusPending, color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
        reviewing: { label: t.services.statusReviewing, color: "text-blue-600", bg: "bg-blue-50", icon: Loader2 },
        accepted: { label: t.services.statusAccepted, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
        rejected: { label: t.services.statusRejected, color: "text-red-600", bg: "bg-red-50", icon: AlertCircle },
        completed: { label: t.services.statusCompleted, color: "text-gray-600", bg: "bg-gray-50", icon: CheckCircle },
    };
    if (previewItem) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("button", { onClick: () => setPreviewItem(null), className: "w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-800", "data-testid": "button-back-preview", children: _jsx(ArrowLeft, { size: 18, className: "text-gray-600 dark:text-gray-300" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-gray-900 dark:text-white", children: previewItem.name }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: selectedCatalogCategory?.name })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4", children: [_jsx("div", { className: "relative w-full", style: { paddingBottom: "100%" }, children: _jsx("img", { src: resolveImg(previewItem.imageUrl), alt: previewItem.name, className: "absolute inset-0 w-full h-full object-cover", "data-testid": "img-preview-full" }) }), _jsxs("div", { className: "p-5", children: [_jsx("h3", { className: "text-xl font-black text-gray-900 dark:text-white", children: previewItem.name }), previewItem.description && _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: previewItem.description }), previewItem.price && (_jsx("div", { className: "mt-3 inline-block bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold text-lg px-4 py-2 rounded-xl", children: previewItem.price }))] })] }), _jsx("button", { onClick: () => {
                                setSelectedItem(previewItem);
                                setPreviewItem(null);
                            }, "data-testid": "button-select-from-preview", className: "w-full bg-red-600 text-white py-4 rounded-2xl text-sm font-bold hover:bg-red-700 shadow-xl shadow-red-200 dark:shadow-red-900/40 mb-3", children: t.services.selectModel }), _jsx("button", { onClick: () => setPreviewItem(null), className: "w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-2xl text-sm font-semibold", children: t.common.back })] })] }));
    }
    if (selectedCatalogCategory) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("button", { onClick: () => { setSelectedCatalogCategory(null); setSelectedItem(null); }, className: "w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-800", "data-testid": "button-back-catalog", children: _jsx(ArrowLeft, { size: 18, className: "text-gray-600 dark:text-gray-300" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-lg font-bold text-gray-900 dark:text-white", "data-testid": "text-catalog-title", children: selectedCatalogCategory.name }), _jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: [t.services.catalog, " \u2022 ", catalogItemsForCategory.length, " mod\u00E8les"] })] })] }), _jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500 mb-5 ml-[52px]", children: t.services.browseCatalog }), catalogItemsForCategory.length === 0 ? (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center", children: [_jsx(Image, { size: 32, className: "text-gray-300 dark:text-gray-600 mx-auto mb-3" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: t.services.noCatalogItems })] })) : (_jsx("div", { className: "grid grid-cols-2 gap-3 mb-6", children: catalogItemsForCategory.map(item => {
                                const isSelected = selectedItem?.id === item.id;
                                return (_jsxs("div", { className: `bg-white dark:bg-gray-900 rounded-2xl border-2 overflow-hidden transition-all ${isSelected ? "border-red-500 shadow-lg shadow-red-100 dark:shadow-red-900/30 scale-[1.02]" : "border-gray-100 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-800 hover:shadow-md"}`, "data-testid": `catalog-item-${item.id}`, children: [_jsx("button", { onClick: () => setPreviewItem(item), className: "w-full text-left", "data-testid": `catalog-preview-${item.id}`, children: _jsxs("div", { className: "relative h-40", children: [_jsx("img", { src: resolveImg(item.imageUrl), alt: item.name, className: "w-full h-full object-cover" }), isSelected && (_jsx("div", { className: "absolute inset-0 bg-red-600/20 flex items-center justify-center", children: _jsx("div", { className: "w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg", children: _jsx(CheckCircle, { size: 22, className: "text-white" }) }) })), item.price && (_jsx("div", { className: "absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg", children: item.price }))] }) }), _jsxs("div", { className: "p-3", children: [_jsx("h4", { className: "font-bold text-xs text-gray-900 dark:text-white line-clamp-1", children: item.name }), item.description && _jsx("p", { className: "text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2", children: item.description }), _jsx("button", { onClick: () => handleSelectModel(item), "data-testid": `catalog-select-${item.id}`, className: `w-full mt-2 py-2 rounded-xl text-[11px] font-bold transition-all ${isSelected
                                                        ? "bg-red-600 text-white"
                                                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"}`, children: isSelected ? "✓ " + t.services.selectedModel : t.services.selectModel })] })] }, item.id));
                            }) })), selectedItem && (_jsxs("div", { className: "bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800/40 p-4 mb-4 flex items-center gap-3", children: [_jsx("img", { src: resolveImg(selectedItem.imageUrl), alt: selectedItem.name, className: "w-14 h-14 rounded-xl object-cover border-2 border-red-300 dark:border-red-700" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-[10px] font-semibold text-red-500 uppercase", children: t.services.selectedModel }), _jsx("p", { className: "font-bold text-sm text-gray-900 dark:text-white", children: selectedItem.name }), selectedItem.price && _jsx("p", { className: "text-xs text-red-600 dark:text-red-400 font-semibold", children: selectedItem.price })] }), _jsx("button", { onClick: () => setSelectedItem(null), className: "w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center", "data-testid": "button-deselect", children: _jsx(X, { size: 14, className: "text-red-600 dark:text-red-400" }) })] })), _jsx("button", { onClick: handleRequestQuote, "data-testid": "button-request-quote", className: `w-full py-4 rounded-2xl text-sm font-bold shadow-xl transition-all ${selectedItem
                                ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200 dark:shadow-red-900/40"
                                : "bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-900 shadow-gray-200"}`, children: selectedItem ? `${t.services.requestQuote} — ${selectedItem.name}` : t.services.requestQuote })] })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-2xl font-black text-gray-900 dark:text-white", "data-testid": "text-services-title", children: t.services.title }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: t.services.subtitle })] }), catsLoading ? (_jsx("div", { className: "flex justify-center py-12", children: _jsx("div", { className: "w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" }) })) : (_jsx("div", { className: "grid grid-cols-2 gap-3 mb-8", children: activeCategories.map((cat) => {
                            const hasCatalog = categoryHasCatalogItems(cat.id);
                            const itemCount = catalogItemCount(cat.id);
                            // Extract response time from description e.g. "Réponse < 90 min"
                            const timeMatch = cat.description.match(/Réponse\s*<\s*[\w\s]+/);
                            const responseTime = timeMatch ? timeMatch[0] : null;
                            // Description without the response time suffix
                            const cleanDesc = cat.description.replace(/[.!]?\s*Réponse\s*<\s*[\w\s]+$/, "").trim();
                            return (_jsxs("button", { onClick: () => handleCategoryClick(cat), "data-testid": `card-service-${cat.id}`, className: "group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-all duration-200", style: { boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }, children: [_jsxs("div", { className: "relative w-full", style: { paddingBottom: "72%" }, children: [cat.imageUrl ? (_jsx("img", { src: resolveImg(cat.imageUrl), alt: cat.name, className: "absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", "data-testid": `img-service-${cat.id}` })) : (_jsx("div", { className: "absolute inset-0 bg-gray-100 flex items-center justify-center", children: _jsx(Briefcase, { size: 32, className: "text-gray-300" }) })), responseTime && (_jsx("div", { className: "absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full", children: responseTime })), hasCatalog && (_jsxs("div", { className: "absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm", children: ["\uD83D\uDCF8 ", itemCount, " mod\u00E8le", itemCount > 1 ? "s" : ""] }))] }), _jsxs("div", { className: "p-3", children: [_jsx("h3", { className: "font-black text-[13px] text-gray-900 dark:text-white leading-tight", children: cat.name }), _jsx("p", { className: "text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2 leading-relaxed", children: cleanDesc })] })] }, cat.id));
                        }) })), user && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold text-gray-900 dark:text-white", "data-testid": "text-my-requests", children: t.services.myRequests }), _jsxs("span", { className: "text-xs text-gray-400 dark:text-gray-500 font-medium", children: [myRequests.length, " ", t.services.request, myRequests.length !== 1 ? "s" : ""] })] }), reqsLoading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx("div", { className: "w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" }) })) : myRequests.length === 0 ? (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3", children: _jsx(Briefcase, { size: 28, className: "text-gray-300 dark:text-gray-600" }) }), _jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-1", children: t.services.noRequests }), _jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: t.services.noRequestsDesc })] })) : (_jsx("div", { className: "space-y-3", children: myRequests.map(req => {
                                    const status = statusConfig[req.status] || statusConfig.pending;
                                    const StatusIcon = status.icon;
                                    return (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-shadow cursor-pointer", "data-testid": `request-card-${req.id}`, onClick: () => navigate(`/services/request/${req.id}`), children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-bold text-sm text-gray-900 dark:text-white", children: req.categoryName }), _jsx("p", { className: "text-[11px] text-gray-400 dark:text-gray-500 mt-0.5", children: new Date(req.createdAt).toLocaleDateString("fr-CD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) })] }), _jsxs("span", { className: `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${status.bg} ${status.color}`, children: [_jsx(StatusIcon, { size: 12 }), status.label] })] }), _jsxs("div", { className: "flex items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400", children: [req.serviceType && _jsxs("span", { children: [t.services.type, ": ", req.serviceType] }), req.budget && _jsxs("span", { children: [t.admin.budget, ": ", req.budget] }), _jsx("span", { className: "capitalize", children: req.contactMethod })] }), req.adminNotes && (_jsxs("div", { className: "mt-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2", children: [_jsxs("p", { className: "text-[10px] font-semibold text-blue-700 dark:text-blue-400", children: [t.services.teamNote, ":"] }), _jsx("p", { className: "text-[11px] text-blue-600 dark:text-blue-300 mt-0.5", children: req.adminNotes })] }))] }, req.id));
                                }) }))] })), !user && (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center", children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: t.services.loginToRequest }), _jsx("button", { onClick: () => navigate("/login"), "data-testid": "button-login-services", className: "mt-3 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700", children: t.common.login })] }))] })] }));
}
//# sourceMappingURL=ServicesPage.js.map