import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import AdBanner from "../../components/AdBanner";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import {
  Star, MapPin, Search, ChevronRight, Flame, ChefHat, X, Zap, TrendingUp
} from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Restaurant, PromoBanner, ServiceCategory, ServiceCatalogItem } from "@shared/schema";

/* ─── Promo banner ─────────────────────────────────────────────────────────── */
function PromoBannerBlock() {
  const { data: banner } = useQuery<PromoBanner>({ queryKey: ["/api/promo-banner"] });
  const defaults = {
    tagText: "Offre Spéciale",
    title: "Livraison gratuite",
    subtitle: "Sur votre première commande",
    buttonText: "Commander maintenant",
    bgColorFrom: "#dc2626",
    bgColorTo: "#b91c1c",
    isActive: true,
    linkUrl: null as string | null,
  };
  const b = { ...defaults, ...banner };
  if (!b.isActive) return null;

  const content = (
    <div
      className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${b.bgColorFrom} 0%, ${b.bgColorTo} 100%)` }}
      data-testid="promo-banner"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 right-12 w-24 h-24 rounded-full bg-white/5" />
      </div>
      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full mb-2">
          <Flame size={11} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{b.tagText}</span>
        </div>
        <h3 className="text-lg font-bold leading-tight">{b.title}</h3>
        <p className="text-white/80 text-xs mt-0.5">{b.subtitle}</p>
        {b.buttonText && (
          <button
            className="mt-3 bg-white px-4 py-1.5 rounded-xl text-xs font-bold shadow active:scale-95 transition-all"
            style={{ color: b.bgColorFrom }}
            data-testid="button-promo"
          >
            {b.buttonText} →
          </button>
        )}
      </div>
    </div>
  );

  if (b.linkUrl) return <a href={b.linkUrl} target="_blank" rel="noopener noreferrer">{content}</a>;
  return content;
}

/* ─── Food cuisine categories ──────────────────────────────────────────────── */
const cuisineCategories = [
  { name: "🍽️ Tous", nameEn: "🍽️ All", cuisine: null },
  { name: "🇨🇩 Congolais", nameEn: "🇨🇩 Congolese", cuisine: "Congolais" },
  { name: "🍔 Burgers", nameEn: "🍔 Burgers", cuisine: "Burgers" },
  { name: "🍕 Pizza", nameEn: "🍕 Pizza", cuisine: "Pizza" },
  { name: "☕ Café & Brunch", nameEn: "☕ Café & Brunch", cuisine: "Café & Brunch" },
  { name: "🔥 Grillades", nameEn: "🔥 Grills", cuisine: "Grillades" },
  { name: "🌯 Fast Food", nameEn: "🌯 Fast Food", cuisine: "Fast Food" },
  { name: "⭐ Gastro", nameEn: "⭐ Fine Dining", cuisine: "Gastronomique" },
  { name: "🧆 Libanais", nameEn: "🧆 Lebanese", cuisine: "Libanais" },
  { name: "🌍 International", nameEn: "🌍 International", cuisine: "International" },
];

/* ─── Default Unsplash image per service name ───────────────────────────────── */
const SERVICE_IMAGES: Record<string, string> = {
  "hotellerie":          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=85",
  "transport":           "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=300&q=85",
  "nettoyage":           "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300&q=85",
  "demenagement":        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=85",
  "evenementiel":        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=85",
  "reparation":          "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&q=85",
  "coursier":            "https://images.unsplash.com/photo-1568952433726-3896e3881c65?w=300&q=85",
  "autre":               "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=300&q=85",
  "coiffure":            "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=300&q=85",
  "pédicure & manucure": "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=85",
  "manucure":            "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=85",
  "massage & bien-être": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&q=85",
  "massage":             "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&q=85",
  "ménage à domicile":   "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=300&q=85",
  "menage":              "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=300&q=85",
  "restaurants":         "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&q=85",
  "fast food":           "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=85",
  "pizza":               "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=85",
  "promos":              "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&q=85",
  "services":            "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=300&q=85",
};

function getServiceImage(name: string, imageUrl?: string | null): string {
  if (imageUrl && imageUrl.trim()) return imageUrl;
  const key = name.toLowerCase().trim();
  for (const [k, v] of Object.entries(SERVICE_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=300&q=85";
}

/* ─── Static quick-access items ─────────────────────────────────────────────── */
const staticItems = [
  { key: "restaurants", label: "Restaurants", labelEn: "Restaurants", filter: null as string | null, path: null as string | null },
  { key: "fastfood",    label: "Fast Food",    labelEn: "Fast Food",    filter: "Fast Food",           path: null },
  { key: "pizza",       label: "Pizza",        labelEn: "Pizza",        filter: "Pizza",               path: null },
  { key: "promos",      label: "Promos",       labelEn: "Promos",       filter: null,                  path: null },
  { key: "services",    label: "Services",     labelEn: "Services",     filter: null,                  path: "/services" },
];

/* ─── Service photo card ─────────────────────────────────────────────────────── */
function ServiceCard({
  name, label, imgUrl, testId, onClick,
}: { name: string; label: string; imgUrl: string; testId: string; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform flex-shrink-0"
      style={{ width: 72 }}
    >
      <div className="w-16 h-16 rounded-2xl overflow-hidden relative shadow-sm"
        style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>
        {!loaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )}
        <img
          src={imgUrl}
          alt={name}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
        />
        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>
      <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight"
        style={{ width: 72, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {label}
      </span>
    </button>
  );
}

/* ─── Restaurant card ──────────────────────────────────────────────────────── */
function RestaurantCard({ r, idx, onClick }: { r: Restaurant; idx: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid={`restaurant-card-${r.id}`}
      className={`w-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden active:scale-[0.97] transition-all duration-200 text-left fade-in-up stagger-${Math.min(idx + 1, 6)}`}
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      <div className="relative h-44">
        <img src={r.image} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        {!r.isActive && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-xl tracking-wide">FERMÉ</span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/95 rounded-xl px-2 py-1 flex items-center gap-1 shadow">
          <Star size={10} className="text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold text-gray-900">{r.rating}</span>
        </div>
        {r.rating >= 4.7 && (
          <div className="absolute top-3 left-3 bg-amber-500 text-white rounded-xl px-2 py-1 flex items-center gap-1">
            <TrendingUp size={9} />
            <span className="text-[9px] font-bold uppercase tracking-wide">Top</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 flex items-end justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {r.logoUrl ? (
                <img src={r.logoUrl} alt={`${r.name} logo`} className="w-full h-full object-contain p-0.5" loading="lazy" />
              ) : (
                <span className="text-red-600 font-black text-lg">{r.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h4 className="font-bold text-white text-sm leading-tight drop-shadow">{r.name}</h4>
              <span className="text-white/75 text-[11px]">{r.cuisine}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
            <Zap size={9} className="text-amber-400" />
            <span className="text-white text-[10px] font-bold">{r.deliveryTime}</span>
          </div>
        </div>
      </div>
      <div className="px-3.5 py-3">
        <p className="text-gray-400 text-[11px] line-clamp-1 mb-2">{r.description}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-gray-400">
            <ChefHat size={10} />
            <span className="text-[10px]">{r.prepTime || r.deliveryTime}</span>
          </div>
          <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-1 text-gray-400 min-w-0">
            <MapPin size={10} className="flex-shrink-0" />
            <span className="text-[10px] truncate">{r.address.split(",")[0]}</span>
          </div>
          <div className="ml-auto text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-lg">
            {formatPrice(r.deliveryFee)} livraison
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { data: restaurants = [], isLoading } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"] });
  const { data: serviceCategories = [] } = useQuery<ServiceCategory[]>({ queryKey: ["/api/service-categories"] });
  const { data: catalogItems = [] } = useQuery<ServiceCatalogItem[]>({ queryKey: ["/api/service-catalog"] });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const availableCuisines = new Set(restaurants.map(r => r.cuisine));
  const visibleCuisines = cuisineCategories.filter(c => c.cuisine === null || availableCuisines.has(c.cuisine));

  const filtered = restaurants.filter(r => {
    if (activeCategory && r.cuisine !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  });

  const displayedRestaurants = showAll || activeCategory || searchQuery.trim() ? filtered : filtered.slice(0, 6);

  const categoryHasCatalog = (catId: number) =>
    catalogItems.some(item => item.categoryId === catId && item.isActive);

  const handleServiceClick = (cat: ServiceCategory) => {
    if (categoryHasCatalog(cat.id)) {
      sessionStorage.setItem("maweja_open_cat", String(cat.id));
      navigate("/services");
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

  const handleStaticItem = (item: typeof staticItems[0]) => {
    if (item.path) { navigate(item.path); return; }
    if (item.filter) { setActiveCategory(item.filter); return; }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
      <ClientNav />

      <div className="max-w-lg mx-auto px-4 pt-4">

        {/* Greeting */}
        <div className="mb-4 fade-in-up">
          <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">
            {user ? `${t.client.hello} ${user.name?.split(" ")[0]} 👋` : "Bienvenue sur MAWEJA 👋"}
          </p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5 leading-tight">
            {t.client.whatToEat}
          </h2>
        </div>

        {/* Search bar */}
        <div className="relative mb-5 fade-in-up stagger-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder={t.client.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
            className="w-full pl-10 pr-9 py-3 bg-white dark:bg-gray-900 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors" data-testid="button-clear-search">
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Sponsorisés ─────────────────────────────────────── */}
        {!searchQuery && !activeCategory && (
          <div className="mb-5 fade-in-up stagger-2">
            <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-2">Sponsorisés</p>
            <AdBanner />
          </div>
        )}

        {/* ── Maweja Services — 2 lignes scrollables ──────────── */}
        {!searchQuery && !activeCategory && (
          <div className="mb-5 fade-in-up stagger-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">Maweja Services</p>
              <button
                onClick={() => navigate("/services")}
                className="text-[11px] font-semibold text-red-600 flex items-center gap-0.5"
                data-testid="button-see-all-services"
              >
                Voir tout <ChevronRight size={12} />
              </button>
            </div>

            {/* 2-row horizontal scroll grid */}
            <div
              className="overflow-x-auto no-scrollbar -mx-4 px-4"
              data-testid="services-scroll"
            >
              <div
                className="grid gap-x-3 gap-y-3 pb-1"
                style={{
                  gridTemplateRows: "repeat(2, auto)",
                  gridAutoFlow: "column",
                  width: "max-content",
                }}
              >
                {/* Static quick-access items */}
                {staticItems.map(item => (
                  <ServiceCard
                    key={item.key}
                    name={item.key}
                    label={lang === "en" ? item.labelEn : item.label}
                    imgUrl={getServiceImage(item.key)}
                    testId={`quicklink-${item.key}`}
                    onClick={() => handleStaticItem(item)}
                  />
                ))}

                {/* Dynamic service categories */}
                {serviceCategories.filter(c => c.isActive).map(cat => (
                  <ServiceCard
                    key={cat.id}
                    name={cat.name}
                    label={cat.name}
                    imgUrl={getServiceImage(cat.name, cat.imageUrl)}
                    testId={`service-icon-${cat.id}`}
                    onClick={() => handleServiceClick(cat)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Promo banner */}
        {!searchQuery && !activeCategory && (
          <div className="fade-in-up stagger-4"><PromoBannerBlock /></div>
        )}

        {/* Cuisine filter pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-1 px-1 fade-in-up stagger-5 pb-0.5">
          {visibleCuisines.map((c) => {
            const isActive = activeCategory === c.cuisine;
            return (
              <button
                key={c.name}
                onClick={() => { setActiveCategory(isActive ? null : c.cuisine); setShowAll(false); }}
                data-testid={`category-${c.name.toLowerCase().replace(/[^a-z0-9]/gi, "")}`}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                  isActive
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400"
                }`}
                style={isActive
                  ? { boxShadow: "0 3px 12px rgba(220,38,38,0.35)" }
                  : { boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}
              >
                {lang === "en" ? c.nameEn : c.name}
              </button>
            );
          })}
        </div>

        {/* ── Tous les établissements ─────────────────────────── */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-red-600 rounded-full" />
            <h3 className="text-[13px] font-semibold text-gray-800 dark:text-white">
              {activeCategory
                ? (cuisineCategories.find(c => c.cuisine === activeCategory)?.name ?? activeCategory)
                : searchQuery
                  ? t.client.results
                  : "Tous les établissements"}
            </h3>
          </div>
          {!showAll && !activeCategory && !searchQuery && filtered.length > 6 && (
            <button onClick={() => setShowAll(true)} className="flex items-center gap-0.5 text-red-600 text-[11px] font-semibold" data-testid="button-see-all">
              {t.common.seeAll} <ChevronRight size={12} />
            </button>
          )}
          {(showAll || activeCategory || searchQuery) && (
            <span className="text-[11px] text-gray-400 font-medium" data-testid="text-result-count">
              {filtered.length} {t.common.restaurant}{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Restaurant list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                <div className="h-44 skeleton-shimmer" />
                <div className="p-3.5 space-y-2.5">
                  <div className="h-2.5 w-full skeleton-shimmer rounded-full" />
                  <div className="flex gap-3">
                    <div className="h-2 w-16 skeleton-shimmer rounded-full" />
                    <div className="h-2 w-24 skeleton-shimmer rounded-full" />
                    <div className="ml-auto h-2 w-14 skeleton-shimmer rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedRestaurants.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 text-center fade-in" data-testid="text-no-results"
            style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={24} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm">{t.client.noRestaurant}</p>
            <p className="text-gray-400 text-xs mt-1">
              {searchQuery ? t.client.tryOtherSearch : t.client.noInCategory}
            </p>
            <button
              onClick={() => { setActiveCategory(null); setSearchQuery(""); setShowAll(false); }}
              className="mt-4 bg-red-600 text-white text-xs font-bold px-5 py-2 rounded-xl active:scale-95 transition-all"
              data-testid="button-reset-filters"
            >
              {t.client.seeAllRestaurants}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedRestaurants.map((r, idx) => (
              <RestaurantCard key={r.id} r={r} idx={idx} onClick={() => navigate(`/restaurant/${r.id}`)} />
            ))}
          </div>
        )}

        {!showAll && !activeCategory && !searchQuery && filtered.length > 6 && (
          <button
            onClick={() => setShowAll(true)}
            data-testid="button-load-more"
            className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 text-xs font-semibold hover:border-red-300 hover:text-red-600 transition-all active:scale-[0.98]"
          >
            Voir tous les restaurants ({filtered.length})
          </button>
        )}
      </div>
    </div>
  );
}
