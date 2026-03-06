import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import DriverNav from "../../components/DriverNav";
import { Package, Clock, CheckCircle2, Truck, MapPin, Power, Navigation, DollarSign, Star, AlertCircle, Phone, Timer, Bell, X } from "lucide-react";
import { formatPrice, statusLabels, statusColors, formatDate } from "../../lib/utils";
import type { Order } from "@shared/schema";

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

export default function DriverDashboard() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [gpsActive, setGpsActive] = useState(false);
  const [alarm, setAlarm] = useState<string | null>(null);

  const { data: pendingOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", "ready"],
    queryFn: () => authFetch("/api/orders?status=ready").then(r => r.json()),
    refetchInterval: 5000,
  });

  const { data: myOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", "driver", user?.id],
    queryFn: () => authFetch(`/api/orders?driverId=${user?.id}`).then(r => r.json()),
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {alarm && <AlarmOverlay reason={alarm} onDismiss={() => setAlarm(null)} />}
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-0.5">Bonjour {user?.name?.split(" ")[0]}</h2>
            <p className="text-xs text-gray-500">Vos livraisons du jour</p>
          </div>
          <button onClick={toggleOnline} data-testid="toggle-online"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg ${
              isOnline
                ? "bg-green-600 text-white shadow-green-200"
                : "bg-gray-200 text-gray-600 shadow-gray-100"
            }`}>
            <Power size={16} />
            {isOnline ? "En ligne" : "Hors ligne"}
          </button>
        </div>

        {isOnline && (
          <div className={`flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-xs font-medium ${gpsActive ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
            <Navigation size={14} />
            {gpsActive ? "GPS actif - Position partagee toutes les 15s" : "GPS inactif - Activez la localisation"}
          </div>
        )}

        {lateOrders.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-red-600" />
              <span className="font-bold text-sm text-red-700">Retard detecte!</span>
            </div>
            <p className="text-xs text-red-600">Vous avez {lateOrders.length} livraison(s) en retard. Veuillez accelerer.</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Package size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{activeOrders.length}</p>
            <p className="text-[10px] text-gray-500 font-medium">En cours</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{deliveredToday.length}</p>
            <p className="text-[10px] text-gray-500 font-medium">Livrees</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <DollarSign size={18} className="text-red-600" />
            </div>
            <p className="text-lg font-black text-gray-900">{formatPrice(totalEarnings)}</p>
            <p className="text-[10px] text-gray-500 font-medium">Gains</p>
          </div>
        </div>

        {!isOnline && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center mb-6">
            <Power size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-900 mb-1">Vous etes hors ligne</p>
            <p className="text-xs text-gray-500 mb-4">Passez en ligne pour recevoir des commandes</p>
            <button onClick={toggleOnline} className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-200" data-testid="go-online">
              Passer en ligne
            </button>
          </div>
        )}

        {activeOrders.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-sm text-gray-900 mb-3">Livraisons en cours ({activeOrders.length})</h3>
            <div className="space-y-3">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm" data-testid={`active-order-${order.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{order.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                  </div>

                  <CountdownBadge estimatedDelivery={order.estimatedDelivery} />

                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <MapPin size={12} />
                    <span className="flex-1 truncate">{order.deliveryAddress}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <span className="font-bold text-red-600 text-sm">{formatPrice(order.total)}</span>
                      <span className="text-[10px] text-gray-400 ml-2">Gain: {formatPrice(order.deliveryFee)}</span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === "picked_up" && (
                        <button onClick={() => updateStatus(order.id, "delivered")} data-testid={`deliver-${order.id}`}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-green-200">
                          Livree
                        </button>
                      )}
                      {["confirmed", "preparing"].includes(order.status) && (
                        <button onClick={() => updateStatus(order.id, "picked_up")} data-testid={`pickup-${order.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
                          Recuperee
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
            <h3 className="font-bold text-sm text-gray-900 mb-3">
              Commandes disponibles ({pendingOrders.filter(o => !o.driverId).length})
            </h3>
            {pendingOrders.filter(o => !o.driverId).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                <Clock size={36} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-medium">Aucune commande disponible</p>
                <p className="text-gray-400 text-xs mt-1">Les nouvelles commandes apparaitront automatiquement</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.filter(o => !o.driverId).map(order => (
                  <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm" data-testid={`pending-order-${order.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{order.orderNumber}</span>
                      <span className="font-bold text-red-600 text-sm">{formatPrice(order.deliveryFee)}</span>
                    </div>
                    {order.estimatedDelivery && <CountdownBadge estimatedDelivery={order.estimatedDelivery} />}
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                      <MapPin size={12} /> {order.deliveryAddress}
                    </p>
                    <p className="text-xs text-gray-400 mb-3">Total commande: {formatPrice(order.total)}</p>
                    <button onClick={() => acceptOrder(order.id)} data-testid={`accept-order-${order.id}`}
                      className="w-full bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all">
                      Accepter la livraison
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="fixed bottom-20 left-0 right-0 text-center">
        <p className="text-[10px] text-gray-400">Demo by Khevin Andrew Kita - Ed Corporation 0911742202</p>
      </div>
    </div>
  );
}
