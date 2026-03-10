import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import AdBanner from "../../components/AdBanner";
import { useAuth } from "../../lib/auth";
import { Star, Clock, MapPin, Search, ChevronRight, Flame, ChefHat } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Restaurant } from "@shared/schema";

export default function HomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: restaurants = [], isLoading } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"] });

  const categories = [
    { name: "Tous", icon: "grid", active: true },
    { name: "Burgers", icon: "burger" },
    { name: "Congolais", icon: "pot" },
    { name: "Grillades", icon: "flame" },
    { name: "Fast Food", icon: "zap" },
    { name: "Gastronomique", icon: "star" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <ClientNav />

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="mb-6">
          <p className="text-gray-500 text-sm font-medium">Bonjour {user?.name?.split(" ")[0]} 👋</p>
          <h2 className="text-2xl font-black text-gray-900 mt-1">Que voulez-vous manger ?</h2>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un restaurant ou un plat..."
            data-testid="input-search"
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
          />
        </div>

        <AdBanner />

        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-5 mb-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-2">
              <Flame size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Offre Speciale</span>
            </div>
            <h3 className="text-xl font-bold">Livraison gratuite</h3>
            <p className="text-red-100 text-sm mt-1">Sur votre premiere commande</p>
            <button className="mt-3 bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-bold" data-testid="button-promo">
              Commander maintenant
            </button>
          </div>
          <div className="absolute right-0 top-0 w-32 h-full bg-red-500/30 rounded-l-full" />
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 -mx-1 px-1">
          {categories.map((c) => (
            <button
              key={c.name}
              data-testid={`category-${c.name.toLowerCase()}`}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                c.active
                  ? "bg-red-600 text-white shadow-lg shadow-red-200"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Restaurants populaires</h3>
          <button className="text-red-600 text-xs font-semibold flex items-center gap-0.5" data-testid="button-see-all">
            Voir tout <ChevronRight size={14} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/restaurant/${r.id}`)}
                data-testid={`restaurant-card-${r.id}`}
                className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
              >
                <div className="relative h-36">
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-sm">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-gray-900">{r.rating}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <span className="text-white text-xs font-medium px-2 py-1 bg-red-600/80 rounded-lg">{r.cuisine}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2.5">
                    {r.logoUrl ? (
                      <img src={r.logoUrl} alt={`${r.name} logo`} className="w-9 h-9 rounded-xl object-cover border border-gray-100 flex-shrink-0" data-testid={`restaurant-logo-${r.id}`} />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 border border-red-100">
                        <span className="text-red-600 font-black text-sm">{r.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900">{r.name}</h4>
                      <p className="text-gray-500 text-xs line-clamp-1">{r.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <div className="flex items-center gap-1 text-gray-500" data-testid={`restaurant-prep-time-${r.id}`}>
                      <ChefHat size={12} />
                      <span className="text-xs font-medium">Prep: {r.prepTime || r.deliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock size={12} />
                      <span className="text-xs font-medium">{r.deliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin size={12} />
                      <span className="text-xs font-medium">{r.address.split(",")[0]}</span>
                    </div>
                    <div className="ml-auto text-xs font-semibold text-red-600">
                      {formatPrice(r.deliveryFee)} livraison
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
