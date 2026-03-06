import { useLocation } from "wouter";
import { useCart } from "../../lib/cart";
import ClientNav from "../../components/ClientNav";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { formatPrice } from "../../lib/utils";

export default function CartPage() {
  const [, navigate] = useLocation();
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <ClientNav />
        <div className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center pt-32">
          <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mb-4">
            <ShoppingBag size={40} className="text-red-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Votre panier est vide</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">Parcourez nos restaurants et ajoutez des plats</p>
          <button
            onClick={() => navigate("/")}
            data-testid="button-browse"
            className="mt-6 bg-red-600 text-white px-8 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-red-200"
          >
            Decouvrir les restaurants
          </button>
        </div>
      </div>
    );
  }

  const deliveryFee = 2500;
  const grandTotal = total + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Mon Panier</h2>
          <button onClick={clearCart} className="text-red-600 text-xs font-semibold flex items-center gap-1" data-testid="button-clear-cart">
            <Trash2 size={14} /> Vider
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-100">
            <p className="text-xs font-semibold text-red-700">{items[0]?.restaurantName}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex gap-3" data-testid={`cart-item-${item.id}`}>
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-sm text-gray-900">{item.name}</h4>
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500" data-testid={`remove-${item.id}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-red-600 text-sm">{formatPrice(item.price * item.quantity)}</span>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center" data-testid={`cart-minus-${item.id}`}>
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center" data-testid={`cart-plus-${item.id}`}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mt-4 space-y-3">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Sous-total</span><span className="font-semibold">{formatPrice(total)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Frais de livraison</span><span className="font-semibold">{formatPrice(deliveryFee)}</span></div>
          <div className="border-t border-gray-100 pt-3 flex justify-between"><span className="font-bold">Total</span><span className="font-black text-red-600 text-lg">{formatPrice(grandTotal)}</span></div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/checkout")}
            data-testid="button-checkout"
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all"
          >
            Commander - {formatPrice(grandTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
