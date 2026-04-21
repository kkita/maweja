export function playAdminAlertSound() {
  try {
    const audio = new Audio("/notification.mp3");
    audio.volume = 1.0;
    audio.play().catch(() => {});
  } catch {}
}

export function playNotifSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const t0 = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.35, t0 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.42);
      osc.start(t0);
      osc.stop(t0 + 0.45);
    });
  } catch {}
}

const STATUS_FR: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée ✅",
  preparing: "En préparation 👨‍🍳",
  ready: "Prête - Agent en route 🛵",
  picked_up: "Récupérée par l'agent 🛵",
  delivered: "Livrée ! 🎉",
  cancelled: "Annulée ❌",
};

let notifId = 1;
let channelCreated = false;

function isNative(): boolean {
  return typeof (window as any).Capacitor !== "undefined" &&
    (window as any).Capacitor?.isNativePlatform?.() === true;
}

function getLocalNotificationsPlugin(): any | null {
  try {
    return (window as any).Capacitor?.Plugins?.LocalNotifications ?? null;
  } catch {
    return null;
  }
}

async function ensureNotifChannel() {
  if (channelCreated || !isNative()) return;
  try {
    const plugin = getLocalNotificationsPlugin();
    if (!plugin?.createChannel) return;
    await plugin.createChannel({
      id: "maweja_default",
      name: "MAWEJA",
      description: "Notifications MAWEJA",
      importance: 4,
      visibility: 1,
      sound: "default",
      vibration: true,
    });
    channelCreated = true;
  } catch {}
}

export async function requestNotifPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const plugin = getLocalNotificationsPlugin();
      if (!plugin) return false;
      const { display } = await plugin.requestPermissions();
      return display === "granted";
    } catch {
      return false;
    }
  }
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export async function getNotifPermission(): Promise<"granted" | "denied" | "default"> {
  if (isNative()) {
    try {
      const plugin = getLocalNotificationsPlugin();
      if (!plugin) return "denied";
      const { display } = await plugin.checkPermissions();
      return display === "granted" ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

const NOTIF_LOGO = "/maweja-logo-red.png";

export async function showNotif(title: string, body: string, icon = NOTIF_LOGO) {
  if (isNative()) {
    try {
      const plugin = getLocalNotificationsPlugin();
      if (!plugin) return;
      await ensureNotifChannel();
      const perms = await plugin.checkPermissions();
      if (perms.display !== "granted") {
        await plugin.requestPermissions();
      }
      await plugin.schedule({
        notifications: [{
          id: notifId++,
          title,
          body,
          smallIcon: "ic_stat_notify",
          largeIcon: "ic_notif_large",
          iconColor: "#EC0000",
          sound: "default",
          autoCancel: true,
          channelId: "maweja_default",
        }],
      });
    } catch (e) {
      console.error("[MAWEJA] LocalNotification error:", e);
    }
  } else {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      new Notification(title, { body, icon, badge: icon, tag: `maweja-${Date.now()}` });
    } catch (e) {
      console.error("[MAWEJA] Browser Notification error:", e);
    }
  }
}

export function handleWSEvent(data: any) {
  const notifApp = localStorage.getItem("maweja_notif_app") !== "false";
  const notifOrders = localStorage.getItem("maweja_notif_orders") !== "false";
  if (!notifApp) return;

  switch (data.type) {
    case "order_status": {
      if (!notifOrders) return;
      const label = STATUS_FR[data.status] || data.status;
      showNotif("🍽️ MAWEJA – Commande", `Statut : ${label}`);
      break;
    }
    case "order_updated": {
      if (!notifOrders) return;
      const o = data.order;
      if (o) {
        const label = STATUS_FR[o.status] || o.status;
        showNotif("🍽️ MAWEJA – Commande", `Commande #${o.orderNumber} : ${label}`);
      }
      break;
    }
    case "order_assigned": {
      if (!notifOrders) return;
      showNotif("🛵 MAWEJA – Agent", "Un agent a été assigné à votre commande !");
      break;
    }
    case "new_order": {
      if (!notifOrders) return;
      const o = data.order;
      showNotif("🛵 MAWEJA – Nouvelle commande", o ? `Commande #${o.orderNumber} disponible !` : "Nouvelle commande disponible !");
      break;
    }
    case "order_cancelled": {
      if (!notifOrders) return;
      const oc = data.order;
      showNotif("❌ MAWEJA – Commande annulée", oc ? `Commande #${oc.orderNumber} a été annulée` : "Une commande a été annulée");
      break;
    }
    case "service_update": {
      const srv = data.data || data;
      const statusMap: Record<string, string> = {
        pending: "En attente",
        reviewing: "En cours d'examen",
        accepted: "Acceptée ✅",
        rejected: "Refusée ❌",
        completed: "Terminée ✅",
      };
      const label = statusMap[srv.status] || srv.status;
      const note = srv.adminNotes ? `\n${srv.adminNotes}` : "";
      playNotifSound();
      showNotif("📋 MAWEJA – Service", `${srv.categoryName || "Demande"} : ${label}${note}`);
      break;
    }
    case "notification": {
      const n = data.notification || data.data || {};
      const title = n.title || data.title || "MAWEJA";
      const message = n.message || data.message || "";
      if (message) showNotif(title, message);
      break;
    }
    case "chat_message": {
      const chatOk = localStorage.getItem("maweja_notif_messages") !== "false";
      if (!chatOk) return;
      playAdminAlertSound();
      try { navigator.vibrate?.([200, 80, 200]); } catch {}
      showNotif("💬 MAWEJA – Message", data.notification?.message || data.message?.message || "Nouveau message reçu");
      break;
    }
    case "alarm":
      showNotif("🚨 MAWEJA – ALERTE", data.reason || "Urgence - Contactez l'administration");
      break;
    case "verification_approved":
      showNotif("✅ MAWEJA – Vérification", "Votre compte a été approuvé !");
      break;
    case "verification_rejected":
      showNotif("⚠️ MAWEJA – Vérification", "Des corrections sont requises sur votre profil.");
      break;
    case "driver_verification":
      showNotif("📋 MAWEJA – Admin", "Un agent a soumis ses documents pour vérification");
      break;
    case "new_user":
      showNotif("👤 MAWEJA – Admin", "Un nouvel utilisateur s'est inscrit");
      break;
    default:
      break;
  }
}
