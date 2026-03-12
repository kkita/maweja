const STATUS_FR: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée ✅",
  preparing: "En préparation 👨‍🍳",
  ready: "Prête - Livreur en route 🛵",
  picked_up: "Récupérée par le livreur 🛵",
  delivered: "Livrée ! 🎉",
  cancelled: "Annulée ❌",
};

let notifId = 1;

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

export async function showNotif(title: string, body: string, icon = "/logo.png") {
  if (isNative()) {
    try {
      const plugin = getLocalNotificationsPlugin();
      if (!plugin) return;
      const perms = await plugin.checkPermissions();
      if (perms.display !== "granted") {
        await plugin.requestPermissions();
      }
      await plugin.schedule({
        notifications: [{
          id: notifId++,
          title,
          body,
          smallIcon: "ic_launcher_foreground",
          iconColor: "#dc2626",
          sound: "default",
          autoCancel: true,
        }],
      });
    } catch (e) {
      console.error("[MAWEJA] LocalNotification error:", e);
    }
  } else {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      new Notification(title, { body, icon, badge: icon, tag: "maweja" });
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
      showNotif("🛵 MAWEJA – Livreur", "Un livreur a été assigné à votre commande !");
      break;
    }
    case "new_order": {
      if (!notifOrders) return;
      const o = data.order;
      showNotif("🛵 MAWEJA – Nouvelle commande", o ? `Commande #${o.orderNumber} disponible !` : "Nouvelle commande disponible !");
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
      const promoOk = localStorage.getItem("maweja_notif_promos") !== "false";
      if (!promoOk) return;
      showNotif("💬 MAWEJA – Message", data.notification?.message || "Nouveau message reçu");
      break;
    }
    case "verification_approved":
      showNotif("✅ MAWEJA – Vérification", "Votre compte a été approuvé !");
      break;
    case "verification_rejected":
      showNotif("⚠️ MAWEJA – Vérification", "Des corrections sont requises sur votre profil.");
      break;
    default:
      break;
  }
}
