import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { useCart } from "../../lib/cart";
import { authFetchJson, resolveImg } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import {
  ArrowLeft, Star, Clock, Plus, ShoppingBag, Minus, Play, ChefHat,
  ChevronRight, Package
} from "lucide-react";
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", id],
    queryFn: () => authFetchJson(`/api/restaurants/${id}`),
    staleTime: STALE.semi,
  });
  const { data: menu = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/restaurants", id, "menu"],
    queryFn: () => authFetchJson(`/api/restaurants/${id}/menu`),
    staleTime: STALE.semi,
  });

  const categories = [...new Set(menu.map((m) => m.category))];

  const getCategoryImage = (cat: string) => {
    const first = menu.find((m) => m.category === cat && m.image);
    return first ? resolveImg(first.image) : "";
  };

  const getCategoryCount = (cat: string) => menu.filter((m) => m.category === cat).length;

  const getItemQty = (itemId: number) => items.find((i) => i.id === itemId)?.quantity || 0;

  const categoryItems = selectedCategory
    ? menu.filter((m) => m.category === selectedCategory && m.isAvailable !== false)
    : [];

  const headerSection = (
    <div className="relative h-52 flex-shrink-0">
      {restaurant && !showVideo && (
        <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
      )}
      {restaurant?.coverVideoUrl && showVideo && (
        <video
          ref={videoRef}
          src={restaurant.coverVideoUrl}
          className="w-full h-full object-cover"
          autoPlay muted playsInline
          onEnded={() => setShowVideo(false)}
          data-testid="restaurant-cover-video"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      <button
        onClick={() => {
          if (selectedCategory) {
            setSelectedCategory(null);
          } else {
            window.history.back();
          }
        }}
        data-testid="button-back"
        className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg z-10"
      >
        <ArrowLeft size={18} className="text-gray-900" />
      </button>

      {restaurant?.coverVideoUrl && !showVideo && (
        <button
          onClick={() => setShowVideo(true)}
          data-testid="button-play-video"
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg z-10"
        >
          <Play size={14} className="text-red-600 fill-red-600" />
          <span className="text-xs font-bold text-gray-900">Video</span>
        </button>
      )}

      <div className="absolute bottom-4 left-4 right-4 text-white z-10">
        <div className="flex items-center gap-3">
          {restaurant?.logoUrl ? (
            <div className="w-12 h-12 rounded-xl bg-white flex-shrink-0 shadow-lg overflow-hidden flex items-center justify-center">
              <img src={restaurant.logoUrl} alt={`${restaurant.name} logo`} className="w-full h-full object-contain p-1" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border-2 border-white/30">
              <span className="text-white font-black text-lg">{restaurant?.name?.charAt(0)}</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-black leading-tight">{restaurant?.name}</h1>
            <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{restaurant?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-medium">
            <Star size={12} className="fill-yellow-400 text-yellow-400" /> {restaurant?.rating}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium">
            <ChefHat size={12} /> {restaurant?.prepTime || restaurant?.deliveryTime}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium">
            <Clock size={12} /> {restaurant?.deliveryTime}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-32">
      {headerSection}

      {!selectedCategory ? (
        /* ── CATEGORY SELECTION VIEW ─────────────────────── */
        <div className="max-w-lg mx-auto px-4 pt-5">
          {/* Discount banner */}
          {(restaurant as any)?.discountPercent > 0 && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-2.5 mb-4" data-testid="restaurant-discount-banner">
              <span className="text-lg">🏷️</span>
              <div className="flex-1">
                <p className="font-bold text-green-700 dark:text-green-400 text-sm">
                  -{(restaurant as any).discountPercent}% de réduction
                </p>
                {(restaurant as any).discountLabel && (
                  <p className="text-green-600 dark:text-green-500 text-xs mt-0.5">{(restaurant as any).discountLabel}</p>
                )}
              </div>
              <span className="bg-green-500 text-white font-black rounded-full px-3 py-1 text-xs">
                -{(restaurant as any).discountPercent}%
              </span>
            </div>
          )}

          <div className="mb-5">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white mb-0.5">
              Choisissez une catégorie
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {categories.length} catégorie{categories.length !== 1 ? "s" : ""} disponible{categories.length !== 1 ? "s" : ""}
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
              <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">Aucun article disponible</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                const img = getCategoryImage(cat);
                const count = getCategoryCount(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    data-testid={`category-card-${cat}`}
                    className="relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 text-left active:scale-[0.97] transition-transform group"
                    style={{ minHeight: 140 }}
                  >
                    {/* Image */}
                    <div className="h-24 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                      {img ? (
                        <img
                          src={img}
                          alt={cat}
                          className="w-full h-full object-cover group-active:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20">
                          <Package size={28} className="text-red-300 dark:text-red-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>

                    {/* Text */}
                    <div className="p-3 flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">{cat}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                          {count} article{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5 group-active:text-red-500 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── CATEGORY ITEMS VIEW ─────────────────────────── */
        <div className="max-w-lg mx-auto px-4 pt-4">
          {/* Category header */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setSelectedCategory(null)}
              data-testid="button-back-categories"
              className="w-8 h-8 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800 flex-shrink-0"
            >
              <ArrowLeft size={14} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">{selectedCategory}</h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{categoryItems.length} article{categoryItems.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Items list */}
          <div className="space-y-3">
            {categoryItems.map((item) => {
              const qty = getItemQty(item.id);
              return (
                <div
                  key={item.id}
                  data-testid={`menu-item-${item.id}`}
                  className="bg-white dark:bg-gray-900 rounded-3xl p-3 flex gap-3 shadow-sm border border-gray-50 dark:border-gray-800/50"
                >
                  <img
                    src={resolveImg(item.image)}
                    alt={item.name}
                    className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{item.name}</h4>
                        {item.popular && (
                          <span className="inline-block mt-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                            ⭐ Populaire
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-400 dark:text-gray-500 mt-1 line-clamp-2 text-[11px]">{item.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-red-600 text-sm">{formatPrice(item.price)}</span>
                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 rounded-xl px-2 py-1">
                          <button
                            onClick={() => updateQuantity(item.id, qty - 1)}
                            data-testid={`minus-${item.id}`}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-gray-900 border border-red-100 dark:border-red-800 flex items-center justify-center text-red-600"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="font-bold text-red-600 w-4 text-center text-sm">{qty}</span>
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
                            addItem({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                              image: item.image,
                              restaurantId: restaurant!.id,
                              restaurantName: restaurant!.name,
                            });
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
      )}

      {/* Cart button */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate("/cart")}
              data-testid="button-view-cart"
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold flex items-center justify-between px-6 active:scale-[0.98] transition-transform text-sm"
              style={{ boxShadow: "0 4px 20px rgba(220,38,38,0.35)" }}
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
