import ClientNav from "../ClientNav";
import {
  ArrowLeft, ShoppingBag, Receipt, User, MapPin, Check, Loader2,
  Sparkles, Tag, Gift, Clock, Shield, X,
} from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { formatZoneFee } from "@shared/deliveryZones";
import { resolveImg } from "../../lib/queryClient";
import type { CheckoutHook } from "../../hooks/use-checkout";

interface OrderSummaryStepProps {
  checkout: CheckoutHook;
}

export default function OrderSummaryStep({ checkout }: OrderSummaryStepProps) {
  const {
    items, itemCount, setStep, orderName, setOrderName, orderPhone, setOrderPhone,
    checkoutData, selectedPayment, subtotal, deliveryFee, baseDeliveryFee, serviceFee, netTotal,
    promoCode, promoType, effectivePromoDiscount, loyaltyCreditDiscount, pointsDiscount,
    zoneResult, activeZones, orderMutation,
  } = checkout;

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

        {/* Items */}
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
                {item.image ? (
                  <img src={resolveImg(item.image)} alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100 dark:border-gray-800" />
                ) : (
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

        {/* Recipient */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <User size={15} className="text-red-600" />
            Destinataire
          </h3>
          <p className="text-xs text-gray-400 mb-3">Vous pouvez modifier le nom et le numero pour commander pour une autre personne</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Nom complet</label>
              <input type="text" value={orderName} onChange={(e) => setOrderName(e.target.value)}
                data-testid="input-order-name"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Numero de telephone</label>
              <input type="tel" value={orderPhone} onChange={(e) => setOrderPhone(e.target.value)}
                data-testid="input-order-phone"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <MapPin size={15} className="text-red-600" />
            Livraison
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">{checkoutData.deliveryAddress || "Adresse non specifiee"}</p>
          {checkoutData.notes && <p className="text-xs text-gray-400 mt-1 italic">Note: {checkoutData.notes}</p>}
        </div>

        {/* Payment */}
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

        {/* Price breakdown */}
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
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 dark:text-gray-400">Frais de livraison</span>
                {zoneResult.zone && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: zoneResult.zone.color }} data-testid="badge-delivery-zone">
                    {zoneResult.zone.name}
                  </span>
                )}
              </div>
              {deliveryFee === 0 && promoType === "delivery" ? (
                <span className="text-green-600 font-medium flex items-center gap-1"><Sparkles size={12} />Gratuit</span>
              ) : !zoneResult.allowed ? (
                <span className="text-red-500 font-medium text-xs">Hors zone</span>
              ) : (
                <span className="text-gray-900 dark:text-white font-medium">{formatPrice(deliveryFee)}</span>
              )}
            </div>
            {!zoneResult.allowed && checkoutData.deliveryAddress && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 mt-1" data-testid="zone-warning">
                <p className="text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5"><MapPin size={12} />Livraison non disponible dans cette zone</p>
                <p className="text-red-500/70 dark:text-red-400/60 text-[10px] mt-1">Nous livrons uniquement dans les zones couvertes de Kinshasa.</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {activeZones.map(z => (
                    <span key={z.id} className="text-[9px] px-2 py-0.5 rounded-full text-white font-bold" style={{ background: z.color }}>{z.name}: {formatZoneFee(z.fee)}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Frais de service</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatPrice(serviceFee)}</span>
            </div>
            {effectivePromoDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 flex items-center gap-1"><Tag size={12} />Promo {promoCode}</span>
                <span className="text-green-600 font-bold">-{formatPrice(effectivePromoDiscount)}</span>
              </div>
            )}
            {loyaltyCreditDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-yellow-600 flex items-center gap-1"><Gift size={12} />Crédit fidélité</span>
                <span className="text-yellow-600 font-bold">-{formatPrice(loyaltyCreditDiscount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 flex items-center gap-1"><Gift size={12} />Points fidelite</span>
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
            disabled={orderMutation.isPending || !zoneResult.allowed}
            data-testid="button-confirm-order"
            className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] ${
              !zoneResult.allowed
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-none cursor-not-allowed"
                : "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-200 dark:shadow-red-900/30"
            }`}
          >
            {orderMutation.isPending ? (
              <><Loader2 size={18} className="animate-spin" />Traitement en cours...</>
            ) : !zoneResult.allowed ? (
              <><MapPin size={18} />Adresse hors zone de livraison</>
            ) : (
              <><Check size={18} />Confirmer et payer {formatPrice(netTotal)}</>
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
