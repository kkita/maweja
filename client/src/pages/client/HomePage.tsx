import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import AdBanner from "../../components/AdBanner";
import { useI18n } from "../../lib/i18n";
import { Star, Clock, Heart, MapPin, ChevronRight } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Restaurant, ServiceCategory, ServiceCatalogItem } from "@shared/schema";

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

/* ────────────────────────────────────────────────────────────────────────────
   FOOD FILTER PILLS
───────────────────────────────────────────────────────────────────────────── */
const FOOD_PILLS = [
  { key: "Pizzas",     emoji: "🍕", cuisine: "Pizza" },
  { key: "Sushis",     emoji: "🍣", cuisine: "Japonais" },
  { key: "Sandwichs",  emoji: "🥪", cuisine: "Fast Food" },
  { key: "Burgers",    emoji: "🍔", cuisine: "Burgers" },
  { key: "Congolais",  emoji: "🇨🇩", cuisine: "Congolais" },
  { key: "Brunch",     emoji: "☕", cuisine: "Café & Brunch" },
  { key: "Grillades",  emoji: "🔥", cuisine: "Grillades" },
  { key: "Libanais",   emoji: "🧆", cuisine: "Libanais" },
];

/* ────────────────────────────────────────────────────────────────────────────
   RESTAURANT CARD — cover fully rounded + logo left of text
───────────────────────────────────────────────────────────────────────────── */
function RestaurantCard({ r, onClick }: { r: Restaurant; onClick: () => void }) {
  const [fav, setFav] = useState(false);

  return (
    <div
      className="bg-white rounded-3xl mb-4 overflow-hidden"
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
            src={r.image}
            alt={r.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Discount badge */}
          {r.rating >= 4.5 && (
            <div className="absolute top-2.5 right-2.5 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              Discount 10%
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
              src={r.logoUrl}
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
              <p className="font-bold text-gray-900 leading-tight truncate" style={{ fontSize: 14 }}>
                {r.name}
              </p>
              {r.cuisine && (
                <p className="text-gray-400 text-xs truncate">{r.cuisine}</p>
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
            {r.deliveryFee != null && r.deliveryFee > 0 ? (
              <span className="text-gray-500" style={{ fontSize: 11 }}>{formatPrice(r.deliveryFee)} livraison</span>
            ) : (
              <span className="text-green-600 font-semibold" style={{ fontSize: 11 }}>Livraison offerte</span>
            )}
            {r.address && (
              <>
                <div className="w-px h-3 bg-gray-200" />
                <div className="flex items-center gap-0.5 text-gray-400 min-w-0">
                  <MapPin size={10} strokeWidth={1.8} className="flex-shrink-0" />
                  <span className="truncate" style={{ fontSize: 10 }}>{r.address.split(",")[0]}</span>
                </div>
              </>
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

  const [activeCatId, setActiveCatId] = useState<number | null>(null);
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  /* filter restaurants */
  const filtered = restaurants.filter(r => {
    if (activeCuisine && r.cuisine !== activeCuisine) return false;
    return true;
  });

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

  return (
    <div className="min-h-screen bg-gray-50 pb-24" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <ClientNav />

      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* ── Sponsorisés ─────────────────────────────────────── */}
        <section className="mb-5">
          <p
            className="font-bold text-gray-900 mb-2.5"
            style={{ fontSize: 15, borderBottom: "2px solid #111", display: "inline-block", paddingBottom: 2 }}
          >
            Sponsorisés
          </p>
          <AdBanner />
        </section>

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

        {/* ── Food type pills ───────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mb-5 pb-0.5" data-testid="food-pills">
          {FOOD_PILLS.map(pill => {
            const isActive = activeCuisine === pill.cuisine;
            return (
              <button
                key={pill.key}
                onClick={() => handlePill(pill.cuisine)}
                data-testid={`pill-${pill.key.toLowerCase()}`}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white active:scale-95 transition-all"
                style={{
                  border: isActive ? "1.5px solid #dc2626" : "1.5px solid #E5E7EB",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontSize: 14 }}>{pill.emoji}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#dc2626" : "#374151",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pill.key}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Section title ─────────────────────────────────────── */}
        <div id="restaurants-section" className="flex items-center justify-between mb-4">
          <p className="font-bold text-gray-900" style={{ fontSize: 15 }}>
            {activeCuisine ? activeCuisine : "Tous les établissements"}
          </p>
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
              <div key={i} className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.09)" }}>
                <div className="px-3 pt-3">
                  <div className="animate-pulse bg-gray-200 rounded-2xl" style={{ height: 188 }} />
                </div>
                <div className="p-4 flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-32 bg-gray-200 animate-pulse rounded-full" />
                    <div className="h-3 w-48 bg-gray-100 animate-pulse rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.09)" }} data-testid="text-no-results">
            <p className="text-gray-700 font-semibold text-sm">{t.client.noRestaurant}</p>
            <p className="text-gray-400 text-xs mt-1">{t.client.noInCategory}</p>
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
