import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useCart } from "../../lib/cart";
import { authFetch, authFetchJson, resolveImg } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { ArrowLeft, Star, Clock, Plus, ShoppingBag, Minus, Play, ChefHat } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { useState, useRef } from "react";
import type { Restaurant, MenuItem } from "@shared/schema";

export default function RestaurantPage() {
  const [, params] = useRoute("/restaurant/:id");
  const [, navigate] = useLocation();
  const { addItem, items, updateQuantity, itemCount, total } = useCart();
  const { toast } = useToast();
  const id = Number(params?.id);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: restaurant } = useQuery<Restaurant>({ queryKey: ["/api/restaurants", id], queryFn: () => authFetchJson(`/api/restaurants/${id}`) });
  const { data: menu = [] } = useQuery<MenuItem[]>({ queryKey: ["/api/restaurants", id, "menu"], queryFn: () => authFetchJson(`/api/restaurants/${id}/menu`) });

  const categories = [...new Set(menu.map((m) => m.category))];

  const getItemQty = (itemId: number) => items.find((i) => i.id === itemId)?.quantity || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-32" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div className="relative h-56">
        {restaurant && !showVideo && (
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
        )}
        {restaurant?.coverVideoUrl && showVideo && (
          <video
            ref={videoRef}
            src={restaurant.coverVideoUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            onEnded={() => setShowVideo(false)}
            data-testid="restaurant-cover-video"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button
          onClick={() => navigate("/")}
          data-testid="button-back"
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg z-10"
        >
          <ArrowLeft size={18} className="text-gray-900 dark:text-white" />
        </button>
        {restaurant?.coverVideoUrl && !showVideo && (
          <button
            onClick={() => setShowVideo(true)}
            data-testid="button-play-video"
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg z-10"
          >
            <Play size={14} className="text-red-600 fill-red-600" />
            <span className="text-xs font-bold text-gray-900 dark:text-white">Video</span>
          </button>
        )}
        <div className="absolute bottom-4 left-4 right-4 text-white z-10">
          <div className="flex items-center gap-3">
            {restaurant?.logoUrl ? (
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-900 flex-shrink-0 shadow-lg overflow-hidden flex items-center justify-center">
                <img src={restaurant.logoUrl} alt={`${restaurant.name} logo`} className="w-full h-full object-contain p-1" data-testid="restaurant-detail-logo" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <span className="text-white font-black text-lg">{restaurant?.name?.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black">{restaurant?.name}</h1>
              <p className="text-white/80 text-sm mt-0.5">{restaurant?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-sm"><Star size={14} className="fill-yellow-400 text-yellow-400" /> {restaurant?.rating}</span>
            <span className="flex items-center gap-1 text-sm" data-testid="restaurant-prep-time"><ChefHat size={14} /> {restaurant?.prepTime || restaurant?.deliveryTime}</span>
            <span className="flex items-center gap-1 text-sm"><Clock size={14} /> {restaurant?.deliveryTime}</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Discount banner */}
        {(restaurant as any)?.discountPercent > 0 && (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-2.5 mb-3" data-testid="restaurant-discount-banner">
            <span className="text-lg">🏷️</span>
            <div className="flex-1">
              <p className="font-bold text-green-700" style={{ fontSize: 13 }}>
                -{(restaurant as any).discountPercent}% de réduction
              </p>
              {(restaurant as any).discountLabel && (
                <p className="text-green-600 mt-0.5" style={{ fontSize: 11 }}>
                  {(restaurant as any).discountLabel}
                </p>
              )}
            </div>
            <span className="bg-green-500 text-white font-black rounded-full px-3 py-1" style={{ fontSize: 13 }}>
              -{(restaurant as any).discountPercent}%
            </span>
          </div>
        )}

        {restaurant?.prepTime && (
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-2.5 mb-4" data-testid="restaurant-prep-time-banner">
            <ChefHat size={16} className="text-orange-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-orange-800 dark:text-orange-300">Temps de préparation : {restaurant.prepTime}</span>
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {categories.map((c) => (
            <a key={c} href={`#cat-${c}`} className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-800 rounded-full font-semibold text-gray-500 dark:text-gray-300 transition-all active:bg-red-50 dark:active:bg-red-950/30 active:text-red-600" style={{ fontSize: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              {c}
            </a>
          ))}
        </div>

        {categories.map((cat) => (
          <div key={cat} id={`cat-${cat}`} className="mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider" style={{ fontSize: 12 }}>{cat}</h3>
            <div className="space-y-3">
              {menu.filter((m) => m.category === cat).map((item) => {
                const qty = getItemQty(item.id);
                return (
                  <div
                    key={item.id}
                    data-testid={`menu-item-${item.id}`}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-3 flex gap-3"
                    style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}
                  >
                    <img src={resolveImg(item.image)} alt={item.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white" style={{ fontSize: 13 }}>{item.name}</h4>
                          {item.popular && <span className="inline-block mt-0.5 bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold" style={{ fontSize: 10 }}>⭐ Populaire</span>}
                        </div>
                      </div>
                      <p className="text-gray-400 dark:text-gray-500 mt-1 line-clamp-2" style={{ fontSize: 11 }}>{item.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-red-600" style={{ fontSize: 14 }}>{formatPrice(item.price)}</span>
                        {qty > 0 ? (
                          <div className="flex items-center gap-2 bg-red-50 rounded-xl px-2 py-1">
                            <button
                              onClick={() => updateQuantity(item.id, qty - 1)}
                              data-testid={`minus-${item.id}`}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-gray-900 border border-red-100 flex items-center justify-center text-red-600"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="font-bold text-red-600 w-4 text-center" style={{ fontSize: 13 }}>{qty}</span>
                            <button
                              onClick={() => updateQuantity(item.id, qty + 1)}
                              data-testid={`plus-${item.id}`}
                              className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              addItem({ id: item.id, name: item.name, price: item.price, image: item.image, restaurantId: restaurant!.id, restaurantName: restaurant!.name });
                              toast({ title: "Ajouté au panier", description: item.name });
                            }}
                            data-testid={`add-${item.id}`}
                            className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white active:scale-95 transition-transform"
                            style={{ boxShadow: "0 4px 12px rgba(220,38,38,0.3)" }}
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate("/cart")}
              data-testid="button-view-cart"
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold flex items-center justify-between px-6 active:scale-[0.98] transition-transform"
              style={{ boxShadow: "0 4px 20px rgba(220,38,38,0.35)", fontSize: 14 }}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} />
                <span>{itemCount} article{itemCount > 1 ? "s" : ""}</span>
              </div>
              <span>{formatPrice(total)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
