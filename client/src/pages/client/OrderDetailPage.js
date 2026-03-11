import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { authFetch, apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { formatPrice, formatDate, statusLabels, paymentLabels } from "../../lib/utils";
import ClientNav from "../../components/ClientNav";
import { ArrowLeft, Clock, CheckCircle, ChefHat, Package, Truck, MapPin, Star, X, Phone, AlertTriangle, Ban, } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
const steps = [
    { key: "pending", icon: Clock, label: "En attente" },
    { key: "confirmed", icon: CheckCircle, label: "Confirmee" },
    { key: "preparing", icon: ChefHat, label: "En preparation" },
    { key: "ready", icon: Package, label: "Prete" },
    { key: "picked_up", icon: Truck, label: "En livraison" },
    { key: "delivered", icon: MapPin, label: "Livree" },
];
const cancelReasons = [
    "Delai trop long",
    "Changement d'avis",
    "Erreur de commande",
    "Autre",
];
export default function OrderDetailPage() {
    const [, params] = useRoute("/order/:id");
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const id = Number(params?.id);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [showRateModal, setShowRateModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const { data: order, isLoading } = useQuery({
        queryKey: ["/api/orders", id],
        queryFn: () => authFetch(`/api/orders/${id}`).then((r) => r.json()),
        enabled: !!id,
        refetchInterval: 10000,
    });
    const { data: restaurant } = useQuery({
        queryKey: ["/api/restaurants", order?.restaurantId],
        queryFn: () => authFetch(`/api/restaurants/${order?.restaurantId}`).then((r) => r.json()),
        enabled: !!order?.restaurantId,
    });
    const { data: driver } = useQuery({
        queryKey: ["/api/drivers", order?.driverId],
        queryFn: () => authFetch("/api/drivers")
            .then((r) => r.json())
            .then((drivers) => drivers.find((d) => d.id === order?.driverId)),
        enabled: !!order?.driverId,
    });
    const cancelMutation = useMutation({
        mutationFn: (reason) => apiRequest(`/api/orders/${id}/cancel`, {
            method: "PATCH",
            body: JSON.stringify({ reason }),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            setShowCancelModal(false);
            toast({ title: "Commande annulee", description: "Votre commande a ete annulee avec succes." });
        },
        onError: () => {
            toast({ title: "Erreur", description: "Impossible d'annuler la commande.", variant: "destructive" });
        },
    });
    const rateMutation = useMutation({
        mutationFn: (data) => apiRequest(`/api/orders/${id}/rate`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            setShowRateModal(false);
            toast({ title: "Merci!", description: "Votre avis a ete enregistre." });
        },
        onError: () => {
            toast({ title: "Erreur", description: "Impossible d'envoyer l'avis.", variant: "destructive" });
        },
    });
    if (isLoading || !order) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" }) }));
    }
    const currentStepIndex = steps.findIndex((s) => s.key === order.status);
    const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
    const isCancelled = order.status === "cancelled";
    const canCancel = order.status === "pending" || order.status === "confirmed";
    const canRate = order.status === "delivered" && order.rating == null;
    const handleCancel = () => {
        const reason = cancelReason === "Autre" ? customReason : cancelReason;
        if (!reason.trim()) {
            toast({ title: "Erreur", description: "Veuillez indiquer une raison.", variant: "destructive" });
            return;
        }
        cancelMutation.mutate(reason);
    };
    const handleRate = () => {
        if (rating === 0) {
            toast({ title: "Erreur", description: "Veuillez donner une note.", variant: "destructive" });
            return;
        }
        rateMutation.mutate({ rating, feedback });
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("button", { onClick: () => navigate("/orders"), className: "w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200", "data-testid": "button-back-orders", children: _jsx(ArrowLeft, { size: 18 }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-bold text-gray-900", children: ["Commande ", order.orderNumber] }), _jsx("p", { className: "text-xs text-gray-500", children: formatDate(order.createdAt) })] })] }), isCancelled && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-3", "data-testid": "banner-cancelled", children: [_jsx(Ban, { size: 20, className: "text-red-600 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-red-700 text-sm", children: "Commande annulee" }), order.cancelReason && (_jsxs("p", { className: "text-xs text-red-500 mt-0.5", children: ["Raison : ", order.cancelReason] }))] })] })), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4", children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900 mb-6", children: "Statut de la commande" }), !isCancelled && (_jsx("div", { className: "space-y-0", children: steps.map((step, i) => {
                                    const isCompleted = i < currentStepIndex;
                                    const isCurrent = i === currentStepIndex;
                                    const isFuture = i > currentStepIndex;
                                    return (_jsxs("div", { className: "flex gap-4", "data-testid": `step-${step.key}`, children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCurrent
                                                            ? "bg-red-600 text-white shadow-lg shadow-red-200"
                                                            : isCompleted
                                                                ? "bg-green-100 text-green-600"
                                                                : "bg-gray-100 text-gray-400"}`, children: _jsx(step.icon, { size: 18 }) }), i < steps.length - 1 && (_jsx("div", { className: `w-0.5 h-8 my-1 ${isCompleted ? "bg-green-300" : isCurrent ? "bg-red-300" : "bg-gray-200"}` }))] }), _jsxs("div", { className: "pb-4", children: [_jsx("p", { className: `font-semibold text-sm ${isCurrent
                                                            ? "text-red-600"
                                                            : isCompleted
                                                                ? "text-green-700"
                                                                : "text-gray-400"}`, children: step.label }), isCurrent && _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: "En cours..." })] })] }, step.key));
                                }) }))] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4", children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900 mb-3", children: "Resume de la commande" }), restaurant && (_jsx("p", { className: "text-xs text-gray-500 mb-3 font-medium", children: restaurant.name })), _jsx("div", { className: "space-y-2", children: items.map((item, i) => (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("span", { className: "text-gray-600", children: [item.qty, " x ", item.name] }), _jsx("span", { className: "font-medium", children: formatPrice(item.price * item.qty) })] }, i))) }), _jsxs("div", { className: "border-t border-gray-100 mt-3 pt-3 space-y-1", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Sous-total" }), _jsx("span", { children: formatPrice(order.subtotal) })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Livraison" }), _jsx("span", { children: formatPrice(order.deliveryFee) })] }), order.taxAmount > 0 && (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Taxes" }), _jsx("span", { children: formatPrice(order.taxAmount) })] })), order.promoDiscount > 0 && (_jsxs("div", { className: "flex justify-between text-sm text-green-600", children: [_jsx("span", { children: "Reduction promo" }), _jsxs("span", { children: ["-", formatPrice(order.promoDiscount)] })] })), _jsxs("div", { className: "flex justify-between font-bold pt-1 border-t border-gray-100", children: [_jsx("span", { children: "Total" }), _jsx("span", { className: "text-red-600", children: formatPrice(order.total) })] })] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4", children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900 mb-3", children: "Details" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Numero" }), _jsx("span", { className: "font-medium", children: order.orderNumber })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Date" }), _jsx("span", { className: "font-medium", children: formatDate(order.createdAt) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Paiement" }), _jsx("span", { className: "font-medium", children: paymentLabels[order.paymentMethod] || order.paymentMethod })] }), _jsxs("div", { className: "flex justify-between items-start gap-2", children: [_jsx("span", { className: "text-gray-500 flex-shrink-0", children: "Adresse" }), _jsx("span", { className: "font-medium text-right", children: order.deliveryAddress })] })] })] }), driver && (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4", children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900 mb-3", children: "Votre livreur" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center", children: _jsx(Truck, { size: 20, className: "text-red-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-sm", children: driver.name }), _jsx("p", { className: "text-xs text-gray-500", children: driver.phone })] }), _jsx("a", { href: `tel:${driver.phone}`, className: "w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600", "data-testid": "button-call-driver", children: _jsx(Phone, { size: 18 }) })] })] })), _jsxs("button", { onClick: () => {
                            const dateStr = new Date(order.createdAt).toLocaleDateString("fr-CD", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
                            const restName = restaurant?.name || "Restaurant";
                            const msg = encodeURIComponent(`Bonjour MAWEJA,\n\nJe vous contacte au sujet de ma commande:\n` +
                                `- N° de commande: ${order.orderNumber}\n` +
                                `- Date: ${dateStr}\n` +
                                `- Restaurant: ${restName}\n` +
                                `- Montant: ${formatPrice(order.total)}\n` +
                                `- Statut actuel: ${statusLabels[order.status] || order.status}\n\n` +
                                `Merci de votre aide.`);
                            window.open(`https://wa.me/243812345678?text=${msg}`, "_blank");
                        }, "data-testid": "button-whatsapp-order", className: "w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-green-200 mt-4 hover:bg-green-700 transition-all", children: [_jsx(SiWhatsapp, { size: 18 }), "Contacter le service client via WhatsApp"] }), _jsxs("div", { className: "flex flex-col gap-3 mt-4", children: [canCancel && (_jsxs("button", { onClick: () => setShowCancelModal(true), "data-testid": "button-cancel-order", className: "w-full py-3 rounded-2xl border-2 border-red-200 text-red-600 font-semibold text-sm flex items-center justify-center gap-2", children: [_jsx(AlertTriangle, { size: 16 }), "Annuler la commande"] })), canRate && (_jsxs("button", { onClick: () => setShowRateModal(true), "data-testid": "button-rate-order", className: "w-full py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-200", children: [_jsx(Star, { size: 16 }), "Evaluer la commande"] }))] })] }), showCancelModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-end justify-center", "data-testid": "modal-cancel", children: _jsxs("div", { className: "bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-in slide-in-from-bottom", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-6", children: [_jsx("h3", { className: "font-bold text-lg", children: "Annuler la commande" }), _jsx("button", { onClick: () => setShowCancelModal(false), "data-testid": "button-close-cancel-modal", className: "w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center", children: _jsx(X, { size: 16 }) })] }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: "Pourquoi souhaitez-vous annuler ?" }), _jsx("div", { className: "space-y-2 mb-4", children: cancelReasons.map((reason) => (_jsx("button", { onClick: () => setCancelReason(reason), "data-testid": `cancel-reason-${reason}`, className: `w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${cancelReason === reason
                                    ? "bg-red-50 text-red-700 border-2 border-red-300"
                                    : "bg-gray-50 text-gray-700 border border-gray-200"}`, children: reason }, reason))) }), cancelReason === "Autre" && (_jsx("textarea", { value: customReason, onChange: (e) => setCustomReason(e.target.value), placeholder: "Decrivez votre raison...", "data-testid": "input-custom-reason", className: "w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-300" })), _jsx("button", { onClick: handleCancel, disabled: cancelMutation.isPending, "data-testid": "button-confirm-cancel", className: "w-full py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm disabled:opacity-50", children: cancelMutation.isPending ? "Annulation..." : "Confirmer l'annulation" })] }) })), showRateModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-end justify-center", "data-testid": "modal-rate", children: _jsxs("div", { className: "bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-in slide-in-from-bottom", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-6", children: [_jsx("h3", { className: "font-bold text-lg", children: "Evaluer la commande" }), _jsx("button", { onClick: () => setShowRateModal(false), "data-testid": "button-close-rate-modal", className: "w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center", children: _jsx(X, { size: 16 }) })] }), _jsx("p", { className: "text-sm text-gray-500 mb-4 text-center", children: "Comment etait votre commande ?" }), _jsx("div", { className: "flex justify-center gap-2 mb-6", children: [1, 2, 3, 4, 5].map((s) => (_jsx("button", { onClick: () => setRating(s), "data-testid": `star-${s}`, className: "p-1 transition-transform", children: _jsx(Star, { size: 36, className: s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300" }) }, s))) }), _jsx("textarea", { value: feedback, onChange: (e) => setFeedback(e.target.value), placeholder: "Un commentaire ? (optionnel)", "data-testid": "input-feedback", className: "w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-300" }), _jsx("button", { onClick: handleRate, disabled: rateMutation.isPending, "data-testid": "button-submit-rating", className: "w-full py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm disabled:opacity-50", children: rateMutation.isPending ? "Envoi..." : "Envoyer mon avis" })] }) }))] }));
}
//# sourceMappingURL=OrderDetailPage.js.map