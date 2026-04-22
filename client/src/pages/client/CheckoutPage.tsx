import { useLocation } from "wouter";
import ClientNav from "../../components/ClientNav";
import {
  Tag, Gift, Star, Receipt, ArrowLeft, Check, Loader2, ChevronRight, Award,
} from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { useCheckout } from "../../hooks/use-checkout";
import OrderSummaryStep from "../../components/checkout/OrderSummaryStep";

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const checkout = useCheckout();
  const {
    user, items, itemCount, step, setStep, checkoutData,
    paymentMethod, setPaymentMethod, paymentOptions, selectedPayment,
    promoCode, promoInput, setPromoInput, promoDescription, promoType, promoLoading,
    usePoints, setUsePoints, useLoyaltyCredit, setUseLoyaltyCredit, bestCredit,
    subtotal, zoneResult, baseDeliveryFee, deliveryFee, serviceFee,
    effectivePromoDiscount, loyaltyCreditDiscount, pointsValue, pointsDiscount, netTotal,
    walletInsufficient, handleApplyPromo,
  } = checkout;

  if (!user) { navigate("/login"); return null; }
  if (items.length === 0) { navigate("/cart"); return null; }

  if (step === "summary") return <OrderSummaryStep checkout={checkout} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-40">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <button onClick={() => navigate("/cart")} data-testid="button-back-cart"
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-4">
          <ArrowLeft size={16} /><span>Retour au panier</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-1.5 rounded-full bg-red-600" />
          <span className="text-xs font-bold text-red-600 whitespace-nowrap">Etape 1/2 — Options</span>
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Invoice card */}
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
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 dark:text-gray-400">Frais de livraison</span>
                {zoneResult.zone && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: zoneResult.zone.color }}>
                    {zoneResult.zone.name}
                  </span>
                )}
              </div>
              <span className={deliveryFee === 0 && promoType === "delivery" ? "text-green-600 line-through" : "text-gray-900 dark:text-white"}>
                {formatPrice(baseDeliveryFee)}
              </span>
            </div>
            {deliveryFee === 0 && promoType === "delivery" && (
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
            {loyaltyCreditDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-yellow-600 flex items-center gap-1"><Gift size={12} />Crédit fidélité</span>
                <span className="text-yellow-600 font-medium">-{formatPrice(loyaltyCreditDiscount)}</span>
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

        {/* Promo code */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={18} className="text-red-600" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Code Promo</h3>
          </div>
          <div className="flex gap-2">
            <input type="text" value={promoInput} onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Entrez votre code" data-testid="input-promo-code"
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={!!promoCode} />
            <button onClick={handleApplyPromo} disabled={promoLoading || !!promoCode} data-testid="button-apply-promo"
              className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
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

        {/* Loyalty credit */}
        {bestCredit && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={18} className="text-yellow-600" />
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Crédit fidélité</h3>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400" data-testid="text-loyalty-credit">{formatPrice(bestCredit.amount)} disponible</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Expire le {new Date(bestCredit.expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                </p>
              </div>
              <div
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${useLoyaltyCredit ? "bg-yellow-500" : "bg-gray-300 dark:bg-gray-600"}`}
                onClick={() => setUseLoyaltyCredit(!useLoyaltyCredit)}
                data-testid="toggle-loyalty-credit"
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useLoyaltyCredit ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </div>
            {useLoyaltyCredit && loyaltyCreditDiscount > 0 && (
              <div className="mt-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl px-3 py-2">
                <p className="text-yellow-700 dark:text-yellow-400 text-xs font-medium" data-testid="text-credit-applied">
                  <Gift size={12} className="inline mr-1" />
                  -{formatPrice(loyaltyCreditDiscount)} de crédit appliqué
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loyalty points */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} className="text-red-600" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Points de fidelite</h3>
          </div>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-loyalty-points">{user.loyaltyPoints} points disponibles</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">= {formatPrice(pointsValue)} • Attribués après livraison</p>
            </div>
            {user.loyaltyPoints > 0 && (
              <div
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${usePoints ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"}`}
                onClick={() => setUsePoints(!usePoints)}
                data-testid="toggle-use-points"
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${usePoints ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            )}
          </div>
          {usePoints && pointsDiscount > 0 && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
              <p className="text-green-700 dark:text-green-400 text-xs font-medium" data-testid="text-points-discount">
                <Gift size={12} className="inline mr-1" />
                -{formatPrice(pointsDiscount)} appliques
              </p>
            </div>
          )}
          <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <Award size={11} className="flex-shrink-0" />
              Vous gagnerez <span className="font-bold text-gray-600 dark:text-gray-300">+{Math.floor(subtotal)} points</span> après livraison
            </p>
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Receipt size={18} className="text-red-600" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Mode de paiement</h3>
          </div>
          <div className="space-y-2">
            {paymentOptions.map((opt) => {
              const isWallet = opt.id === "wallet";
              const disabled = opt.comingSoon || (isWallet && walletInsufficient);
              return (
                <button key={opt.id} onClick={() => !disabled && setPaymentMethod(opt.id)}
                  disabled={disabled} data-testid={`payment-${opt.id}`}
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
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</p>
                      {opt.comingSoon && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                          Bientôt
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isWallet ? `Solde: ${formatPrice(user.walletBalance || 0)}` : opt.desc}
                    </p>
                    {isWallet && walletInsufficient && !opt.comingSoon && <p className="text-xs text-red-500 mt-0.5">Solde insuffisant</p>}
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
          <button onClick={() => setStep("summary")} data-testid="button-place-order"
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
            Voir le recapitulatif
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
