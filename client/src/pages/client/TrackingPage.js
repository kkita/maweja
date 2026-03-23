import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import ClientNav from "../../components/ClientNav";
import { onWSMessage } from "../../lib/websocket";
import { queryClient, authFetchJson } from "../../lib/queryClient";
import { ArrowLeft, CheckCircle2, Package, ChefHat, Truck, MapPin, Clock, Phone, MessageCircle, Star } from "lucide-react";
import { formatPrice, formatDate, statusLabels } from "../../lib/utils";
const steps = [
    {
        key: "pending",
        icon: Clock,
        label: "En attente",
        desc: "Votre commande a été reçue",
        color: "#F59E0B",
    },
    {
        key: "confirmed",
        icon: CheckCircle2,
        label: "Confirmée",
        desc: "Le restaurant a accepté votre commande",
        color: "#10B981",
    },
    {
        key: "preparing",
        icon: ChefHat,
        label: "En préparation",
        desc: "Votre repas est en cours de préparation",
        color: "#6366F1",
    },
    {
        key: "ready",
        icon: Package,
        label: "Prête",
        desc: "Commande prête, en attente du livreur",
        color: "#8B5CF6",
    },
    {
        key: "picked_up",
        icon: Truck,
        label: "En livraison",
        desc: "Votre livreur est en route",
        color: "#3B82F6",
    },
    {
        key: "delivered",
        icon: MapPin,
        label: "Livrée",
        desc: "Commande livrée avec succès !",
        color: "#dc2626",
    },
];
export default function TrackingPage() {
    const [, params] = useRoute("/tracking/:id");
    const [, navigate] = useLocation();
    const id = Number(params?.id);
    const { data: order } = useQuery({
        queryKey: ["/api/orders", id],
        queryFn: () => authFetchJson(`/api/orders/${id}`),
        refetchInterval: 10000,
    });
    const { data: driver } = useQuery({
        queryKey: ["/api/drivers", order?.driverId],
        queryFn: () => authFetchJson(`/api/drivers`).then((drivers) => drivers.find(d => d.id === order?.driverId)),
        enabled: !!order?.driverId,
    });
    useEffect(() => {
        return onWSMessage((data) => {
            if (data.type === "order_status" && data.orderId === id) {
                queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
            }
        });
    }, [id]);
    if (!order) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] flex items-center justify-center", children: _jsx("div", { className: "w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" }) }));
    }
    const currentStepIndex = steps.findIndex((s) => s.key === order.status);
    const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
    const isDelivered = order.status === "delivered";
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-28", style: { fontFamily: "system-ui, -apple-system, sans-serif" }, children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 pt-5", children: [_jsxs("div", { className: "flex items-center gap-3 mb-5", children: [_jsx("button", { onClick: () => navigate("/orders"), className: "w-10 h-10 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center active:scale-90 transition-transform", "data-testid": "button-back-orders", style: { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }, children: _jsx(ArrowLeft, { size: 18, className: "text-gray-800 dark:text-gray-100" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("h2", { className: "font-bold text-gray-900 dark:text-white", style: { fontSize: 18 }, children: ["Commande #", order.orderNumber] }), _jsx("p", { className: "text-gray-400 dark:text-gray-500", style: { fontSize: 12 }, children: formatDate(order.createdAt) })] }), _jsx("div", { className: "px-3 py-1 rounded-full", style: {
                                    background: isDelivered ? "#DCFCE7" : "#FEF3C7",
                                    border: `1px solid ${isDelivered ? "#BBF7D0" : "#FDE68A"}`,
                                }, children: _jsx("span", { style: {
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: isDelivered ? "#16A34A" : "#D97706",
                                    }, children: statusLabels[order.status] || order.status }) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-3xl p-5 mb-4", style: { boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("p", { className: "font-bold text-gray-900 dark:text-white", style: { fontSize: 15 }, children: "Suivi de la commande" }), _jsx("div", { className: "px-3 py-1 rounded-full", style: {
                                            background: isDelivered ? "#DCFCE7" : "#FEF3C7",
                                            border: `1px solid ${isDelivered ? "#BBF7D0" : "#FDE68A"}`,
                                        }, children: _jsx("span", { style: { fontSize: 11, fontWeight: 700, color: isDelivered ? "#16A34A" : "#D97706" }, children: isDelivered ? "Livrée ✓" : "En cours…" }) })] }), _jsx("div", { className: "w-full", children: _jsxs("div", { className: "relative flex justify-between items-start w-full", children: [_jsx("div", { className: "absolute h-0.5 rounded-full", style: { left: 16, right: 16, top: 16, background: "#E5E7EB", zIndex: 0 } }), _jsx("div", { className: "absolute h-0.5 rounded-full transition-all duration-700", style: {
                                                left: 16,
                                                top: 16,
                                                background: "linear-gradient(to right, #EC0000, #ff4444)",
                                                width: currentStepIndex === 0 ? 0 : `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 32px)`,
                                                zIndex: 0,
                                            } }), steps.map((step, i) => {
                                            const isCompleted = i < currentStepIndex;
                                            const isCurrent = i === currentStepIndex;
                                            const isFuture = i > currentStepIndex;
                                            const StepIcon = step.icon;
                                            return (_jsxs("div", { className: "flex flex-col items-center", style: { zIndex: 1, width: `${100 / steps.length}%` }, "data-testid": `tracking-step-${step.key}`, children: [_jsxs("div", { className: "relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 flex-shrink-0", style: {
                                                            background: isCurrent ? "#EC0000" : isCompleted ? "#FEE2E2" : "#F3F4F6",
                                                            border: isFuture ? "1.5px dashed #D1D5DB" : "none",
                                                            boxShadow: isCurrent ? "0 0 0 3px rgba(236,0,0,0.15)" : "none",
                                                        }, children: [isCompleted ? (_jsx(CheckCircle2, { size: 14, style: { color: "#EC0000" } })) : (_jsx(StepIcon, { size: 14, style: { color: isCurrent ? "#fff" : "#C4C4C4" } })), isCurrent && (_jsx("span", { className: "absolute inset-0 rounded-full", style: { animation: "tracking-pulse 2s ease-in-out infinite", background: "rgba(236,0,0,0.15)" } }))] }), _jsx("p", { className: "text-center leading-tight mt-1.5 w-full", style: {
                                                            fontSize: 9,
                                                            fontWeight: isCurrent ? 700 : 500,
                                                            color: isCurrent ? "#EC0000" : isCompleted ? "#374151" : "#9CA3AF",
                                                            wordBreak: "break-word",
                                                            hyphens: "auto",
                                                        }, children: step.label }), isCurrent && (_jsx("div", { className: "w-1 h-1 rounded-full mt-0.5", style: { background: "#EC0000", animation: "pulse 1s ease-in-out infinite" } }))] }, step.key));
                                        })] }) }), isDelivered && (_jsxs("div", { className: "mt-4 rounded-2xl p-3 flex items-center gap-3", style: { background: "linear-gradient(135deg, #FEF2F2, #FFF7ED)" }, children: [_jsx("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", style: { background: "#dc2626" }, children: _jsx(Star, { size: 16, fill: "white", className: "text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-bold text-gray-900", style: { fontSize: 13 }, children: "Commande livr\u00E9e avec succ\u00E8s !" }), _jsx("p", { className: "text-gray-500", style: { fontSize: 11 }, children: "Merci de votre confiance \uD83C\uDF89" })] })] }))] }), driver && (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-3xl p-4 mb-4", style: { boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }, children: [_jsx("p", { className: "font-bold text-gray-900 dark:text-white mb-3", style: { fontSize: 14 }, children: "Votre livreur" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", style: { background: "linear-gradient(135deg, #FEE2E2, #FCA5A5)" }, children: _jsx(Truck, { size: 20, className: "text-red-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-bold text-gray-900 dark:text-white truncate", style: { fontSize: 14 }, children: driver.name }), _jsx("p", { className: "text-gray-400 dark:text-gray-500", style: { fontSize: 12 }, children: driver.phone })] }), _jsx("a", { href: `tel:${driver.phone}`, className: "w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 active:scale-95 transition-transform", "data-testid": "button-call-driver", children: _jsx(Phone, { size: 18 }) }), _jsx("button", { className: "w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 active:scale-95 transition-transform", "data-testid": "button-chat-driver", children: _jsx(MessageCircle, { size: 18 }) })] })] })), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-3xl p-4 mb-4", style: { boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }, children: [_jsx("p", { className: "font-bold text-gray-900 dark:text-white mb-3", style: { fontSize: 14 }, children: "D\u00E9tails de la commande" }), _jsx("div", { className: "space-y-2", children: items.map((item, i) => (_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0", style: { background: "#dc2626", fontSize: 11, fontWeight: 800 }, children: item.qty }), _jsx("span", { className: "text-gray-600 dark:text-gray-300", style: { fontSize: 13 }, children: item.name })] }), _jsx("span", { className: "font-semibold text-gray-900 dark:text-white", style: { fontSize: 13 }, children: formatPrice(item.price * item.qty) })] }, i))) }), _jsxs("div", { className: "border-t border-gray-100 dark:border-gray-800 mt-3 pt-3 space-y-2", children: [_jsxs("div", { className: "flex justify-between", style: { fontSize: 13 }, children: [_jsx("span", { className: "text-gray-400 dark:text-gray-500", children: "Livraison" }), _jsx("span", { className: "text-gray-700 dark:text-gray-200 font-semibold", children: formatPrice(order.deliveryFee) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "font-bold text-gray-900 dark:text-white", style: { fontSize: 14 }, children: "Total" }), _jsx("span", { className: "font-black text-red-600", style: { fontSize: 18 }, children: formatPrice(order.total) })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-3xl p-4", style: { boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }, children: [_jsx("p", { className: "font-bold text-gray-900 dark:text-white mb-2", style: { fontSize: 14 }, children: "Adresse de livraison" }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(MapPin, { size: 16, className: "text-red-500 mt-0.5 flex-shrink-0" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", style: { fontSize: 13 }, children: order.deliveryAddress })] })] })] }), _jsx("style", { children: `
        @keyframes tracking-pulse {
          0%, 100% { opacity: 0; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      ` })] }));
}
//# sourceMappingURL=TrackingPage.js.map