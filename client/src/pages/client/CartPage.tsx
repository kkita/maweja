import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "../../lib/cart";
import { useAuth } from "../../lib/auth";
import { authFetch } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import {
  MapPin,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  User,
  Mail,
  Phone,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { useToast } from "../../hooks/use-toast";
import type { SavedAddress } from "@shared/schema";

export default function CartPage() {
  const [, navigate] = useLocation();
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: savedAddresses } = useQuery<SavedAddress[]>({
    queryKey: ["/api/saved-addresses"],
    enabled: !!user,
    queryFn: async () => {
      const res = await authFetch("/api/saved-addresses");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const defaultAddress =
    savedAddresses?.find((a) => a.isDefault) || savedAddresses?.[0] || null;

  const deliveryFee = 2500;
  const grandTotal = total + deliveryFee;

  const resolvedAddress = defaultAddress?.address || manualAddress;

  const handleCheckout = () => {
    if (!resolvedAddress) {
      toast({
        title: "Adresse manquante",
        description: "Veuillez ajouter une adresse de livraison",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmCheckout = () => {
    sessionStorage.setItem(
      "maweja_checkout",
      JSON.stringify({
        deliveryAddress: resolvedAddress,
        addressId: defaultAddress?.id || null,
        deliveryLat: defaultAddress?.lat || null,
        deliveryLng: defaultAddress?.lng || null,
        notes: specialInstructions,
      })
    );
    setShowConfirmModal(false);
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <ClientNav />
        <div className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center pt-32">
          <div className="w-24 h-24 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
            <ShoppingBag size={40} className="text-red-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900" data-testid="text-empty-cart">
            Votre panier est vide
          </h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            Parcourez nos restaurants et ajoutez des plats
          </p>
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

  const restaurantId = items[0].restaurantId;
  const restaurantName = items[0].restaurantName;

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900" data-testid="text-cart-title">
              Mon Panier
            </h2>
            <span
              className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full"
              data-testid="badge-item-count"
            >
              {itemCount}
            </span>
          </div>
          <button
            onClick={clearCart}
            className="text-red-600 text-xs font-semibold flex items-center gap-1"
            data-testid="button-clear-cart"
          >
            <Trash2 size={14} /> Vider le panier
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 bg-red-50 rounded-t-2xl border-b border-red-100 flex items-center gap-2">
            <ShoppingBag size={16} className="text-red-600" />
            <p className="text-sm font-semibold text-red-700" data-testid="text-restaurant-name">
              {restaurantName}
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 flex gap-3"
                data-testid={`cart-item-${item.id}`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm text-gray-900 truncate">
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-500 flex-shrink-0"
                      data-testid={`remove-${item.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatPrice(item.price)} / unite
                  </p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="font-bold text-red-600 text-sm" data-testid={`price-${item.id}`}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center"
                        data-testid={`cart-minus-${item.id}`}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold w-5 text-center" data-testid={`qty-${item.id}`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center"
                        data-testid={`cart-plus-${item.id}`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => navigate(`/restaurant/${restaurantId}`)}
              className="w-full py-2.5 rounded-xl border-2 border-red-600 text-red-600 text-sm font-semibold flex items-center justify-center gap-2"
              data-testid="button-add-items"
            >
              <Plus size={16} /> Ajouter des articles
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <User size={16} className="text-red-600" />
            Informations personnelles
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm" data-testid="text-user-name">
              <User size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{user?.name || "Non connecte"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm" data-testid="text-user-email">
              <Mail size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{user?.email || "-"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm" data-testid="text-user-phone">
              <Phone size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{user?.phone || "-"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare size={16} className="text-red-600" />
            Instructions speciales
          </h3>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Ex: Sans oignon, bien cuit, allergies..."
            className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            rows={3}
            data-testid="input-special-instructions"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MapPin size={16} className="text-red-600" />
              Adresse de livraison
            </h3>
            {defaultAddress && (
              <button
                onClick={() => navigate("/addresses")}
                className="text-red-600 text-xs font-semibold flex items-center gap-0.5"
                data-testid="button-change-address"
              >
                Changer <ChevronRight size={14} />
              </button>
            )}
          </div>
          {defaultAddress ? (
            <div
              className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 flex items-start gap-2"
              data-testid="text-delivery-address"
            >
              <MapPin size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <span>{defaultAddress.address}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Entrez votre adresse de livraison"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                data-testid="input-manual-address"
              />
              <button
                onClick={() => navigate("/addresses")}
                className="text-red-600 text-xs font-semibold flex items-center gap-1"
                data-testid="link-add-address"
              >
                <Plus size={14} /> Ajouter une adresse
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex justify-between gap-2 text-sm">
            <span className="text-gray-500">Sous-total</span>
            <span className="font-semibold" data-testid="text-subtotal">{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between gap-2 text-sm">
            <span className="text-gray-500">Frais de livraison</span>
            <span className="font-semibold" data-testid="text-delivery-fee">{formatPrice(deliveryFee)}</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between gap-2">
            <span className="font-bold">Total</span>
            <span className="font-black text-red-600 text-lg" data-testid="text-grand-total">
              {formatPrice(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleCheckout}
            data-testid="button-checkout"
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
          >
            Proceder au paiement - {formatPrice(grandTotal)}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 animate-in slide-in-from-bottom"
            data-testid="modal-confirm-address"
          >
            <h3 className="text-lg font-bold text-gray-900">Confirmer l'adresse</h3>
            <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
              <MapPin size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700" data-testid="text-confirm-address">
                {resolvedAddress}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  navigate("/addresses");
                }}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-semibold"
                data-testid="button-modal-change"
              >
                Changer
              </button>
              <button
                onClick={confirmCheckout}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold"
                data-testid="button-modal-confirm"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
