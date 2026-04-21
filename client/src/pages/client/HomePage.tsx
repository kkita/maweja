import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useI18n } from "../../lib/i18n";
import { Tag, ShoppingBag, Store, Utensils, Flame, Search, TrendingUp } from "lucide-react";
import ClientNav from "../../components/ClientNav";
import AdBanner from "../../components/client/AdBanner";
import { useState, useCallback, useEffect, useRef } from "react";
import { resolveImg } from "../../lib/queryClient";
import type { Restaurant, ServiceCategory, ServiceCatalogItem as CatalogItem, RestaurantCategory, BoutiqueCategory } from "@shared/schema";
import {
  RestaurantCard,
  RestaurantCardSkeleton,
  BoutiqueGridCard,
  FeaturedRestaurantCard,
  PromoCard,
  MPill,
  MSectionHeader,
  MEmptyState,
  ServiceCategoryItem,
} from "../../components/client/ClientUI";

const PAGE_SIZE = 10;

function getRestaurantPromoLabel(r: Restaurant): string | undefined {
  if (r.discountLabel) return r.discountLabel;
  if (r.discountPercent && r.discountPercent > 0) return `-${r.discountPercent}%`;
  return undefined;
}

export default function HomePage() {
  const [, navigate] = useLocation();
  const { t }        = useI18n();

  const [activeCuisine, setActiveCuisine]             = useState<string | null>(null);
  const [activeCatId, setActiveCatId]                 = useState<number | null>(null);
  const [activeBoutiqueCatId, setActiveBoutiqueCatId] = useState<number | null>(null);
  const [localSearch, setLocalSearch]                 = useState("");
  const [displayCount, setDisplayCount]               = useState(PAGE_SIZE);

  const { data: restaurants = [], isLoading } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"] });
  const { data: activeCategories = [] }       = useQuery<ServiceCategory[]>({ queryKey: ["/api/service-categories/active"] });
  const { data: catalogItems = [] }           = useQuery<CatalogItem[]>({ queryKey: ["/api/catalog-items"] });
  const { data: restCats = [] }               = useQuery<RestaurantCategory[]>({ queryKey: ["/api/restaurant-categories"] });
  const { data: boutiqueCats = [] }           = useQuery<BoutiqueCategory[]>({ queryKey: ["/api/boutique-categories"] });

  const activeRestaurants = restaurants.filter(r => r.isActive);
  const boutiques         = activeRestaurants.filter(r => r.type === "boutique");
  const restOnly          = activeRestaurants.filter(r => r.type !== "boutique");
  const promoRestaurants  = restOnly.filter(r => r.discountLabel || (r.discountPercent && r.discountPercent > 0));
  const featuredRests     = restOnly.filter(r => r.isFeatured).slice(0, 8);

  const matchedRestaurants = localSearch
    ? activeRestaurants.filter(r =>
        r.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        (r.cuisine || "").toLowerCase().includes(localSearch.toLowerCase())
      )
    : [];

  const matchedServices = localSearch
    ? activeCategories.filter(cat => cat.name.toLowerCase().includes(localSearch.toLowerCase()))
    : [];

  const activeRestCats = restCats.filter(cat => restOnly.some(r => r.categoryId === cat.id));
  const activeBoutiqueCats = boutiqueCats.filter(cat => boutiques.some(b => b.categoryId === cat.id));

  const filteredBoutiques = activeBoutiqueCatId
    ? boutiques.filter(b => b.categoryId === activeBoutiqueCatId)
    : boutiques;

  const filteredRestaurants = restOnly.filter(r => {
    if (activeCuisine === "Promos") return promoRestaurants.includes(r);
    if (activeCuisine && restCats.length) {
      const cat = restCats.find(c => c.name === activeCuisine);
      if (cat) return r.categoryId === cat.id;
    }
    return true;
  });

  const displayed = filteredRestaurants.slice(0, displayCount);
  const hasMore   = filteredRestaurants.length > displayCount;

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMore    = useCallback(() => setDisplayCount(prev => prev + PAGE_SIZE), []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => { setDisplayCount(PAGE_SIZE); }, [activeCuisine]);

  const handleServiceClick = (cat: ServiceCategory) => {
    const hasCatalog = catalogItems.some(item => item.categoryId === cat.id && item.isActive);
    if (hasCatalog) navigate(`/services?cat=${cat.id}`);
    else {
      sessionStorage.setItem("maweja_service_request", JSON.stringify({
        categoryId: cat.id, categoryName: cat.name, categoryImageUrl: cat.imageUrl || null,
        catalogItemId: null, catalogItemName: null, catalogItemPrice: null, catalogItemImage: null,
      }));
      navigate("/services/new");
    }
  };

  const handlePill = (cuisine: string) => {
    setActiveCuisine(prev => prev === cuisine ? null : cuisine);
    setActiveCatId(null);
  };

  const hasSearch = !!localSearch;

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0c0c0c] pb-28">
      <ClientNav />

      <div className="max-w-lg mx-auto">

        {/* ══ SEARCH BAR ══════════════════════════════════════════════════ */}
        <div className={`px-4 pt-4 mb-5`}>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="search"
              value={localSearch}
              onChange={e => { setLocalSearch(e.target.value); if (!e.target.value) { setActiveCuisine(null); } }}
              placeholder="Plat, restaurant, boutique, service…"
              data-testid="input-home-search"
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#181818] rounded-[18px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/30 transition-all"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)" }}
            />
          </div>
        </div>

        {/* ══ SEARCH RESULTS ══════════════════════════════════════════════ */}
        {hasSearch && (
          <div className="px-4">
            {matchedServices.length > 0 && (
              <section className="mb-5">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Services</p>
                <div className="flex gap-2.5 flex-wrap">
                  {matchedServices.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setLocalSearch(""); navigate(`/services?cat=${cat.id}`); }}
                      data-testid={`search-service-${cat.id}`}
                      className="flex items-center gap-2 bg-white dark:bg-[#181818] rounded-[14px] px-4 py-2.5 active:scale-95 transition-transform"
                      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid rgba(225,0,0,0.1)" }}
                    >
                      {cat.imageUrl && <img src={resolveImg(cat.imageUrl)} alt={cat.name} className="w-6 h-6 rounded-lg object-cover" />}
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {matchedRestaurants.length > 0 ? (
              <section className="mb-4">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                  Résultats pour « {localSearch} »
                </p>
                {matchedRestaurants.map(r => (
                  <RestaurantCard
                    key={r.id}
                    r={r}
                    onClick={() => navigate(`/restaurant/${r.id}`)}
                  />
                ))}
              </section>
            ) : matchedServices.length === 0 && (
              <MEmptyState
                icon={<Search size={36} />}
                title="Aucun résultat"
                description={`Rien trouvé pour « ${localSearch} »`}
                action={{ label: "Effacer", onClick: () => setLocalSearch(""), testId: "button-clear-search" }}
              />
            )}
          </div>
        )}

        {/* ══ CONTENU PRINCIPAL (hors recherche) ══════════════════════════ */}
        {!hasSearch && (
          <>
            {/* ── AdBanner pleine largeur ── */}
            <section className="mb-7 px-4">
              <AdBanner />
            </section>

            {/* ── Services ── */}
            {activeCategories.length > 0 && (
              <section className="mb-7">
                <div className="px-5 mb-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-black text-gray-900 dark:text-white" style={{ fontSize: 17, letterSpacing: "-0.3px" }}>Services</h2>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Commandes express sur Kinshasa</p>
                    </div>
                    <button
                      onClick={() => navigate("/services")}
                      data-testid="button-view-all-services"
                      className="text-brand font-semibold flex items-center gap-0.5 active:opacity-70"
                      style={{ fontSize: 12 }}
                    >
                      Tout voir
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto no-scrollbar -mx-0 px-5">
                  <div className="grid grid-rows-2 grid-flow-col gap-x-3 gap-y-4 pb-1 w-max">
                    <ServiceCategoryItem
                      name="Tout voir"
                      emoji="✦"
                      onClick={() => navigate("/services")}
                      testId="cat-all-services"
                    />
                    {activeCategories.map(cat => (
                      <ServiceCategoryItem
                        key={cat.id}
                        name={cat.name}
                        imageUrl={cat.imageUrl}
                        active={activeCatId === cat.id}
                        onClick={() => { setActiveCatId(cat.id); handleServiceClick(cat); }}
                        testId={`cat-${cat.id}`}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── Promotions en cours ── */}
            {promoRestaurants.length > 0 && !activeCuisine && (
              <section className="mb-7">
                <div className="px-5 mb-1">
                  <MSectionHeader
                    title="Promotions en cours"
                    icon={<Tag size={15} />}
                    action={promoRestaurants.length > 3
                      ? { label: "Tout voir", onClick: () => setActiveCuisine("Promos"), testId: "button-see-all-promos" }
                      : undefined
                    }
                  />
                </div>
                <div className="overflow-x-auto no-scrollbar px-5 pb-2">
                  <div className="flex gap-3">
                    {promoRestaurants.slice(0, 8).map(r => (
                      <PromoCard
                        key={r.id}
                        r={r}
                        promoLabel={getRestaurantPromoLabel(r)}
                        onClick={() => navigate(`/restaurant/${r.id}`)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── Boutiques & Commerces (grille 2 colonnes) ── */}
            {boutiques.length > 0 && !activeCuisine && (
              <section className="mb-7 px-5">
                <MSectionHeader
                  title="Boutiques & Commerces"
                  subtitle="Mode, pharmacie, tech et plus"
                  icon={<Store size={15} />}
                  action={{ label: "Tout voir", onClick: () => navigate("/boutiques"), testId: "button-view-all-boutiques" }}
                />

                {activeBoutiqueCats.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar -mx-5 px-5" data-testid="boutique-cat-pills">
                    <MPill active={!activeBoutiqueCatId} onClick={() => setActiveBoutiqueCatId(null)} testId="boutique-pill-all">
                      ✦ Tout
                    </MPill>
                    {activeBoutiqueCats.sort((a, b) => a.sortOrder - b.sortOrder).map(cat => (
                      <MPill
                        key={cat.id}
                        active={activeBoutiqueCatId === cat.id}
                        onClick={() => setActiveBoutiqueCatId(activeBoutiqueCatId === cat.id ? null : cat.id)}
                        testId={`boutique-cat-chip-${cat.id}`}
                      >
                        <span className="text-[13px]">{cat.emoji}</span> {cat.name}
                      </MPill>
                    ))}
                  </div>
                )}

                {filteredBoutiques.length > 0 ? (
                  <div className="overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
                    <div className="flex gap-3">
                      {filteredBoutiques.map(b => (
                        <div key={b.id} className="flex-shrink-0" style={{ width: 152 }}>
                          <BoutiqueGridCard
                            b={b}
                            onClick={() => navigate(`/restaurant/${b.id}`)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#181818] rounded-[18px] p-6 text-center" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
                    <p className="text-gray-400 text-xs">
                      {activeBoutiqueCatId ? "Aucune boutique dans cette catégorie" : "Bientôt disponible dans votre zone"}
                    </p>
                    {activeBoutiqueCatId && (
                      <button onClick={() => setActiveBoutiqueCatId(null)} className="mt-2 text-brand text-xs font-bold" data-testid="button-reset-boutique-filter">
                        Tout afficher
                      </button>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ── Séparateur ── */}
            {boutiques.length > 0 && !activeCuisine && (
              <div className="flex items-center gap-3 mb-6 px-5">
                <div className="flex-1 h-px bg-gray-200/70 dark:bg-[#222]" />
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(0,0,0,0.045)", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <Utensils size={10} className="text-gray-400 dark:text-gray-600" />
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 tracking-widest uppercase">Restaurants</span>
                </div>
                <div className="flex-1 h-px bg-gray-200/70 dark:bg-[#222]" />
              </div>
            )}

            {/* ── Coups de cœur (featured) ── */}
            {featuredRests.length > 0 && !activeCuisine && (
              <section className="mb-7">
                <div className="px-5 mb-1">
                  <MSectionHeader
                    title="Coups de cœur"
                    subtitle="Nos meilleures adresses du moment"
                    icon={<Flame size={15} />}
                  />
                </div>
                <div className="overflow-x-auto no-scrollbar px-5 pb-2">
                  <div className="flex gap-3">
                    {featuredRests.map(r => (
                      <FeaturedRestaurantCard
                        key={r.id}
                        r={r}
                        onClick={() => navigate(`/restaurant/${r.id}`)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* ══ SECTION RESTAURANTS ══════════════════════════════════════════ */}
        {!hasSearch && (
          <section className="px-5">
            {/* Header + pills */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {!activeCuisine ? (
                    <TrendingUp size={15} className="text-brand" />
                  ) : null}
                  <div>
                    <h2 className="font-black text-gray-900 dark:text-white" style={{ fontSize: 17, letterSpacing: "-0.3px" }}>
                      {activeCuisine ? activeCuisine : "Tous les restaurants"}
                    </h2>
                    {!activeCuisine && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {restOnly.length} restaurants disponibles
                      </p>
                    )}
                  </div>
                </div>
                {activeCuisine && (
                  <button
                    onClick={() => { setActiveCuisine(null); setActiveCatId(null); }}
                    data-testid="button-clear-filter"
                    className="text-brand font-semibold flex items-center gap-0.5 active:opacity-70"
                    style={{ fontSize: 12 }}
                  >
                    Tout voir
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                )}
              </div>

              {activeRestCats.length > 0 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1" data-testid="food-pills">
                  <MPill active={!activeCuisine} onClick={() => { setActiveCuisine(null); setActiveCatId(null); }} testId="pill-all">
                    <span className="text-[13px]">✦</span> Tout
                  </MPill>
                  {promoRestaurants.length > 0 && (
                    <MPill active={activeCuisine === "Promos"} onClick={() => handlePill("Promos")} testId="pill-promos">
                      <span className="text-[13px]">🏷️</span> Promos
                    </MPill>
                  )}
                  {activeRestCats.map(cat => (
                    <MPill key={cat.id} active={activeCuisine === cat.name} onClick={() => handlePill(cat.name)} testId={`pill-${cat.id}`}>
                      <span className="text-[13px]">{cat.emoji}</span> {cat.name}
                    </MPill>
                  ))}
                </div>
              )}
            </div>

            {/* Cards */}
            {isLoading ? (
              [1, 2, 3].map(i => <RestaurantCardSkeleton key={i} />)
            ) : displayed.length === 0 ? (
              <MEmptyState
                icon={<ShoppingBag size={36} />}
                title={t.client.noRestaurant}
                description={t.client.noInCategory}
                action={{ label: "Tout afficher", onClick: () => { setActiveCuisine(null); setActiveCatId(null); }, testId: "button-reset-filters" }}
              />
            ) : (
              <>
                {displayed.map(r => (
                  <RestaurantCard
                    key={r.id}
                    r={r}
                    onClick={() => navigate(`/restaurant/${r.id}`)}
                    promoLabel={activeCuisine === "Promos" ? getRestaurantPromoLabel(r) : undefined}
                  />
                ))}
                <div ref={sentinelRef} className="h-4" data-testid="scroll-sentinel" />
                {hasMore && (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-brand rounded-full animate-spin" />
                  </div>
                )}
              </>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
