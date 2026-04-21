import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "../../lib/cart";
import { useAuth } from "../../lib/auth";
import { authFetch, resolveImg } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import type { Restaurant } from "@shared/schema";
import { MapPin, ShoppingBag, Plus, Minus, Trash2, ArrowRight, User, Mail, Phone, MessageSquare, ChevronRight } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { useToast } from "../../hooks/use-toast";
import type { SavedAddress } from "@shared/schema";
import { detectZone, formatZoneFee, type DeliveryZoneData } from "@shared/deliveryZones";
import { MCard, MBtn, MEmptyState, MPageHeader } from "../../components/client/ClientUI";

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

  const restaurantId = items.length > 0 ? items[0].restaurantId : null;
  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: [`/api/restaurants/${restaurantId}`],
    enabled: !!restaurantId,
  });

  const { data: dbZones = [] } = useQuery<DeliveryZoneData[]>({ queryKey: ["/api/delivery-zones"] });
  const { data: appSettings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const defaultAddress = savedAddresses?.find(a => a.isDefault) || savedAddresses?.[0] || null;
  const resolvedAddress = defaultAddress?.address || manualAddress;
  const activeZones = dbZones.filter(z => z.isActive);
  const zoneResult = detectZone(resolvedAddress || "", activeZones);
  const deliveryFee = zoneResult.allowed ? zoneResult.fee : 0;
  const serviceFee = parseFloat(appSettings?.service_fee || "0.76");
  const grandTotal = parseFloat((total + deliveryFee + serviceFee).toFixed(2));

  const handleCheckout = () => {
    if (!resolvedAddress) {
      toast({ title: "Adresse manquante", description: "Veuillez ajouter une adresse de livraison", variant: "destructive" });
      return;
    }
    if (!zoneResult.allowed) {
      toast({ title: "Zone non desservie", description: "La livraison n'est pas disponible à cette adresse.", variant: "destructive" });
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmCheckout = () => {
    sessionStorage.setItem("maweja_checkout", JSON.stringify({
      deliveryAddress: resolvedAddress,
      addressId: defaultAddress?.id || null,
      deliveryLat: defaultAddress?.lat || null,
      deliveryLng: defaultAddress?.lng || null,
      notes: specialInstructions,
    }));
    setShowConfirmModal(false);
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0a0a0a] pb-28">
        <ClientNav />
        <MEmptyState
          icon={<ShoppingBag size={36} />}
          title="Votre panier est vide"
          description="Parcourez nos restaurants et ajoutez des plats"
          action={{ label: "Découvrir les restaurants", onClick: () => navigate("/"), testId: "button-browse" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0a0a0a] pb-44" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <ClientNav />
      <MPageHeader
        title="Mon Panier"
        subtitle={`${itemCount} article${itemCount > 1 ? "s" : ""}`}
        action={
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 text-[#E10000] font-semibold text-xs active:opacity-70 transition-opacity"
            data-testid="button-clear-cart"
          >
            <Trash2 size={13} />
            Vider
          </button>
        }
      />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">

        {/* ── Cart items ───────────────────────────────────────────── */}
        <MCard>
          {/* Restaurant header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5 bg-red-50/70 dark:bg-red-950/20 border-b border-red-100/60 dark:border-red-900/30">
            <ShoppingBag size={15} className="text-[#E10000] flex-shrink-0" />
            <p className="text-sm font-bold text-[#E10000] flex-1 truncate" data-testid="text-restaurant-name">
              {items[0].restaurantName}
            </p>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-zinc-800/60">
            {items.map(item => (
              <div key={item.id} className="flex gap-3.5 p-4" data-testid={`cart-item-${item.id}`}>
                <img
                  src={resolveImg(item.image)}
                  alt={item.name}
                  className="w-[68px] h-[68px] rounded-[14px] object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{item.name}</p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-7 h-7 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                      data-testid={`remove-${item.id}`}
                    >
                      <Trash2 size={12} className="text-gray-400 dark:text-gray-500" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatPrice(item.price)} / unité</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="font-black text-[#E10000] text-sm" data-testid={`price-${item.id}`}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    {/* Qty stepper */}
                    <div className="flex items-center gap-0.5 bg-gray-50 dark:bg-zinc-800 rounded-[12px] p-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-[10px] bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 flex items-center justify-center active:scale-90 transition-transform"
                        data-testid={`cart-minus-${item.id}`}
                      >
                        <Minus size={12} className="text-gray-600 dark:text-gray-300" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-gray-900 dark:text-white" data-testid={`qty-${item.id}`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-[10px] bg-[#E10000] flex items-center justify-center active:scale-90 transition-transform"
                        data-testid={`cart-plus-${item.id}`}
                      >
                        <Plus size={12} color="white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add more */}
          <div className="px-4 pb-4">
            <button
              onClick={() => navigate(`/restaurant/${restaurantId}`)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[14px] border-2 border-[#E10000]/20 text-[#E10000] font-semibold text-sm active:scale-98 transition-all"
              data-testid="button-add-items"
            >
              <Plus size={15} />
              Ajouter des articles
            </button>
          </div>
        </MCard>

        {/* ── Special instructions ─────────────────────────────────── */}
        <MCard padded>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={15} className="text-[#E10000]" />
            <p className="font-bold text-gray-900 dark:text-white text-sm">Instructions spéciales</p>
          </div>
          <textarea
            value={specialInstructions}
            onChange={e => setSpecialInstructions(e.target.value)}
            placeholder="Ex: Sans oignon, bien cuit, allergie aux noix…"
            className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 rounded-[14px] p-3.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E10000]/15"
            rows={3}
            data-testid="input-special-instructions"
          />
        </MCard>

        {/* ── User info ────────────────────────────────────────────── */}
        <MCard padded>
          <div className="flex items-center gap-2 mb-3">
            <User size={15} className="text-[#E10000]" />
            <p className="font-bold text-gray-900 dark:text-white text-sm">Informations personnelles</p>
          </div>
          <div className="space-y-2.5">
            {[
              { icon: User, value: user?.name || "Non connecté", testId: "text-user-name" },
              { icon: Mail, value: user?.email || "—", testId: "text-user-email" },
              { icon: Phone, value: user?.phone || "—", testId: "text-user-phone" },
            ].map(({ icon: Icon, value, testId }) => (
              <div key={testId} className="flex items-center gap-3" data-testid={testId}>
                <Icon size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-300 text-sm">{value}</span>
              </div>
            ))}
          </div>
        </MCard>

        {/* ── Delivery address ─────────────────────────────────────── */}
        <MCard padded>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-[#E10000]" />
              <p className="font-bold text-gray-900 dark:text-white text-sm">Adresse de livraison</p>
            </div>
            {defaultAddress && (
              <button
                onClick={() => navigate("/addresses")}
                className="flex items-center gap-0.5 text-[#E10000] font-semibold"
                style={{ fontSize: 12 }}
                data-testid="button-change-address"
              >
                Changer <ChevronRight size={13} />
              </button>
            )}
          </div>

          {defaultAddress ? (
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-[14px] p-3.5 flex items-start gap-2.5" data-testid="text-delivery-address">
              <MapPin size={13} className="text-[#E10000] mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{defaultAddress.address}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={manualAddress}
                onChange={e => setManualAddress(e.target.value)}
                placeholder="Entrez votre adresse de livraison"
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 rounded-[14px] p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E10000]/15"
                data-testid="input-manual-address"
              />
              <button
                onClick={() => navigate("/addresses")}
                className="flex items-center gap-1.5 text-[#E10000] font-semibold"
                style={{ fontSize: 12 }}
                data-testid="link-add-address"
              >
                <Plus size={13} />
                Ajouter une adresse enregistrée
              </button>
            </div>
          )}
        </MCard>

        {/* ── Order summary ────────────────────────────────────────── */}
        <MCard padded>
          <div className="space-y-3">
            <div className="flex justify-between" style={{ fontSize: 13 }}>
              <span className="text-gray-400 dark:text-gray-500">Sous-total</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200" data-testid="text-subtotal">{formatPrice(total)}</span>
            </div>

            <div className="flex justify-between items-center" style={{ fontSize: 13 }}>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 dark:text-gray-500">Livraison</span>
                {zoneResult.zone && (
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: zoneResult.zone.color }}
                    data-testid="badge-cart-zone"
                  >
                    {zoneResult.zone.name}
                  </span>
                )}
              </div>
              {!zoneResult.allowed && resolvedAddress ? (
                <span className="text-[#E10000] font-bold text-xs" data-testid="text-delivery-fee">Hors zone</span>
              ) : (
                <span className="font-semibold text-gray-800 dark:text-gray-200" data-testid="text-delivery-fee">{formatPrice(deliveryFee)}</span>
              )}
            </div>

            {!zoneResult.allowed && resolvedAddress && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-[12px] p-3" data-testid="cart-zone-warning">
                <p className="text-[#E10000] text-[11px] font-bold flex items-center gap-1.5 mb-1.5">
                  <MapPin size={11} />
                  Adresse hors zone — livraison non disponible
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {activeZones.map(z => (
                    <span key={z.id} className="text-[9px] px-2 py-0.5 rounded-full text-white font-bold" style={{ background: z.color }}>
                      {z.name}: {formatZoneFee(z.fee)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between" style={{ fontSize: 13 }}>
              <span className="text-gray-400 dark:text-gray-500">Frais de service</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200" data-testid="text-tax">{formatPrice(serviceFee)}</span>
            </div>

            <div className="border-t border-gray-100 dark:border-zinc-800 pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white text-base">Total</span>
              <span className="font-black text-[#E10000] text-xl" data-testid="text-grand-total">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </MCard>
      </div>

      {/* ── Sticky checkout CTA ──────────────────────────────────────── */}
      <div className="fixed bottom-[68px] left-0 right-0 px-4 py-3 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-gray-100 dark:border-zinc-800/60 z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleCheckout}
            disabled={!!(resolvedAddress && !zoneResult.allowed)}
            data-testid="button-checkout"
            className={`w-full py-4 rounded-[18px] font-bold text-base flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] ${
              resolvedAddress && !zoneResult.allowed
                ? "bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "text-white"
            }`}
            style={
              resolvedAddress && !zoneResult.allowed
                ? {}
                : { background: "linear-gradient(90deg, #E10000, #cc0000)", boxShadow: "0 6px 20px rgba(225,0,0,0.35)" }
            }
          >
            {resolvedAddress && !zoneResult.allowed ? (
              <><MapPin size={17} /> Zone non desservie</>
            ) : (
              <>Passer la commande · {formatPrice(grandTotal)} <ArrowRight size={17} /></>
            )}
          </button>
        </div>
      </div>

      {/* ── Confirm address modal ────────────────────────────────────── */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] flex items-end justify-center"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1a1a1a] rounded-t-[28px] w-full max-w-lg p-6 pb-10"
            style={{ boxShadow: "0 -8px 48px rgba(0,0,0,0.2)", animation: "slideInUp 0.26s cubic-bezier(0.34,1.56,0.64,1)" }}
            onClick={e => e.stopPropagation()}
            data-testid="modal-confirm-address"
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 bg-gray-200 dark:bg-zinc-700 rounded-full" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Confirmer l'adresse</h3>
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-[16px] p-4 flex items-start gap-3 mb-5">
              <div className="w-8 h-8 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin size={14} className="text-[#E10000]" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-confirm-address">
                {resolvedAddress}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmModal(false); navigate("/addresses"); }}
                className="flex-1 py-3.5 rounded-[16px] border-2 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-semibold text-sm active:scale-95 transition-transform"
                data-testid="button-modal-change"
              >
                Modifier
              </button>
              <button
                onClick={confirmCheckout}
                className="flex-1 py-3.5 rounded-[16px] text-white font-bold text-sm active:scale-95 transition-transform"
                style={{ background: "#E10000", boxShadow: "0 4px 16px rgba(225,0,0,0.3)" }}
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
