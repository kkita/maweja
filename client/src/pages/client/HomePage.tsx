import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { Star, Clock, Heart, MapPin, ChevronRight, Zap } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Restaurant, ServiceCategory, ServiceCatalogItem, Advertisement } from "@shared/schema";

/* ────────────────────────────────────────────────────────────────────────────
   SPONSORISÉS — two ad cards side by side
───────────────────────────────────────────────────────────────────────────── */
function SponsorisedSection() {
  const { data: ads = [] } = useQuery<Advertisement[]>({
    queryKey: ["/api/advertisements?active=true"],
  });

  const visible = ads.slice(0, 4);

  const fallbackCards = [
    {
      id: "f1",
      title: "Livraison offerte",
      sub: "Chez Kivu Kitchen (aujourd'hui)",
      bg: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
    },
    {
      id: "f2",
      title: "-20% sur les menus",
      sub: "Sushi House • jusqu'au 31/03",
      bg: "https://images.unsplash.com/photo-1563612116625-3012372fccce?w=400&q=80",
    },
  ];

  const cards = visible.length >= 2
    ? visible
    : fallbackCards;

  return (
    <section className="mb-5">
      <p className="text-[15px] font-bold text-gray-900 mb-2.5" style={{ borderBottom: "2px solid #111", display: "inline-block", paddingBottom: 2 }}>
        Sponsorisés
      </p>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {cards.map((c: any, i: number) => {
          const bg = c.mediaUrl || c.bg;
          const title = c.title || "";
          const sub = c.description || c.sub || "";
          return (
            <div
              key={c.id || i}
              className="flex-shrink-0 relative rounded-2xl overflow-hidden"
              style={{ width: "calc(60vw)", maxWidth: 220, height: 118 }}
              data-testid={`sponsored-card-${i}`}
            >
              <img src={bg} alt={title} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-bold text-[13px] leading-tight drop-shadow">{title}</p>
                {sub && <p className="text-white/80 text-[11px] mt-0.5 leading-tight">{sub}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   CATEGORY GRID — 2 rows × horizontal scroll, icon boxes
───────────────────────────────────────────────────────────────────────────── */

const STATIC_CATS = [
  { key: "fastfood",       emoji: "🍔", label: "Fast Food",      color: "#FFF8E1", border: "#F59E0B", filter: "Fast Food" },
  { key: "freedelivery",   emoji: "🛵", label: "Free Delivery",  color: "#F0FFF4", border: null,      filter: null },
  { key: "grocery",        emoji: "🛍️", label: "Grocery",        color: "#F0F4FF", border: null,      filter: null },
  { key: "pizza",          emoji: "🍕", label: "Pizza",          color: "#FFF5F5", border: null,      filter: "Pizza" },
  { key: "promo",          emoji: "🏷️", label: "Promotion",      color: "#FFFBF0", border: null,      filter: null },
  { key: "restaurants",    emoji: "🍽️", label: "Restaurants",    color: "#F5F5FF", border: null,      filter: null },
  { key: "shops",          emoji: "🛒", label: "Shops",          color: "#F0FAFF", border: null,      filter: null },
  { key: "all",            emoji: "✦",  label: "All",            color: "#111",    border: null,      filter: null, dark: true },
];

interface CategoryBoxProps {
  emoji: string;
  label: string;
  color: string;
  border?: string | null;
  dark?: boolean;
  active: boolean;
  testId: string;
  onClick: () => void;
}

function CategoryBox({ emoji, label, color, border, dark, active, testId, onClick }: CategoryBoxProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform flex-shrink-0"
      style={{ width: 64 }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{
          background: active ? (border || "#F59E0B") + "22" : color,
          border: active
            ? `2.5px solid ${border || "#F59E0B"}`
            : dark
              ? "2.5px solid transparent"
              : "1.5px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
      >
        <span style={{ fontSize: 22 }}>{emoji}</span>
      </div>
      <span
        className="text-center leading-tight"
        style={{
          fontSize: 10,
          fontWeight: active ? 700 : 500,
          color: active ? (border || "#F59E0B") : "#374151",
          width: 64,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {label}
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
   RESTAURANT CARD — design finale style
───────────────────────────────────────────────────────────────────────────── */
function RestaurantCard({ r, onClick }: { r: Restaurant; onClick: () => void }) {
  const [fav, setFav] = useState(false);

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden mb-4"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}
      data-testid={`restaurant-card-${r.id}`}
    >
      {/* Photo */}
      <button onClick={onClick} className="relative block w-full" style={{ height: 200 }}>
        <img src={r.image} alt={r.name} className="w-full h-full object-cover" loading="lazy" />

        {/* Discount badge */}
        {r.rating >= 4.5 && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Discount 10%
          </div>
        )}

        {!r.isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-xl">FERMÉ</span>
          </div>
        )}

        {/* Circular logo — bottom-left overlapping */}
        {r.logoUrl && (
          <div
            className="absolute -bottom-5 left-4 w-12 h-12 rounded-full bg-white border-2 border-white overflow-hidden"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          >
            <img src={r.logoUrl} alt={r.name} className="w-full h-full object-contain p-1" />
          </div>
        )}
      </button>

      {/* Info */}
      <div className={`px-4 pb-4 ${r.logoUrl ? "pt-8" : "pt-4"}`}>
        <div className="flex items-start justify-between mb-2">
          <p className="font-bold text-gray-900" style={{ fontSize: 15 }}>{r.name}</p>
          <button
            onClick={() => setFav(!fav)}
            className="ml-2 active:scale-90 transition-transform"
            data-testid={`button-fav-${r.id}`}
          >
            <Heart
              size={18}
              className={fav ? "fill-red-500 text-red-500" : "text-red-400"}
              strokeWidth={1.8}
            />
          </button>
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <span className="text-gray-700 font-semibold" style={{ fontSize: 12 }}>{r.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock size={12} strokeWidth={1.8} />
            <span style={{ fontSize: 12 }}>{r.deliveryTime || "0min"}</span>
          </div>
          {r.deliveryFee != null && r.deliveryFee > 0 ? (
            <div className="flex items-center gap-1 text-gray-500">
              <Zap size={12} className="text-amber-500" />
              <span style={{ fontSize: 12 }}>{formatPrice(r.deliveryFee)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-gray-400 line-through" style={{ fontSize: 12 }}>$4 USD</span>
              <span className="text-green-600 font-semibold" style={{ fontSize: 12 }}>0.00</span>
            </div>
          )}
          {r.address && (
            <div className="flex items-center gap-0.5 text-gray-400">
              <MapPin size={11} strokeWidth={1.8} />
              <span style={{ fontSize: 11 }}>{r.address.split(",")[0]}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { t, lang } = useI18n();

  const { data: restaurants = [], isLoading } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"] });
  const { data: serviceCategories = [] } = useQuery<ServiceCategory[]>({ queryKey: ["/api/service-categories"] });
  const { data: catalogItems = [] } = useQuery<ServiceCatalogItem[]>({ queryKey: ["/api/service-catalog"] });

  const [activeCat, setActiveCat] = useState<string | null>(null);   // static cat key
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null); // cuisine filter
  const [showAll, setShowAll] = useState(false);

  /* filter restaurants */
  const filtered = restaurants.filter(r => {
    if (activeCuisine && r.cuisine !== activeCuisine) return false;
    return true;
  });
  const displayed = showAll || activeCuisine ? filtered : filtered.slice(0, 6);

  /* service category click */
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

  /* static cat click */
  const handleStaticCat = (cat: typeof STATIC_CATS[0]) => {
    if (cat.key === activeCat) {
      setActiveCat(null);
      setActiveCuisine(null);
      return;
    }
    setActiveCat(cat.key);
    if (cat.filter) {
      setActiveCuisine(cat.filter);
    } else if (cat.key === "restaurants") {
      setActiveCuisine(null);
      setShowAll(true);
      setTimeout(() => {
        document.getElementById("restaurants-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } else {
      setActiveCuisine(null);
    }
  };

  /* pill click */
  const handlePill = (cuisine: string) => {
    if (activeCuisine === cuisine) {
      setActiveCuisine(null);
      setActiveCat(null);
    } else {
      setActiveCuisine(cuisine);
      setActiveCat(null);
    }
  };

  /* extra dynamic service cats from API (excluding ones already in static) */
  const dynamicCats = serviceCategories.filter(c => c.isActive).slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50 pb-28" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <ClientNav />

      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* ── Sponsorisés ─────────────────────────────────────── */}
        <SponsorisedSection />

        {/* ── Category grid — 2-row horizontal scroll ─────────── */}
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
              {/* Static categories */}
              {STATIC_CATS.map(cat => (
                <CategoryBox
                  key={cat.key}
                  emoji={cat.emoji}
                  label={cat.label}
                  color={cat.color}
                  border={cat.border}
                  dark={cat.dark}
                  active={activeCat === cat.key}
                  testId={`cat-${cat.key}`}
                  onClick={() => handleStaticCat(cat)}
                />
              ))}

              {/* Dynamic service categories from API */}
              {dynamicCats.map(cat => (
                <CategoryBox
                  key={`svc-${cat.id}`}
                  emoji="✦"
                  label={cat.name}
                  color="#F9F9FF"
                  border={null}
                  active={false}
                  testId={`service-cat-${cat.id}`}
                  onClick={() => handleServiceClick(cat)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Food type pills ───────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mb-5 pb-0.5" data-testid="food-pills">
          {FOOD_PILLS.map(pill => {
            const isActive = activeCuisine === pill.cuisine;
            return (
              <button
                key={pill.key}
                onClick={() => handlePill(pill.cuisine)}
                data-testid={`pill-${pill.key.toLowerCase()}`}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white active:scale-95 transition-all"
                style={{
                  border: isActive ? "1.5px solid #dc2626" : "1.5px solid #E5E7EB",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontSize: 14 }}>{pill.emoji}</span>
                <span style={{
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#dc2626" : "#374151",
                  whiteSpace: "nowrap",
                }}>
                  {pill.key}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tous les établissements ───────────────────────────── */}
        <div id="restaurants-section" className="flex items-center justify-between mb-4">
          <p className="font-bold text-gray-900" style={{ fontSize: 15 }}>
            {activeCuisine ? activeCuisine : "Tous les établissements"}
          </p>
          {!showAll && !activeCuisine && filtered.length > 6 && (
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center gap-0.5 text-red-600 font-semibold"
              style={{ fontSize: 12 }}
              data-testid="button-see-all"
            >
              Voir tout <ChevronRight size={14} />
            </button>
          )}
          {(showAll || activeCuisine) && (
            <span className="text-gray-400 font-medium" style={{ fontSize: 12 }} data-testid="text-result-count">
              {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Restaurant cards ──────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                <div className="animate-pulse bg-gray-200" style={{ height: 200 }} />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded-full" />
                  <div className="h-3 w-48 bg-gray-100 animate-pulse rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }} data-testid="text-no-results">
            <p className="text-gray-700 font-semibold text-sm">{t.client.noRestaurant}</p>
            <p className="text-gray-400 text-xs mt-1">{t.client.noInCategory}</p>
            <button
              onClick={() => { setActiveCuisine(null); setActiveCat(null); setShowAll(false); }}
              className="mt-4 bg-red-600 text-white text-xs font-bold px-5 py-2 rounded-xl active:scale-95 transition-all"
              data-testid="button-reset-filters"
            >
              Tout afficher
            </button>
          </div>
        ) : (
          <div>
            {displayed.map(r => (
              <RestaurantCard
                key={r.id}
                r={r}
                onClick={() => navigate(`/restaurant/${r.id}`)}
              />
            ))}
          </div>
        )}

        {/* Services shortcut */}
        {!activeCuisine && (
          <button
            onClick={() => navigate("/services")}
            className="w-full mt-4 py-3 rounded-2xl bg-white flex items-center justify-between px-5"
            style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1.5px solid #F3F4F6" }}
            data-testid="button-all-services"
          >
            <span className="font-semibold text-gray-800" style={{ fontSize: 13 }}>Tous les services Maweja</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        )}

      </div>
    </div>
  );
}
