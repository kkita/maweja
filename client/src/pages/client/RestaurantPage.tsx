import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useCart } from "../../lib/cart";
import { useToast } from "../../hooks/use-toast";
import { ArrowLeft, Star, Clock, MapPin, Plus, ShoppingBag, Minus } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Restaurant, MenuItem } from "@shared/schema";

export default function RestaurantPage() {
  const [, params] = useRoute("/restaurant/:id");
  const [, navigate] = useLocation();
  const { addItem, items, updateQuantity, itemCount, total } = useCart();
  const { toast } = useToast();
  const id = Number(params?.id);

  const { data: restaurant } = useQuery<Restaurant>({ queryKey: ["/api/restaurants", id], queryFn: () => fetch(`/api/restaurants/${id}`).then(r => r.json()) });
  const { data: menu = [] } = useQuery<MenuItem[]>({ queryKey: ["/api/restaurants", id, "menu"], queryFn: () => fetch(`/api/restaurants/${id}/menu`).then(r => r.json()) });

  const categories = [...new Set(menu.map((m) => m.category))];

  const getItemQty = (itemId: number) => items.find((i) => i.id === itemId)?.quantity || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="relative h-56">
        {restaurant && <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button
          onClick={() => navigate("/")}
          data-testid="button-back"
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
        >
          <ArrowLeft size={18} className="text-gray-900" />
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-2xl font-black">{restaurant?.name}</h1>
          <p className="text-white/80 text-sm mt-1">{restaurant?.description}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-sm"><Star size={14} className="fill-yellow-400 text-yellow-400" /> {restaurant?.rating}</span>
            <span className="flex items-center gap-1 text-sm"><Clock size={14} /> {restaurant?.deliveryTime}</span>
            <span className="flex items-center gap-1 text-sm"><MapPin size={14} /> {restaurant?.address?.split(",")[0]}</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {categories.map((c) => (
            <a key={c} href={`#cat-${c}`} className="flex-shrink-0 px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all">
              {c}
            </a>
          ))}
        </div>

        {categories.map((cat) => (
          <div key={cat} id={`cat-${cat}`} className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">{cat}</h3>
            <div className="space-y-3">
              {menu.filter((m) => m.category === cat).map((item) => {
                const qty = getItemQty(item.id);
                return (
                  <div
                    key={item.id}
                    data-testid={`menu-item-${item.id}`}
                    className="bg-white rounded-2xl p-3 flex gap-3 border border-gray-100 shadow-sm"
                  >
                    <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
                          {item.popular && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">Populaire</span>}
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-red-600 text-sm">{formatPrice(item.price)}</span>
                        {qty > 0 ? (
                          <div className="flex items-center gap-2 bg-red-50 rounded-xl px-2 py-1">
                            <button
                              onClick={() => updateQuantity(item.id, qty - 1)}
                              data-testid={`minus-${item.id}`}
                              className="w-6 h-6 rounded-lg bg-white border border-red-200 flex items-center justify-center text-red-600"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-bold text-red-600 w-4 text-center">{qty}</span>
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
                              toast({ title: "Ajoute au panier", description: item.name });
                            }}
                            data-testid={`add-${item.id}`}
                            className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate("/cart")}
              data-testid="button-view-cart"
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold flex items-center justify-between px-6 shadow-xl shadow-red-200 hover:bg-red-700 transition-all"
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
