/* ─────────────────────────────────────────────────────────────
   MAWEJA — Système de notifications + sonneries personnalisables
   ───────────────────────────────────────────────────────────── */

export type RingtoneId =
  | "maweja"
  | "classic"
  | "chime"
  | "bell"
  | "ding"
  | "digital"
  | "silent"
  | "custom";

export interface Ringtone {
  id: RingtoneId;
  label: string;
  description: string;
  kind: "file" | "synth" | "custom";
  src?: string;
}

export const RINGTONES: Ringtone[] = [
  { id: "maweja",  label: "MAWEJA Officiel", description: "Sonnerie signature MAWEJA", kind: "file",  src: "/sounds/maweja.mp3" },
  { id: "classic", label: "Classique",       description: "Notification standard",     kind: "file",  src: "/sounds/classic.mp3" },
  { id: "chime",   label: "Carillon",        description: "3 notes ascendantes douces", kind: "synth" },
  { id: "bell",    label: "Cloche",          description: "Sonnerie type cloche",       kind: "synth" },
  { id: "ding",    label: "Ding",            description: "Une note courte et claire",  kind: "synth" },
  { id: "digital", label: "Digital",         description: "Bip moderne aigu",            kind: "synth" },
  { id: "silent",  label: "Silencieux",      description: "Aucun son (notif visuelle uniquement)", kind: "synth" },
];

const LS_RINGTONE = "maweja_ringtone";
const LS_VOLUME = "maweja_ringtone_volume";
const LS_CUSTOM_DATA = "maweja_ringtone_custom_data";
const LS_CUSTOM_NAME = "maweja_ringtone_custom_name";

/* ─── Custom uploaded ringtone ─────────────────────────────── */
export interface CustomRingtone {
  dataUrl: string;
  name: string;
}

export function getCustomRingtone(): CustomRingtone | null {
  try {
    const dataUrl = localStorage.getItem(LS_CUSTOM_DATA);
    const name = localStorage.getItem(LS_CUSTOM_NAME) || "Sonnerie personnalisée";
    if (dataUrl && dataUrl.startsWith("data:audio")) return { dataUrl, name };
  } catch {}
  return null;
}

export function setCustomRingtone(dataUrl: string, name: string) {
  try {
    localStorage.setItem(LS_CUSTOM_DATA, dataUrl);
    localStorage.setItem(LS_CUSTOM_NAME, name);
  } catch (e) {
    throw new Error("Le fichier est trop volumineux pour être stocké (limite navigateur dépassée).");
  }
}

export function clearCustomRingtone() {
  try {
    localStorage.removeItem(LS_CUSTOM_DATA);
    localStorage.removeItem(LS_CUSTOM_NAME);
  } catch {}
}

/** Read a File and convert to a data URL string. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Lecture du fichier échouée"));
    reader.readAsDataURL(file);
  });
}

export function getSelectedRingtone(): RingtoneId {
  try {
    const v = localStorage.getItem(LS_RINGTONE) as RingtoneId | null;
    if (v === "custom") return "custom";
    if (v && RINGTONES.some(r => r.id === v)) return v;
  } catch {}
  return "maweja";
}

export function setSelectedRingtone(id: RingtoneId) {
  try { localStorage.setItem(LS_RINGTONE, id); } catch {}
}

export function getRingtoneVolume(): number {
  try {
    const v = parseFloat(localStorage.getItem(LS_VOLUME) || "1");
    if (!isNaN(v) && v >= 0 && v <= 1) return v;
  } catch {}
  return 1;
}

export function setRingtoneVolume(v: number) {
  try { localStorage.setItem(LS_VOLUME, String(Math.max(0, Math.min(1, v)))); } catch {}
}

/* ─── Synth tones (Web Audio) ──────────────────────────────── */
function playSynth(id: RingtoneId, volume: number) {
  if (id === "silent") return;
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);

    const note = (freq: number, start: number, dur: number, type: OscillatorType = "sine", peak = 0.35) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(g);
      g.connect(master);
      const t0 = ctx.currentTime + start;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    };

    switch (id) {
      case "chime":
        note(523.25, 0,    0.45);
        note(659.25, 0.18, 0.45);
        note(783.99, 0.36, 0.55);
        break;
      case "bell":
        note(880, 0,    0.9, "triangle", 0.45);
        note(660, 0.05, 0.9, "sine",     0.25);
        break;
      case "ding":
        note(1046.5, 0, 0.6, "sine", 0.5);
        break;
      case "digital":
        note(1200, 0,    0.12, "square", 0.25);
        note(1600, 0.15, 0.12, "square", 0.25);
        note(1200, 0.30, 0.18, "square", 0.25);
        break;
      default:
        note(659.25, 0, 0.4);
    }
  } catch {}
}

/* ─── Main API: play the selected ringtone ─────────────────── */
export function playRingtone(idOverride?: RingtoneId, volumeOverride?: number) {
  const id = idOverride ?? getSelectedRingtone();
  const vol = volumeOverride ?? getRingtoneVolume();
  if (id === "silent" || vol === 0) return;

  if (id === "custom") {
    const custom = getCustomRingtone();
    if (custom) {
      try {
        const audio = new Audio(custom.dataUrl);
        audio.volume = vol;
        audio.play().catch(() => playSynth("chime", vol));
        return;
      } catch {
        playSynth("chime", vol);
        return;
      }
    }
    // Pas de fichier custom enregistré → fallback
    playSynth("chime", vol);
    return;
  }

  const def = RINGTONES.find(r => r.id === id);
  if (!def) return;
  if (def.kind === "file" && def.src) {
    try {
      const audio = new Audio(def.src);
      audio.volume = vol;
      audio.play().catch(() => playSynth("chime", vol));
    } catch {
      playSynth("chime", vol);
    }
  } else {
    playSynth(id, vol);
  }
}

/* ─── Backward-compat exports ──────────────────────────────── */
export function playAdminAlertSound() {
  playRingtone();
}

export function playNotifSound() {
  playRingtone();
}

/* ─── French status labels ─────────────────────────────────── */
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
      playRingtone();
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
      playRingtone();
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
