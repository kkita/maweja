import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import AdBanner from "../../components/AdBanner";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { Star, Clock, MapPin, Search, ChevronRight, Flame, ChefHat, X } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Restaurant, PromoBanner } from "@shared/schema";

function PromoBannerBlock() {
  const { data: banner } = useQuery<PromoBanner>({
    queryKey: ["/api/promo-banner"],
  });

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
      className="rounded-2xl p-5 mb-6 text-white relative overflow-hidden"
      style={{ background: `linear-gradient(to right, ${b.bgColorFrom}, ${b.bgColorTo})` }}
      data-testid="promo-banner"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-1 mb-2">
          <Flame size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">{b.tagText}</span>
        </div>
        <h3 className="text-xl font-bold">{b.title}</h3>
        <p className="text-white/80 text-sm mt-1">{b.subtitle}</p>
        {b.buttonText && (
          <button
            className="mt-3 bg-white px-4 py-2 rounded-xl text-xs font-bold"
            style={{ color: b.bgColorFrom }}
            data-testid="button-promo"
          >
            {b.buttonText}
          </button>
        )}
      </div>
      <div className="absolute right-0 top-0 w-32 h-full rounded-l-full" style={{ background: "rgba(255,255,255,0.1)" }} />
    </div>
  );

  if (b.linkUrl) {
    return <a href={b.linkUrl} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return content;
}

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
  const { data: restaurants = [], isLoading } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"] });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const availableCuisines = new Set(restaurants.map(r => r.cuisine));
  const visibleCategories = categories.filter(c => c.cuisine === null || availableCuisines.has(c.cuisine));

  const filtered = restaurants.filter(r => {
    if (activeCategory && r.cuisine !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  });

  const displayedRestaurants = showAll || activeCategory || searchQuery.trim() ? filtered : filtered.slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="mb-6 fade-in-up">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {user ? `${t.client.hello} ${user.name?.split(" ")[0]} 👋` : `Bienvenue sur MAWEJA 👋`}
          </p>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{t.client.whatToEat}</h2>
        </div>

        <div className="relative mb-6 fade-in-up stagger-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t.client.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
            className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm transition-shadow hover:shadow-md"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors" data-testid="button-clear-search">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="fade-in-up stagger-2">
          <AdBanner />
        </div>

        <div className="fade-in-up stagger-3">
          <PromoBannerBlock />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 -mx-1 px-1 fade-in-up stagger-4">
          {visibleCategories.map((c) => {
            const isActive = activeCategory === c.cuisine;
            return (
              <button
                key={c.name}
                onClick={() => { setActiveCategory(isActive ? null : c.cuisine); setShowAll(false); }}
                data-testid={`category-${c.name.toLowerCase().replace(/\s/g, "-")}`}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-90 ${
                  isActive
                    ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/30"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-red-300 hover:text-red-600"
                }`}
              >
                {lang === "en" ? c.nameEn : c.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {activeCategory ? activeCategory : searchQuery ? t.client.results : t.client.popularRestaurants}
          </h3>
          {!showAll && !activeCategory && !searchQuery && filtered.length > 6 && (
            <button onClick={() => setShowAll(true)} className="text-red-600 text-xs font-semibold flex items-center gap-0.5" data-testid="button-see-all">
              {t.common.seeAll} <ChevronRight size={14} />
            </button>
          )}
          {(showAll || activeCategory || searchQuery) && (
            <span className="text-xs text-gray-400 font-medium" data-testid="text-result-count">{filtered.length} {t.common.restaurant}{filtered.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="h-36 skeleton-shimmer" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl skeleton-shimmer flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3.5 w-40 skeleton-shimmer rounded mb-2" />
                      <div className="h-2.5 w-28 skeleton-shimmer rounded" />
                    </div>
                  </div>
                  <div className="h-2.5 w-full skeleton-shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedRestaurants.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-800 fade-in" data-testid="text-no-results">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-bold">{t.client.noRestaurant}</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {searchQuery ? t.client.tryOtherSearch : t.client.noInCategory}
            </p>
            <button
              onClick={() => { setActiveCategory(null); setSearchQuery(""); setShowAll(false); }}
              className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors active:scale-95"
              data-testid="button-reset-filters"
            >
              {t.client.seeAllRestaurants}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedRestaurants.map((r, idx) => (
              <button
                key={r.id}
                onClick={() => navigate(`/restaurant/${r.id}`)}
                data-testid={`restaurant-card-${r.id}`}
                className={`w-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-left fade-in-up stagger-${Math.min(idx + 1, 6)}`}
              >
                <div className="relative h-36">
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                  {!r.isActive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-lg">Fermé</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-sm">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-gray-900">{r.rating}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
                    <span className="text-white text-xs font-bold px-2.5 py-1 bg-red-600/80 rounded-lg backdrop-blur-sm">{r.cuisine}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2.5">
                    {r.logoUrl ? (
                      <img src={r.logoUrl} alt={`${r.name} logo`} className="w-9 h-9 rounded-xl object-cover border border-gray-100 dark:border-gray-700 flex-shrink-0" data-testid={`restaurant-logo-${r.id}`} loading="lazy" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 flex items-center justify-center flex-shrink-0 border border-red-100 dark:border-red-900">
                        <span className="text-red-600 font-black text-sm">{r.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-gray-900 dark:text-white text-sm">{r.name}</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1 mt-0.5">{r.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" data-testid={`restaurant-prep-time-${r.id}`}>
                      <ChefHat size={11} />
                      <span className="text-[11px] font-medium">{t.client.prep}: {r.prepTime || r.deliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Clock size={11} />
                      <span className="text-[11px] font-medium">{r.deliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 flex-1 min-w-0">
                      <MapPin size={11} className="flex-shrink-0" />
                      <span className="text-[11px] font-medium truncate">{r.address.split(",")[0]}</span>
                    </div>
                    <div className="text-[11px] font-black text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                      {formatPrice(r.deliveryFee)} {t.client.deliveryFee}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
