import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import DriverNav from "../../components/DriverNav";
import { Package, Clock, CheckCircle2, MapPin, Power, Navigation, DollarSign, AlertCircle, Timer, Bell } from "lucide-react";
import { formatPrice, statusLabels, statusColors } from "../../lib/utils";
function CountdownBadge({ estimatedDelivery }) {
    const [remaining, setRemaining] = useState("");
    const [isLate, setIsLate] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    useEffect(() => {
        if (!estimatedDelivery) {
            setRemaining("--:--");
            return;
        }
        const update = () => {
            const diff = new Date(estimatedDelivery).getTime() - Date.now();
            if (diff <= 0) {
                setRemaining(`-${Math.abs(Math.floor(diff / 60000))}min`);
                setIsLate(true);
                setIsUrgent(true);
            }
            else {
                const min = Math.floor(diff / 60000);
                const sec = Math.floor((diff % 60000) / 1000);
                setRemaining(`${min}:${sec.toString().padStart(2, "0")}`);
                setIsLate(false);
                setIsUrgent(min < 5);
            }
        };
        update();
        const i = setInterval(update, 1000);
        return () => clearInterval(i);
    }, [estimatedDelivery]);
    return (_jsxs("div", { className: `flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${isLate ? "bg-red-100 border border-red-200 animate-pulse" : isUrgent ? "bg-orange-100 border border-orange-200" : "bg-green-100 border border-green-200"}`, children: [_jsx(Timer, { size: 12, className: isLate ? "text-red-600" : isUrgent ? "text-orange-600" : "text-green-600" }), _jsx("span", { className: `font-mono font-black text-sm ${isLate ? "text-red-700" : isUrgent ? "text-orange-700" : "text-green-700"}`, "data-testid": "driver-countdown", children: remaining }), _jsx("span", { className: `text-[8px] font-bold ${isLate ? "text-red-500" : isUrgent ? "text-orange-500" : "text-green-500"}`, children: isLate ? "RETARD!" : isUrgent ? "URGENT" : "restant" })] }));
}
function AlarmOverlay({ reason, onDismiss }) {
    useEffect(() => {
        const audio = new AudioContext();
        let oscillator = null;
        try {
            oscillator = audio.createOscillator();
            const gain = audio.createGain();
            oscillator.connect(gain);
            gain.connect(audio.destination);
            oscillator.frequency.value = 880;
            oscillator.type = "sawtooth";
            gain.gain.value = 0.3;
            oscillator.start();
            setTimeout(() => { oscillator?.stop(); }, 3000);
        }
        catch { }
        if ("vibrate" in navigator)
            navigator.vibrate([500, 200, 500, 200, 500]);
        return () => { try {
            oscillator?.stop();
            audio.close();
        }
        catch { } };
    }, []);
    return (_jsx("div", { className: "fixed inset-0 z-[100] bg-red-600/95 flex items-center justify-center p-6 animate-pulse", children: _jsxs("div", { className: "bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl", children: [_jsx("div", { className: "w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce", children: _jsx(Bell, { size: 36, className: "text-red-600" }) }), _jsx("h2", { className: "text-xl font-black text-red-600 mb-2", children: "ALERTE URGENTE" }), _jsx("p", { className: "text-gray-700 text-sm mb-6 leading-relaxed", children: reason }), _jsx("button", { onClick: onDismiss, "data-testid": "dismiss-alarm", className: "w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-red-200", children: "J'ai compris" })] }) }));
}
export default function DriverDashboard() {
    const { user, setUser } = useAuth();
    const { toast } = useToast();
    const [isOnline, setIsOnline] = useState(user?.isOnline || false);
    const [gpsActive, setGpsActive] = useState(false);
    const [alarm, setAlarm] = useState(null);
    const { data: pendingOrders = [] } = useQuery({
        queryKey: ["/api/orders", "ready"],
        queryFn: () => authFetch("/api/orders?status=ready").then(r => r.json()),
        refetchInterval: 5000,
    });
    const { data: myOrders = [] } = useQuery({
        queryKey: ["/api/orders", "driver", user?.id],
        queryFn: () => authFetch(`/api/orders?driverId=${user?.id}`).then(r => r.json()),
        enabled: !!user,
        refetchInterval: 5000,
    });
    const activeOrders = myOrders.filter(o => !["delivered", "cancelled"].includes(o.status));
    const deliveredToday = myOrders.filter(o => o.status === "delivered");
    const totalEarnings = deliveredToday.reduce((s, o) => s + o.deliveryFee, 0);
    const lateOrders = activeOrders.filter(o => {
        if (!o.estimatedDelivery)
            return false;
        return new Date(o.estimatedDelivery).getTime() < Date.now();
    });
    const sendLocation = useCallback(() => {
        if (!user?.id || !isOnline)
            return;
        navigator.geolocation.getCurrentPosition(pos => {
            setGpsActive(true);
            apiRequest(`/api/drivers/${user.id}/location`, {
                method: "PATCH",
                body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            }).catch(() => { });
        }, () => setGpsActive(false), { enableHighAccuracy: true, timeout: 10000 });
    }, [user?.id, isOnline]);
    useEffect(() => {
        if (!isOnline)
            return;
        sendLocation();
        const interval = setInterval(sendLocation, 15000);
        return () => clearInterval(interval);
    }, [isOnline, sendLocation]);
    useEffect(() => {
        return onWSMessage(data => {
            if (data.type === "order_assigned" || data.type === "new_order") {
                toast({ title: "Nouvelle commande!", description: "Une commande est disponible" });
                queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            }
            if (data.type === "alarm") {
                setAlarm(data.reason || "Alerte de l'administration");
            }
        });
    }, [toast]);
    useEffect(() => {
        if (lateOrders.length > 0 && isOnline) {
            const checkInterval = setInterval(() => {
                const lateNow = activeOrders.filter(o => {
                    if (!o.estimatedDelivery)
                        return false;
                    const diff = new Date(o.estimatedDelivery).getTime() - Date.now();
                    return diff < 0 && diff > -60000;
                });
                if (lateNow.length > 0) {
                    toast({
                        title: "Retard detecte!",
                        description: `Vous etes en retard sur ${lateNow.length} livraison(s). Accelerez!`,
                        variant: "destructive",
                    });
                    if ("vibrate" in navigator)
                        navigator.vibrate([300, 100, 300]);
                }
            }, 30000);
            return () => clearInterval(checkInterval);
        }
    }, [lateOrders.length, isOnline, activeOrders, toast]);
    const toggleOnline = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        await apiRequest(`/api/drivers/${user?.id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ isOnline: newStatus }),
        });
        setUser({ ...user, isOnline: newStatus });
        toast({ title: newStatus ? "Vous etes en ligne" : "Vous etes hors ligne" });
        if (newStatus)
            sendLocation();
    };
    const acceptOrder = async (orderId) => {
        try {
            await apiRequest(`/api/orders/${orderId}`, {
                method: "PATCH",
                body: JSON.stringify({ driverId: user?.id, status: "picked_up" }),
            });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            toast({ title: "Commande acceptee!", description: "Rendez-vous au restaurant" });
        }
        catch (err) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        }
    };
    const updateStatus = async (orderId, status) => {
        await apiRequest(`/api/orders/${orderId}`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        toast({ title: status === "delivered" ? "Livraison terminee!" : "Statut mis a jour" });
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [alarm && _jsx(AlarmOverlay, { reason: alarm, onDismiss: () => setAlarm(null) }), _jsx(DriverNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900 mb-0.5", children: ["Bonjour ", user?.name?.split(" ")[0]] }), _jsx("p", { className: "text-xs text-gray-500", children: "Vos livraisons du jour" })] }), _jsxs("button", { onClick: toggleOnline, "data-testid": "toggle-online", className: `flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg ${isOnline
                                    ? "bg-green-600 text-white shadow-green-200"
                                    : "bg-gray-200 text-gray-600 shadow-gray-100"}`, children: [_jsx(Power, { size: 16 }), isOnline ? "En ligne" : "Hors ligne"] })] }), isOnline && (_jsxs("div", { className: `flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-xs font-medium ${gpsActive ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`, children: [_jsx(Navigation, { size: 14 }), gpsActive ? "GPS actif - Position partagee toutes les 15s" : "GPS inactif - Activez la localisation"] })), lateOrders.length > 0 && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 animate-pulse", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(AlertCircle, { size: 16, className: "text-red-600" }), _jsx("span", { className: "font-bold text-sm text-red-700", children: "Retard detecte!" })] }), _jsxs("p", { className: "text-xs text-red-600", children: ["Vous avez ", lateOrders.length, " livraison(s) en retard. Veuillez accelerer."] })] })), _jsxs("div", { className: "grid grid-cols-3 gap-3 mb-6", children: [_jsxs("div", { className: "bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center", children: [_jsx("div", { className: "w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2", children: _jsx(Package, { size: 18, className: "text-blue-600" }) }), _jsx("p", { className: "text-2xl font-black text-gray-900", children: activeOrders.length }), _jsx("p", { className: "text-[10px] text-gray-500 font-medium", children: "En cours" })] }), _jsxs("div", { className: "bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center", children: [_jsx("div", { className: "w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2", children: _jsx(CheckCircle2, { size: 18, className: "text-green-600" }) }), _jsx("p", { className: "text-2xl font-black text-gray-900", children: deliveredToday.length }), _jsx("p", { className: "text-[10px] text-gray-500 font-medium", children: "Livrees" })] }), _jsxs("div", { className: "bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center", children: [_jsx("div", { className: "w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-2", children: _jsx(DollarSign, { size: 18, className: "text-red-600" }) }), _jsx("p", { className: "text-lg font-black text-gray-900", children: formatPrice(totalEarnings) }), _jsx("p", { className: "text-[10px] text-gray-500 font-medium", children: "Gains" })] })] }), !isOnline && (_jsxs("div", { className: "bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center mb-6", children: [_jsx(Power, { size: 40, className: "text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "font-bold text-gray-900 mb-1", children: "Vous etes hors ligne" }), _jsx("p", { className: "text-xs text-gray-500 mb-4", children: "Passez en ligne pour recevoir des commandes" }), _jsx("button", { onClick: toggleOnline, className: "bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-200", "data-testid": "go-online", children: "Passer en ligne" })] })), activeOrders.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 mb-3", children: ["Livraisons en cours (", activeOrders.length, ")"] }), _jsx("div", { className: "space-y-3", children: activeOrders.map(order => (_jsxs("div", { className: "bg-white rounded-2xl p-4 border border-gray-100 shadow-sm", "data-testid": `active-order-${order.id}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "font-bold text-sm", children: order.orderNumber }), _jsx("span", { className: `text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`, children: statusLabels[order.status] })] }), _jsx(CountdownBadge, { estimatedDelivery: order.estimatedDelivery }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-500 mt-2", children: [_jsx(MapPin, { size: 12 }), _jsx("span", { className: "flex-1 truncate", children: order.deliveryAddress })] }), _jsxs("div", { className: "flex items-center justify-between mt-3 pt-3 border-t border-gray-100", children: [_jsxs("div", { children: [_jsx("span", { className: "font-bold text-red-600 text-sm", children: formatPrice(order.total) }), _jsxs("span", { className: "text-[10px] text-gray-400 ml-2", children: ["Gain: ", formatPrice(order.deliveryFee)] })] }), _jsxs("div", { className: "flex gap-2", children: [order.status === "picked_up" && (_jsx("button", { onClick: () => updateStatus(order.id, "delivered"), "data-testid": `deliver-${order.id}`, className: "bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-green-200", children: "Livree" })), ["confirmed", "preparing"].includes(order.status) && (_jsx("button", { onClick: () => updateStatus(order.id, "picked_up"), "data-testid": `pickup-${order.id}`, className: "bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold", children: "Recuperee" }))] })] })] }, order.id))) })] })), isOnline && (_jsxs("div", { children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 mb-3", children: ["Commandes disponibles (", pendingOrders.filter(o => !o.driverId).length, ")"] }), pendingOrders.filter(o => !o.driverId).length === 0 ? (_jsxs("div", { className: "bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center", children: [_jsx(Clock, { size: 36, className: "text-gray-300 mx-auto mb-2" }), _jsx("p", { className: "text-gray-500 text-sm font-medium", children: "Aucune commande disponible" }), _jsx("p", { className: "text-gray-400 text-xs mt-1", children: "Les nouvelles commandes apparaitront automatiquement" })] })) : (_jsx("div", { className: "space-y-3", children: pendingOrders.filter(o => !o.driverId).map(order => (_jsxs("div", { className: "bg-white rounded-2xl p-4 border border-gray-100 shadow-sm", "data-testid": `pending-order-${order.id}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "font-bold text-sm", children: order.orderNumber }), _jsx("span", { className: "font-bold text-red-600 text-sm", children: formatPrice(order.deliveryFee) })] }), order.estimatedDelivery && _jsx(CountdownBadge, { estimatedDelivery: order.estimatedDelivery }), _jsxs("p", { className: "text-xs text-gray-500 flex items-center gap-1 mt-2", children: [_jsx(MapPin, { size: 12 }), " ", order.deliveryAddress] }), _jsxs("p", { className: "text-xs text-gray-400 mb-3", children: ["Total commande: ", formatPrice(order.total)] }), _jsx("button", { onClick: () => acceptOrder(order.id), "data-testid": `accept-order-${order.id}`, className: "w-full bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all", children: "Accepter la livraison" })] }, order.id))) }))] }))] }), _jsx("div", { className: "fixed bottom-20 left-0 right-0 text-center", children: _jsx("p", { className: "text-[10px] text-gray-400", children: "Made By Khevin Andrew Kita - Ed Corporation" }) })] }));
}
//# sourceMappingURL=DriverDashboard.js.map