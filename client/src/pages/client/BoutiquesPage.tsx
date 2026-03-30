import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import { useI18n } from "../../lib/i18n";
import { Star, Clock, MapPin, ChevronLeft, ShoppingBag } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { resolveImg } from "../../lib/queryClient";
import type { Restaurant, BoutiqueCategory } from "@shared/schema";

export default function BoutiquesPage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { data: boutiques = [], isLoading } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants?type=boutique"] });
  const { data: categories = [] } = useQuery<BoutiqueCategory[]>({ queryKey: ["/api/boutique-categories"] });
  const activeCats = categories.filter(c => c.isActive);

  const [activeCatId, setActiveCatId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = boutiques.filter(b => {
    if (!b.isActive) return false;
    if (search) {
      const q = search.toLowerCase();
      return b.name.toLowerCase().includes(q) || b.cuisine.toLowerCase().includes(q) || b.address.toLowerCase().includes(q);
    }
    if (activeCatId) {
      return (b as any).categoryId === activeCatId;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d]">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 pb-24" style={{ paddingTop: 70 }}>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm"
            data-testid="button-back-home"
          >
            <ChevronLeft size={18} className="text-gray-700 dark:text-gray-200" />
          </button>
          <div>
            <h1 className="font-black text-gray-900 dark:text-white text-lg">Boutiques & Commerces</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} boutique{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); if (e.target.value) setActiveCatId(null); }}
            placeholder="Rechercher une boutique..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none"
            data-testid="input-search-boutiques"
          />
          <ShoppingBag size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {activeCats.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            <button
              onClick={() => { setActiveCatId(null); setSearch(""); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${!activeCatId ? "bg-red-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"}`}
              data-testid="button-boutique-all"
            >
              Tout
            </button>
            {activeCats.sort((a, b) => a.sortOrder - b.sortOrder).map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCatId(cat.id); setSearch(""); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeCatId === cat.id ? "bg-red-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"}`}
                data-testid={`button-boutique-cat-${cat.id}`}
              >
                <span>{cat.emoji}</span> {cat.name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden animate-pulse" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                <div className="h-32 bg-gray-200 dark:bg-gray-800" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <ShoppingBag size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-700 dark:text-gray-200 font-semibold text-sm">
              {search ? `Aucun résultat pour "${search}"` : "Aucune boutique disponible"}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              {search ? "Essayez un autre terme de recherche" : "Les boutiques arrivent bientôt dans votre zone"}
            </p>
            {(search || activeCatId) && (
              <button
                onClick={() => { setSearch(""); setActiveCatId(null); }}
                className="mt-4 bg-red-600 text-white text-xs font-bold px-5 py-2 rounded-xl active:scale-95 transition-all"
                data-testid="button-reset-boutique-filters"
              >
                Tout afficher
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => (
              <div
                key={b.id}
                onClick={() => navigate(`/restaurant/${b.id}`)}
                className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                data-testid={`boutique-list-card-${b.id}`}
              >
                <div className="px-3 pt-3">
                  <div className="relative rounded-2xl overflow-hidden" style={{ height: 140 }}>
                    <img src={resolveImg(b.image)} alt={b.name} className="w-full h-full object-cover" />
                    {(b as any).discountPercent > 0 && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        -{(b as any).discountPercent}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3 flex gap-3">
                  {(b as any).logoUrl ? (
                    <img src={resolveImg((b as any).logoUrl)} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-gray-800 flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag size={18} className="text-red-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{b.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{b.cuisine} • {b.address}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-0.5 text-xs text-gray-600 dark:text-gray-300">
                        <Star size={11} className="text-yellow-500 fill-yellow-500" /> {b.rating}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Clock size={11} /> {b.deliveryTime}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        Min. {formatPrice(b.minOrder)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
