import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { useToast } from "./use-toast";
import { authFetch, apiRequest, queryClient, authFetchJson, STALE } from "../lib/queryClient";
import { detectZone, type DeliveryZoneData, type ZoneResult } from "@shared/deliveryZones";
import { Banknote, Smartphone, Wallet, CreditCard } from "lucide-react";

export interface LoyaltyCredit {
  id: number;
  amount: number;
  isActive: boolean;
  expiresAt: string;
}

export interface CheckoutData {
  deliveryAddress: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  notes: string;
}

export const paymentOptions = [
  { id: "cash",        label: "Cash",              desc: "Paiement a la livraison",        Icon: Banknote   },
  { id: "mobile_money",label: "Mobile Money",      desc: "M-Pesa / Orange Money / Airtel", Icon: Smartphone },
  { id: "wallet",      label: "Wallet MAWEJA",     desc: "Solde du portefeuille",          Icon: Wallet     },
  { id: "google_pay",  label: "Google Pay",        desc: "Paiement Google",                Icon: CreditCard },
  { id: "pos",         label: "POS",               desc: "Terminal de paiement",           Icon: CreditCard },
  { id: "illico_cash", label: "IllicoCash",        desc: "Paiement IllicoCash",            Icon: Banknote   },
  { id: "card",        label: "Carte de Credit",   desc: "Visa, Mastercard",               Icon: CreditCard },
];

export function useCheckout() {
  const [, navigate] = useLocation();
  const { items, total, itemCount, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"checkout" | "summary">("checkout");
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    deliveryAddress: "", deliveryLat: null, deliveryLng: null, notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [promoCode, setPromoCode] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDescription, setPromoDescription] = useState("");
  const [promoType, setPromoType] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [useLoyaltyCredit, setUseLoyaltyCredit] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [orderName, setOrderName] = useState("");
  const [orderPhone, setOrderPhone] = useState("");

  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"], staleTime: STALE.static });
  const { data: dbZones = [] } = useQuery<DeliveryZoneData[]>({ queryKey: ["/api/delivery-zones"], staleTime: STALE.static });
  const { data: loyaltyCredits = [] } = useQuery<LoyaltyCredit[]>({
    queryKey: ["/api/loyalty/credits"],
    queryFn: () => authFetchJson("/api/loyalty/credits"),
    enabled: !!user,
  });

  const activeCredits = loyaltyCredits.filter(c => c.isActive);
  const bestCredit = activeCredits.length > 0
    ? activeCredits.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())[0]
    : null;

  useEffect(() => {
    const raw = sessionStorage.getItem("maweja_checkout");
    if (raw) { try { setCheckoutData(JSON.parse(raw)); } catch {} }
  }, []);

  useEffect(() => {
    if (user) { setOrderName(user.name || ""); setOrderPhone(user.phone || ""); }
  }, [user]);

  const subtotal = total;
  const activeZones = dbZones.filter(z => z.isActive);
  const zoneResult: ZoneResult = detectZone(checkoutData.deliveryAddress, activeZones);
  const baseDeliveryFee = zoneResult.allowed ? zoneResult.fee : 0;
  const deliveryFee = promoType === "delivery" ? 0 : baseDeliveryFee;
  const serviceFee = parseFloat(settings?.service_fee || "0.76");
  const effectivePromoDiscount = promoType === "delivery" ? 0 : promoDiscount;
  const totalBeforeDiscounts = parseFloat((subtotal + deliveryFee + serviceFee).toFixed(2));
  const remainingAfterPromo = Math.max(0, totalBeforeDiscounts - effectivePromoDiscount);
  const loyaltyCreditDiscount = useLoyaltyCredit && bestCredit ? Math.min(bestCredit.amount, remainingAfterPromo) : 0;
  const remainingAfterCredit = Math.max(0, remainingAfterPromo - loyaltyCreditDiscount);
  const pointsValue = (user?.loyaltyPoints || 0) * 0.001;
  const pointsDiscount = usePoints ? Math.min(pointsValue, remainingAfterCredit) : 0;
  const netTotal = parseFloat(Math.max(0, remainingAfterCredit - pointsDiscount).toFixed(2));
  const walletInsufficient = (user?.walletBalance || 0) < netTotal;
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
      if (!zoneResult.allowed) throw new Error("Livraison impossible — votre adresse est hors de notre zone de couverture.");
      const res = await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          clientId: user!.id,
          restaurantId: items[0].restaurantId,
          items: JSON.stringify(items.map((i) => ({ name: i.name, qty: i.quantity, price: i.price }))),
          subtotal, deliveryFee, taxAmount: serviceFee, total: netTotal,
          paymentMethod, paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
          deliveryAddress: checkoutData.deliveryAddress || "Adresse non specifiee",
          deliveryLat: checkoutData.deliveryLat, deliveryLng: checkoutData.deliveryLng,
          deliveryZone: zoneResult.zone?.name || null,
          notes: [
            checkoutData.notes || "",
            orderName !== user!.name ? `Destinataire: ${orderName}` : "",
            orderPhone !== user!.phone ? `Tel destinataire: ${orderPhone}` : "",
          ].filter(Boolean).join(" | ") || "",
          orderName: orderName || user!.name, orderPhone: orderPhone || user!.phone,
          promoCode: promoCode || null,
          promoDiscount: effectivePromoDiscount + loyaltyCreditDiscount + pointsDiscount,
          loyaltyCreditId: useLoyaltyCredit && bestCredit ? bestCredit.id : null,
          loyaltyCreditDiscount, pointsUsed: usePoints ? Math.ceil(pointsDiscount / 0.001) : 0,
          status: "pending",
        }),
      });
      return res.json();
    },
    onSuccess: (order: any) => {
      clearCart();
      sessionStorage.removeItem("maweja_checkout");
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/credits"] });
      toast({ title: "Commande confirmee!", description: `Commande ${order.orderNumber} passee avec succes` });
      navigate("/orders");
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la commande", variant: "destructive" });
    },
  });

  return {
    navigate, items, total, itemCount, user, step, setStep,
    checkoutData, paymentMethod, setPaymentMethod, paymentOptions, selectedPayment,
    promoCode, promoInput, setPromoInput, promoDiscount, promoDescription, promoType, promoLoading,
    usePoints, setUsePoints, useLoyaltyCredit, setUseLoyaltyCredit, bestCredit,
    orderName, setOrderName, orderPhone, setOrderPhone,
    subtotal, activeZones, zoneResult, baseDeliveryFee, deliveryFee, serviceFee,
    effectivePromoDiscount, totalBeforeDiscounts, remainingAfterPromo,
    loyaltyCreditDiscount, remainingAfterCredit, pointsValue, pointsDiscount,
    netTotal, walletInsufficient,
    handleApplyPromo, orderMutation,
  };
}

export type CheckoutHook = ReturnType<typeof useCheckout>;
