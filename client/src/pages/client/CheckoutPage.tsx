import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCart } from "../../lib/cart";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { authFetch, apiRequest, queryClient } from "../../lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import ClientNav from "../../components/ClientNav";
import { Banknote, Smartphone, Wallet, CreditCard, Tag, Gift, Star, Receipt, ArrowLeft, Check, Loader2 } from "lucide-react";
import { formatPrice } from "../../lib/utils";

interface CheckoutData {
  deliveryAddress: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  notes: string;
}

const paymentOptions = [
  { id: "cash", label: "Cash", desc: "Paiement a la livraison", Icon: Banknote },
  { id: "mobile_money", label: "Mobile Money", desc: "M-Pesa / Orange Money / Airtel", Icon: Smartphone },
  { id: "wallet", label: "Wallet MAWEJA", desc: "Solde du portefeuille", Icon: Wallet },
  { id: "google_pay", label: "Google Pay", desc: "Paiement Google", Icon: CreditCard },
  { id: "pos", label: "POS", desc: "Terminal de paiement", Icon: CreditCard },
  { id: "illico_cash", label: "IllicoCash", desc: "Paiement IllicoCash", Icon: Banknote },
  { id: "card", label: "Carte de Credit", desc: "Visa, Mastercard", Icon: CreditCard },
];

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { items, total, itemCount, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    deliveryAddress: "",
    deliveryLat: null,
    deliveryLng: null,
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [promoCode, setPromoCode] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDescription, setPromoDescription] = useState("");
  const [promoType, setPromoType] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("maweja_checkout");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setCheckoutData(parsed);
      } catch {}
    }
  }, []);

  if (!user) {
    navigate("/login");
    return null;
  }

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const subtotal = total;
  const baseDeliveryFee = 2500;
  const deliveryFee = promoType === "delivery" ? 0 : baseDeliveryFee;
  const taxAmount = Math.floor(subtotal * 0.05);
  const effectivePromoDiscount = promoType === "delivery" ? 0 : promoDiscount;
  const totalBeforeDiscounts = subtotal + deliveryFee + taxAmount;
  const remainingAfterPromo = totalBeforeDiscounts - effectivePromoDiscount;
  const pointsValue = user.loyaltyPoints * 100;
  const pointsDiscount = usePoints ? Math.min(pointsValue, Math.max(0, remainingAfterPromo)) : 0;
  const netTotal = Math.max(0, totalBeforeDiscounts - effectivePromoDiscount - pointsDiscount);

  const walletInsufficient = (user.walletBalance || 0) < netTotal;

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const res = await authFetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), subtotal }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Code invalide", description: err.message, variant: "destructive" });
        setPromoLoading(false);
        return;
      }
      const data = await res.json();
      setPromoCode(data.code);
      setPromoDiscount(data.discount);
      setPromoDescription(data.description);
      setPromoType(data.type || "");
      toast({ title: "Code applique", description: data.description });
    } catch {
      toast({ title: "Erreur", description: "Impossible de valider le code", variant: "destructive" });
    } finally {
      setPromoLoading(false);
    }
  };

  const orderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          clientId: user.id,
          restaurantId: items[0].restaurantId,
          items: JSON.stringify(items.map((i) => ({ name: i.name, qty: i.quantity, price: i.price }))),
          subtotal,
          deliveryFee,
          taxAmount,
          total: netTotal,
          paymentMethod,
          paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
          deliveryAddress: checkoutData.deliveryAddress || "Adresse non specifiee",
          deliveryLat: checkoutData.deliveryLat,
          deliveryLng: checkoutData.deliveryLng,
          notes: checkoutData.notes || "",
          promoCode: promoCode || null,
          promoDiscount: effectivePromoDiscount + pointsDiscount,
          pointsUsed: usePoints ? Math.ceil(pointsDiscount / 100) : 0,
          status: "pending",
        }),
      });
      return res.json();
    },
    onSuccess: (order: any) => {
      clearCart();
      sessionStorage.removeItem("maweja_checkout");
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande confirmee!", description: `Commande ${order.orderNumber} passee avec succes` });
      navigate("/orders");
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la commande", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <button
          onClick={() => navigate("/cart")}
          data-testid="button-back-cart"
          className="flex items-center gap-2 text-gray-500 text-sm mb-4"
        >
          <ArrowLeft size={16} />
          <span>Retour au panier</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Receipt size={20} className="text-red-600" />
              <h2 className="text-lg font-bold text-gray-900">Facture</h2>
            </div>
            <span className="text-xs font-semibold text-red-600 tracking-widest">MAWEJA</span>
          </div>

          <div className="space-y-2 mb-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 text-sm" data-testid={`invoice-item-${item.id}`}>
                <span className="text-gray-700 flex-1 min-w-0 truncate">{item.name}</span>
                <span className="text-gray-400 whitespace-nowrap">{item.quantity} x {formatPrice(item.price)}</span>
                <span className="font-medium text-gray-900 whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total</span>
              <span className="text-gray-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Frais de livraison</span>
              <span className={deliveryFee === 0 ? "text-green-600 line-through" : "text-gray-900"}>
                {deliveryFee === 0 ? formatPrice(baseDeliveryFee) : formatPrice(deliveryFee)}
              </span>
            </div>
            {deliveryFee === 0 && (
              <div className="flex justify-end">
                <span className="text-xs text-green-600 font-medium">Livraison gratuite (promo)</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Taxes (5%)</span>
              <span className="text-gray-900">{formatPrice(taxAmount)}</span>
            </div>
            {effectivePromoDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Reduction promo</span>
                <span className="text-green-600 font-medium">-{formatPrice(effectivePromoDiscount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Points fidelite</span>
                <span className="text-green-600 font-medium">-{formatPrice(pointsDiscount)}</span>
              </div>
            )}
          </div>

          <div className="border-t-2 border-red-600 mt-3 pt-3">
            <div className="flex justify-between items-center gap-2">
              <span className="text-base font-bold text-gray-900">TOTAL NET A PAYER</span>
              <span className="text-xl font-bold text-red-600" data-testid="text-net-total">{formatPrice(netTotal)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={18} className="text-red-600" />
            <h3 className="font-bold text-sm text-gray-900">Code Promo</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Entrez votre code"
              data-testid="input-promo-code"
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={!!promoCode}
            />
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading || !!promoCode}
              data-testid="button-apply-promo"
              className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {promoLoading ? <Loader2 size={16} className="animate-spin" /> : "Appliquer"}
            </button>
          </div>
          {promoCode && (
            <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2" data-testid="promo-success">
              <Check size={14} className="text-green-600" />
              <span className="text-green-700 text-xs font-medium">{promoDescription}{promoType === "delivery" ? "" : ` (-${formatPrice(effectivePromoDiscount)})`}</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} className="text-red-600" />
            <h3 className="font-bold text-sm text-gray-900">Points de fidelite</h3>
          </div>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div>
              <p className="text-sm text-gray-700" data-testid="text-loyalty-points">{user.loyaltyPoints} points disponibles</p>
              <p className="text-xs text-gray-400">= {formatPrice(pointsValue)}</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer" data-testid="toggle-use-points">
              <span className="text-xs text-gray-500">Utiliser</span>
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${usePoints ? "bg-red-600" : "bg-gray-300"}`}
                onClick={() => setUsePoints(!usePoints)}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${usePoints ? "translate-x-5" : "translate-x-0"}`}
                />
              </div>
            </label>
          </div>
          {usePoints && pointsDiscount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <p className="text-green-700 text-xs font-medium" data-testid="text-points-discount">
                <Gift size={12} className="inline mr-1" />
                -{formatPrice(pointsDiscount)} appliques
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={18} className="text-red-600" />
            <h3 className="font-bold text-sm text-gray-900">Mode de paiement</h3>
          </div>
          <div className="space-y-2">
            {paymentOptions.map((opt) => {
              const isWallet = opt.id === "wallet";
              const disabled = isWallet && walletInsufficient;
              return (
                <button
                  key={opt.id}
                  onClick={() => !disabled && setPaymentMethod(opt.id)}
                  disabled={disabled}
                  data-testid={`payment-${opt.id}`}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === opt.id
                      ? "border-red-500 bg-red-50"
                      : disabled
                      ? "border-gray-100 opacity-50 cursor-not-allowed"
                      : "border-gray-100"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <opt.Icon size={18} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500">
                      {isWallet ? `Solde: ${formatPrice(user.walletBalance || 0)}` : opt.desc}
                    </p>
                    {isWallet && walletInsufficient && (
                      <p className="text-xs text-red-500 mt-0.5">Solde insuffisant</p>
                    )}
                  </div>
                  {paymentMethod === opt.id && (
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shrink-0">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => orderMutation.mutate()}
            disabled={orderMutation.isPending}
            data-testid="button-place-order"
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {orderMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Traitement en cours...
              </>
            ) : (
              `Confirmer et payer ${formatPrice(netTotal)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
