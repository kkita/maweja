import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "../../lib/cart";
import { useAuth } from "../../lib/auth";
import { authFetch } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import { MapPin, ShoppingBag, Plus, Minus, Trash2, ArrowRight, User, Mail, Phone, MessageSquare, ChevronRight, } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { useToast } from "../../hooks/use-toast";
export default function CartPage() {
    const [, navigate] = useLocation();
    const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
    const { user } = useAuth();
    const { toast } = useToast();
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [manualAddress, setManualAddress] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const { data: savedAddresses } = useQuery({
        queryKey: ["/api/saved-addresses"],
        enabled: !!user,
        queryFn: async () => {
            const res = await authFetch("/api/saved-addresses");
            if (!res.ok)
                return [];
            return res.json();
        },
    });
    const defaultAddress = savedAddresses?.find((a) => a.isDefault) || savedAddresses?.[0] || null;
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
        return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 flex flex-col items-center justify-center pt-32", children: [_jsx("div", { className: "w-24 h-24 bg-red-50 rounded-2xl flex items-center justify-center mb-4", children: _jsx(ShoppingBag, { size: 40, className: "text-red-300" }) }), _jsx("h2", { className: "text-xl font-bold text-gray-900", "data-testid": "text-empty-cart", children: "Votre panier est vide" }), _jsx("p", { className: "text-gray-500 text-sm mt-2 text-center", children: "Parcourez nos restaurants et ajoutez des plats" }), _jsx("button", { onClick: () => navigate("/"), "data-testid": "button-browse", className: "mt-6 bg-red-600 text-white px-8 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-red-200", children: "Decouvrir les restaurants" })] })] }));
    }
    const restaurantId = items[0].restaurantId;
    const restaurantName = items[0].restaurantName;
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-48", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", "data-testid": "text-cart-title", children: "Mon Panier" }), _jsx("span", { className: "bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full", "data-testid": "badge-item-count", children: itemCount })] }), _jsxs("button", { onClick: clearCart, className: "text-red-600 text-xs font-semibold flex items-center gap-1", "data-testid": "button-clear-cart", children: [_jsx(Trash2, { size: 14 }), " Vider le panier"] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm", children: [_jsxs("div", { className: "px-4 py-3 bg-red-50 rounded-t-2xl border-b border-red-100 flex items-center gap-2", children: [_jsx(ShoppingBag, { size: 16, className: "text-red-600" }), _jsx("p", { className: "text-sm font-semibold text-red-700", "data-testid": "text-restaurant-name", children: restaurantName })] }), _jsx("div", { className: "divide-y divide-gray-50", children: items.map((item) => (_jsxs("div", { className: "p-4 flex gap-3", "data-testid": `cart-item-${item.id}`, children: [_jsx("img", { src: item.image, alt: item.name, className: "w-16 h-16 rounded-xl object-cover flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("h4", { className: "font-semibold text-sm text-gray-900 truncate", children: item.name }), _jsx("button", { onClick: () => removeItem(item.id), className: "text-gray-300 hover:text-red-500 flex-shrink-0", "data-testid": `remove-${item.id}`, children: _jsx(Trash2, { size: 14 }) })] }), _jsxs("p", { className: "text-xs text-gray-400 mt-0.5", children: [formatPrice(item.price), " / unite"] }), _jsxs("div", { className: "flex items-center justify-between mt-2 gap-2", children: [_jsx("span", { className: "font-bold text-red-600 text-sm", "data-testid": `price-${item.id}`, children: formatPrice(item.price * item.quantity) }), _jsxs("div", { className: "flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1", children: [_jsx("button", { onClick: () => updateQuantity(item.id, item.quantity - 1), className: "w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center", "data-testid": `cart-minus-${item.id}`, children: _jsx(Minus, { size: 12 }) }), _jsx("span", { className: "text-sm font-bold w-5 text-center", "data-testid": `qty-${item.id}`, children: item.quantity }), _jsx("button", { onClick: () => updateQuantity(item.id, item.quantity + 1), className: "w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center", "data-testid": `cart-plus-${item.id}`, children: _jsx(Plus, { size: 12 }) })] })] })] })] }, item.id))) }), _jsx("div", { className: "px-4 py-3 border-t border-gray-100", children: _jsxs("button", { onClick: () => navigate(`/restaurant/${restaurantId}`), className: "w-full py-2.5 rounded-xl border-2 border-red-600 text-red-600 text-sm font-semibold flex items-center justify-center gap-2", "data-testid": "button-add-items", children: [_jsx(Plus, { size: 16 }), " Ajouter des articles"] }) })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4", children: [_jsxs("h3", { className: "text-sm font-bold text-gray-900 mb-3 flex items-center gap-2", children: [_jsx(User, { size: 16, className: "text-red-600" }), "Informations personnelles"] }), _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex items-center gap-3 text-sm", "data-testid": "text-user-name", children: [_jsx(User, { size: 14, className: "text-gray-400 flex-shrink-0" }), _jsx("span", { className: "text-gray-700", children: user?.name || "Non connecte" })] }), _jsxs("div", { className: "flex items-center gap-3 text-sm", "data-testid": "text-user-email", children: [_jsx(Mail, { size: 14, className: "text-gray-400 flex-shrink-0" }), _jsx("span", { className: "text-gray-700", children: user?.email || "-" })] }), _jsxs("div", { className: "flex items-center gap-3 text-sm", "data-testid": "text-user-phone", children: [_jsx(Phone, { size: 14, className: "text-gray-400 flex-shrink-0" }), _jsx("span", { className: "text-gray-700", children: user?.phone || "-" })] })] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4", children: [_jsxs("h3", { className: "text-sm font-bold text-gray-900 mb-3 flex items-center gap-2", children: [_jsx(MessageSquare, { size: 16, className: "text-red-600" }), "Instructions speciales"] }), _jsx("textarea", { value: specialInstructions, onChange: (e) => setSpecialInstructions(e.target.value), placeholder: "Ex: Sans oignon, bien cuit, allergies...", className: "w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400", rows: 3, "data-testid": "input-special-instructions" })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-3", children: [_jsxs("h3", { className: "text-sm font-bold text-gray-900 flex items-center gap-2", children: [_jsx(MapPin, { size: 16, className: "text-red-600" }), "Adresse de livraison"] }), defaultAddress && (_jsxs("button", { onClick: () => navigate("/addresses"), className: "text-red-600 text-xs font-semibold flex items-center gap-0.5", "data-testid": "button-change-address", children: ["Changer ", _jsx(ChevronRight, { size: 14 })] }))] }), defaultAddress ? (_jsxs("div", { className: "bg-gray-50 rounded-xl p-3 text-sm text-gray-700 flex items-start gap-2", "data-testid": "text-delivery-address", children: [_jsx(MapPin, { size: 14, className: "text-red-500 mt-0.5 flex-shrink-0" }), _jsx("span", { children: defaultAddress.address })] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("input", { type: "text", value: manualAddress, onChange: (e) => setManualAddress(e.target.value), placeholder: "Entrez votre adresse de livraison", className: "w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400", "data-testid": "input-manual-address" }), _jsxs("button", { onClick: () => navigate("/addresses"), className: "text-red-600 text-xs font-semibold flex items-center gap-1", "data-testid": "link-add-address", children: [_jsx(Plus, { size: 14 }), " Ajouter une adresse"] })] }))] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3", children: [_jsxs("div", { className: "flex justify-between gap-2 text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Sous-total" }), _jsx("span", { className: "font-semibold", "data-testid": "text-subtotal", children: formatPrice(total) })] }), _jsxs("div", { className: "flex justify-between gap-2 text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Frais de livraison" }), _jsx("span", { className: "font-semibold", "data-testid": "text-delivery-fee", children: formatPrice(deliveryFee) })] }), _jsxs("div", { className: "border-t border-gray-100 pt-3 flex justify-between gap-2", children: [_jsx("span", { className: "font-bold", children: "Total" }), _jsx("span", { className: "font-black text-red-600 text-lg", "data-testid": "text-grand-total", children: formatPrice(grandTotal) })] })] })] }), _jsx("div", { className: "fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50", children: _jsx("div", { className: "max-w-lg mx-auto", children: _jsxs("button", { onClick: handleCheckout, "data-testid": "button-checkout", className: "w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2", children: ["Proceder au paiement - ", formatPrice(grandTotal), _jsx(ArrowRight, { size: 16 })] }) }) }), showConfirmModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-[100] flex items-end justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 animate-in slide-in-from-bottom", "data-testid": "modal-confirm-address", children: [_jsx("h3", { className: "text-lg font-bold text-gray-900", children: "Confirmer l'adresse" }), _jsxs("div", { className: "bg-gray-50 rounded-xl p-4 flex items-start gap-3", children: [_jsx(MapPin, { size: 18, className: "text-red-600 mt-0.5 flex-shrink-0" }), _jsx("p", { className: "text-sm text-gray-700", "data-testid": "text-confirm-address", children: resolvedAddress })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => {
                                        setShowConfirmModal(false);
                                        navigate("/addresses");
                                    }, className: "flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-semibold", "data-testid": "button-modal-change", children: "Changer" }), _jsx("button", { onClick: confirmCheckout, className: "flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold", "data-testid": "button-modal-confirm", children: "Confirmer" })] })] }) }))] }));
}
//# sourceMappingURL=CartPage.js.map