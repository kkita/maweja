import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient, authFetch, authFetchJson } from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import DriverNav from "../../components/DriverNav";
import {
  Package, Clock, CheckCircle2, Truck, MapPin, Power, Navigation,
  DollarSign, AlertCircle, Phone, Timer, Bell, X, Map as MapIcon,
  ChevronUp, ChevronDown, TrendingUp, Zap, Star,
} from "lucide-react";
import { formatPrice, statusLabels, statusColors, formatDate } from "../../lib/utils";
import type { Order } from "@shared/schema";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";

function CountdownBadge({ estimatedDelivery }: { estimatedDelivery: string | null }) {
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

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${
      isLate ? "bg-red-100 text-red-700 animate-pulse" :
      isUrgent ? "bg-orange-100 text-orange-700" :
      "bg-emerald-100 text-emerald-700"
    }`}>
      <Timer size={11} />
      <span className="font-mono font-black" data-testid="driver-countdown">{remaining}</span>
      <span className="text-[9px] font-semibold opacity-80">
        {isLate ? "RETARD!" : isUrgent ? "URGENT" : "restant"}
      </span>
    </div>
  );
}

function AlarmOverlay({ reason, onDismiss }: { reason: string; onDismiss: () => void }) {
  useEffect(() => {
    const audio = new AudioContext();
    let oscillator: OscillatorNode | null = null;
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
    } catch {}
    if ("vibrate" in navigator) navigator.vibrate([500, 200, 500, 200, 500]);
    return () => { try { oscillator?.stop(); audio.close(); } catch {} };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-red-600/95 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-bounce">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell size={36} className="text-red-600" />
        </div>
        <h2 className="text-xl font-black text-red-600 mb-2">ALERTE URGENTE</h2>
        <p className="text-gray-700 dark:text-gray-200 text-sm mb-6 leading-relaxed">{reason}</p>
        <button onClick={onDismiss} data-testid="dismiss-alarm"
          className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-red-200">
          J'ai compris
        </button>
      </div>
    </div>
  );
}

interface DriverMapProps {
  driverLat: number | null;
  driverLng: number | null;
  activeOrders: Order[];
}

function DriverLiveMap({ driverLat, driverLng, activeOrders }: DriverMapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const driverMarkerRef = useRef<any>(null);
  const orderMarkersRef = useRef<any[]>([]);

  const defaultLat = driverLat ?? -4.3222;
  const defaultLng = driverLng ?? 15.3222;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng], zoom: 14, zoomControl: true, attributionControl: false,
    });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !driverLat || !driverLng) return;
    const driverIcon = L.divIcon({
      html: `<div style="width:40px;height:40px;background:#dc2626;border-radius:50%;border:4px solid white;box-shadow:0 4px 12px rgba(220,38,38,0.5);display:flex;align-items:center;justify-content:center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>
      </div>`,
      className: "", iconSize: [40, 40], iconAnchor: [20, 20],
    });
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driverLat, driverLng]);
    } else {
      driverMarkerRef.current = L.marker([driverLat, driverLng], { icon: driverIcon })
        .addTo(mapRef.current).bindPopup("📍 Vous êtes ici");
    }
    mapRef.current.setView([driverLat, driverLng], mapRef.current.getZoom());
  }, [driverLat, driverLng]);

  useEffect(() => {
    if (!mapRef.current) return;
    orderMarkersRef.current.forEach(m => m.remove());
    orderMarkersRef.current = [];
    activeOrders.forEach((order, i) => {
      if (!order.deliveryLat || !order.deliveryLng) return;
      const orderIcon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 3px 8px rgba(37,99,235,0.5);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:12px;">${i + 1}</div>`,
        className: "", iconSize: [32, 32], iconAnchor: [16, 16],
      });
      const m = L.marker([order.deliveryLat, order.deliveryLng], { icon: orderIcon })
        .addTo(mapRef.current).bindPopup(`🚚 Livraison #${order.orderNumber}`);
      orderMarkersRef.current.push(m);
    });
  }, [activeOrders]);

  return <div ref={mapContainerRef} className="w-full h-48 rounded-2xl overflow-hidden" data-testid="driver-map" />;
}

export default function DriverDashboard() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [gpsActive, setGpsActive] = useState(false);
  const [alarm, setAlarm] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bonjour" : now.getHours() < 18 ? "Bon après-midi" : "Bonsoir";

  const { data: pendingOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", "ready"],
    queryFn: () => authFetchJson("/api/orders?status=ready"),
    refetchInterval: 5000,
  });

  const { data: myOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", "driver", user?.id],
    queryFn: () => authFetchJson(`/api/orders?driverId=${user?.id}`),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const activeOrders = myOrders.filter(o => !["delivered", "cancelled"].includes(o.status));
  const deliveredToday = myOrders.filter(o => o.status === "delivered");
  const totalEarnings = deliveredToday.reduce((s, o) => s + o.deliveryFee, 0);

  const lateOrders = activeOrders.filter(o => {
    if (!o.estimatedDelivery) return false;
    return new Date(o.estimatedDelivery).getTime() < Date.now();
  });

  const sendLocation = useCallback(() => {
    if (!user?.id || !isOnline) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsActive(true);
        setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        apiRequest(`/api/drivers/${user.id}/location`, {
          method: "PATCH",
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        }).catch(() => {});
      },
      () => setGpsActive(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [user?.id, isOnline]);

  useEffect(() => {
    if (!isOnline) return;
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
      if (data.type === "alarm") setAlarm(data.reason || "Alerte de l'administration");
    });
  }, [toast]);

  useEffect(() => {
    if (lateOrders.length > 0 && isOnline) {
      const checkInterval = setInterval(() => {
        const lateNow = activeOrders.filter(o => {
          if (!o.estimatedDelivery) return false;
          const diff = new Date(o.estimatedDelivery).getTime() - Date.now();
          return diff < 0 && diff > -60000;
        });
        if (lateNow.length > 0) {
          toast({ title: "Retard détecté!", description: `${lateNow.length} livraison(s) en retard.`, variant: "destructive" });
          if ("vibrate" in navigator) navigator.vibrate([300, 100, 300]);
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
    setUser({ ...user!, isOnline: newStatus });
    toast({ title: newStatus ? "Vous êtes en ligne" : "Vous êtes hors ligne" });
    if (newStatus) sendLocation();
  };

  const acceptOrder = async (orderId: number) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ driverId: user?.id, status: "picked_up" }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande acceptée!", description: "Rendez-vous au restaurant" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const updateStatus = async (orderId: number, status: string) => {
    await apiRequest(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    toast({ title: status === "delivered" ? "Livraison terminée! 🎉" : "Statut mis à jour" });
  };

  const availablePending = pendingOrders.filter(o => !o.driverId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-28">
      {alarm && <AlarmOverlay reason={alarm} onDismiss={() => setAlarm(null)} />}
      <DriverNav />

      <div className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">

        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-3xl p-5 text-white overflow-hidden shadow-xl shadow-red-200/50">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-12 -translate-x-12" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-red-200 text-xs font-semibold mb-0.5">{greeting},</p>
              <h2 className="text-2xl font-black">{user?.name?.split(" ")[0]} 👋</h2>
              <p className="text-red-200 text-xs mt-1">
                {isOnline
                  ? `${activeOrders.length} livraison${activeOrders.length !== 1 ? "s" : ""} en cours`
                  : "Activez votre service pour commencer"}
              </p>
            </div>
            <button
              onClick={toggleOnline}
              data-testid="toggle-online"
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl text-xs font-black transition-all active:scale-95 border-2 ${
                isOnline
                  ? "bg-white/15 border-white/30 text-white backdrop-blur-sm"
                  : "bg-white text-red-600 border-white/80 shadow-lg"
              }`}
            >
              <Power size={20} className={isOnline ? "animate-pulse" : ""} />
              {isOnline ? "En ligne" : "Hors ligne"}
            </button>
          </div>

          {isOnline && (
            <div className="relative mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping absolute" />
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-green-200 text-xs font-semibold ml-4">Service actif — en attente de commandes</span>
            </div>
          )}
        </div>

        {/* Late orders alert */}
        {lateOrders.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 animate-pulse flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={18} className="text-red-600" />
            </div>
            <div>
              <p className="font-black text-sm text-red-700">Retard détecté !</p>
              <p className="text-xs text-red-500 mt-0.5">
                {lateOrders.length} livraison{lateOrders.length > 1 ? "s" : ""} en retard. Accélérez svp.
              </p>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Package, label: "En cours", value: activeOrders.length, bg: "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600", valColor: "text-blue-700" },
            { icon: CheckCircle2, label: "Livrées", value: deliveredToday.length, bg: "bg-emerald-50", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", valColor: "text-emerald-700" },
            { icon: DollarSign, label: "Gains", value: formatPrice(totalEarnings), bg: "bg-red-50", iconBg: "bg-red-100", iconColor: "text-red-600", valColor: "text-red-700" },
          ].map((stat, i) => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 text-center`} data-testid={`driver-stat-${stat.label.toLowerCase()}`}>
              <div className={`w-9 h-9 ${stat.iconBg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <stat.icon size={16} className={stat.iconColor} />
              </div>
              <p className={`text-lg font-black ${stat.valColor}`}>{stat.value}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 font-semibold mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* GPS / Map toggle */}
        {isOnline && (
          <div>
            <button
              onClick={() => setShowMap(m => !m)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold border-2 transition-all ${
                gpsActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-orange-50 text-orange-700 border-orange-200"
              }`}
              data-testid="toggle-map"
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${gpsActive ? "bg-emerald-100" : "bg-orange-100"}`}>
                <Navigation size={13} className={gpsActive ? "text-emerald-600" : "text-orange-600"} />
              </div>
              <span className="flex-1 text-left">
                {gpsActive ? "GPS actif — Position partagée toutes les 15s" : "GPS inactif — Activez la localisation"}
              </span>
              <MapIcon size={13} />
              {showMap ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showMap && (
              <div className="mt-2 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800">
                <DriverLiveMap driverLat={driverPos?.lat ?? null} driverLng={driverPos?.lng ?? null} activeOrders={activeOrders} />
                <div className="bg-white px-4 py-2.5 flex items-center gap-4 text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600" /> Vous</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600" /> Livraisons</span>
                  <span className="ml-auto font-bold">{activeOrders.filter(o => o.deliveryLat && o.deliveryLng).length} point{activeOrders.filter(o => o.deliveryLat && o.deliveryLng).length !== 1 ? "s" : ""}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Offline empty state */}
        {!isOnline && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Power size={32} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="font-black text-xl text-gray-900 dark:text-white mb-2">Vous êtes hors ligne</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-6 max-w-xs mx-auto">
              Passez en ligne pour recevoir des commandes et commencer à livrer
            </p>
            <button onClick={toggleOnline}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-red-200 hover:shadow-xl transition-all active:scale-95"
              data-testid="go-online">
              <Power size={14} className="inline mr-2" />
              Passer en ligne
            </button>
          </div>
        )}

        {/* Active orders */}
        {activeOrders.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping absolute" />
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
              </div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white ml-0.5">Livraisons en cours</h3>
              <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">{activeOrders.length}</span>
            </div>
            <div className="space-y-3">
              {activeOrders.map(order => (
                <div key={order.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                  data-testid={`active-order-${order.id}`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Truck size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-black text-sm text-gray-900 dark:text-white">{order.orderNumber}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(order.createdAt!)}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                        {order.estimatedDelivery && <CountdownBadge estimatedDelivery={order.estimatedDelivery} />}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 mb-3">
                      <MapPin size={12} className="mt-0.5 flex-shrink-0 text-red-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 line-clamp-2">{order.deliveryAddress}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Votre gain</p>
                        <span className="font-black text-emerald-600 text-base">{formatPrice(order.deliveryFee)}</span>
                      </div>
                      <div className="flex gap-2">
                        {["confirmed", "preparing"].includes(order.status) && (
                          <button onClick={() => updateStatus(order.id, "picked_up")} data-testid={`pickup-${order.id}`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200">
                            📦 Récupérée
                          </button>
                        )}
                        {order.status === "picked_up" && (
                          <button onClick={() => updateStatus(order.id, "delivered")} data-testid={`deliver-${order.id}`}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:from-emerald-600 hover:to-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-200">
                            ✓ Livrée
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available orders */}
        {isOnline && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping absolute" />
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              </div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white ml-0.5">Commandes disponibles</h3>
              <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-auto">{availablePending.length}</span>
            </div>

            {availablePending.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-700 dark:text-gray-200 font-bold text-sm">En attente de commandes...</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Les nouvelles commandes apparaîtront automatiquement</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availablePending.map(order => (
                  <div key={order.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-red-100 shadow-sm hover:shadow-lg hover:border-red-300:border-red-700 transition-all"
                    data-testid={`pending-order-${order.id}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                            <Package size={16} className="text-red-600" />
                          </div>
                          <div>
                            <p className="font-black text-sm text-gray-900 dark:text-white">{order.orderNumber}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Total: {formatPrice(order.total)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Votre gain</p>
                          <p className="font-black text-emerald-600 text-base">{formatPrice(order.deliveryFee)}</p>
                        </div>
                      </div>

                      {order.estimatedDelivery && <div className="mb-2"><CountdownBadge estimatedDelivery={order.estimatedDelivery} /></div>}

                      <div className="flex items-start gap-2 mb-4">
                        <MapPin size={12} className="mt-0.5 flex-shrink-0 text-red-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{order.deliveryAddress}</span>
                      </div>

                      <button onClick={() => acceptOrder(order.id)} data-testid={`accept-order-${order.id}`}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl text-xs font-black hover:from-red-700 hover:to-red-800 active:scale-95 transition-all shadow-md shadow-red-200">
                        🚀 Accepter cette livraison
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
