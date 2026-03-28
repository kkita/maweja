import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCart } from "../../lib/cart";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { authFetch, apiRequest, queryClient, resolveImg } from "../../lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import ClientNav from "../../components/ClientNav";
import {
  Banknote, Smartphone, Wallet, CreditCard, Tag, Gift, Star, Receipt,
  ArrowLeft, Check, Loader2, MapPin, ChevronRight, ShoppingBag,
  Clock, Shield, Sparkles, X, User
} from "lucide-react";
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

  const [step, setStep] = useState<"checkout" | "summary">("checkout");
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
  const [orderName, setOrderName] = useState("");
  const [orderPhone, setOrderPhone] = useState("");

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("maweja_checkout");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setCheckoutData(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (user) {
      setOrderName(user.name || "");
      setOrderPhone(user.phone || "");
    }
  }, [user]);

  if (!user) { navigate("/login"); return null; }
  if (items.length === 0) { navigate("/cart"); return null; }

  const subtotal = total;
  const baseDeliveryFee = settings?.delivery_fee ? parseInt(settings.delivery_fee, 10) : 2500;
  const deliveryFee = promoType === "delivery" ? 0 : baseDeliveryFee;
  const serviceFee = 0.76;
  const effectivePromoDiscount = promoType === "delivery" ? 0 : promoDiscount;
  const totalBeforeDiscounts = Math.round(subtotal + deliveryFee + serviceFee);
  const remainingAfterPromo = totalBeforeDiscounts - effectivePromoDiscount;
  const pointsValue = user.loyaltyPoints * 100;
  const pointsDiscount = usePoints ? Math.min(pointsValue, Math.max(0, remainingAfterPromo)) : 0;
  const netTotal = Math.max(0, totalBeforeDiscounts - effectivePromoDiscount - pointsDiscount);
  const walletInsufficient = (user.walletBalance || 0) < netTotal;

  const selectedPayment = paymentOptions.find(p => p.id === paymentMethod);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const res = await authFetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), subtotal, restaurantId: items[0]?.restaurantId }),
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
          taxAmount: Math.round(serviceFee * 100),
          total: netTotal,
          paymentMethod,
          paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
          deliveryAddress: checkoutData.deliveryAddress || "Adresse non specifiee",
          deliveryLat: checkoutData.deliveryLat,
          deliveryLng: checkoutData.deliveryLng,
          notes: [
            checkoutData.notes || "",
            orderName !== user.name ? `Destinataire: ${orderName}` : "",
            orderPhone !== user.phone ? `Tel destinataire: ${orderPhone}` : "",
          ].filter(Boolean).join(" | ") || "",
          orderName: orderName || user.name,
          orderPhone: orderPhone || user.phone,
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

  if (step === "summary") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <ClientNav />
        <div className="max-w-lg mx-auto px-4 py-4 pb-40">
          <button
            onClick={() => setStep("checkout")}
            data-testid="button-back-checkout"
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-5"
          >
            <ArrowLeft size={16} />
            <span>Modifier ma commande</span>
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-200 dark:shadow-red-900/40">
              <ShoppingBag size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Recapitulatif de commande</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Verifiez votre commande avant de confirmer</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-white/80" />
                  <span className="text-white font-bold text-sm">Articles ({itemCount})</span>
                </div>
                <span className="text-white/80 text-xs font-semibold tracking-widest">MAWEJA</span>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3" data-testid={`summary-item-${item.id}`}>
                  {item.image && (
                    <img src={resolveImg(item.image)} alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100 dark:border-gray-800" />
                  )}
                  {!item.image && (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag size={16} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.quantity} x {formatPrice(item.price)}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <User size={15} className="text-red-600" />
              Destinataire
            </h3>
            <p className="text-xs text-gray-400 mb-3">Vous pouvez modifier le nom et le numero pour commander pour une autre personne</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Nom complet</label>
                <input
                  type="text"
                  value={orderName}
                  onChange={(e) => setOrderName(e.target.value)}
                  data-testid="input-order-name"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Numero de telephone</label>
                <input
                  type="tel"
                  value={orderPhone}
                  onChange={(e) => setOrderPhone(e.target.value)}
                  data-testid="input-order-phone"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <MapPin size={15} className="text-red-600" />
              Livraison
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {checkoutData.deliveryAddress || "Adresse non specifiee"}
            </p>
            {checkoutData.notes && (
              <p className="text-xs text-gray-400 mt-1 italic">Note: {checkoutData.notes}</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              {selectedPayment && <selectedPayment.Icon size={15} className="text-red-600" />}
              Paiement
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">{selectedPayment?.label}</span>
              <span className="text-xs text-gray-400">{selectedPayment?.desc}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Receipt size={15} className="text-red-600" />
              Detail du prix
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Sous-total ({itemCount} articles)</span>
                <span className="text-gray-900 dark:text-white font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Frais de livraison</span>
                {deliveryFee === 0 ? (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <Sparkles size={12} />
                    Gratuit
                  </span>
                ) : (
                  <span className="text-gray-900 dark:text-white font-medium">{formatPrice(deliveryFee)}</span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Frais de service</span>
                <span className="text-gray-900 dark:text-white font-medium">{formatPrice(serviceFee)}</span>
              </div>
              {effectivePromoDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <Tag size={12} />
                    Promo {promoCode}
                  </span>
                  <span className="text-green-600 font-bold">-{formatPrice(effectivePromoDiscount)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <Gift size={12} />
                    Points fidelite
                  </span>
                  <span className="text-green-600 font-bold">-{formatPrice(pointsDiscount)}</span>
                </div>
              )}
              <div className="border-t-2 border-dashed border-red-200 dark:border-red-900/40 mt-1 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-black text-gray-900 dark:text-white">TOTAL A PAYER</span>
                  <span className="text-2xl font-black text-red-600" data-testid="text-net-total-summary">{formatPrice(netTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 mb-4 flex items-start gap-3">
            <Clock size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-800 dark:text-amber-400 font-semibold text-xs">Temps de livraison estimé</p>
              <p className="text-amber-700 dark:text-amber-500 text-xs mt-0.5">25 - 40 minutes apres confirmation</p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Shield size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-green-800 dark:text-green-400 font-semibold text-xs">Paiement securise</p>
              <p className="text-green-700 dark:text-green-500 text-xs mt-0.5">Votre commande est protegee par MAWEJA</p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 z-50">
          <div className="max-w-lg mx-auto space-y-2">
            <button
              onClick={() => orderMutation.mutate()}
              disabled={orderMutation.isPending}
              data-testid="button-confirm-order"
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-red-200 dark:shadow-red-900/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {orderMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Confirmer et payer {formatPrice(netTotal)}
                </>
              )}
            </button>
            <button
              onClick={() => setStep("checkout")}
              disabled={orderMutation.isPending}
              className="w-full py-2.5 rounded-2xl text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center gap-1"
            >
              <X size={14} />
              Modifier la commande
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-40">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <button
          onClick={() => navigate("/cart")}
          data-testid="button-back-cart"
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-4"
        >
          <ArrowLeft size={16} />
          <span>Retour au panier</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-1.5 rounded-full bg-red-600" />
          <span className="text-xs font-bold text-red-600 whitespace-nowrap">Etape 1/2 — Options</span>
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Receipt size={20} className="text-red-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Facture</h2>
            </div>
            <span className="text-xs font-semibold text-red-600 tracking-widest">MAWEJA</span>
          </div>

          <div className="space-y-2 mb-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 text-sm" data-testid={`invoice-item-${item.id}`}>
                <span className="text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">{item.name}</span>
                <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap">{item.quantity} x {formatPrice(item.price)}</span>
                <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
              <span className="text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Frais de livraison</span>
              <span className={deliveryFee === 0 ? "text-green-600 line-through" : "text-gray-900 dark:text-white"}>
                {formatPrice(baseDeliveryFee)}
              </span>
            </div>
            {deliveryFee === 0 && (
              <div className="flex justify-end">
                <span className="text-xs text-green-600 font-medium">Livraison gratuite (promo)</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Frais de service</span>
              <span className="text-gray-900 dark:text-white">{formatPrice(serviceFee)}</span>
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
              <span className="text-base font-bold text-gray-900 dark:text-white">TOTAL NET A PAYER</span>
              <span className="text-xl font-bold text-red-600" data-testid="text-net-total">{formatPrice(netTotal)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={18} className="text-red-600" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Code Promo</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Entrez votre code"
              data-testid="input-promo-code"
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
            <div className="mt-3 flex items-center gap-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2" data-testid="promo-success">
              <Check size={14} className="text-green-600" />
              <span className="text-green-700 dark:text-green-400 text-xs font-medium">{promoDescription}{promoType === "delivery" ? "" : ` (-${formatPrice(effectivePromoDiscount)})`}</span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} className="text-red-600" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Points de fidelite</h3>
          </div>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-loyalty-points">{user.loyaltyPoints} points disponibles</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">= {formatPrice(pointsValue)}</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer" data-testid="toggle-use-points">
              <span className="text-xs text-gray-500 dark:text-gray-400">Utiliser</span>
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${usePoints ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"}`}
                onClick={() => setUsePoints(!usePoints)}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${usePoints ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </label>
          </div>
          {usePoints && pointsDiscount > 0 && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
              <p className="text-green-700 dark:text-green-400 text-xs font-medium" data-testid="text-points-discount">
                <Gift size={12} className="inline mr-1" />
                -{formatPrice(pointsDiscount)} appliques
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={18} className="text-red-600" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Mode de paiement</h3>
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
                      ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                      : disabled
                      ? "border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed"
                      : "border-gray-100 dark:border-gray-800"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <opt.Icon size={18} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setStep("summary")}
            data-testid="button-place-order"
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            Voir le recapitulatif
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
