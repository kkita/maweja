import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../lib/auth";
import { useToast } from "./use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import { onWSMessage } from "../lib/websocket";

export function useDriverStatus() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [gpsActive, setGpsActive] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [alarm, setAlarm] = useState<string | null>(null);

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
    const i = setInterval(sendLocation, 15000);
    return () => clearInterval(i);
  }, [isOnline, sendLocation]);

  const playSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const t = ctx.currentTime;
      [[880, t], [1100, t + 0.15], [1320, t + 0.3], [1760, t + 0.6]].forEach(([freq, start]) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.frequency.value = freq as number;
        osc.type = "sine";
        g.gain.setValueAtTime(0.35, start as number);
        g.gain.exponentialRampToValueAtTime(0.01, (start as number) + 0.2);
        osc.start(start as number); osc.stop((start as number) + 0.2);
      });
      setTimeout(() => ctx.close(), 2000);
    } catch {}
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 400]);
  }, []);

  useEffect(() => {
    return onWSMessage(data => {
      if (data.type === "order_assigned" || data.type === "new_order") {
        playSound();
        toast({ title: "🔔 Nouvelle commande!", description: "Une commande est disponible pour vous" });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
      if (data.type === "alarm") setAlarm(data.reason || "Alerte de l'administration");
    });
  }, [toast, playSound]);

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    await apiRequest(`/api/drivers/${user?.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isOnline: newStatus }),
    });
    setUser({ ...user!, isOnline: newStatus });
    toast({ title: newStatus ? "✅ Vous êtes en ligne" : "⏸ Vous êtes hors ligne" });
    if (newStatus) sendLocation();
  };

  const updateStatus = async (orderId: number, status: string) => {
    await apiRequest(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    toast({ title: status === "delivered" ? "🎉 Livraison terminée !" : "✅ Statut mis à jour" });
  };

  return {
    isOnline, gpsActive, showMap, setShowMap,
    driverPos, alarm, setAlarm,
    toggleOnline, updateStatus, sendLocation,
  };
}
