import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import { apiRequest, queryClient, authFetch , authFetchJson} from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import { useToast } from "../../hooks/use-toast";
import {
  Truck, MapPin, Phone, Circle, Plus, X, Edit, Trash2, Ban, CheckCircle2,
  Bell, Clock, Navigation, Package, DollarSign, Search, ChevronRight,
  Timer, Zap, Send, Star, Power, ChevronLeft, Menu, AlertTriangle,
  User, Settings, ChevronDown, ChevronUp
} from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors } from "../../lib/utils";
import type { Order } from "@shared/schema";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const KINSHASA_CENTER: [number, number] = [-4.3217, 15.3126];

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

function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
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

function CountdownTimer({ estimatedDelivery, compact }: { estimatedDelivery: string | null; compact?: boolean }) {
  const [remaining, setRemaining] = useState("");
  const [isLate, setIsLate] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!estimatedDelivery) { setRemaining("--:--"); return; }
    const update = () => {
      const diff = new Date(estimatedDelivery).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(`-${Math.abs(Math.floor(diff / 60000))}min`);
        setIsLate(true); setIsUrgent(true);
      } else {
        const min = Math.floor(diff / 60000);
        const sec = Math.floor((diff % 60000) / 1000);
        setRemaining(`${min}:${sec.toString().padStart(2, "0")}`);
        setIsLate(false); setIsUrgent(min < 5);
      }
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [estimatedDelivery]);

  if (compact) {
    return (
      <span className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md ${isLate ? "bg-red-100 text-red-700 animate-pulse" : isUrgent ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`} data-testid="countdown-timer">
        <Timer size={8} className="inline mr-0.5" />{remaining}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${isLate ? "bg-red-50 border border-red-200" : isUrgent ? "bg-orange-50 border border-orange-200" : "bg-green-50 border border-green-200"}`}>
      <Timer size={12} className={isLate ? "text-red-600 animate-pulse" : isUrgent ? "text-orange-600" : "text-green-600"} />
      <span className={`font-mono font-bold text-xs ${isLate ? "text-red-700" : isUrgent ? "text-orange-700" : "text-green-700"}`}>{remaining}</span>
      <span className={`text-[9px] ${isLate ? "text-red-500" : isUrgent ? "text-orange-500" : "text-green-500"}`}>
        {isLate ? "RETARD" : isUrgent ? "URGENT" : "restant"}
      </span>
    </div>
  );
}

function ElapsedTime({ createdAt }: { createdAt: string | Date | null }) {
  const [elapsed, setElapsed] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!createdAt) { setElapsed("--"); return; }
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

  return (
    <span className={`text-[10px] font-semibold ${isUrgent ? "text-red-600" : "text-gray-500 dark:text-gray-400"}`} data-testid="elapsed-time">
      <Clock size={9} className="inline mr-0.5" />{elapsed}
      {isUrgent && <span className="ml-1 px-1 py-0.5 bg-red-600 text-white text-[8px] font-bold rounded">URGENT</span>}
    </span>
  );
}

type DispatchTab = "unassigned" | "assigned" | "completed" | "free" | "busy" | "offline" | "gestion";

export default function AdminDrivers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dispatchTab, setDispatchTab] = useState<DispatchTab>("gestion");
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "online" | "busy" | "offline" | "blocked">("all");
  const [search, setSearch] = useState("");
  const [alarmReason, setAlarmReason] = useState("");
  const [showAlarmModal, setShowAlarmModal] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"list" | "info" | "map">("list");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", vehicleType: "moto", vehiclePlate: "", driverLicense: "", commissionRate: 15 });
  const [expandedBusyDriver, setExpandedBusyDriver] = useState<number | null>(null);
  const [assigningOrderId, setAssigningOrderId] = useState<number | null>(null);

  const { data: drivers = [] } = useQuery<any[]>({
    queryKey: ["/api/drivers"],
    queryFn: () => authFetchJson("/api/drivers"),
    refetchInterval: 5000,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000,
  });

  const { data: restaurants = [] } = useQuery<any[]>({
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
  const getDriverActiveOrders = (driverId: number) => activeOrders.filter(o => o.driverId === driverId);
  const getDriverDelivered = (driverId: number) => orders.filter(o => o.driverId === driverId && o.status === "delivered");
  const getDriverStatus = (d: any) => {
    if (d.isBlocked) return "blocked";
    if (!d.isOnline) return "offline";
    if (getDriverActiveOrders(d.id).length > 0) return "busy";
    return "online";
  };

  const getRestaurantName = (restaurantId: number) => {
    const r = restaurants.find((rest: any) => rest.id === restaurantId);
    return r?.name || `Restaurant #${restaurantId}`;
  };

  const filteredDrivers = drivers
    .filter((d: any) => filter === "all" ? true : getDriverStatus(d) === filter)
    .filter((d: any) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.phone?.includes(search) ||
      d.email?.toLowerCase().includes(search.toLowerCase())
    );

  const statusCounts = {
    all: drivers.length,
    online: drivers.filter((d: any) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length === 0).length,
    busy: drivers.filter((d: any) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length > 0).length,
    offline: drivers.filter((d: any) => !d.isOnline && !d.isBlocked).length,
    blocked: drivers.filter((d: any) => d.isBlocked).length,
  };

  const driversWithLocation = drivers.filter((d: any) => d.lat && d.lng && d.isOnline);

  const unassignedOrders = useMemo(() =>
    orders.filter(o => !o.driverId && ["pending", "confirmed", "preparing", "ready"].includes(o.status)),
    [orders]
  );

  const assignedOrders = useMemo(() =>
    orders.filter(o => o.driverId && !["delivered", "cancelled"].includes(o.status)),
    [orders]
  );

  const assignedByDriver = useMemo(() => {
    const map = new Map<number, Order[]>();
    assignedOrders.forEach(o => {
      if (o.driverId) {
        const existing = map.get(o.driverId) || [];
        existing.push(o);
        map.set(o.driverId, existing);
      }
    });
    return map;
  }, [assignedOrders]);

  const completedOrders = useMemo(() =>
    orders.filter(o => o.status === "delivered"),
    [orders]
  );

  const freeDrivers = useMemo(() =>
    drivers.filter((d: any) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length === 0),
    [drivers, activeOrders]
  );

  const busyDrivers = useMemo(() =>
    drivers.filter((d: any) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length > 0),
    [drivers, activeOrders]
  );

  const offlineDrivers = useMemo(() =>
    drivers.filter((d: any) => !d.isOnline),
    [drivers]
  );

  const availableDriversForAssign = useMemo(() =>
    drivers.filter((d: any) => d.isOnline && !d.isBlocked),
    [drivers]
  );

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const getDriverTodayDeliveries = (driverId: number) =>
    orders.filter(o => o.driverId === driverId && o.status === "delivered" && o.updatedAt && new Date(o.updatedAt).getTime() >= todayStart).length;

  const handleAssignDriver = async (orderId: number, driverId: number) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ driverId, status: "confirmed" }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Livreur attribue" });
      setAssigningOrderId(null);
    } catch (err: any) {
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
      } else {
        if (!form.password) { toast({ title: "Mot de passe requis", variant: "destructive" }); return; }
        await apiRequest("/api/drivers", { method: "POST", body: JSON.stringify(form) });
        toast({ title: "Livreur ajoute!" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      setShowForm(false);
      setEditingDriver(null);
      setForm({ name: "", email: "", phone: "", password: "", vehicleType: "moto", vehiclePlate: "", driverLicense: "", commissionRate: 15 });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce livreur definitivement ?")) return;
    try {
      await apiRequest(`/api/drivers/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      if (selectedDriver?.id === id) setSelectedDriver(null);
      toast({ title: "Livreur supprime" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de supprimer le livreur", variant: "destructive" });
    }
  };

  const handleBlock = async (id: number, isBlocked: boolean) => {
    try {
      await apiRequest(`/api/drivers/${id}/block`, { method: "PATCH", body: JSON.stringify({ isBlocked: !isBlocked }) });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({ title: isBlocked ? "Livreur debloque" : "Livreur bloque" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de modifier le statut du livreur", variant: "destructive" });
    }
  };

  const startEdit = (d: any) => {
    setEditingDriver(d);
    setForm({ name: d.name, email: d.email, phone: d.phone, password: "", vehicleType: d.vehicleType || "moto", vehiclePlate: d.vehiclePlate || "", driverLicense: d.driverLicense || "", commissionRate: d.commissionRate || 15 });
    setShowForm(true);
  };

  const sendAlarm = async (driverId: number) => {
    try {
      await apiRequest(`/api/drivers/${driverId}/alarm`, {
        method: "POST",
        body: JSON.stringify({ reason: alarmReason || "Urgence - Contactez l'administration immediatement" }),
      });
      toast({ title: "Alarme envoyee", description: "Le livreur a ete alerte" });
      setShowAlarmModal(null);
      setAlarmReason("");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const sendQuickMessage = async (driverId: number) => {
    if (!chatMessage.trim() || !user) return;
    try {
      await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({ senderId: user.id, receiverId: driverId, message: chatMessage.trim(), isRead: false }),
      });
      toast({ title: "Message envoye" });
      setChatMessage("");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const selectDriver = (d: any) => {
    setSelectedDriver(d);
    setMobilePanel("info");
  };

  const sd = selectedDriver ? drivers.find((d: any) => d.id === selectedDriver.id) || selectedDriver : null;
  const sdOrders = sd ? getDriverActiveOrders(sd.id) : [];
  const sdDelivered = sd ? getDriverDelivered(sd.id) : [];

  const filterButtons = [
    { key: "all" as const, label: "Tous", active: "bg-gray-900 text-white", idle: "bg-gray-100 text-gray-600 hover:bg-gray-200" },
    { key: "online" as const, label: "Dispo", active: "bg-green-600 text-white", idle: "bg-green-50 text-green-700 hover:bg-green-100" },
    { key: "busy" as const, label: "Occupe", active: "bg-orange-600 text-white", idle: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
    { key: "offline" as const, label: "Off", active: "bg-gray-600 text-white", idle: "bg-gray-50 text-gray-500 hover:bg-gray-100" },
    { key: "blocked" as const, label: "Bloque", active: "bg-red-600 text-white", idle: "bg-red-50 text-red-700 hover:bg-red-100" },
  ];

  const dispatchTabs: { key: DispatchTab; label: string; count: number }[] = [
    { key: "gestion", label: "Gestion", count: drivers.length },
    { key: "unassigned", label: "Non attribuees", count: unassignedOrders.length },
    { key: "assigned", label: "Attribuees", count: assignedOrders.length },
    { key: "completed", label: "Completees", count: completedOrders.length },
    { key: "free", label: "Disponibles", count: freeDrivers.length },
    { key: "busy", label: "Occupes", count: busyDrivers.length },
    { key: "offline", label: "Hors ligne", count: offlineDrivers.length },
  ];

  const renderDriverCard = (d: any, showActiveOrder = true) => {
    const status = getDriverStatus(d);
    const active = getDriverActiveOrders(d.id);
    const todayCount = getDriverTodayDeliveries(d.id);

    return (
      <div key={d.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4" data-testid={`dispatch-driver-card-${d.id}`}>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              status === "busy" ? "bg-orange-100" : status === "online" ? "bg-green-100" : status === "blocked" ? "bg-red-100" : "bg-gray-100"
            }`}>
              <Truck size={18} className={
                status === "busy" ? "text-orange-600" : status === "online" ? "text-green-600" : status === "blocked" ? "text-red-600" : "text-gray-400"
              } />
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${d.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm text-gray-900 truncate" data-testid={`driver-name-${d.id}`}>{d.name}</p>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${d.isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 dark:text-gray-400"}`}>
                {d.isOnline ? "EN LIGNE" : "HORS LIGNE"}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-[10px] text-gray-500 flex items-center gap-1"><Phone size={9} />{d.phone}</span>
              <span className="text-[10px] text-gray-500 capitalize">{d.vehicleType || "Moto"}{d.vehiclePlate ? ` - ${d.vehiclePlate}` : ""}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[10px] text-gray-400"><Package size={9} className="inline mr-0.5" />{todayCount} livr. aujourd'hui</span>
              {active.length > 0 && (
                <span className="text-[10px] text-orange-600 font-semibold">{active.length} en cours</span>
              )}
            </div>
          </div>
        </div>
        {showActiveOrder && active.length > 0 && (
          <div className="mt-3 space-y-2">
            {active.map(order => (
              <div key={order.id} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 dark:border-gray-800" data-testid={`dispatch-driver-order-${order.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-[10px] text-gray-900 dark:text-white">{order.orderNumber}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                </div>
                <p className="text-[9px] text-gray-500 mt-1 truncate"><MapPin size={8} className="inline mr-0.5" />{order.deliveryAddress}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderOrderCard = (order: Order, showAssign = false) => {
    const elapsed = order.createdAt ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000) : 0;
    const isUrgent = elapsed >= 45;
    const isApproaching = elapsed >= 30 && elapsed < 45;

    return (
      <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4" data-testid={`dispatch-order-card-${order.id}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-gray-900 dark:text-white" data-testid={`order-number-${order.id}`}>{order.orderNumber}</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
            {isUrgent && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-red-600 text-white animate-pulse" data-testid={`urgent-badge-${order.id}`}>URGENT</span>}
            {isApproaching && !isUrgent && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700">BIENTOT</span>}
          </div>
          <ElapsedTime createdAt={order.createdAt} />
        </div>
        <p className="text-xs text-gray-600 mt-1.5">{getRestaurantName(order.restaurantId)}</p>
        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1 truncate">
          <MapPin size={9} />{order.deliveryAddress}
        </p>
        <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
          <span className="text-xs font-bold text-red-600">{formatPrice(order.total)}</span>
          {order.estimatedDelivery && <CountdownTimer estimatedDelivery={order.estimatedDelivery} compact />}
        </div>
        {showAssign && (
          <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            {assigningOrderId === order.id ? (
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-500 font-semibold">Attribuer a :</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {availableDriversForAssign.map((d: any) => (
                    <button key={d.id} onClick={() => handleAssignDriver(order.id, d.id)}
                      data-testid={`assign-driver-${d.id}-to-order-${order.id}`}
                      className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg text-xs hover:bg-red-50 hover:text-red-700 transition-colors flex items-center justify-between gap-2">
                      <span className="truncate">{d.name}</span>
                      <span className="text-[9px] text-gray-400 capitalize shrink-0">{d.vehicleType || "Moto"}</span>
                    </button>
                  ))}
                  {availableDriversForAssign.length === 0 && (
                    <p className="text-[10px] text-gray-400 text-center py-2">Aucun livreur disponible</p>
                  )}
                </div>
                <button onClick={() => setAssigningOrderId(null)} className="text-[10px] text-gray-500 hover:text-gray-700">Annuler</button>
              </div>
            ) : (
              <button onClick={() => setAssigningOrderId(order.id)} data-testid={`button-assign-order-${order.id}`}
                className="w-full py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5">
                <User size={12} /> Attribuer un livreur
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDispatchContent = () => {
    switch (dispatchTab) {
      case "unassigned":
        return (
          <div>
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white" data-testid="tab-title-unassigned">Commandes non attribuees ({unassignedOrders.length})</h2>
            </div>
            {unassignedOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Aucune commande non attribuee</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {unassignedOrders.map(order => renderOrderCard(order, true))}
              </div>
            )}
          </div>
        );

      case "assigned":
        return (
          <div>
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white" data-testid="tab-title-assigned">Commandes attribuees ({assignedOrders.length})</h2>
            </div>
            {assignedByDriver.size === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Aucune commande attribuee en cours</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(assignedByDriver.entries()).map(([driverId, driverOrders]) => {
                  const driver = drivers.find((d: any) => d.id === driverId);
                  return (
                    <div key={driverId} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden" data-testid={`assigned-driver-group-${driverId}`}>
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 flex-wrap">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-orange-100`}>
                          <Truck size={14} className="text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">{driver?.name || `Livreur #${driverId}`}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{driver?.phone} - {driver?.vehicleType || "Moto"}</p>
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">{driverOrders.length} commande(s)</span>
                      </div>
                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {driverOrders.map(order => (
                          <div key={order.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 dark:border-gray-800" data-testid={`assigned-order-${order.id}`}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-bold text-xs text-gray-900 dark:text-white">{order.orderNumber}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1">{getRestaurantName(order.restaurantId)}</p>
                            <p className="text-[9px] text-gray-500 mt-0.5 truncate"><MapPin size={8} className="inline mr-0.5" />{order.deliveryAddress}</p>
                            <div className="flex items-center justify-between mt-1.5 gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-red-600">{formatPrice(order.total)}</span>
                              {order.estimatedDelivery && <CountdownTimer estimatedDelivery={order.estimatedDelivery} compact />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "completed":
        return (
          <div>
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white" data-testid="tab-title-completed">Commandes completees ({completedOrders.length})</h2>
            </div>
            {completedOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <CheckCircle2 size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Aucune commande livree</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {completedOrders.map(order => {
                  const isOnTime = order.estimatedDelivery && order.updatedAt
                    ? new Date(order.updatedAt).getTime() <= new Date(order.estimatedDelivery).getTime()
                    : null;
                  const driver = order.driverId ? drivers.find((d: any) => d.id === order.driverId) : null;

                  return (
                    <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4" data-testid={`completed-order-${order.id}`}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{order.orderNumber}</span>
                        {isOnTime === true && (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700" data-testid={`ontime-badge-${order.id}`}>A l'heure</span>
                        )}
                        {isOnTime === false && (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700" data-testid={`late-badge-${order.id}`}>En retard</span>
                        )}
                        {isOnTime === null && (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 dark:text-gray-400">--</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1.5">{getRestaurantName(order.restaurantId)}</p>
                      <p className="text-[10px] text-gray-500 mt-1 truncate"><MapPin size={9} className="inline mr-0.5" />{order.deliveryAddress}</p>
                      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                        <span className="text-xs font-bold text-red-600">{formatPrice(order.total)}</span>
                        {driver && <span className="text-[10px] text-gray-500 dark:text-gray-400"><Truck size={9} className="inline mr-0.5" />{driver.name}</span>}
                      </div>
                      {order.updatedAt && <p className="text-[9px] text-gray-400 mt-1.5">{formatDate(order.updatedAt)}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "free":
        return (
          <div>
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white" data-testid="tab-title-free">Livreurs disponibles ({freeDrivers.length})</h2>
            </div>
            {freeDrivers.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Truck size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Aucun livreur disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {freeDrivers.map((d: any) => renderDriverCard(d, false))}
              </div>
            )}
          </div>
        );

      case "busy":
        return (
          <div>
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white" data-testid="tab-title-busy">Livreurs occupes ({busyDrivers.length})</h2>
            </div>
            {busyDrivers.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Truck size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Aucun livreur occupe</p>
              </div>
            ) : (
              <div className="space-y-3">
                {busyDrivers.map((d: any) => {
                  const active = getDriverActiveOrders(d.id);
                  const todayCount = getDriverTodayDeliveries(d.id);
                  const isExpanded = expandedBusyDriver === d.id;

                  return (
                    <div key={d.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden" data-testid={`busy-driver-card-${d.id}`}>
                      <button onClick={() => setExpandedBusyDriver(isExpanded ? null : d.id)}
                        data-testid={`toggle-busy-driver-${d.id}`}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-orange-100 shrink-0`}>
                          <Truck size={18} className="text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-gray-900 truncate">{d.name}</p>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">({active.length} commandes)</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400"><Phone size={9} className="inline mr-0.5" />{d.phone}</span>
                            <span className="text-[10px] text-gray-500 capitalize">{d.vehicleType || "Moto"}</span>
                            <span className="text-[10px] text-gray-400">{todayCount} livr. aujourd'hui</span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                          {active.map(order => (
                            <div key={order.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 dark:border-gray-800" data-testid={`busy-driver-order-${order.id}`}>
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-bold text-xs text-gray-900 dark:text-white">{order.orderNumber}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                              </div>
                              <p className="text-[10px] text-gray-600 mt-1">{getRestaurantName(order.restaurantId)}</p>
                              <p className="text-[9px] text-gray-500 mt-0.5 truncate"><MapPin size={8} className="inline mr-0.5" />{order.deliveryAddress}</p>
                              <div className="flex items-center justify-between mt-1.5 gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-red-600">{formatPrice(order.total)}</span>
                                {order.estimatedDelivery && <CountdownTimer estimatedDelivery={order.estimatedDelivery} compact />}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "offline":
        return (
          <div>
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white" data-testid="tab-title-offline">Livreurs hors ligne ({offlineDrivers.length})</h2>
            </div>
            {offlineDrivers.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Truck size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Tous les livreurs sont en ligne</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {offlineDrivers.map((d: any) => renderDriverCard(d, false))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Gestion des livreurs">
      <div className="mb-4 overflow-x-auto -mx-2 px-2">
        <div className="flex gap-1.5 min-w-max">
          {dispatchTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setDispatchTab(tab.key)}
              data-testid={`dispatch-tab-${tab.key}`}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                dispatchTab === tab.key
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                dispatchTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500 dark:text-gray-400"
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {dispatchTab !== "gestion" ? (
        renderDispatchContent()
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
            {[
              { label: "Total", value: drivers.length, icon: Truck, bg: "bg-blue-50", fg: "text-blue-600" },
              { label: "Disponibles", value: statusCounts.online, icon: CheckCircle2, bg: "bg-green-50", fg: "text-green-600" },
              { label: "En livraison", value: statusCounts.busy, icon: Package, bg: "bg-orange-50", fg: "text-orange-600" },
              { label: "Hors ligne", value: statusCounts.offline, icon: Circle, bg: "bg-gray-50", fg: "text-gray-500 dark:text-gray-400" },
              { label: "Bloques", value: statusCounts.blocked, icon: Ban, bg: "bg-red-50", fg: "text-red-600" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3" data-testid={`stat-${s.label.toLowerCase()}`}>
                <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <s.icon size={16} className={s.fg} />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900 leading-none">{s.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex lg:hidden gap-1 mb-3 bg-white rounded-xl p-1 border border-gray-100 dark:border-gray-800">
            {([
              { key: "list" as const, label: "Liste", icon: Menu },
              { key: "info" as const, label: "Details", icon: Truck },
              { key: "map" as const, label: "Carte", icon: Navigation },
            ]).map(tab => (
              <button key={tab.key} onClick={() => setMobilePanel(tab.key)} data-testid={`tab-${tab.key}`}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${mobilePanel === tab.key ? "bg-red-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <tab.icon size={14} />{tab.label}
              </button>
            ))}
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }} onClick={() => { setShowForm(false); setEditingDriver(null); }}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ zIndex: 10000 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base">{editingDriver ? "Modifier le livreur" : "Nouveau livreur"}</h3>
                  <button onClick={() => { setShowForm(false); setEditingDriver(null); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Nom complet *", key: "name", type: "text", testid: "input-driver-name" },
                    { label: "Email *", key: "email", type: "email", testid: "input-driver-email" },
                    { label: "Telephone *", key: "phone", type: "tel", testid: "input-driver-phone" },
                    ...(!editingDriver ? [{ label: "Mot de passe *", key: "password", type: "password", testid: "input-driver-password" }] : []),
                    { label: "Plaque", key: "vehiclePlate", type: "text", testid: "input-vehicle-plate" },
                    { label: "Permis", key: "driverLicense", type: "text", testid: "input-license" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] font-semibold text-gray-500 mb-1 block">{f.label}</label>
                      <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        data-testid={f.testid} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none" />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Vehicule</label>
                    <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}
                      data-testid="select-vehicle-type" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                      <option value="moto">Moto</option><option value="velo">Velo</option><option value="voiture">Voiture</option><option value="scooter">Scooter</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Commission (%)</label>
                    <input type="number" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: Number(e.target.value) })}
                      data-testid="input-commission" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none" />
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={handleSave} data-testid="button-save-driver"
                    className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200">
                    {editingDriver ? "Mettre a jour" : "Creer le livreur"}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditingDriver(null); }} className="px-5 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold text-gray-600">Annuler</button>
                </div>
              </div>
            </div>
          )}

          {showAlarmModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-5 w-full max-w-md" style={{ zIndex: 10000 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><Bell size={18} className="text-red-600" /></div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">Envoyer une alarme</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">a {showAlarmModal.name}</p>
                  </div>
                </div>
                <select value={alarmReason} onChange={e => setAlarmReason(e.target.value)}
                  data-testid="alarm-reason-select" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white mb-2">
                  <option value="">Choisir un motif...</option>
                  <option value="Retard de livraison detecte - Accelerez votre course">Retard de livraison</option>
                  <option value="Client en attente - Merci de vous depecher">Client en attente</option>
                  <option value="Changement d'adresse de livraison - Verifiez vos commandes">Changement d'adresse</option>
                  <option value="Contactez l'administration immediatement">Contact urgent</option>
                  <option value="Votre position GPS n'est plus visible - Reactiver la localisation">GPS perdu</option>
                </select>
                <input type="text" value={alarmReason} onChange={e => setAlarmReason(e.target.value)}
                  placeholder="Ou tapez un message personnalise..." data-testid="alarm-reason-input"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-red-500" />
                <div className="flex gap-2">
                  <button onClick={() => sendAlarm(showAlarmModal.id)} data-testid="button-send-alarm"
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 flex items-center justify-center gap-2">
                    <Zap size={14} /> Envoyer l'alarme
                  </button>
                  <button onClick={() => { setShowAlarmModal(null); setAlarmReason(""); }}
                    className="px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-600">Annuler</button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3" style={{ height: "calc(100vh - 340px)", minHeight: 400 }}>

            <div className={`${mobilePanel === "info" ? "flex" : "hidden"} lg:flex w-full lg:w-[280px] xl:w-[300px] shrink-0 flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden`}>
              {sd ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <button onClick={() => { setSelectedDriver(null); setMobilePanel("list"); }}
                      className="lg:hidden flex items-center gap-1 text-xs text-gray-500 mb-3 hover:text-gray-700" data-testid="back-to-list">
                      <ChevronLeft size={14} /> Retour a la liste
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                          getDriverStatus(sd) === "busy" ? "bg-orange-100" :
                          getDriverStatus(sd) === "online" ? "bg-green-100" :
                          getDriverStatus(sd) === "blocked" ? "bg-red-100" : "bg-gray-100"
                        }`}>
                          <Truck size={22} className={
                            getDriverStatus(sd) === "busy" ? "text-orange-600" :
                            getDriverStatus(sd) === "online" ? "text-green-600" :
                            getDriverStatus(sd) === "blocked" ? "text-red-600" : "text-gray-400"
                          } />
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${sd.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-sm text-gray-900 truncate" data-testid="driver-detail-name">{sd.name}</h3>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={9} />{sd.phone}</p>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                          getDriverStatus(sd) === "busy" ? "bg-orange-100 text-orange-700" :
                          getDriverStatus(sd) === "online" ? "bg-green-100 text-green-700" :
                          getDriverStatus(sd) === "blocked" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-500 dark:text-gray-400"
                        }`}>
                          {getDriverStatus(sd) === "busy" ? "EN LIVRAISON" : getDriverStatus(sd) === "online" ? "DISPONIBLE" : getDriverStatus(sd) === "blocked" ? "BLOQUE" : "HORS LIGNE"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-0 border-b border-gray-100 dark:border-gray-800">
                    <div className="p-3 text-center border-r border-gray-100 dark:border-gray-800">
                      <p className="text-base font-black text-green-600">{formatPrice(sdDelivered.reduce((s, o) => s + o.deliveryFee, 0))}</p>
                      <p className="text-[8px] text-gray-400 dark:text-gray-500 mt-0.5">GAINS</p>
                    </div>
                    <div className="p-3 text-center border-r border-gray-100 dark:border-gray-800">
                      <p className="text-base font-black text-blue-600">{sdDelivered.length}</p>
                      <p className="text-[8px] text-gray-400 dark:text-gray-500 mt-0.5">LIVREES</p>
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-base font-black text-orange-600">{sdOrders.length}</p>
                      <p className="text-[8px] text-gray-400 dark:text-gray-500 mt-0.5">EN COURS</p>
                    </div>
                  </div>

                  <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-500 mb-2 font-semibold">INFORMATIONS</p>
                    <div className="space-y-1.5 text-xs text-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Vehicule</span>
                        <span className="font-semibold capitalize">{sd.vehicleType || "Moto"}</span>
                      </div>
                      {sd.vehiclePlate && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Plaque</span>
                          <span className="font-semibold">{sd.vehiclePlate}</span>
                        </div>
                      )}
                      {sd.driverLicense && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Permis</span>
                          <span className="font-semibold">{sd.driverLicense}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Commission</span>
                        <span className="font-semibold">{sd.commissionRate || 15}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Email</span>
                        <span className="font-semibold text-[10px] truncate ml-2">{sd.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-500 mb-2 font-semibold">ACTIONS RAPIDES</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button onClick={() => setShowAlarmModal(sd)} data-testid="button-alarm-driver"
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors" title="Alarme">
                        <Bell size={16} className="text-red-600" />
                        <span className="text-[8px] text-red-600 font-semibold">Alarme</span>
                      </button>
                      <button onClick={() => startEdit(sd)} data-testid="button-edit-selected"
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors" title="Modifier">
                        <Edit size={16} className="text-blue-600" />
                        <span className="text-[8px] text-blue-600 font-semibold">Modifier</span>
                      </button>
                      <button onClick={() => handleBlock(sd.id, sd.isBlocked)} data-testid="button-block-selected"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${sd.isBlocked ? "bg-green-50 hover:bg-green-100" : "bg-orange-50 hover:bg-orange-100"}`}>
                        {sd.isBlocked ? <CheckCircle2 size={16} className="text-green-600" /> : <Ban size={16} className="text-orange-600" />}
                        <span className={`text-[8px] font-semibold ${sd.isBlocked ? "text-green-600" : "text-orange-600"}`}>{sd.isBlocked ? "Debloquer" : "Bloquer"}</span>
                      </button>
                      <button onClick={() => handleDelete(sd.id)} data-testid="button-delete-selected"
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors" title="Supprimer">
                        <Trash2 size={16} className="text-red-600" />
                        <span className="text-[8px] text-red-600 font-semibold">Supprimer</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-500 mb-2 font-semibold">MESSAGE RAPIDE</p>
                    <div className="flex gap-1.5">
                      <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendQuickMessage(sd.id)}
                        placeholder={`Ecrire a ${sd.name?.split(" ")[0]}...`}
                        data-testid="quick-chat-input"
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500" />
                      <button onClick={() => sendQuickMessage(sd.id)} data-testid="quick-chat-send"
                        className="w-9 h-9 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 shrink-0">
                        <Send size={14} />
                      </button>
                    </div>
                  </div>

                  {sdOrders.length > 0 && (
                    <div className="p-3">
                      <p className="text-[10px] text-gray-500 mb-2 font-semibold flex items-center gap-1">
                        <Package size={10} className="text-orange-600" /> LIVRAISONS EN COURS ({sdOrders.length})
                      </p>
                      <div className="space-y-2">
                        {sdOrders.map(order => (
                          <div key={order.id} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 dark:border-gray-800" data-testid={`driver-order-${order.id}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-[10px] text-gray-900 dark:text-white">{order.orderNumber}</span>
                              <CountdownTimer estimatedDelivery={order.estimatedDelivery} compact />
                            </div>
                            <p className="text-[9px] text-gray-500 flex items-center gap-1 truncate">
                              <MapPin size={8} />{order.deliveryAddress}
                            </p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] font-bold text-red-600">{formatPrice(order.total)}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sd.lat && sd.lng && (
                    <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-[9px] text-gray-400 flex items-center gap-1">
                        <Navigation size={9} /> GPS: {sd.lat.toFixed(4)}, {sd.lng.toFixed(4)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center text-gray-400">
                    <Truck size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Selectionnez un livreur</p>
                    <p className="text-[10px] mt-1">dans la liste pour voir ses details</p>
                  </div>
                </div>
              )}
            </div>

            <div className={`${mobilePanel === "map" ? "flex" : "hidden"} lg:flex flex-1 flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden`}>
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-xs text-gray-900 flex items-center gap-2">
                  <Navigation size={12} className="text-red-600" /> Carte en temps reel
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-400">{driversWithLocation.length} visible(s)</span>
                  {sd?.lat && sd?.lng && (
                    <span className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">{sd.name?.split(" ")[0]}</span>
                  )}
                </div>
              </div>
              <div className="flex-1 relative" style={{ minHeight: 0 }}>
                <MapContainer
                  center={sd?.lat && sd?.lng ? [sd.lat, sd.lng] : KINSHASA_CENTER}
                  zoom={sd?.lat ? 16 : 12}
                  style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }}
                  scrollWheelZoom={true}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  <MapInvalidateSize />
                  {sd?.lat && sd?.lng && <MapFlyTo lat={sd.lat} lng={sd.lng} />}
                  {driversWithLocation.map((d: any) => (
                    <Marker
                      key={d.id}
                      position={[d.lat, d.lng]}
                      icon={sd?.id === d.id ? driverIcon : onlineIcon}
                      eventHandlers={{ click: () => selectDriver(d) }}
                    >
                      <Popup>
                        <div className="text-xs min-w-[120px]">
                          <p className="font-bold text-sm">{d.name}</p>
                          <p className="text-gray-500 dark:text-gray-400">{d.phone}</p>
                          <p className="capitalize text-gray-400">{d.vehicleType || "Moto"}</p>
                          {getDriverActiveOrders(d.id).length > 0 && (
                            <p className="text-orange-600 font-semibold mt-1">{getDriverActiveOrders(d.id).length} livraison(s)</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            <div className={`${mobilePanel === "list" ? "flex" : "hidden"} lg:flex w-full lg:w-[280px] xl:w-[300px] shrink-0 flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden`}>
              <div className="p-3 border-b border-gray-100 dark:border-gray-800 space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Livreurs ({filteredDrivers.length})</h3>
                  <button onClick={() => { setShowForm(true); setEditingDriver(null); setForm({ name: "", email: "", phone: "", password: "", vehicleType: "moto", vehiclePlate: "", driverLicense: "", commissionRate: 15 }); }}
                    data-testid="button-add-driver" className="bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-700 shadow-lg shadow-red-200">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                    data-testid="search-drivers" className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {filterButtons.map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} data-testid={`filter-${f.key}`}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${filter === f.key ? f.active : f.idle}`}>
                      {f.label} {statusCounts[f.key]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredDrivers.map((d: any) => {
                  const status = getDriverStatus(d);
                  const active = getDriverActiveOrders(d.id);
                  const isSelected = sd?.id === d.id;

                  return (
                    <div
                      key={d.id}
                      onClick={() => selectDriver(d)}
                      data-testid={`driver-card-${d.id}`}
                      className={`px-3 py-2.5 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 ${isSelected ? "bg-red-50 border-l-[3px] border-l-red-600" : ""}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            status === "busy" ? "bg-orange-100" : status === "online" ? "bg-green-100" : status === "blocked" ? "bg-red-100" : "bg-gray-100"
                          }`}>
                            <Truck size={14} className={
                              status === "busy" ? "text-orange-600" : status === "online" ? "text-green-600" : status === "blocked" ? "text-red-600" : "text-gray-400"
                            } />
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[1.5px] border-white ${
                            status === "busy" ? "bg-orange-500" : status === "online" ? "bg-green-500" : status === "blocked" ? "bg-red-500" : "bg-gray-400"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-xs text-gray-900 truncate">{d.name}</p>
                            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                              status === "busy" ? "bg-orange-100 text-orange-700" :
                              status === "online" ? "bg-green-100 text-green-700" :
                              status === "blocked" ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-500 dark:text-gray-400"
                            }`}>
                              {status === "busy" ? "OCCUPE" : status === "online" ? "DISPO" : status === "blocked" ? "BLOQUE" : "OFF"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-gray-400 capitalize">{d.vehicleType || "Moto"}</span>
                            <span className="text-[9px] text-gray-400">{d.phone}</span>
                          </div>
                          {active.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[9px] text-orange-600 font-semibold">{active.length} cmd</span>
                              {active[0]?.estimatedDelivery && (
                                <CountdownTimer estimatedDelivery={active[0].estimatedDelivery} compact />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredDrivers.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Truck size={28} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium">Aucun livreur trouve</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
