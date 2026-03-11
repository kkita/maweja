import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-40", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("button", { onClick: () => navigate("/cart"), "data-testid": "button-back-cart", className: "flex items-center gap-2 text-gray-500 text-sm mb-4", children: [_jsx(ArrowLeft, { size: 16 }), _jsx("span", { children: "Retour au panier" })] }), _jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-4 flex-wrap", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Receipt, { size: 20, className: "text-red-600" }), _jsx("h2", { className: "text-lg font-bold text-gray-900", children: "Facture" })] }), _jsx("span", { className: "text-xs font-semibold text-red-600 tracking-widest", children: "MAWEJA" })] }), _jsx("div", { className: "space-y-2 mb-3", children: items.map((item) => (_jsxs("div", { className: "flex items-center justify-between gap-2 text-sm", "data-testid": `invoice-item-${item.id}`, children: [_jsx("span", { className: "text-gray-700 flex-1 min-w-0 truncate", children: item.name }), _jsxs("span", { className: "text-gray-400 whitespace-nowrap", children: [item.quantity, " x ", formatPrice(item.price)] }), _jsx("span", { className: "font-medium text-gray-900 whitespace-nowrap", children: formatPrice(item.price * item.quantity) })] }, item.id))) }), _jsxs("div", { className: "border-t border-gray-100 pt-3 space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Sous-total" }), _jsx("span", { className: "text-gray-900", children: formatPrice(subtotal) })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Frais de livraison" }), _jsx("span", { className: deliveryFee === 0 ? "text-green-600 line-through" : "text-gray-900", children: deliveryFee === 0 ? formatPrice(baseDeliveryFee) : formatPrice(deliveryFee) })] }), deliveryFee === 0 && (_jsx("div", { className: "flex justify-end", children: _jsx("span", { className: "text-xs text-green-600 font-medium", children: "Livraison gratuite (promo)" }) })), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Taxes (5%)" }), _jsx("span", { className: "text-gray-900", children: formatPrice(taxAmount) })] }), effectivePromoDiscount > 0 && (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-green-600", children: "Reduction promo" }), _jsxs("span", { className: "text-green-600 font-medium", children: ["-", formatPrice(effectivePromoDiscount)] })] })), pointsDiscount > 0 && (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-green-600", children: "Points fidelite" }), _jsxs("span", { className: "text-green-600 font-medium", children: ["-", formatPrice(pointsDiscount)] })] }))] }), _jsx("div", { className: "border-t-2 border-red-600 mt-3 pt-3", children: _jsxs("div", { className: "flex justify-between items-center gap-2", children: [_jsx("span", { className: "text-base font-bold text-gray-900", children: "TOTAL NET A PAYER" }), _jsx("span", { className: "text-xl font-bold text-red-600", "data-testid": "text-net-total", children: formatPrice(netTotal) })] }) })] }), _jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Tag, { size: 18, className: "text-red-600" }), _jsx("h3", { className: "font-bold text-sm text-gray-900", children: "Code Promo" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: promoInput, onChange: (e) => setPromoInput(e.target.value), placeholder: "Entrez votre code", "data-testid": "input-promo-code", className: "flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500", disabled: !!promoCode }), _jsx("button", { onClick: handleApplyPromo, disabled: promoLoading || !!promoCode, "data-testid": "button-apply-promo", className: "px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50", children: promoLoading ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : "Appliquer" })] }), promoCode && (_jsxs("div", { className: "mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2", "data-testid": "promo-success", children: [_jsx(Check, { size: 14, className: "text-green-600" }), _jsxs("span", { className: "text-green-700 text-xs font-medium", children: [promoDescription, promoType === "delivery" ? "" : ` (-${formatPrice(effectivePromoDiscount)})`] })] }))] }), _jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Star, { size: 18, className: "text-red-600" }), _jsx("h3", { className: "font-bold text-sm text-gray-900", children: "Points de fidelite" })] }), _jsxs("div", { className: "flex items-center justify-between gap-2 mb-2 flex-wrap", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-sm text-gray-700", "data-testid": "text-loyalty-points", children: [user.loyaltyPoints, " points disponibles"] }), _jsxs("p", { className: "text-xs text-gray-400", children: ["= ", formatPrice(pointsValue)] })] }), _jsxs("label", { className: "flex items-center gap-2 cursor-pointer", "data-testid": "toggle-use-points", children: [_jsx("span", { className: "text-xs text-gray-500", children: "Utiliser" }), _jsx("div", { className: `relative w-10 h-5 rounded-full transition-colors ${usePoints ? "bg-red-600" : "bg-gray-300"}`, onClick: () => setUsePoints(!usePoints), children: _jsx("div", { className: `absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${usePoints ? "translate-x-5" : "translate-x-0"}` }) })] })] }), usePoints && pointsDiscount > 0 && (_jsx("div", { className: "bg-green-50 border border-green-200 rounded-xl px-3 py-2", children: _jsxs("p", { className: "text-green-700 text-xs font-medium", "data-testid": "text-points-discount", children: [_jsx(Gift, { size: 12, className: "inline mr-1" }), "-", formatPrice(pointsDiscount), " appliques"] }) }))] }), _jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(CreditCard, { size: 18, className: "text-red-600" }), _jsx("h3", { className: "font-bold text-sm text-gray-900", children: "Mode de paiement" })] }), _jsx("div", { className: "space-y-2", children: paymentOptions.map((opt) => {
                                    const isWallet = opt.id === "wallet";
                                    const disabled = isWallet && walletInsufficient;
                                    return (_jsxs("button", { onClick: () => !disabled && setPaymentMethod(opt.id), disabled: disabled, "data-testid": `payment-${opt.id}`, className: `w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${paymentMethod === opt.id
                                            ? "border-red-500 bg-red-50"
                                            : disabled
                                                ? "border-gray-100 opacity-50 cursor-not-allowed"
                                                : "border-gray-100"}`, children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0", children: _jsx(opt.Icon, { size: 18, className: "text-gray-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-semibold text-sm text-gray-900", children: opt.label }), _jsx("p", { className: "text-xs text-gray-500", children: isWallet ? `Solde: ${formatPrice(user.walletBalance || 0)}` : opt.desc }), isWallet && walletInsufficient && (_jsx("p", { className: "text-xs text-red-500 mt-0.5", children: "Solde insuffisant" }))] }), paymentMethod === opt.id && (_jsx("div", { className: "w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shrink-0", children: _jsx(Check, { size: 14, className: "text-white" }) }))] }, opt.id));
                                }) })] })] }), _jsx("div", { className: "fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50", children: _jsx("div", { className: "max-w-lg mx-auto", children: _jsx("button", { onClick: () => orderMutation.mutate(), disabled: orderMutation.isPending, "data-testid": "button-place-order", className: "w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2", children: orderMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 18, className: "animate-spin" }), "Traitement en cours..."] })) : (`Confirmer et payer ${formatPrice(netTotal)}`) }) }) })] }));
}
//# sourceMappingURL=CheckoutPage.js.map