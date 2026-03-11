import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import { useToast } from "../../hooks/use-toast";
import { Truck, MapPin, Phone, Circle, Plus, X, Edit, Trash2, Ban, CheckCircle2, Bell, Clock, Navigation, Package, Search, Timer, Zap, Send, ChevronLeft, Menu, User, ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors } from "../../lib/utils";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
const KINSHASA_CENTER = [-4.3217, 15.3126];
const driverIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const onlineIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
function MapFlyTo({ lat, lng }) {
    const map = useMap();
    useEffect(() => { map.flyTo([lat, lng], 16, { duration: 1.2 }); }, [lat, lng, map]);
    return null;
}
function MapInvalidateSize() {
    const map = useMap();
    useEffect(() => {
        const t = setTimeout(() => map.invalidateSize(), 200);
        return () => clearTimeout(t);
    }, [map]);
    return null;
}
function CountdownTimer({ estimatedDelivery, compact }) {
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
    if (compact) {
        return (_jsxs("span", { className: `font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md ${isLate ? "bg-red-100 text-red-700 animate-pulse" : isUrgent ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`, "data-testid": "countdown-timer", children: [_jsx(Timer, { size: 8, className: "inline mr-0.5" }), remaining] }));
    }
    return (_jsxs("div", { className: `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${isLate ? "bg-red-50 border border-red-200" : isUrgent ? "bg-orange-50 border border-orange-200" : "bg-green-50 border border-green-200"}`, children: [_jsx(Timer, { size: 12, className: isLate ? "text-red-600 animate-pulse" : isUrgent ? "text-orange-600" : "text-green-600" }), _jsx("span", { className: `font-mono font-bold text-xs ${isLate ? "text-red-700" : isUrgent ? "text-orange-700" : "text-green-700"}`, children: remaining }), _jsx("span", { className: `text-[9px] ${isLate ? "text-red-500" : isUrgent ? "text-orange-500" : "text-green-500"}`, children: isLate ? "RETARD" : isUrgent ? "URGENT" : "restant" })] }));
}
function ElapsedTime({ createdAt }) {
    const [elapsed, setElapsed] = useState("");
    const [isUrgent, setIsUrgent] = useState(false);
    useEffect(() => {
        if (!createdAt) {
            setElapsed("--");
            return;
        }
        const update = () => {
            const diff = Date.now() - new Date(createdAt).getTime();
            const min = Math.floor(diff / 60000);
            setElapsed(`${min} min`);
            setIsUrgent(min >= 45);
        };
        update();
        const i = setInterval(update, 30000);
        return () => clearInterval(i);
    }, [createdAt]);
    return (_jsxs("span", { className: `text-[10px] font-semibold ${isUrgent ? "text-red-600" : "text-gray-500"}`, "data-testid": "elapsed-time", children: [_jsx(Clock, { size: 9, className: "inline mr-0.5" }), elapsed, isUrgent && _jsx("span", { className: "ml-1 px-1 py-0.5 bg-red-600 text-white text-[8px] font-bold rounded", children: "URGENT" })] }));
}
export default function AdminDrivers() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [dispatchTab, setDispatchTab] = useState("gestion");
    const [showForm, setShowForm] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [alarmReason, setAlarmReason] = useState("");
    const [showAlarmModal, setShowAlarmModal] = useState(null);
    const [chatMessage, setChatMessage] = useState("");
    const [mobilePanel, setMobilePanel] = useState("list");
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", vehicleType: "moto", vehiclePlate: "", driverLicense: "", commissionRate: 15 });
    const [expandedBusyDriver, setExpandedBusyDriver] = useState(null);
    const [assigningOrderId, setAssigningOrderId] = useState(null);
    const { data: drivers = [] } = useQuery({
        queryKey: ["/api/drivers"],
        queryFn: () => authFetch("/api/drivers").then(r => r.json()),
        refetchInterval: 5000,
    });
    const { data: orders = [] } = useQuery({
        queryKey: ["/api/orders"],
        refetchInterval: 5000,
    });
    const { data: restaurants = [] } = useQuery({
        queryKey: ["/api/restaurants"],
    });
    useEffect(() => {
        return onWSMessage((data) => {
            if (data.type === "driver_location" || data.type === "driver_status") {
                queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
            }
        });
    }, []);
    const activeOrders = orders.filter(o => ["confirmed", "preparing", "ready", "picked_up"].includes(o.status));
    const getDriverActiveOrders = (driverId) => activeOrders.filter(o => o.driverId === driverId);
    const getDriverDelivered = (driverId) => orders.filter(o => o.driverId === driverId && o.status === "delivered");
    const getDriverStatus = (d) => {
        if (d.isBlocked)
            return "blocked";
        if (!d.isOnline)
            return "offline";
        if (getDriverActiveOrders(d.id).length > 0)
            return "busy";
        return "online";
    };
    const getRestaurantName = (restaurantId) => {
        const r = restaurants.find((rest) => rest.id === restaurantId);
        return r?.name || `Restaurant #${restaurantId}`;
    };
    const filteredDrivers = drivers
        .filter((d) => filter === "all" ? true : getDriverStatus(d) === filter)
        .filter((d) => d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.phone?.includes(search) ||
        d.email?.toLowerCase().includes(search.toLowerCase()));
    const statusCounts = {
        all: drivers.length,
        online: drivers.filter((d) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length === 0).length,
        busy: drivers.filter((d) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length > 0).length,
        offline: drivers.filter((d) => !d.isOnline && !d.isBlocked).length,
        blocked: drivers.filter((d) => d.isBlocked).length,
    };
    const driversWithLocation = drivers.filter((d) => d.lat && d.lng && d.isOnline);
    const unassignedOrders = useMemo(() => orders.filter(o => !o.driverId && ["pending", "confirmed", "preparing", "ready"].includes(o.status)), [orders]);
    const assignedOrders = useMemo(() => orders.filter(o => o.driverId && !["delivered", "cancelled"].includes(o.status)), [orders]);
    const assignedByDriver = useMemo(() => {
        const map = new Map();
        assignedOrders.forEach(o => {
            if (o.driverId) {
                const existing = map.get(o.driverId) || [];
                existing.push(o);
                map.set(o.driverId, existing);
            }
        });
        return map;
    }, [assignedOrders]);
    const completedOrders = useMemo(() => orders.filter(o => o.status === "delivered"), [orders]);
    const freeDrivers = useMemo(() => drivers.filter((d) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length === 0), [drivers, activeOrders]);
    const busyDrivers = useMemo(() => drivers.filter((d) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length > 0), [drivers, activeOrders]);
    const offlineDrivers = useMemo(() => drivers.filter((d) => !d.isOnline), [drivers]);
    const availableDriversForAssign = useMemo(() => drivers.filter((d) => d.isOnline && !d.isBlocked), [drivers]);
    const todayStart = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }, []);
    const getDriverTodayDeliveries = (driverId) => orders.filter(o => o.driverId === driverId && o.status === "delivered" && o.updatedAt && new Date(o.updatedAt).getTime() >= todayStart).length;
    const handleAssignDriver = async (orderId, driverId) => {
        try {
            await apiRequest(`/api/orders/${orderId}`, {
                method: "PATCH",
                body: JSON.stringify({ driverId, status: "confirmed" }),
            });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            toast({ title: "Livreur attribue" });
            setAssigningOrderId(null);
        }
        catch (err) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        }
    };
    const handleSave = async () => {
        try {
            if (editingDriver) {
                const { password, ...updateData } = form;
                const payload = password ? { ...updateData, password } : updateData;
                await apiRequest(`/api/drivers/${editingDriver.id}`, { method: "PATCH", body: JSON.stringify(payload) });
                toast({ title: "Livreur mis a jour" });
            }
            else {
                if (!form.password) {
                    toast({ title: "Mot de passe requis", variant: "destructive" });
                    return;
                }
                await apiRequest("/api/drivers", { method: "POST", body: JSON.stringify(form) });
                toast({ title: "Livreur ajoute!" });
            }
            queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
            setShowForm(false);
            setEditingDriver(null);
            setForm({ name: "", email: "", phone: "", password: "", vehicleType: "moto", vehiclePlate: "", driverLicense: "", commissionRate: 15 });
        }
        catch (err) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        }
    };
    const handleDelete = async (id) => {
        if (!confirm("Supprimer ce livreur definitivement ?"))
            return;
        await apiRequest(`/api/drivers/${id}`, { method: "DELETE" });
        queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
        if (selectedDriver?.id === id)
            setSelectedDriver(null);
        toast({ title: "Livreur supprime" });
    };
    const handleBlock = async (id, isBlocked) => {
        await apiRequest(`/api/drivers/${id}/block`, { method: "PATCH", body: JSON.stringify({ isBlocked: !isBlocked }) });
        queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
        toast({ title: isBlocked ? "Livreur debloque" : "Livreur bloque" });
    };
    const startEdit = (d) => {
        setEditingDriver(d);
        setForm({ name: d.name, email: d.email, phone: d.phone, password: "", vehicleType: d.vehicleType || "moto", vehiclePlate: d.vehiclePlate || "", driverLicense: d.driverLicense || "", commissionRate: d.commissionRate || 15 });
        setShowForm(true);
    };
    const sendAlarm = async (driverId) => {
        try {
            await apiRequest(`/api/drivers/${driverId}/alarm`, {
                method: "POST",
                body: JSON.stringify({ reason: alarmReason || "Urgence - Contactez l'administration immediatement" }),
            });
            toast({ title: "Alarme envoyee", description: "Le livreur a ete alerte" });
            setShowAlarmModal(null);
            setAlarmReason("");
        }
        catch (err) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        }
    };
    const sendQuickMessage = async (driverId) => {
        if (!chatMessage.trim() || !user)
            return;
        try {
            await apiRequest("/api/chat", {
                method: "POST",
                body: JSON.stringify({ senderId: user.id, receiverId: driverId, message: chatMessage.trim(), isRead: false }),
            });
            toast({ title: "Message envoye" });
            setChatMessage("");
        }
        catch (err) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        }
    };
    const selectDriver = (d) => {
        setSelectedDriver(d);
        setMobilePanel("info");
    };
    const sd = selectedDriver ? drivers.find((d) => d.id === selectedDriver.id) || selectedDriver : null;
    const sdOrders = sd ? getDriverActiveOrders(sd.id) : [];
    const sdDelivered = sd ? getDriverDelivered(sd.id) : [];
    const filterButtons = [
        { key: "all", label: "Tous", active: "bg-gray-900 text-white", idle: "bg-gray-100 text-gray-600 hover:bg-gray-200" },
        { key: "online", label: "Dispo", active: "bg-green-600 text-white", idle: "bg-green-50 text-green-700 hover:bg-green-100" },
        { key: "busy", label: "Occupe", active: "bg-orange-600 text-white", idle: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
        { key: "offline", label: "Off", active: "bg-gray-600 text-white", idle: "bg-gray-50 text-gray-500 hover:bg-gray-100" },
        { key: "blocked", label: "Bloque", active: "bg-red-600 text-white", idle: "bg-red-50 text-red-700 hover:bg-red-100" },
    ];
    const dispatchTabs = [
        { key: "gestion", label: "Gestion", count: drivers.length },
        { key: "unassigned", label: "Non attribuees", count: unassignedOrders.length },
        { key: "assigned", label: "Attribuees", count: assignedOrders.length },
        { key: "completed", label: "Completees", count: completedOrders.length },
        { key: "free", label: "Disponibles", count: freeDrivers.length },
        { key: "busy", label: "Occupes", count: busyDrivers.length },
        { key: "offline", label: "Hors ligne", count: offlineDrivers.length },
    ];
    const renderDriverCard = (d, showActiveOrder = true) => {
        const status = getDriverStatus(d);
        const active = getDriverActiveOrders(d.id);
        const todayCount = getDriverTodayDeliveries(d.id);
        return (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4", "data-testid": `dispatch-driver-card-${d.id}`, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative shrink-0", children: [_jsx("div", { className: `w-11 h-11 rounded-xl flex items-center justify-center ${status === "busy" ? "bg-orange-100" : status === "online" ? "bg-green-100" : status === "blocked" ? "bg-red-100" : "bg-gray-100"}`, children: _jsx(Truck, { size: 18, className: status === "busy" ? "text-orange-600" : status === "online" ? "text-green-600" : status === "blocked" ? "text-red-600" : "text-gray-400" }) }), _jsx("div", { className: `absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${d.isOnline ? "bg-green-500" : "bg-gray-400"}` })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("p", { className: "font-bold text-sm text-gray-900 truncate", "data-testid": `driver-name-${d.id}`, children: d.name }), _jsx("span", { className: `text-[8px] font-bold px-1.5 py-0.5 rounded-full ${d.isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`, children: d.isOnline ? "EN LIGNE" : "HORS LIGNE" })] }), _jsxs("div", { className: "flex items-center gap-3 mt-0.5 flex-wrap", children: [_jsxs("span", { className: "text-[10px] text-gray-500 flex items-center gap-1", children: [_jsx(Phone, { size: 9 }), d.phone] }), _jsxs("span", { className: "text-[10px] text-gray-500 capitalize", children: [d.vehicleType || "Moto", d.vehiclePlate ? ` - ${d.vehiclePlate}` : ""] })] }), _jsxs("div", { className: "flex items-center gap-3 mt-1 flex-wrap", children: [_jsxs("span", { className: "text-[10px] text-gray-400", children: [_jsx(Package, { size: 9, className: "inline mr-0.5" }), todayCount, " livr. aujourd'hui"] }), active.length > 0 && (_jsxs("span", { className: "text-[10px] text-orange-600 font-semibold", children: [active.length, " en cours"] }))] })] })] }), showActiveOrder && active.length > 0 && (_jsx("div", { className: "mt-3 space-y-2", children: active.map(order => (_jsxs("div", { className: "bg-gray-50 rounded-xl p-2.5 border border-gray-100", "data-testid": `dispatch-driver-order-${order.id}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [_jsx("span", { className: "font-bold text-[10px] text-gray-900", children: order.orderNumber }), _jsx("span", { className: `text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`, children: statusLabels[order.status] })] }), _jsxs("p", { className: "text-[9px] text-gray-500 mt-1 truncate", children: [_jsx(MapPin, { size: 8, className: "inline mr-0.5" }), order.deliveryAddress] })] }, order.id))) }))] }, d.id));
    };
    const renderOrderCard = (order, showAssign = false) => {
        const elapsed = order.createdAt ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000) : 0;
        const isUrgent = elapsed >= 45;
        const isApproaching = elapsed >= 30 && elapsed < 45;
        return (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4", "data-testid": `dispatch-order-card-${order.id}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "font-bold text-sm text-gray-900", "data-testid": `order-number-${order.id}`, children: order.orderNumber }), _jsx("span", { className: `text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`, children: statusLabels[order.status] }), isUrgent && _jsx("span", { className: "text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-red-600 text-white animate-pulse", "data-testid": `urgent-badge-${order.id}`, children: "URGENT" }), isApproaching && !isUrgent && _jsx("span", { className: "text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700", children: "BIENTOT" })] }), _jsx(ElapsedTime, { createdAt: order.createdAt })] }), _jsx("p", { className: "text-xs text-gray-600 mt-1.5", children: getRestaurantName(order.restaurantId) }), _jsxs("p", { className: "text-[10px] text-gray-500 mt-1 flex items-center gap-1 truncate", children: [_jsx(MapPin, { size: 9 }), order.deliveryAddress] }), _jsxs("div", { className: "flex items-center justify-between mt-2 gap-2 flex-wrap", children: [_jsx("span", { className: "text-xs font-bold text-red-600", children: formatPrice(order.total) }), order.estimatedDelivery && _jsx(CountdownTimer, { estimatedDelivery: order.estimatedDelivery, compact: true })] }), showAssign && (_jsx("div", { className: "mt-3 border-t border-gray-100 pt-3", children: assigningOrderId === order.id ? (_jsxs("div", { className: "space-y-1.5", children: [_jsx("p", { className: "text-[10px] text-gray-500 font-semibold", children: "Attribuer a :" }), _jsxs("div", { className: "max-h-32 overflow-y-auto space-y-1", children: [availableDriversForAssign.map((d) => (_jsxs("button", { onClick: () => handleAssignDriver(order.id, d.id), "data-testid": `assign-driver-${d.id}-to-order-${order.id}`, className: "w-full text-left px-3 py-2 bg-gray-50 rounded-lg text-xs hover:bg-red-50 hover:text-red-700 transition-colors flex items-center justify-between gap-2", children: [_jsx("span", { className: "truncate", children: d.name }), _jsx("span", { className: "text-[9px] text-gray-400 capitalize shrink-0", children: d.vehicleType || "Moto" })] }, d.id))), availableDriversForAssign.length === 0 && (_jsx("p", { className: "text-[10px] text-gray-400 text-center py-2", children: "Aucun livreur disponible" }))] }), _jsx("button", { onClick: () => setAssigningOrderId(null), className: "text-[10px] text-gray-500 hover:text-gray-700", children: "Annuler" })] })) : (_jsxs("button", { onClick: () => setAssigningOrderId(order.id), "data-testid": `button-assign-order-${order.id}`, className: "w-full py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5", children: [_jsx(User, { size: 12 }), " Attribuer un livreur"] })) }))] }, order.id));
    };
    const renderDispatchContent = () => {
        switch (dispatchTab) {
            case "unassigned":
                return (_jsxs("div", { children: [_jsx("div", { className: "flex items-center justify-between mb-4 gap-2 flex-wrap", children: _jsxs("h2", { className: "text-lg font-bold text-gray-900", "data-testid": "tab-title-unassigned", children: ["Commandes non attribuees (", unassignedOrders.length, ")"] }) }), unassignedOrders.length === 0 ? (_jsxs("div", { className: "text-center py-16 text-gray-400", children: [_jsx(Package, { size: 36, className: "mx-auto mb-3 opacity-20" }), _jsx("p", { className: "text-sm font-medium", children: "Aucune commande non attribuee" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3", children: unassignedOrders.map(order => renderOrderCard(order, true)) }))] }));
            case "assigned":
                return (_jsxs("div", { children: [_jsx("div", { className: "flex items-center justify-between mb-4 gap-2 flex-wrap", children: _jsxs("h2", { className: "text-lg font-bold text-gray-900", "data-testid": "tab-title-assigned", children: ["Commandes attribuees (", assignedOrders.length, ")"] }) }), assignedByDriver.size === 0 ? (_jsxs("div", { className: "text-center py-16 text-gray-400", children: [_jsx(Package, { size: 36, className: "mx-auto mb-3 opacity-20" }), _jsx("p", { className: "text-sm font-medium", children: "Aucune commande attribuee en cours" })] })) : (_jsx("div", { className: "space-y-4", children: Array.from(assignedByDriver.entries()).map(([driverId, driverOrders]) => {
                                const driver = drivers.find((d) => d.id === driverId);
                                return (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden", "data-testid": `assigned-driver-group-${driverId}`, children: [_jsxs("div", { className: "px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3 flex-wrap", children: [_jsx("div", { className: `w-9 h-9 rounded-lg flex items-center justify-center bg-orange-100`, children: _jsx(Truck, { size: 14, className: "text-orange-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-bold text-sm text-gray-900 truncate", children: driver?.name || `Livreur #${driverId}` }), _jsxs("p", { className: "text-[10px] text-gray-500", children: [driver?.phone, " - ", driver?.vehicleType || "Moto"] })] }), _jsxs("span", { className: "text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg", children: [driverOrders.length, " commande(s)"] })] }), _jsx("div", { className: "p-3 grid grid-cols-1 md:grid-cols-2 gap-2", children: driverOrders.map(order => (_jsxs("div", { className: "bg-gray-50 rounded-xl p-3 border border-gray-100", "data-testid": `assigned-order-${order.id}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [_jsx("span", { className: "font-bold text-xs text-gray-900", children: order.orderNumber }), _jsx("span", { className: `text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`, children: statusLabels[order.status] })] }), _jsx("p", { className: "text-[10px] text-gray-600 mt-1", children: getRestaurantName(order.restaurantId) }), _jsxs("p", { className: "text-[9px] text-gray-500 mt-0.5 truncate", children: [_jsx(MapPin, { size: 8, className: "inline mr-0.5" }), order.deliveryAddress] }), _jsxs("div", { className: "flex items-center justify-between mt-1.5 gap-2 flex-wrap", children: [_jsx("span", { className: "text-[10px] font-bold text-red-600", children: formatPrice(order.total) }), order.estimatedDelivery && _jsx(CountdownTimer, { estimatedDelivery: order.estimatedDelivery, compact: true })] })] }, order.id))) })] }, driverId));
                            }) }))] }));
            case "completed":
                return (_jsxs("div", { children: [_jsx("div", { className: "flex items-center justify-between mb-4 gap-2 flex-wrap", children: _jsxs("h2", { className: "text-lg font-bold text-gray-900", "data-testid": "tab-title-completed", children: ["Commandes completees (", completedOrders.length, ")"] }) }), completedOrders.length === 0 ? (_jsxs("div", { className: "text-center py-16 text-gray-400", children: [_jsx(CheckCircle2, { size: 36, className: "mx-auto mb-3 opacity-20" }), _jsx("p", { className: "text-sm font-medium", children: "Aucune commande livree" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3", children: completedOrders.map(order => {
                                const isOnTime = order.estimatedDelivery && order.updatedAt
                                    ? new Date(order.updatedAt).getTime() <= new Date(order.estimatedDelivery).getTime()
                                    : null;
                                const driver = order.driverId ? drivers.find((d) => d.id === order.driverId) : null;
                                return (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4", "data-testid": `completed-order-${order.id}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [_jsx("span", { className: "font-bold text-sm text-gray-900", children: order.orderNumber }), isOnTime === true && (_jsx("span", { className: "text-[8px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700", "data-testid": `ontime-badge-${order.id}`, children: "A l'heure" })), isOnTime === false && (_jsx("span", { className: "text-[8px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700", "data-testid": `late-badge-${order.id}`, children: "En retard" })), isOnTime === null && (_jsx("span", { className: "text-[8px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500", children: "--" }))] }), _jsx("p", { className: "text-xs text-gray-600 mt-1.5", children: getRestaurantName(order.restaurantId) }), _jsxs("p", { className: "text-[10px] text-gray-500 mt-1 truncate", children: [_jsx(MapPin, { size: 9, className: "inline mr-0.5" }), order.deliveryAddress] }), _jsxs("div", { className: "flex items-center justify-between mt-2 gap-2 flex-wrap", children: [_jsx("span", { className: "text-xs font-bold text-red-600", children: formatPrice(order.total) }), driver && _jsxs("span", { className: "text-[10px] text-gray-500", children: [_jsx(Truck, { size: 9, className: "inline mr-0.5" }), driver.name] })] }), order.updatedAt && _jsx("p", { className: "text-[9px] text-gray-400 mt-1.5", children: formatDate(order.updatedAt) })] }, order.id));
                            }) }))] }));
            case "free":
                return (_jsxs("div", { children: [_jsx("div", { className: "flex items-center justify-between mb-4 gap-2 flex-wrap", children: _jsxs("h2", { className: "text-lg font-bold text-gray-900", "data-testid": "tab-title-free", children: ["Livreurs disponibles (", freeDrivers.length, ")"] }) }), freeDrivers.length === 0 ? (_jsxs("div", { className: "text-center py-16 text-gray-400", children: [_jsx(Truck, { size: 36, className: "mx-auto mb-3 opacity-20" }), _jsx("p", { className: "text-sm font-medium", children: "Aucun livreur disponible" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3", children: freeDrivers.map((d) => renderDriverCard(d, false)) }))] }));
            case "busy":
                return (_jsxs("div", { children: [_jsx("div", { className: "flex items-center justify-between mb-4 gap-2 flex-wrap", children: _jsxs("h2", { className: "text-lg font-bold text-gray-900", "data-testid": "tab-title-busy", children: ["Livreurs occupes (", busyDrivers.length, ")"] }) }), busyDrivers.length === 0 ? (_jsxs("div", { className: "text-center py-16 text-gray-400", children: [_jsx(Truck, { size: 36, className: "mx-auto mb-3 opacity-20" }), _jsx("p", { className: "text-sm font-medium", children: "Aucun livreur occupe" })] })) : (_jsx("div", { className: "space-y-3", children: busyDrivers.map((d) => {
                                const active = getDriverActiveOrders(d.id);
                                const todayCount = getDriverTodayDeliveries(d.id);
                                const isExpanded = expandedBusyDriver === d.id;
                                return (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden", "data-testid": `busy-driver-card-${d.id}`, children: [_jsxs("button", { onClick: () => setExpandedBusyDriver(isExpanded ? null : d.id), "data-testid": `toggle-busy-driver-${d.id}`, className: "w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left", children: [_jsx("div", { className: `w-11 h-11 rounded-xl flex items-center justify-center bg-orange-100 shrink-0`, children: _jsx(Truck, { size: 18, className: "text-orange-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("p", { className: "font-bold text-sm text-gray-900 truncate", children: d.name }), _jsxs("span", { className: "text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700", children: ["(", active.length, " commandes)"] })] }), _jsxs("div", { className: "flex items-center gap-3 mt-0.5 flex-wrap", children: [_jsxs("span", { className: "text-[10px] text-gray-500", children: [_jsx(Phone, { size: 9, className: "inline mr-0.5" }), d.phone] }), _jsx("span", { className: "text-[10px] text-gray-500 capitalize", children: d.vehicleType || "Moto" }), _jsxs("span", { className: "text-[10px] text-gray-400", children: [todayCount, " livr. aujourd'hui"] })] })] }), isExpanded ? _jsx(ChevronUp, { size: 16, className: "text-gray-400 shrink-0" }) : _jsx(ChevronDown, { size: 16, className: "text-gray-400 shrink-0" })] }), isExpanded && (_jsx("div", { className: "px-4 pb-3 border-t border-gray-100 pt-3 space-y-2", children: active.map(order => (_jsxs("div", { className: "bg-gray-50 rounded-xl p-3 border border-gray-100", "data-testid": `busy-driver-order-${order.id}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [_jsx("span", { className: "font-bold text-xs text-gray-900", children: order.orderNumber }), _jsx("span", { className: `text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`, children: statusLabels[order.status] })] }), _jsx("p", { className: "text-[10px] text-gray-600 mt-1", children: getRestaurantName(order.restaurantId) }), _jsxs("p", { className: "text-[9px] text-gray-500 mt-0.5 truncate", children: [_jsx(MapPin, { size: 8, className: "inline mr-0.5" }), order.deliveryAddress] }), _jsxs("div", { className: "flex items-center justify-between mt-1.5 gap-2 flex-wrap", children: [_jsx("span", { className: "text-[10px] font-bold text-red-600", children: formatPrice(order.total) }), order.estimatedDelivery && _jsx(CountdownTimer, { estimatedDelivery: order.estimatedDelivery, compact: true })] })] }, order.id))) }))] }, d.id));
                            }) }))] }));
            case "offline":
                return (_jsxs("div", { children: [_jsx("div", { className: "flex items-center justify-between mb-4 gap-2 flex-wrap", children: _jsxs("h2", { className: "text-lg font-bold text-gray-900", "data-testid": "tab-title-offline", children: ["Livreurs hors ligne (", offlineDrivers.length, ")"] }) }), offlineDrivers.length === 0 ? (_jsxs("div", { className: "text-center py-16 text-gray-400", children: [_jsx(Truck, { size: 36, className: "mx-auto mb-3 opacity-20" }), _jsx("p", { className: "text-sm font-medium", children: "Tous les livreurs sont en ligne" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3", children: offlineDrivers.map((d) => renderDriverCard(d, false)) }))] }));
            default:
                return null;
        }
    };
    return (_jsxs(AdminLayout, { title: "Gestion des livreurs", children: [_jsx("div", { className: "mb-4 overflow-x-auto -mx-2 px-2", children: _jsx("div", { className: "flex gap-1.5 min-w-max", children: dispatchTabs.map(tab => (_jsxs("button", { onClick: () => setDispatchTab(tab.key), "data-testid": `dispatch-tab-${tab.key}`, className: `px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${dispatchTab === tab.key
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"}`, children: [tab.label, _jsx("span", { className: `text-[10px] px-1.5 py-0.5 rounded-full font-bold ${dispatchTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`, children: tab.count })] }, tab.key))) }) }), dispatchTab !== "gestion" ? (renderDispatchContent()) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4", children: [
                            { label: "Total", value: drivers.length, icon: Truck, bg: "bg-blue-50", fg: "text-blue-600" },
                            { label: "Disponibles", value: statusCounts.online, icon: CheckCircle2, bg: "bg-green-50", fg: "text-green-600" },
                            { label: "En livraison", value: statusCounts.busy, icon: Package, bg: "bg-orange-50", fg: "text-orange-600" },
                            { label: "Hors ligne", value: statusCounts.offline, icon: Circle, bg: "bg-gray-50", fg: "text-gray-500" },
                            { label: "Bloques", value: statusCounts.blocked, icon: Ban, bg: "bg-red-50", fg: "text-red-600" },
                        ].map(s => (_jsxs("div", { className: "bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center gap-3", "data-testid": `stat-${s.label.toLowerCase()}`, children: [_jsx("div", { className: `w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center shrink-0`, children: _jsx(s.icon, { size: 16, className: s.fg }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xl font-black text-gray-900 leading-none", children: s.value }), _jsx("p", { className: "text-[10px] text-gray-500 mt-0.5", children: s.label })] })] }, s.label))) }), _jsx("div", { className: "flex lg:hidden gap-1 mb-3 bg-white rounded-xl p-1 border border-gray-100", children: ([
                            { key: "list", label: "Liste", icon: Menu },
                            { key: "info", label: "Details", icon: Truck },
                            { key: "map", label: "Carte", icon: Navigation },
                        ]).map(tab => (_jsxs("button", { onClick: () => setMobilePanel(tab.key), "data-testid": `tab-${tab.key}`, className: `flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${mobilePanel === tab.key ? "bg-red-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`, children: [_jsx(tab.icon, { size: 14 }), tab.label] }, tab.key))) }), showForm && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4", style: { zIndex: 9999 }, onClick: () => { setShowForm(false); setEditingDriver(null); }, children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto", style: { zIndex: 10000 }, onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "font-bold text-base", children: editingDriver ? "Modifier le livreur" : "Nouveau livreur" }), _jsx("button", { onClick: () => { setShowForm(false); setEditingDriver(null); }, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [[
                                            { label: "Nom complet *", key: "name", type: "text", testid: "input-driver-name" },
                                            { label: "Email *", key: "email", type: "email", testid: "input-driver-email" },
                                            { label: "Telephone *", key: "phone", type: "tel", testid: "input-driver-phone" },
                                            ...(!editingDriver ? [{ label: "Mot de passe *", key: "password", type: "password", testid: "input-driver-password" }] : []),
                                            { label: "Plaque", key: "vehiclePlate", type: "text", testid: "input-vehicle-plate" },
                                            { label: "Permis", key: "driverLicense", type: "text", testid: "input-license" },
                                        ].map(f => (_jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-semibold text-gray-500 mb-1 block", children: f.label }), _jsx("input", { type: f.type, value: form[f.key], onChange: e => setForm({ ...form, [f.key]: e.target.value }), "data-testid": f.testid, className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" })] }, f.key))), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-semibold text-gray-500 mb-1 block", children: "Vehicule" }), _jsxs("select", { value: form.vehicleType, onChange: e => setForm({ ...form, vehicleType: e.target.value }), "data-testid": "select-vehicle-type", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm", children: [_jsx("option", { value: "moto", children: "Moto" }), _jsx("option", { value: "velo", children: "Velo" }), _jsx("option", { value: "voiture", children: "Voiture" }), _jsx("option", { value: "scooter", children: "Scooter" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-semibold text-gray-500 mb-1 block", children: "Commission (%)" }), _jsx("input", { type: "number", value: form.commissionRate, onChange: e => setForm({ ...form, commissionRate: Number(e.target.value) }), "data-testid": "input-commission", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" })] })] }), _jsxs("div", { className: "flex gap-2 mt-5", children: [_jsx("button", { onClick: handleSave, "data-testid": "button-save-driver", className: "flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200", children: editingDriver ? "Mettre a jour" : "Creer le livreur" }), _jsx("button", { onClick: () => { setShowForm(false); setEditingDriver(null); }, className: "px-5 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold text-gray-600", children: "Annuler" })] })] }) })), showAlarmModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4", style: { zIndex: 9999 }, children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl p-5 w-full max-w-md", style: { zIndex: 10000 }, children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center", children: _jsx(Bell, { size: 18, className: "text-red-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-sm text-gray-900", children: "Envoyer une alarme" }), _jsxs("p", { className: "text-[10px] text-gray-500", children: ["a ", showAlarmModal.name] })] })] }), _jsxs("select", { value: alarmReason, onChange: e => setAlarmReason(e.target.value), "data-testid": "alarm-reason-select", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-2", children: [_jsx("option", { value: "", children: "Choisir un motif..." }), _jsx("option", { value: "Retard de livraison detecte - Accelerez votre course", children: "Retard de livraison" }), _jsx("option", { value: "Client en attente - Merci de vous depecher", children: "Client en attente" }), _jsx("option", { value: "Changement d'adresse de livraison - Verifiez vos commandes", children: "Changement d'adresse" }), _jsx("option", { value: "Contactez l'administration immediatement", children: "Contact urgent" }), _jsx("option", { value: "Votre position GPS n'est plus visible - Reactiver la localisation", children: "GPS perdu" })] }), _jsx("input", { type: "text", value: alarmReason, onChange: e => setAlarmReason(e.target.value), placeholder: "Ou tapez un message personnalise...", "data-testid": "alarm-reason-input", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => sendAlarm(showAlarmModal.id), "data-testid": "button-send-alarm", className: "flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 flex items-center justify-center gap-2", children: [_jsx(Zap, { size: 14 }), " Envoyer l'alarme"] }), _jsx("button", { onClick: () => { setShowAlarmModal(null); setAlarmReason(""); }, className: "px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-600", children: "Annuler" })] })] }) })), _jsxs("div", { className: "flex gap-3", style: { height: "calc(100vh - 340px)", minHeight: 400 }, children: [_jsx("div", { className: `${mobilePanel === "info" ? "flex" : "hidden"} lg:flex w-full lg:w-[280px] xl:w-[300px] shrink-0 flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`, children: sd ? (_jsxs("div", { className: "flex-1 overflow-y-auto", children: [_jsxs("div", { className: "p-4 border-b border-gray-100", children: [_jsxs("button", { onClick: () => { setSelectedDriver(null); setMobilePanel("list"); }, className: "lg:hidden flex items-center gap-1 text-xs text-gray-500 mb-3 hover:text-gray-700", "data-testid": "back-to-list", children: [_jsx(ChevronLeft, { size: 14 }), " Retour a la liste"] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: `w-14 h-14 rounded-2xl flex items-center justify-center ${getDriverStatus(sd) === "busy" ? "bg-orange-100" :
                                                                        getDriverStatus(sd) === "online" ? "bg-green-100" :
                                                                            getDriverStatus(sd) === "blocked" ? "bg-red-100" : "bg-gray-100"}`, children: _jsx(Truck, { size: 22, className: getDriverStatus(sd) === "busy" ? "text-orange-600" :
                                                                            getDriverStatus(sd) === "online" ? "text-green-600" :
                                                                                getDriverStatus(sd) === "blocked" ? "text-red-600" : "text-gray-400" }) }), _jsx("div", { className: `absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${sd.isOnline ? "bg-green-500" : "bg-gray-400"}` })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-black text-sm text-gray-900 truncate", "data-testid": "driver-detail-name", children: sd.name }), _jsxs("p", { className: "text-[10px] text-gray-500 flex items-center gap-1 mt-0.5", children: [_jsx(Phone, { size: 9 }), sd.phone] }), _jsx("span", { className: `text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${getDriverStatus(sd) === "busy" ? "bg-orange-100 text-orange-700" :
                                                                        getDriverStatus(sd) === "online" ? "bg-green-100 text-green-700" :
                                                                            getDriverStatus(sd) === "blocked" ? "bg-red-100 text-red-700" :
                                                                                "bg-gray-100 text-gray-500"}`, children: getDriverStatus(sd) === "busy" ? "EN LIVRAISON" : getDriverStatus(sd) === "online" ? "DISPONIBLE" : getDriverStatus(sd) === "blocked" ? "BLOQUE" : "HORS LIGNE" })] })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-0 border-b border-gray-100", children: [_jsxs("div", { className: "p-3 text-center border-r border-gray-100", children: [_jsx("p", { className: "text-base font-black text-green-600", children: formatPrice(sdDelivered.reduce((s, o) => s + o.deliveryFee, 0)) }), _jsx("p", { className: "text-[8px] text-gray-400 mt-0.5", children: "GAINS" })] }), _jsxs("div", { className: "p-3 text-center border-r border-gray-100", children: [_jsx("p", { className: "text-base font-black text-blue-600", children: sdDelivered.length }), _jsx("p", { className: "text-[8px] text-gray-400 mt-0.5", children: "LIVREES" })] }), _jsxs("div", { className: "p-3 text-center", children: [_jsx("p", { className: "text-base font-black text-orange-600", children: sdOrders.length }), _jsx("p", { className: "text-[8px] text-gray-400 mt-0.5", children: "EN COURS" })] })] }), _jsxs("div", { className: "p-3 border-b border-gray-100", children: [_jsx("p", { className: "text-[10px] text-gray-500 mb-2 font-semibold", children: "INFORMATIONS" }), _jsxs("div", { className: "space-y-1.5 text-xs text-gray-700", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Vehicule" }), _jsx("span", { className: "font-semibold capitalize", children: sd.vehicleType || "Moto" })] }), sd.vehiclePlate && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Plaque" }), _jsx("span", { className: "font-semibold", children: sd.vehiclePlate })] })), sd.driverLicense && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Permis" }), _jsx("span", { className: "font-semibold", children: sd.driverLicense })] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Commission" }), _jsxs("span", { className: "font-semibold", children: [sd.commissionRate || 15, "%"] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Email" }), _jsx("span", { className: "font-semibold text-[10px] truncate ml-2", children: sd.email })] })] })] }), _jsxs("div", { className: "p-3 border-b border-gray-100", children: [_jsx("p", { className: "text-[10px] text-gray-500 mb-2 font-semibold", children: "ACTIONS RAPIDES" }), _jsxs("div", { className: "grid grid-cols-4 gap-1.5", children: [_jsxs("button", { onClick: () => setShowAlarmModal(sd), "data-testid": "button-alarm-driver", className: "flex flex-col items-center gap-1 p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors", title: "Alarme", children: [_jsx(Bell, { size: 16, className: "text-red-600" }), _jsx("span", { className: "text-[8px] text-red-600 font-semibold", children: "Alarme" })] }), _jsxs("button", { onClick: () => startEdit(sd), "data-testid": "button-edit-selected", className: "flex flex-col items-center gap-1 p-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors", title: "Modifier", children: [_jsx(Edit, { size: 16, className: "text-blue-600" }), _jsx("span", { className: "text-[8px] text-blue-600 font-semibold", children: "Modifier" })] }), _jsxs("button", { onClick: () => handleBlock(sd.id, sd.isBlocked), "data-testid": "button-block-selected", className: `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${sd.isBlocked ? "bg-green-50 hover:bg-green-100" : "bg-orange-50 hover:bg-orange-100"}`, children: [sd.isBlocked ? _jsx(CheckCircle2, { size: 16, className: "text-green-600" }) : _jsx(Ban, { size: 16, className: "text-orange-600" }), _jsx("span", { className: `text-[8px] font-semibold ${sd.isBlocked ? "text-green-600" : "text-orange-600"}`, children: sd.isBlocked ? "Debloquer" : "Bloquer" })] }), _jsxs("button", { onClick: () => handleDelete(sd.id), "data-testid": "button-delete-selected", className: "flex flex-col items-center gap-1 p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors", title: "Supprimer", children: [_jsx(Trash2, { size: 16, className: "text-red-600" }), _jsx("span", { className: "text-[8px] text-red-600 font-semibold", children: "Supprimer" })] })] })] }), _jsxs("div", { className: "p-3 border-b border-gray-100", children: [_jsx("p", { className: "text-[10px] text-gray-500 mb-2 font-semibold", children: "MESSAGE RAPIDE" }), _jsxs("div", { className: "flex gap-1.5", children: [_jsx("input", { type: "text", value: chatMessage, onChange: e => setChatMessage(e.target.value), onKeyDown: e => e.key === "Enter" && sendQuickMessage(sd.id), placeholder: `Ecrire a ${sd.name?.split(" ")[0]}...`, "data-testid": "quick-chat-input", className: "flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500" }), _jsx("button", { onClick: () => sendQuickMessage(sd.id), "data-testid": "quick-chat-send", className: "w-9 h-9 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 shrink-0", children: _jsx(Send, { size: 14 }) })] })] }), sdOrders.length > 0 && (_jsxs("div", { className: "p-3", children: [_jsxs("p", { className: "text-[10px] text-gray-500 mb-2 font-semibold flex items-center gap-1", children: [_jsx(Package, { size: 10, className: "text-orange-600" }), " LIVRAISONS EN COURS (", sdOrders.length, ")"] }), _jsx("div", { className: "space-y-2", children: sdOrders.map(order => (_jsxs("div", { className: "bg-gray-50 rounded-xl p-2.5 border border-gray-100", "data-testid": `driver-order-${order.id}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "font-bold text-[10px] text-gray-900", children: order.orderNumber }), _jsx(CountdownTimer, { estimatedDelivery: order.estimatedDelivery, compact: true })] }), _jsxs("p", { className: "text-[9px] text-gray-500 flex items-center gap-1 truncate", children: [_jsx(MapPin, { size: 8 }), order.deliveryAddress] }), _jsxs("div", { className: "flex items-center justify-between mt-1.5", children: [_jsx("span", { className: "text-[10px] font-bold text-red-600", children: formatPrice(order.total) }), _jsx("span", { className: `text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`, children: statusLabels[order.status] })] })] }, order.id))) })] })), sd.lat && sd.lng && (_jsx("div", { className: "p-3 border-t border-gray-100", children: _jsxs("p", { className: "text-[9px] text-gray-400 flex items-center gap-1", children: [_jsx(Navigation, { size: 9 }), " GPS: ", sd.lat.toFixed(4), ", ", sd.lng.toFixed(4)] }) }))] })) : (_jsx("div", { className: "flex-1 flex items-center justify-center p-6", children: _jsxs("div", { className: "text-center text-gray-400", children: [_jsx(Truck, { size: 32, className: "mx-auto mb-2 opacity-20" }), _jsx("p", { className: "text-xs font-semibold text-gray-500", children: "Selectionnez un livreur" }), _jsx("p", { className: "text-[10px] mt-1", children: "dans la liste pour voir ses details" })] }) })) }), _jsxs("div", { className: `${mobilePanel === "map" ? "flex" : "hidden"} lg:flex flex-1 flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`, children: [_jsxs("div", { className: "px-4 py-2.5 border-b border-gray-100 flex items-center justify-between shrink-0", children: [_jsxs("h3", { className: "font-bold text-xs text-gray-900 flex items-center gap-2", children: [_jsx(Navigation, { size: 12, className: "text-red-600" }), " Carte en temps reel"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-[9px] text-gray-400", children: [driversWithLocation.length, " visible(s)"] }), sd?.lat && sd?.lng && (_jsx("span", { className: "text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold", children: sd.name?.split(" ")[0] }))] })] }), _jsx("div", { className: "flex-1 relative", style: { minHeight: 0 }, children: _jsxs(MapContainer, { center: sd?.lat && sd?.lng ? [sd.lat, sd.lng] : KINSHASA_CENTER, zoom: sd?.lat ? 16 : 12, style: { height: "100%", width: "100%", position: "absolute", inset: 0 }, scrollWheelZoom: true, children: [_jsx(TileLayer, { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '\u00A9 OpenStreetMap' }), _jsx(MapInvalidateSize, {}), sd?.lat && sd?.lng && _jsx(MapFlyTo, { lat: sd.lat, lng: sd.lng }), driversWithLocation.map((d) => (_jsx(Marker, { position: [d.lat, d.lng], icon: sd?.id === d.id ? driverIcon : onlineIcon, eventHandlers: { click: () => selectDriver(d) }, children: _jsx(Popup, { children: _jsxs("div", { className: "text-xs min-w-[120px]", children: [_jsx("p", { className: "font-bold text-sm", children: d.name }), _jsx("p", { className: "text-gray-500", children: d.phone }), _jsx("p", { className: "capitalize text-gray-400", children: d.vehicleType || "Moto" }), getDriverActiveOrders(d.id).length > 0 && (_jsxs("p", { className: "text-orange-600 font-semibold mt-1", children: [getDriverActiveOrders(d.id).length, " livraison(s)"] }))] }) }) }, d.id)))] }) })] }), _jsxs("div", { className: `${mobilePanel === "list" ? "flex" : "hidden"} lg:flex w-full lg:w-[280px] xl:w-[300px] shrink-0 flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`, children: [_jsxs("div", { className: "p-3 border-b border-gray-100 space-y-2 shrink-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900", children: ["Livreurs (", filteredDrivers.length, ")"] }), _jsx("button", { onClick: () => { setShowForm(true); setEditingDriver(null); setForm({ name: "", email: "", phone: "", password: "", vehicleType: "moto", vehiclePlate: "", driverLicense: "", commissionRate: 15 }); }, "data-testid": "button-add-driver", className: "bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-700 shadow-lg shadow-red-200", children: _jsx(Plus, { size: 14 }) })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { size: 13, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher...", value: search, onChange: e => setSearch(e.target.value), "data-testid": "search-drivers", className: "w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500" })] }), _jsx("div", { className: "flex gap-1 flex-wrap", children: filterButtons.map(f => (_jsxs("button", { onClick: () => setFilter(f.key), "data-testid": `filter-${f.key}`, className: `px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${filter === f.key ? f.active : f.idle}`, children: [f.label, " ", statusCounts[f.key]] }, f.key))) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto", children: [filteredDrivers.map((d) => {
                                                const status = getDriverStatus(d);
                                                const active = getDriverActiveOrders(d.id);
                                                const isSelected = sd?.id === d.id;
                                                return (_jsx("div", { onClick: () => selectDriver(d), "data-testid": `driver-card-${d.id}`, className: `px-3 py-2.5 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 ${isSelected ? "bg-red-50 border-l-[3px] border-l-red-600" : ""}`, children: _jsxs("div", { className: "flex items-center gap-2.5", children: [_jsxs("div", { className: "relative shrink-0", children: [_jsx("div", { className: `w-9 h-9 rounded-lg flex items-center justify-center ${status === "busy" ? "bg-orange-100" : status === "online" ? "bg-green-100" : status === "blocked" ? "bg-red-100" : "bg-gray-100"}`, children: _jsx(Truck, { size: 14, className: status === "busy" ? "text-orange-600" : status === "online" ? "text-green-600" : status === "blocked" ? "text-red-600" : "text-gray-400" }) }), _jsx("div", { className: `absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[1.5px] border-white ${status === "busy" ? "bg-orange-500" : status === "online" ? "bg-green-500" : status === "blocked" ? "bg-red-500" : "bg-gray-400"}` })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between gap-1", children: [_jsx("p", { className: "font-bold text-xs text-gray-900 truncate", children: d.name }), _jsx("span", { className: `text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${status === "busy" ? "bg-orange-100 text-orange-700" :
                                                                                    status === "online" ? "bg-green-100 text-green-700" :
                                                                                        status === "blocked" ? "bg-red-100 text-red-700" :
                                                                                            "bg-gray-100 text-gray-500"}`, children: status === "busy" ? "OCCUPE" : status === "online" ? "DISPO" : status === "blocked" ? "BLOQUE" : "OFF" })] }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [_jsx("span", { className: "text-[9px] text-gray-400 capitalize", children: d.vehicleType || "Moto" }), _jsx("span", { className: "text-[9px] text-gray-400", children: d.phone })] }), active.length > 0 && (_jsxs("div", { className: "flex items-center gap-1.5 mt-1", children: [_jsxs("span", { className: "text-[9px] text-orange-600 font-semibold", children: [active.length, " cmd"] }), active[0]?.estimatedDelivery && (_jsx(CountdownTimer, { estimatedDelivery: active[0].estimatedDelivery, compact: true }))] }))] })] }) }, d.id));
                                            }), filteredDrivers.length === 0 && (_jsxs("div", { className: "text-center py-12 text-gray-400", children: [_jsx(Truck, { size: 28, className: "mx-auto mb-2 opacity-20" }), _jsx("p", { className: "text-xs font-medium", children: "Aucun livreur trouve" })] }))] })] })] })] }))] }));
}
//# sourceMappingURL=AdminDrivers.js.map