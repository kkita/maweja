import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient, authFetch , authFetchJson} from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import DriverNav from "../../components/DriverNav";
import { Package, Clock, CheckCircle2, Truck, MapPin, Power, Navigation, DollarSign, Star, AlertCircle, Phone, Timer, Bell, X, Map as MapIcon, ChevronUp, ChevronDown } from "lucide-react";
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
        setIsLate(true);
        setIsUrgent(true);
      } else {
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

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${isLate ? "bg-red-100 border border-red-200 animate-pulse" : isUrgent ? "bg-orange-100 border border-orange-200" : "bg-green-100 border border-green-200"}`}>
      <Timer size={12} className={isLate ? "text-red-600" : isUrgent ? "text-orange-600" : "text-green-600"} />
      <span className={`font-mono font-black text-sm ${isLate ? "text-red-700" : isUrgent ? "text-orange-700" : "text-green-700"}`} data-testid="driver-countdown">
        {remaining}
      </span>
      <span className={`text-[8px] font-bold ${isLate ? "text-red-500" : isUrgent ? "text-orange-500" : "text-green-500"}`}>
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
    <div className="fixed inset-0 z-[100] bg-red-600/95 flex items-center justify-center p-6 animate-pulse">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Bell size={36} className="text-red-600" />
        </div>
        <h2 className="text-xl font-black text-red-600 mb-2">ALERTE URGENTE</h2>
        <p className="text-gray-700 text-sm mb-6 leading-relaxed">{reason}</p>
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
      center: [defaultLat, defaultLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update driver marker
  useEffect(() => {
    if (!mapRef.current || !driverLat || !driverLng) return;

    const driverIcon = L.divIcon({
      html: `<div style="width:40px;height:40px;background:#dc2626;border-radius:50%;border:4px solid white;box-shadow:0 4px 12px rgba(220,38,38,0.5);display:flex;align-items:center;justify-content:center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>
      </div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driverLat, driverLng]);
    } else {
      driverMarkerRef.current = L.marker([driverLat, driverLng], { icon: driverIcon })
        .addTo(mapRef.current)
        .bindPopup("📍 Vous êtes ici");
    }

    mapRef.current.setView([driverLat, driverLng], mapRef.current.getZoom());
  }, [driverLat, driverLng]);

  // Update order markers
  useEffect(() => {
    if (!mapRef.current) return;

    orderMarkersRef.current.forEach(m => m.remove());
    orderMarkersRef.current = [];

    activeOrders.forEach((order, i) => {
      if (!order.deliveryLat || !order.deliveryLng) return;
      const orderIcon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 3px 8px rgba(37,99,235,0.5);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:12px;">${i + 1}</div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const m = L.marker([order.deliveryLat, order.deliveryLng], { icon: orderIcon })
        .addTo(mapRef.current)
        .bindPopup(`🚚 Livraison #${order.orderNumber}`);
      orderMarkersRef.current.push(m);
    });
  }, [activeOrders]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-48 rounded-2xl overflow-hidden"
      data-testid="driver-map"
    />
  );
}

export default function DriverDashboard() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [gpsActive, setGpsActive] = useState(false);
  const [alarm, setAlarm] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);

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
      if (data.type === "alarm") {
        setAlarm(data.reason || "Alerte de l'administration");
      }
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
          toast({
            title: "Retard detecte!",
            description: `Vous etes en retard sur ${lateNow.length} livraison(s). Accelerez!`,
            variant: "destructive",
          });
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
    toast({ title: newStatus ? "Vous etes en ligne" : "Vous etes hors ligne" });
    if (newStatus) sendLocation();
  };

  const acceptOrder = async (orderId: number) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ driverId: user?.id, status: "picked_up" }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande acceptee!", description: "Rendez-vous au restaurant" });
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
    toast({ title: status === "delivered" ? "Livraison terminee!" : "Statut mis a jour" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {alarm && <AlarmOverlay reason={alarm} onDismiss={() => setAlarm(null)} />}
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-5 fade-in-up">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Bonjour</p>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">{user?.name?.split(" ")[0]} 👋</h2>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Vos livraisons du jour</p>
          </div>
          <button onClick={toggleOnline} data-testid="toggle-online"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95 ${
              isOnline
                ? "bg-green-500 text-white shadow-green-200 dark:shadow-green-900/30"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 shadow-gray-100 dark:shadow-none"
            }`}>
            <Power size={15} className={isOnline ? "animate-pulse" : ""} />
            {isOnline ? "En ligne" : "Hors ligne"}
          </button>
        </div>

        {isOnline && (
          <div className="mb-4 fade-in">
            <button
              onClick={() => setShowMap(m => !m)}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-semibold border transition-all ${
                gpsActive
                  ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                  : "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800"
              }`}
              data-testid="toggle-map"
            >
              <Navigation size={13} className={gpsActive ? "text-green-600" : "text-orange-600"} />
              <span className="flex-1 text-left">
                {gpsActive ? "📍 GPS actif — Position partagée toutes les 15s" : "⚠️ GPS inactif — Activez la localisation"}
              </span>
              <MapIcon size={14} />
              {showMap ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showMap && (
              <div className="mt-2 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800">
                <DriverLiveMap
                  driverLat={driverPos?.lat ?? null}
                  driverLng={driverPos?.lng ?? null}
                  activeOrders={activeOrders}
                />
                <div className="bg-white dark:bg-gray-900 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600 flex-shrink-0" /> Vous</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0" /> Livraisons</span>
                  <span className="ml-auto font-bold">{activeOrders.filter(o => o.deliveryLat && o.deliveryLng).length} point{activeOrders.filter(o => o.deliveryLat && o.deliveryLng).length !== 1 ? "s" : ""}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {lateOrders.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4 animate-pulse">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={15} className="text-red-600" />
              <span className="font-black text-sm text-red-700 dark:text-red-400">Retard détecté !</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400">Vous avez {lateOrders.length} livraison{lateOrders.length > 1 ? "s" : ""} en retard. Veuillez accélérer.</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { icon: Package, label: "En cours", value: activeOrders.length, color: "blue", bg: "bg-blue-50 dark:bg-blue-950/30", iconBg: "bg-blue-100 dark:bg-blue-900/40", iconColor: "text-blue-600" },
            { icon: CheckCircle2, label: "Livrées", value: deliveredToday.length, color: "green", bg: "bg-green-50 dark:bg-green-950/30", iconBg: "bg-green-100 dark:bg-green-900/40", iconColor: "text-green-600" },
            { icon: DollarSign, label: "Gains", value: formatPrice(totalEarnings), color: "red", bg: "bg-red-50 dark:bg-red-950/30", iconBg: "bg-red-100 dark:bg-red-900/40", iconColor: "text-red-600" },
          ].map((stat, i) => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-3.5 border border-transparent fade-in-up stagger-${i + 1}`} data-testid={`driver-stat-${stat.label.toLowerCase()}`}>
              <div className={`w-8 h-8 ${stat.iconBg} rounded-xl flex items-center justify-center mb-2`}>
                <stat.icon size={16} className={stat.iconColor} />
              </div>
              <p className={`text-xl font-black ${stat.iconColor}`}>{stat.value}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>

        {!isOnline && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm text-center mb-5 fade-in scale-in">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Power size={36} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="font-black text-lg text-gray-900 dark:text-white mb-1">Vous êtes hors ligne</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Passez en ligne pour recevoir des commandes et commencer à livrer</p>
            <button
              onClick={toggleOnline}
              className="bg-green-500 text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-green-200 dark:shadow-green-900/30 hover:bg-green-600 active:scale-95 transition-all"
              data-testid="go-online"
            >
              <Power size={14} className="inline mr-2" />
              Passer en ligne
            </button>
          </div>
        )}

        {activeOrders.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <h3 className="font-black text-sm text-gray-900 dark:text-white">Livraisons en cours</h3>
              <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">{activeOrders.length}</span>
            </div>
            <div className="space-y-3">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all" data-testid={`active-order-${order.id}`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-black text-sm text-gray-900 dark:text-white">{order.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                  </div>

                  <CountdownBadge estimatedDelivery={order.estimatedDelivery} />

                  <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2.5">
                    <MapPin size={12} className="mt-0.5 flex-shrink-0 text-red-400" />
                    <span className="flex-1 line-clamp-2">{order.deliveryAddress}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Votre gain</p>
                      <span className="font-black text-green-600 text-base">{formatPrice(order.deliveryFee)}</span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === "picked_up" && (
                        <button onClick={() => updateStatus(order.id, "delivered")} data-testid={`deliver-${order.id}`}
                          className="bg-green-500 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-green-200 dark:shadow-green-900/30 hover:bg-green-600 active:scale-95 transition-all">
                          ✓ Livrée
                        </button>
                      )}
                      {["confirmed", "preparing"].includes(order.status) && (
                        <button onClick={() => updateStatus(order.id, "picked_up")} data-testid={`pickup-${order.id}`}
                          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-blue-700 active:scale-95 transition-all">
                          Récupérée
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isOnline && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping absolute" />
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <h3 className="font-black text-sm text-gray-900 dark:text-white">
                Commandes disponibles
              </h3>
              <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                {pendingOrders.filter(o => !o.driverId).length}
              </span>
            </div>
            {pendingOrders.filter(o => !o.driverId).length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock size={28} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-bold text-sm">En attente de commandes...</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Les nouvelles commandes apparaîtront automatiquement</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.filter(o => !o.driverId).map(order => (
                  <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border-2 border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-lg hover:border-red-300 dark:hover:border-red-700 transition-all" data-testid={`pending-order-${order.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-sm text-gray-900 dark:text-white">{order.orderNumber}</span>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Votre gain</p>
                        <p className="font-black text-green-600 text-base">{formatPrice(order.deliveryFee)}</p>
                      </div>
                    </div>
                    {order.estimatedDelivery && <CountdownBadge estimatedDelivery={order.estimatedDelivery} />}
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1 mt-2">
                      <MapPin size={12} className="mt-0.5 flex-shrink-0 text-red-400" />
                      <span className="line-clamp-2">{order.deliveryAddress}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3 mt-1">Total commande: {formatPrice(order.total)}</p>
                    <button onClick={() => acceptOrder(order.id)} data-testid={`accept-order-${order.id}`}
                      className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-black shadow-lg shadow-red-200 dark:shadow-red-900/30 hover:bg-red-700 active:scale-95 transition-all">
                      🚀 Accepter cette livraison
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="fixed bottom-20 left-0 right-0 text-center">
        <p className="text-[10px] text-gray-400">Made By Khevin Andrew Kita - Ed Corporation</p>
      </div>
    </div>
  );
}
