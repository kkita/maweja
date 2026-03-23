import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import AdBanner from "../../components/AdBanner";
import { useI18n } from "../../lib/i18n";
import { Star, Clock, Heart, MapPin, ChevronRight, Search } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { resolveImg } from "../../lib/queryClient";
import type { Restaurant, ServiceCategory, ServiceCatalogItem, RestaurantCategory } from "@shared/schema";

/* ────────────────────────────────────────────────────────────────────────────
   CATEGORY ITEM — dynamic from API with image
───────────────────────────────────────────────────────────────────────────── */
const FALLBACK_EMOJIS: Record<string, string> = {
  fastfood: "🍔", "fast food": "🍔",
  delivery: "🛵", livraison: "🛵",
  grocery: "🛍️", épicerie: "🛍️",
  pizza: "🍕",
  promo: "🏷️", promotion: "🏷️",
  restaurant: "🍽️",
  shop: "🛒", boutique: "🛒",
  all: "✦", tout: "✦",
  hotel: "🏨", hôtellerie: "🏨",
  transport: "🚗",
  coiffure: "💇", salon: "💇",
  massage: "💆",
  nettoyage: "🧹", ménage: "🧹",
  coursier: "📦",
  services: "🔧",
};

function getFallbackEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(FALLBACK_EMOJIS)) {
    if (lower.includes(k)) return v;
  }
  return "✦";
}

interface CategoryItemProps {
  name: string;
  imageUrl?: string | null;
  active: boolean;
  testId: string;
  onClick: () => void;
}

function CategoryItem({ name, imageUrl, active, testId, onClick }: CategoryItemProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform flex-shrink-0"
      style={{ width: 68 }}
    >
      <div
        className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center"
        style={{
          border: active ? "2.5px solid #F59E0B" : "1.5px solid rgba(0,0,0,0.07)",
          boxShadow: active ? "0 0 0 3px rgba(245,158,11,0.15)" : "0 1px 6px rgba(0,0,0,0.07)",
          background: imageUrl ? "transparent" : "#F9FAFB",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span style={{ fontSize: 26 }}>{getFallbackEmoji(name)}</span>
        )}
      </div>
      <span
        className="text-center leading-tight"
        style={{
          fontSize: 10,
          fontWeight: active ? 700 : 500,
          color: active ? "#F59E0B" : "#374151",
          width: 68,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {name}
      </span>
    </button>
  );
}

/* FOOD FILTER PILLS — now loaded dynamically from /api/restaurant-categories */

/* ────────────────────────────────────────────────────────────────────────────
   RESTAURANT CARD — cover fully rounded + logo left of text
───────────────────────────────────────────────────────────────────────────── */
function RestaurantCard({ r, onClick }: { r: Restaurant; onClick: () => void }) {
  const [fav, setFav] = useState(false);

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-3xl mb-4 overflow-hidden"
      style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.09)" }}
      data-testid={`restaurant-card-${r.id}`}
    >
      {/* ── Cover photo — fully rounded, inside card with margin ── */}
      <button onClick={onClick} className="block w-full px-3 pt-3" style={{ display: "block" }}>
        <div
          className="relative w-full rounded-2xl overflow-hidden"
          style={{ height: 188 }}
        >
          <img
            src={resolveImg(r.image)}
            alt={r.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Discount badge — set from admin dashboard */}
          {(r as any).discountPercent > 0 && (
            <div className="absolute top-2.5 right-2.5 bg-green-500 text-white font-bold rounded-full px-2.5 py-1 flex items-center gap-1" style={{ fontSize: 10 }}>
              <span>🏷</span>
              <span>-{(r as any).discountPercent}%</span>
              {(r as any).discountLabel && <span>· {(r as any).discountLabel}</span>}
            </div>
          )}

          {/* Closed overlay */}
          {!r.isActive && (
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-xl">FERMÉ</span>
            </div>
          )}
        </div>
      </button>

      {/* ── Info section — logo left of text, visually distinct ── */}
      <div className="px-4 py-3.5 flex items-start gap-3">
        {/* Circular logo — solid fill, no whitespace */}
        <div
          className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-red-100"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
        >
          {r.logoUrl ? (
            <img
              src={resolveImg(r.logoUrl)}
              alt={r.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <span className="text-white font-black text-lg">{r.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <button onClick={onClick} className="text-left flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-white leading-tight truncate" style={{ fontSize: 14 }}>
                {r.name}
              </p>
              {r.cuisine && (
                <p className="text-gray-400 dark:text-gray-500 text-xs truncate">{r.cuisine}</p>
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setFav(!fav); }}
              className="flex-shrink-0 active:scale-90 transition-transform"
              data-testid={`button-fav-${r.id}`}
            >
              <Heart
                size={18}
                className={fav ? "fill-red-500 text-red-500" : "text-red-300"}
                strokeWidth={1.8}
              />
            </button>
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-gray-700 font-semibold" style={{ fontSize: 11 }}>{r.rating}</span>
            </div>
            <div className="w-px h-3 bg-gray-200" />
            <div className="flex items-center gap-1 text-gray-500">
              <Clock size={11} strokeWidth={1.8} />
              <span style={{ fontSize: 11 }}>{r.deliveryTime || "—"}</span>
            </div>
            <div className="w-px h-3 bg-gray-200" />
            {(r as any).isFeatured && (
              <span className="text-amber-500 font-bold flex items-center gap-0.5" style={{ fontSize: 11 }}>
                <Star size={10} className="fill-amber-400 text-amber-400" />
                Partenaire
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
const PAGE_SIZE = 6;

export default function HomePage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();

  const { data: restaurants = [], isLoading } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"] });
  const { data: serviceCategories = [] } = useQuery<ServiceCategory[]>({ queryKey: ["/api/service-categories"] });
  const { data: catalogItems = [] } = useQuery<ServiceCatalogItem[]>({ queryKey: ["/api/service-catalog"] });
  const { data: restaurantCategories = [] } = useQuery<RestaurantCategory[]>({ queryKey: ["/api/restaurant-categories"] });
  const activeRestCats = restaurantCategories.filter(c => c.isActive);

  const [activeCatId, setActiveCatId] = useState<number | null>(null);
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [globalSearch, setGlobalSearch] = useState("");

  /* ── Listen to ClientNav search events ── */
  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent).detail?.query ?? "";
      setGlobalSearch(q);
      if (q) { setActiveCuisine(null); setActiveCatId(null); }
    };
    document.addEventListener("maweja-search", handler);
    return () => document.removeEventListener("maweja-search", handler);
  }, []);

  /* filter restaurants */
  const filtered = restaurants.filter(r => {
    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      return (r.name?.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q) || r.address?.toLowerCase().includes(q));
    }
    if (activeCuisine && r.cuisine !== activeCuisine) return false;
    return true;
  });

  /* Service categories matching search */
  const matchedServices = globalSearch
    ? activeCategories.filter(c => c.name.toLowerCase().includes(globalSearch.toLowerCase()))
    : [];

  const displayed = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;

  /* Infinite scroll sentinel */
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMore = useCallback(() => {
    setDisplayCount(prev => prev + PAGE_SIZE);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  /* Reset count when filter changes */
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [activeCuisine]);

  /* Service category click */
  const handleServiceClick = (cat: ServiceCategory) => {
    const hasCatalog = catalogItems.some(item => item.categoryId === cat.id && item.isActive);
    if (hasCatalog) {
      navigate(`/services?cat=${cat.id}`);
    } else {
      sessionStorage.setItem("maweja_service_request", JSON.stringify({
        categoryId: cat.id,
        categoryName: cat.name,
        catalogItemId: null,
        catalogItemName: null,
        catalogItemPrice: null,
        catalogItemImage: null,
      }));
      navigate("/services/new");
    }
  };

  /* Category toggle */
  const handleCatClick = (cat: ServiceCategory) => {
    if (activeCatId === cat.id) {
      setActiveCatId(null);
      setActiveCuisine(null);
    } else {
      setActiveCatId(cat.id);
      handleServiceClick(cat);
    }
  };

  /* Pill toggle */
  const handlePill = (cuisine: string) => {
    setActiveCuisine(prev => prev === cuisine ? null : cuisine);
    setActiveCatId(null);
  };

  const activeCategories = serviceCategories.filter(c => c.isActive);

  /* Static "Tous les services" category */
  const STATIC_SERVICES_CAT = { id: -1, name: "Tous les services", imageUrl: null, isActive: true };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-24" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <ClientNav />

      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* ── Sponsorisés ─────────────────────────────────────── */}
        <section className="mb-5">
          <p
            className="font-bold text-gray-900 dark:text-white mb-2.5"
            style={{ fontSize: 15, borderBottom: "2px solid #EC0000", display: "inline-block", paddingBottom: 2 }}
          >
            Sponsorisés
          </p>
          <AdBanner />
        </section>

        {/* ── Services title ────────────────────────────────────────── */}
        {activeCategories.length > 0 && (
          <div className="mb-3">
            <p
              className="font-black text-gray-900 dark:text-white"
              style={{
                fontSize: 15,
                borderBottom: "2.5px solid #dc2626",
                display: "inline-block",
                paddingBottom: 3,
                letterSpacing: "-0.2px",
              }}
            >
              Catégories
            </p>
          </div>
        )}

        {/* ── Category grid — 2-row horizontal scroll — dynamic from Admin ── */}
        {activeCategories.length > 0 && (
          <section className="mb-5">
            <div
              className="overflow-x-auto no-scrollbar -mx-4 px-4"
              data-testid="category-grid-scroll"
            >
              <div
                className="grid gap-x-2 gap-y-3 pb-1"
                style={{
                  gridTemplateRows: "repeat(2, auto)",
                  gridAutoFlow: "column",
                  width: "max-content",
                }}
              >
                {/* Static "Tous les services" entry */}
                <CategoryItem
                  key="all-services"
                  name="Tous les services"
                  imageUrl={null}
                  active={false}
                  testId="cat-all-services"
                  onClick={() => navigate("/services")}
                />

                {activeCategories.map(cat => (
                  <CategoryItem
                    key={cat.id}
                    name={cat.name}
                    imageUrl={cat.imageUrl}
                    active={activeCatId === cat.id}
                    testId={`cat-${cat.id}`}
                    onClick={() => handleCatClick(cat)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Title: Tous les établissements ──────────────────── */}
        <p
          className="font-black text-gray-900 dark:text-white mb-3"
          style={{
            fontSize: 15,
            borderBottom: "2.5px solid #EC0000",
            display: "inline-block",
            paddingBottom: 3,
            letterSpacing: "-0.2px",
          }}
        >
          Tous les établissements
        </p>

        {/* ── Food type pills — dynamic from admin ─────────── */}
        {activeRestCats.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mb-5 pb-0.5" data-testid="food-pills">
            {activeRestCats.map(cat => {
              const isActive = activeCuisine === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => handlePill(cat.name)}
                  data-testid={`pill-${cat.id}`}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-900 active:scale-95 transition-all"
                  style={{
                    border: isActive ? "1.5px solid #dc2626" : "1.5px solid #E5E7EB",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#dc2626" : "#374151",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Search results: Services ────────────────────────────── */}
        {globalSearch && matchedServices.length > 0 && (
          <section className="mb-5">
            <p className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2" style={{ fontSize: 14 }}>
              <Search size={14} className="text-red-500" />
              Services trouvés
            </p>
            <div className="flex gap-3 flex-wrap">
              {matchedServices.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setGlobalSearch(""); navigate(`/services?cat=${cat.id}`); }}
                  data-testid={`search-service-${cat.id}`}
                  className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-2.5 active:scale-95 transition-all"
                  style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.08)", border: "1px solid rgba(220,38,38,0.15)" }}
                >
                  {cat.imageUrl && <img src={resolveImg(cat.imageUrl)} alt={cat.name} className="w-7 h-7 rounded-lg object-cover" />}
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Section title ─────────────────────────────────────── */}
        <div id="restaurants-section" className="flex items-center justify-between mb-4">
          {(globalSearch || activeCuisine) && (
            <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: 15 }}>
              {globalSearch ? `Résultats pour "${globalSearch}"` : activeCuisine}
            </p>
          )}
          {(activeCuisine) && (
            <button
              onClick={() => { setActiveCuisine(null); setActiveCatId(null); }}
              className="text-red-600 font-semibold flex items-center gap-1"
              style={{ fontSize: 12 }}
              data-testid="button-clear-filter"
            >
              Tout voir <ChevronRight size={13} />
            </button>
          )}
        </div>

        {/* ── Restaurant cards ──────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.09)" }}>
                <div className="px-3 pt-3">
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-2xl" style={{ height: 188 }} />
                </div>
                <div className="p-4 flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-full" />
                    <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 text-center" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.09)" }} data-testid="text-no-results">
            <p className="text-gray-700 dark:text-gray-200 font-semibold text-sm">{t.client.noRestaurant}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{t.client.noInCategory}</p>
            <button
              onClick={() => { setActiveCuisine(null); setActiveCatId(null); }}
              className="mt-4 bg-red-600 text-white text-xs font-bold px-5 py-2 rounded-xl active:scale-95 transition-all"
              data-testid="button-reset-filters"
            >
              Tout afficher
            </button>
          </div>
        ) : (
          <>
            {displayed.map(r => (
              <RestaurantCard
                key={r.id}
                r={r}
                onClick={() => navigate(`/restaurant/${r.id}`)}
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" data-testid="scroll-sentinel" />

            {/* Loading more indicator */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
