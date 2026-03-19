import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { authFetch, authFetchJson, resolveImg } from "../../lib/queryClient";
import {
  Hotel, Car, Sparkles, Package, PartyPopper, Wrench, Bike, HelpCircle,
  Briefcase, ChevronRight, Clock, CheckCircle, AlertCircle, Loader2, ArrowLeft, Image, Scissors, X
} from "lucide-react";
import type { ServiceCategory, ServiceRequest, ServiceCatalogItem } from "@shared/schema";

const iconMap: Record<string, any> = {
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
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<ServiceCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<ServiceCatalogItem | null>(null);
  const [previewItem, setPreviewItem] = useState<ServiceCatalogItem | null>(null);

  const { data: categories = [], isLoading: catsLoading } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/service-categories"],
  });

  const { data: myRequests = [], isLoading: reqsLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
    queryFn: () => authFetchJson("/api/service-requests"),
    enabled: !!user,
  });

  const { data: allCatalogItems = [] } = useQuery<ServiceCatalogItem[]>({
    queryKey: ["/api/service-catalog"],
  });

  const activeCategories = categories.filter(c => c.isActive);

  // Auto-open a category when navigated from HomePage with ?cat=ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catId = params.get("cat");
    if (!catId || categories.length === 0) return;
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

  const categoryHasCatalogItems = (catId: number) =>
    allCatalogItems.some(item => item.categoryId === catId && item.isActive);

  const catalogItemCount = (catId: number) =>
    allCatalogItems.filter(item => item.categoryId === catId && item.isActive).length;

  const handleCategoryClick = (cat: ServiceCategory) => {
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

  const handleSelectModel = (item: ServiceCatalogItem) => {
    setSelectedItem(prev => prev?.id === item.id ? null : item);
  };

  const handleRequestQuote = () => {
    if (!selectedCatalogCategory) return;
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

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: t.services.statusPending, color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
    reviewing: { label: t.services.statusReviewing, color: "text-blue-600", bg: "bg-blue-50", icon: Loader2 },
    accepted: { label: t.services.statusAccepted, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
    rejected: { label: t.services.statusRejected, color: "text-red-600", bg: "bg-red-50", icon: AlertCircle },
    completed: { label: t.services.statusCompleted, color: "text-gray-600", bg: "bg-gray-50", icon: CheckCircle },
  };

  if (previewItem) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24">
        <ClientNav />
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setPreviewItem(null)}
              className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-800" data-testid="button-back-preview">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{previewItem.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{selectedCatalogCategory?.name}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4">
            <div className="relative w-full" style={{ paddingBottom: "100%" }}>
              <img src={resolveImg(previewItem.imageUrl)} alt={previewItem.name}
                className="absolute inset-0 w-full h-full object-cover" data-testid="img-preview-full" />
            </div>
            <div className="p-5">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{previewItem.name}</h3>
              {previewItem.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{previewItem.description}</p>}
              {previewItem.price && (
                <div className="mt-3 inline-block bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold text-lg px-4 py-2 rounded-xl">
                  {previewItem.price}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedItem(previewItem);
              setPreviewItem(null);
            }}
            data-testid="button-select-from-preview"
            className="w-full bg-red-600 text-white py-4 rounded-2xl text-sm font-bold hover:bg-red-700 shadow-xl shadow-red-200 dark:shadow-red-900/40 mb-3"
          >
            {t.services.selectModel}
          </button>
          <button
            onClick={() => setPreviewItem(null)}
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-2xl text-sm font-semibold"
          >
            {t.common.back}
          </button>
        </div>
      </div>
    );
  }

  if (selectedCatalogCategory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24">
        <ClientNav />
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => { setSelectedCatalogCategory(null); setSelectedItem(null); }}
              className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-800" data-testid="button-back-catalog">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white" data-testid="text-catalog-title">{selectedCatalogCategory.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.services.catalog} • {catalogItemsForCategory.length} modèles</p>
            </div>
          </div>

          <p className="text-sm text-gray-400 dark:text-gray-500 mb-5 ml-[52px]">{t.services.browseCatalog}</p>

          {catalogItemsForCategory.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
              <Image size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.services.noCatalogItems}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {catalogItemsForCategory.map(item => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div key={item.id} className={`bg-white dark:bg-gray-900 rounded-2xl border-2 overflow-hidden transition-all ${
                    isSelected ? "border-red-500 shadow-lg shadow-red-100 dark:shadow-red-900/30 scale-[1.02]" : "border-gray-100 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-800 hover:shadow-md"
                  }`} data-testid={`catalog-item-${item.id}`}>
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="w-full text-left"
                      data-testid={`catalog-preview-${item.id}`}
                    >
                      <div className="relative h-40">
                        <img src={resolveImg(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircle size={22} className="text-white" />
                            </div>
                          </div>
                        )}
                        {item.price && (
                          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                            {item.price}
                          </div>
                        )}
                      </div>
                    </button>
                    <div className="p-3">
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-1">{item.name}</h4>
                      {item.description && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>}
                      <button
                        onClick={() => handleSelectModel(item)}
                        data-testid={`catalog-select-${item.id}`}
                        className={`w-full mt-2 py-2 rounded-xl text-[11px] font-bold transition-all ${
                          isSelected
                            ? "bg-red-600 text-white"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        }`}
                      >
                        {isSelected ? "✓ " + t.services.selectedModel : t.services.selectModel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedItem && (
            <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800/40 p-4 mb-4 flex items-center gap-3">
              <img src={resolveImg(selectedItem.imageUrl)} alt={selectedItem.name} className="w-14 h-14 rounded-xl object-cover border-2 border-red-300 dark:border-red-700" />
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-red-500 uppercase">{t.services.selectedModel}</p>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{selectedItem.name}</p>
                {selectedItem.price && <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{selectedItem.price}</p>}
              </div>
              <button onClick={() => setSelectedItem(null)} className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center" data-testid="button-deselect">
                <X size={14} className="text-red-600 dark:text-red-400" />
              </button>
            </div>
          )}

          <button
            onClick={handleRequestQuote}
            data-testid="button-request-quote"
            className={`w-full py-4 rounded-2xl text-sm font-bold shadow-xl transition-all ${
              selectedItem
                ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200 dark:shadow-red-900/40"
                : "bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-900 shadow-gray-200"
            }`}
          >
            {selectedItem ? `${t.services.requestQuote} — ${selectedItem.name}` : t.services.requestQuote}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white" data-testid="text-services-title">{t.services.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.services.subtitle}</p>
        </div>

        {catsLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {activeCategories.map((cat) => {
              const hasCatalog = categoryHasCatalogItems(cat.id);
              const itemCount = catalogItemCount(cat.id);
              // Extract response time from description e.g. "Réponse < 90 min"
              const timeMatch = cat.description.match(/Réponse\s*<\s*[\w\s]+/);
              const responseTime = timeMatch ? timeMatch[0] : null;
              // Description without the response time suffix
              const cleanDesc = cat.description.replace(/[.!]?\s*Réponse\s*<\s*[\w\s]+$/, "").trim();
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  data-testid={`card-service-${cat.id}`}
                  className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-all duration-200"
                  style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}
                >
                  {/* Real service image */}
                  <div className="relative w-full" style={{ paddingBottom: "72%" }}>
                    {cat.imageUrl ? (
                      <img
                        src={resolveImg(cat.imageUrl)}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        data-testid={`img-service-${cat.id}`}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                        <Briefcase size={32} className="text-gray-300" />
                      </div>
                    )}
                    {/* Response time badge */}
                    {responseTime && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        {responseTime}
                      </div>
                    )}
                    {hasCatalog && (
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                        📸 {itemCount} modèle{itemCount > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  {/* Name & description */}
                  <div className="p-3">
                    <h3 className="font-black text-[13px] text-gray-900 dark:text-white leading-tight">{cat.name}</h3>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{cleanDesc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {user && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white" data-testid="text-my-requests">{t.services.myRequests}</h3>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{myRequests.length} {t.services.request}{myRequests.length !== 1 ? "s" : ""}</span>
            </div>

            {reqsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myRequests.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Briefcase size={28} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t.services.noRequests}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t.services.noRequestsDesc}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map(req => {
                  const status = statusConfig[req.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-shadow cursor-pointer"
                      data-testid={`request-card-${req.id}`}
                      onClick={() => navigate(`/services/request/${req.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">{req.categoryName}</h4>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {new Date(req.createdAt!).toLocaleDateString("fr-CD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${status.bg} ${status.color}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400">
                        {req.serviceType && <span>{t.services.type}: {req.serviceType}</span>}
                        {req.budget && <span>{t.admin.budget}: {req.budget}</span>}
                        <span className="capitalize">{req.contactMethod}</span>
                      </div>
                      {req.adminNotes && (
                        <div className="mt-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2">
                          <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400">{t.services.teamNote}:</p>
                          <p className="text-[11px] text-blue-600 dark:text-blue-300 mt-0.5">{req.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!user && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.services.loginToRequest}</p>
            <button
              onClick={() => navigate("/login")}
              data-testid="button-login-services"
              className="mt-3 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700"
            >
              {t.common.login}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
