import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import ClientNav from "../../components/ClientNav";
import { onWSMessage } from "../../lib/websocket";
import { queryClient, authFetch } from "../../lib/queryClient";
import { ArrowLeft, CheckCircle2, Package, ChefHat, Truck, MapPin, Clock, Phone, MessageCircle } from "lucide-react";
import { formatPrice, formatDate } from "../../lib/utils";
const steps = [
    { key: "pending", icon: Clock, label: "En attente" },
    { key: "confirmed", icon: CheckCircle2, label: "Confirmee" },
    { key: "preparing", icon: ChefHat, label: "En preparation" },
    { key: "ready", icon: Package, label: "Prete" },
    { key: "picked_up", icon: Truck, label: "En livraison" },
    { key: "delivered", icon: MapPin, label: "Livree" },
];
export default function TrackingPage() {
    const [, params] = useRoute("/tracking/:id");
    const [, navigate] = useLocation();
    const id = Number(params?.id);
    const { data: order } = useQuery({
        queryKey: ["/api/orders", id],
        queryFn: () => authFetch(`/api/orders/${id}`).then((r) => r.json()),
        refetchInterval: 10000,
    });
    const { data: driver } = useQuery({
        queryKey: ["/api/drivers", order?.driverId],
        queryFn: () => authFetch(`/api/drivers`).then(r => r.json()).then((drivers) => drivers.find(d => d.id === order?.driverId)),
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
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" }) }));
    }
    const currentStepIndex = steps.findIndex((s) => s.key === order.status);
    const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("button", { onClick: () => navigate("/orders"), className: "w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200", "data-testid": "button-back-orders", children: _jsx(ArrowLeft, { size: 18 }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-bold text-gray-900", children: ["Commande ", order.orderNumber] }), _jsx("p", { className: "text-xs text-gray-500", children: formatDate(order.createdAt) })] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4", children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900 mb-6", children: "Suivi de la commande" }), _jsx("div", { className: "space-y-0", children: steps.map((step, i) => {
                                    const isCompleted = i <= currentStepIndex;
                                    const isCurrent = i === currentStepIndex;
                                    return (_jsxs("div", { className: "flex gap-4", "data-testid": `tracking-step-${step.key}`, children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCurrent ? "bg-red-600 text-white shadow-lg shadow-red-200" : isCompleted ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"}`, children: _jsx(step.icon, { size: 18 }) }), i < steps.length - 1 && (_jsx("div", { className: `w-0.5 h-8 my-1 ${isCompleted ? "bg-red-300" : "bg-gray-200"}` }))] }), _jsxs("div", { className: "pb-4", children: [_jsx("p", { className: `font-semibold text-sm ${isCurrent ? "text-red-600" : isCompleted ? "text-gray-900" : "text-gray-400"}`, children: step.label }), isCurrent && _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: "En cours..." })] })] }, step.key));
                                }) })] }), driver && (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4", children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900 mb-3", children: "Votre livreur" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center", children: _jsx(Truck, { size: 20, className: "text-red-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-sm", children: driver.name }), _jsx("p", { className: "text-xs text-gray-500", children: driver.phone })] }), _jsx("button", { className: "w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600", "data-testid": "button-call-driver", children: _jsx(Phone, { size: 18 }) }), _jsx("button", { className: "w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600", "data-testid": "button-chat-driver", children: _jsx(MessageCircle, { size: 18 }) })] })] })), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4", children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900 mb-3", children: "Details de la commande" }), _jsx("div", { className: "space-y-2", children: items.map((item, i) => (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("span", { className: "text-gray-600", children: [item.qty, "x ", item.name] }), _jsx("span", { className: "font-medium", children: formatPrice(item.price * item.qty) })] }, i))) }), _jsxs("div", { className: "border-t border-gray-100 mt-3 pt-3 space-y-1", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Livraison" }), _jsx("span", { children: formatPrice(order.deliveryFee) })] }), _jsxs("div", { className: "flex justify-between font-bold", children: [_jsx("span", { children: "Total" }), _jsx("span", { className: "text-red-600", children: formatPrice(order.total) })] })] })] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4", children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900 mb-2", children: "Adresse de livraison" }), _jsxs("p", { className: "text-sm text-gray-600 flex items-start gap-2", children: [_jsx(MapPin, { size: 16, className: "text-red-500 mt-0.5 flex-shrink-0" }), order.deliveryAddress] })] })] })] }));
}
//# sourceMappingURL=TrackingPage.js.map