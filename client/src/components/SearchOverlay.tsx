import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, X, ArrowLeft, Star, Clock, Zap } from "lucide-react";
import type { Restaurant, ServiceCategory } from "@shared/schema";

const TRENDING = ["Poulet", "Pizza", "Sushi", "Burger", "Transport", "Coiffure"];

interface Props {
  onClose: () => void;
}

export default function SearchOverlay({ onClose }: Props) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: restaurants = [] } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"] });
  const { data: categories = [] } = useQuery<ServiceCategory[]>({ queryKey: ["/api/service-categories"] });

  /* Auto-focus with a short delay so animation finishes first */
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  /* Lock body scroll while overlay is open */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const q = query.toLowerCase().trim();

  const filteredRestaurants = q
    ? restaurants.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.cuisine?.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q)
      ).slice(0, 8)
    : [];

  const filteredServices = q
    ? (categories as ServiceCategory[]).filter(c => c.isActive && c.name.toLowerCase().includes(q)).slice(0, 5)
    : [];

  const hasResults = filteredRestaurants.length > 0 || filteredServices.length > 0;

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "#fff" }}
      data-testid="search-overlay"
    >

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0"
        style={{
          background: "#dc2626",
          boxShadow: "0 4px 24px rgba(220,38,38,0.3)",
        }}
      >
        {/* Back button */}
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 active:scale-90 transition-transform flex-shrink-0"
          data-testid="button-close-search-overlay"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>

        {/* Input */}
        <div className="flex-1 relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#dc2626" }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Plat, restaurant, service…"
            data-testid="input-search-overlay"
            className="w-full rounded-2xl py-2.5 text-[14px] font-medium placeholder-gray-400 outline-none border-none"
            style={{
              background: "rgba(255,255,255,0.97)",
              color: "#111827",
              paddingLeft: 40,
              paddingRight: query.length > 0 ? 36 : 14,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
          {query.length > 0 && (
            <button
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 active:scale-90 transition-transform"
              data-testid="button-clear-overlay-search"
            >
              <X size={11} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* ── Results area ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0d0d0d]">

        {/* ── Empty state: trending suggestions ── */}
        {!q && (
          <div className="px-4 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} className="text-amber-500" />
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tendances</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map(term => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  data-testid={`trending-${term.toLowerCase()}`}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
                  style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb" }}
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Suggestion cards */}
            <div className="mt-5 space-y-2">
              {restaurants.slice(0, 3).map(r => (
                <button
                  key={r.id}
                  onClick={() => goTo(`/restaurant/${r.id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-2xl active:scale-[0.98] transition-all text-left"
                  style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
                  data-testid={`suggestion-restaurant-${r.id}`}
                >
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.name || ""} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-xl">🍽️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 truncate">{r.cuisine}</p>
                  </div>
                  <Search size={13} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── No results ── */}
        {q && !hasResults && (
          <div className="flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: "linear-gradient(135deg,#fef2f2,#fee2e2)" }}
            >
              <Search size={32} className="text-red-300" />
            </div>
            <p className="font-black text-gray-900 dark:text-white text-base mb-1">Aucun résultat</p>
            <p className="text-sm text-gray-400">Aucun résultat pour <span className="font-semibold text-gray-600 dark:text-gray-300">"{query}"</span></p>
            <p className="text-xs text-gray-400 mt-1">Essayez un autre mot-clé</p>
          </div>
        )}

        {/* ── Services matched ── */}
        {filteredServices.length > 0 && (
          <div className="px-4 pt-4">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Services</p>
            <div className="space-y-2">
              {filteredServices.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => goTo(`/services?cat=${cat.id}`)}
                  data-testid={`result-service-${cat.id}`}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-2xl active:scale-[0.98] transition-all text-left"
                  style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
                >
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-11 h-11 rounded-xl object-contain bg-gray-50 border border-gray-100 flex-shrink-0 p-1" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 text-xl">🔧</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{cat.name}</p>
                    {cat.description && <p className="text-xs text-gray-400 truncate">{cat.description}</p>}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Search size={12} className="text-red-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Restaurants matched ── */}
        {filteredRestaurants.length > 0 && (
          <div className="px-4 pt-4 pb-10">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Restaurants & Établissements</p>
            <div className="space-y-3">
              {filteredRestaurants.map(r => (
                <button
                  key={r.id}
                  onClick={() => goTo(`/restaurant/${r.id}`)}
                  data-testid={`result-restaurant-${r.id}`}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-2xl active:scale-[0.98] transition-all text-left"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
                >
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.name || ""} className="w-16 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-2xl">🍽️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[14px] text-gray-900 dark:text-white truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 truncate mb-1">{r.cuisine}</p>
                    <div className="flex items-center gap-3">
                      {r.rating && (
                        <span className="text-[11px] font-bold text-amber-500 flex items-center gap-0.5">
                          <Star size={9} fill="currentColor" /> {r.rating}
                        </span>
                      )}
                      {r.deliveryTime && (
                        <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                          <Clock size={9} /> {r.deliveryTime} min
                        </span>
                      )}
                      {r.deliveryFee !== undefined && r.deliveryFee !== null && (
                        <span className="text-[11px] text-gray-400">
                          {Number(r.deliveryFee) === 0 ? "Livraison gratuite" : `$${r.deliveryFee}`}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
