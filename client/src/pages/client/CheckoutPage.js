import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCart } from "../../lib/cart";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { authFetch, apiRequest, queryClient, resolveImg } from "../../lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import ClientNav from "../../components/ClientNav";
import { Banknote, Smartphone, Wallet, CreditCard, Tag, Gift, Star, Receipt, ArrowLeft, Check, Loader2, MapPin, ChevronRight, ShoppingBag, Clock, Shield, Sparkles, X, User } from "lucide-react";
import { formatPrice } from "../../lib/utils";
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
    const [step, setStep] = useState("checkout");
    const [checkoutData, setCheckoutData] = useState({
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
    const { data: settings } = useQuery({
        queryKey: ["/api/settings"],
    });
    useEffect(() => {
        const raw = sessionStorage.getItem("maweja_checkout");
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                setCheckoutData(parsed);
            }
            catch { }
        }
    }, []);
    useEffect(() => {
        if (user) {
            setOrderName(user.name || "");
            setOrderPhone(user.phone || "");
        }
    }, [user]);
    if (!user) {
        navigate("/login");
        return null;
    }
    if (items.length === 0) {
        navigate("/cart");
        return null;
    }
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
        if (!promoInput.trim())
            return;
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
        }
        catch {
            toast({ title: "Erreur", description: "Impossible de valider le code", variant: "destructive" });
        }
        finally {
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
        onSuccess: (order) => {
            clearCart();
            sessionStorage.removeItem("maweja_checkout");
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            toast({ title: "Commande confirmee!", description: `Commande ${order.orderNumber} passee avec succes` });
            navigate("/orders");
        },
        onError: (err) => {
            toast({ title: "Erreur", description: err.message || "Erreur lors de la commande", variant: "destructive" });
        },
    });
    if (step === "summary") {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-950", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4 pb-40", children: [_jsxs("button", { onClick: () => setStep("checkout"), "data-testid": "button-back-checkout", className: "flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-5", children: [_jsx(ArrowLeft, { size: 16 }), _jsx("span", { children: "Modifier ma commande" })] }), _jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-200 dark:shadow-red-900/40", children: _jsx(ShoppingBag, { size: 28, className: "text-white" }) }), _jsx("h1", { className: "text-xl font-black text-gray-900 dark:text-white", children: "Recapitulatif de commande" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: "Verifiez votre commande avant de confirmer" })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-4", children: [_jsx("div", { className: "bg-gradient-to-r from-red-600 to-red-500 px-5 py-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Receipt, { size: 16, className: "text-white/80" }), _jsxs("span", { className: "text-white font-bold text-sm", children: ["Articles (", itemCount, ")"] })] }), _jsx("span", { className: "text-white/80 text-xs font-semibold tracking-widest", children: "MAWEJA" })] }) }), _jsx("div", { className: "p-5 space-y-3", children: items.map((item) => (_jsxs("div", { className: "flex items-center gap-3", "data-testid": `summary-item-${item.id}`, children: [item.image && (_jsx("img", { src: resolveImg(item.image), alt: item.name, className: "w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100 dark:border-gray-800" })), !item.image && (_jsx("div", { className: "w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0", children: _jsx(ShoppingBag, { size: 16, className: "text-gray-400" }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white truncate", children: item.name }), _jsxs("p", { className: "text-xs text-gray-400", children: [item.quantity, " x ", formatPrice(item.price)] })] }), _jsx("span", { className: "text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap", children: formatPrice(item.price * item.quantity) })] }, item.id))) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2", children: [_jsx(User, { size: 15, className: "text-red-600" }), "Destinataire"] }), _jsx("p", { className: "text-xs text-gray-400 mb-3", children: "Vous pouvez modifier le nom et le numero pour commander pour une autre personne" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block", children: "Nom complet" }), _jsx("input", { type: "text", value: orderName, onChange: (e) => setOrderName(e.target.value), "data-testid": "input-order-name", className: "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block", children: "Numero de telephone" }), _jsx("input", { type: "tel", value: orderPhone, onChange: (e) => setOrderPhone(e.target.value), "data-testid": "input-order-phone", className: "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2", children: [_jsx(MapPin, { size: 15, className: "text-red-600" }), "Livraison"] }), _jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300", children: checkoutData.deliveryAddress || "Adresse non specifiee" }), checkoutData.notes && (_jsxs("p", { className: "text-xs text-gray-400 mt-1 italic", children: ["Note: ", checkoutData.notes] }))] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2", children: [selectedPayment && _jsx(selectedPayment.Icon, { size: 15, className: "text-red-600" }), "Paiement"] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: selectedPayment?.label }), _jsx("span", { className: "text-xs text-gray-400", children: selectedPayment?.desc })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(Receipt, { size: 15, className: "text-red-600" }), "Detail du prix"] }), _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("span", { className: "text-gray-500 dark:text-gray-400", children: ["Sous-total (", itemCount, " articles)"] }), _jsx("span", { className: "text-gray-900 dark:text-white font-medium", children: formatPrice(subtotal) })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "Frais de livraison" }), deliveryFee === 0 ? (_jsxs("span", { className: "text-green-600 font-medium flex items-center gap-1", children: [_jsx(Sparkles, { size: 12 }), "Gratuit"] })) : (_jsx("span", { className: "text-gray-900 dark:text-white font-medium", children: formatPrice(deliveryFee) }))] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "Frais de service" }), _jsx("span", { className: "text-gray-900 dark:text-white font-medium", children: formatPrice(serviceFee) })] }), effectivePromoDiscount > 0 && (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("span", { className: "text-green-600 flex items-center gap-1", children: [_jsx(Tag, { size: 12 }), "Promo ", promoCode] }), _jsxs("span", { className: "text-green-600 font-bold", children: ["-", formatPrice(effectivePromoDiscount)] })] })), pointsDiscount > 0 && (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("span", { className: "text-green-600 flex items-center gap-1", children: [_jsx(Gift, { size: 12 }), "Points fidelite"] }), _jsxs("span", { className: "text-green-600 font-bold", children: ["-", formatPrice(pointsDiscount)] })] })), _jsx("div", { className: "border-t-2 border-dashed border-red-200 dark:border-red-900/40 mt-1 pt-3", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-base font-black text-gray-900 dark:text-white", children: "TOTAL A PAYER" }), _jsx("span", { className: "text-2xl font-black text-red-600", "data-testid": "text-net-total-summary", children: formatPrice(netTotal) })] }) })] })] }), _jsxs("div", { className: "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 mb-4 flex items-start gap-3", children: [_jsx(Clock, { size: 16, className: "text-amber-600 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "text-amber-800 dark:text-amber-400 font-semibold text-xs", children: "Temps de livraison estim\u00E9" }), _jsx("p", { className: "text-amber-700 dark:text-amber-500 text-xs mt-0.5", children: "25 - 40 minutes apres confirmation" })] })] }), _jsxs("div", { className: "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 rounded-2xl p-4 mb-6 flex items-start gap-3", children: [_jsx(Shield, { size: 16, className: "text-green-600 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "text-green-800 dark:text-green-400 font-semibold text-xs", children: "Paiement securise" }), _jsx("p", { className: "text-green-700 dark:text-green-500 text-xs mt-0.5", children: "Votre commande est protegee par MAWEJA" })] })] })] }), _jsx("div", { className: "fixed bottom-16 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 z-50", children: _jsxs("div", { className: "max-w-lg mx-auto space-y-2", children: [_jsx("button", { onClick: () => orderMutation.mutate(), disabled: orderMutation.isPending, "data-testid": "button-confirm-order", className: "w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-red-200 dark:shadow-red-900/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]", children: orderMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 18, className: "animate-spin" }), "Traitement en cours..."] })) : (_jsxs(_Fragment, { children: [_jsx(Check, { size: 18 }), "Confirmer et payer ", formatPrice(netTotal)] })) }), _jsxs("button", { onClick: () => setStep("checkout"), disabled: orderMutation.isPending, className: "w-full py-2.5 rounded-2xl text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center gap-1", children: [_jsx(X, { size: 14 }), "Modifier la commande"] })] }) })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-950 pb-40", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("button", { onClick: () => navigate("/cart"), "data-testid": "button-back-cart", className: "flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-4", children: [_jsx(ArrowLeft, { size: 16 }), _jsx("span", { children: "Retour au panier" })] }), _jsxs("div", { className: "flex items-center gap-3 mb-5", children: [_jsx("div", { className: "flex-1 h-1.5 rounded-full bg-red-600" }), _jsx("span", { className: "text-xs font-bold text-red-600 whitespace-nowrap", children: "Etape 1/2 \u2014 Options" }), _jsx("div", { className: "flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800" })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-4 flex-wrap", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Receipt, { size: 20, className: "text-red-600" }), _jsx("h2", { className: "text-lg font-bold text-gray-900 dark:text-white", children: "Facture" })] }), _jsx("span", { className: "text-xs font-semibold text-red-600 tracking-widest", children: "MAWEJA" })] }), _jsx("div", { className: "space-y-2 mb-3", children: items.map((item) => (_jsxs("div", { className: "flex items-center justify-between gap-2 text-sm", "data-testid": `invoice-item-${item.id}`, children: [_jsx("span", { className: "text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate", children: item.name }), _jsxs("span", { className: "text-gray-400 dark:text-gray-500 whitespace-nowrap", children: [item.quantity, " x ", formatPrice(item.price)] }), _jsx("span", { className: "font-medium text-gray-900 dark:text-white whitespace-nowrap", children: formatPrice(item.price * item.quantity) })] }, item.id))) }), _jsxs("div", { className: "border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "Sous-total" }), _jsx("span", { className: "text-gray-900 dark:text-white", children: formatPrice(subtotal) })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "Frais de livraison" }), _jsx("span", { className: deliveryFee === 0 ? "text-green-600 line-through" : "text-gray-900 dark:text-white", children: formatPrice(baseDeliveryFee) })] }), deliveryFee === 0 && (_jsx("div", { className: "flex justify-end", children: _jsx("span", { className: "text-xs text-green-600 font-medium", children: "Livraison gratuite (promo)" }) })), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "Frais de service" }), _jsx("span", { className: "text-gray-900 dark:text-white", children: formatPrice(serviceFee) })] }), effectivePromoDiscount > 0 && (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-green-600", children: "Reduction promo" }), _jsxs("span", { className: "text-green-600 font-medium", children: ["-", formatPrice(effectivePromoDiscount)] })] })), pointsDiscount > 0 && (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-green-600", children: "Points fidelite" }), _jsxs("span", { className: "text-green-600 font-medium", children: ["-", formatPrice(pointsDiscount)] })] }))] }), _jsx("div", { className: "border-t-2 border-red-600 mt-3 pt-3", children: _jsxs("div", { className: "flex justify-between items-center gap-2", children: [_jsx("span", { className: "text-base font-bold text-gray-900 dark:text-white", children: "TOTAL NET A PAYER" }), _jsx("span", { className: "text-xl font-bold text-red-600", "data-testid": "text-net-total", children: formatPrice(netTotal) })] }) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Tag, { size: 18, className: "text-red-600" }), _jsx("h3", { className: "font-bold text-sm text-gray-900 dark:text-white", children: "Code Promo" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: promoInput, onChange: (e) => setPromoInput(e.target.value), placeholder: "Entrez votre code", "data-testid": "input-promo-code", className: "flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500", disabled: !!promoCode }), _jsx("button", { onClick: handleApplyPromo, disabled: promoLoading || !!promoCode, "data-testid": "button-apply-promo", className: "px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50", children: promoLoading ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : "Appliquer" })] }), promoCode && (_jsxs("div", { className: "mt-3 flex items-center gap-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2", "data-testid": "promo-success", children: [_jsx(Check, { size: 14, className: "text-green-600" }), _jsxs("span", { className: "text-green-700 dark:text-green-400 text-xs font-medium", children: [promoDescription, promoType === "delivery" ? "" : ` (-${formatPrice(effectivePromoDiscount)})`] })] }))] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Star, { size: 18, className: "text-red-600" }), _jsx("h3", { className: "font-bold text-sm text-gray-900 dark:text-white", children: "Points de fidelite" })] }), _jsxs("div", { className: "flex items-center justify-between gap-2 mb-2 flex-wrap", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-sm text-gray-700 dark:text-gray-300", "data-testid": "text-loyalty-points", children: [user.loyaltyPoints, " points disponibles"] }), _jsxs("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: ["= ", formatPrice(pointsValue)] })] }), _jsxs("label", { className: "flex items-center gap-2 cursor-pointer", "data-testid": "toggle-use-points", children: [_jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Utiliser" }), _jsx("div", { className: `relative w-10 h-5 rounded-full transition-colors ${usePoints ? "bg-red-600" : "bg-gray-300 dark:bg-gray-600"}`, onClick: () => setUsePoints(!usePoints), children: _jsx("div", { className: `absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${usePoints ? "translate-x-5" : "translate-x-0"}` }) })] })] }), usePoints && pointsDiscount > 0 && (_jsx("div", { className: "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2", children: _jsxs("p", { className: "text-green-700 dark:text-green-400 text-xs font-medium", "data-testid": "text-points-discount", children: [_jsx(Gift, { size: 12, className: "inline mr-1" }), "-", formatPrice(pointsDiscount), " appliques"] }) }))] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(CreditCard, { size: 18, className: "text-red-600" }), _jsx("h3", { className: "font-bold text-sm text-gray-900 dark:text-white", children: "Mode de paiement" })] }), _jsx("div", { className: "space-y-2", children: paymentOptions.map((opt) => {
                                    const isWallet = opt.id === "wallet";
                                    const disabled = isWallet && walletInsufficient;
                                    return (_jsxs("button", { onClick: () => !disabled && setPaymentMethod(opt.id), disabled: disabled, "data-testid": `payment-${opt.id}`, className: `w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${paymentMethod === opt.id
                                            ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                                            : disabled
                                                ? "border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed"
                                                : "border-gray-100 dark:border-gray-800"}`, children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0", children: _jsx(opt.Icon, { size: 18, className: "text-gray-600 dark:text-gray-400" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-semibold text-sm text-gray-900 dark:text-white", children: opt.label }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: isWallet ? `Solde: ${formatPrice(user.walletBalance || 0)}` : opt.desc }), isWallet && walletInsufficient && (_jsx("p", { className: "text-xs text-red-500 mt-0.5", children: "Solde insuffisant" }))] }), paymentMethod === opt.id && (_jsx("div", { className: "w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shrink-0", children: _jsx(Check, { size: 14, className: "text-white" }) }))] }, opt.id));
                                }) })] })] }), _jsx("div", { className: "fixed bottom-16 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 z-50", children: _jsx("div", { className: "max-w-lg mx-auto", children: _jsxs("button", { onClick: () => setStep("summary"), "data-testid": "button-place-order", className: "w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]", children: ["Voir le recapitulatif", _jsx(ChevronRight, { size: 18 })] }) }) })] }));
}
//# sourceMappingURL=CheckoutPage.js.map