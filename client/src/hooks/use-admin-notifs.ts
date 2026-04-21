import { useState, useEffect, useRef } from "react";
import { onWSMessage } from "../lib/websocket";
import { queryClient } from "../lib/queryClient";
import { playAdminAlertSound } from "../lib/notify";
import {
  type Notif, type NotifType,
  NOTIF_HREFS, NOTIF_SESSION_KEY,
} from "../components/admin/AdminNotifPanel";

export type { Notif, NotifType };

export function useAdminNotifs() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifRinging, setNotifRinging] = useState(false);
  const [liveToast, setLiveToast] = useState<Notif | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = notifs.filter(n => !n.read).length;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(NOTIF_SESSION_KEY);
      if (raw) setNotifs(JSON.parse(raw).map((n: any) => ({ ...n, time: new Date(n.time) })));
    } catch {}
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(NOTIF_SESSION_KEY, JSON.stringify(notifs)); } catch {}
  }, [notifs]);

  function showLiveToast(n: Notif) {
    setLiveToast(n);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setLiveToast(null), 6000);
  }

  function addNotif(n: Notif) {
    setNotifs(prev => [n, ...prev].slice(0, 60));
    showLiveToast(n);
    playAdminAlertSound();
    setNotifRinging(true);
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    ringTimerRef.current = setTimeout(() => setNotifRinging(false), 5500);
  }

  useEffect(() => {
    return onWSMessage(data => {
      if (data.type === "new_order") {
        const num = data.order?.orderNumber ? `#${data.order.orderNumber}` : "";
        const rest = data.order?.restaurantName ? ` — ${data.order.restaurantName}` : "";
        addNotif({ id: crypto.randomUUID(), title: "Nouvelle commande", description: `Commande ${num} reçue${rest}`, type: "order", time: new Date(), read: false, href: NOTIF_HREFS.order });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
      if (data.type === "new_service_request") {
        addNotif({ id: crypto.randomUUID(), title: "Demande de service", description: data.request?.serviceType || data.request?.categoryName || "Un client a soumis une demande", type: "service", time: new Date(), read: false, href: NOTIF_HREFS.service });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
      if (data.type === "chat_message") {
        addNotif({ id: crypto.randomUUID(), title: "Nouveau message", description: data.notification?.message || "Un client vous a envoyé un message", type: "message", time: new Date(), read: false, href: NOTIF_HREFS.message });
      }
      if (data.type === "driver_verification") {
        addNotif({ id: crypto.randomUUID(), title: "Vérification agent", description: data.driverName ? `${data.driverName} a soumis ses documents` : "Un agent attend sa vérification", type: "driver", time: new Date(), read: false, href: NOTIF_HREFS.driver });
      }
      if (data.type === "new_user") {
        addNotif({ id: crypto.randomUUID(), title: "Nouvel utilisateur", description: data.name ? `${data.name} vient de s'inscrire` : "Nouvel inscrit sur la plateforme", type: "user", time: new Date(), read: false, href: NOTIF_HREFS.user });
      }
      if (data.type === "alarm") {
        addNotif({ id: crypto.randomUUID(), title: "🚨 ALERTE", description: data.reason || "Urgence — vérifiez immédiatement", type: "alarm", time: new Date(), read: false, href: NOTIF_HREFS.alarm });
      }
      if (data.type === "order_updated") {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
    });
  }, []);

  const dismissNotif = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const clearAll = () => {
    setNotifs([]);
    setNotifPanelOpen(false);
    sessionStorage.removeItem(NOTIF_SESSION_KEY);
  };
  const openPanel = () => {
    setNotifPanelOpen(true);
    setNotifs(p => p.map(n => ({ ...n, read: true })));
  };
  const closePanel = () => setNotifPanelOpen(false);

  return {
    notifs, notifPanelOpen, notifRinging,
    liveToast, setLiveToast, unreadCount,
    openPanel, closePanel,
    dismissNotif, markAllRead, clearAll,
  };
}
