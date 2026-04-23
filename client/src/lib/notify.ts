/* ─────────────────────────────────────────────────────────────
   MAWEJA — Système de notifications & sonneries (v2026)

   Conçu pour les standards mobiles 2026 :
   • AudioContext partagé persistant (résumé à chaque play)
   • Pool d'<audio> préchargés → contourne les politiques autoplay
   • Vibration native (Capacitor Haptics) + navigator.vibrate fallback
   • Notifications système (LocalNotifications natif, Notification web)
   • Dé-duplication d'événements (anti-spam 2 s)
   • Demande de permission différée au premier geste utilisateur
   • Reconnexion WebSocket sur resume / visibilitychange
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
  { id: "maweja",  label: "MAWEJA Officiel", description: "Sonnerie signature MAWEJA",         kind: "file",  src: "/sounds/maweja.mp3" },
  { id: "classic", label: "Classique",       description: "Notification standard",             kind: "file",  src: "/sounds/classic.mp3" },
  { id: "chime",   label: "Carillon",        description: "3 notes ascendantes douces",        kind: "synth" },
  { id: "bell",    label: "Cloche",          description: "Sonnerie type cloche",              kind: "synth" },
  { id: "ding",    label: "Ding",            description: "Une note courte et claire",         kind: "synth" },
  { id: "digital", label: "Digital",         description: "Bip moderne aigu",                  kind: "synth" },
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
  } catch {
    throw new Error("Le fichier est trop volumineux pour être stocké (limite navigateur dépassée).");
  }
}

export function clearCustomRingtone() {
  try {
    localStorage.removeItem(LS_CUSTOM_DATA);
    localStorage.removeItem(LS_CUSTOM_NAME);
  } catch {}
}

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

/* ─── Device detection ─────────────────────────────────────── */
export type DevicePlatform = "ios" | "android" | "web";

export function getDevicePlatform(): DevicePlatform {
  try {
    const cap = (window as any).Capacitor;
    if (cap?.getPlatform) {
      const p = String(cap.getPlatform()).toLowerCase();
      if (p === "ios" || p === "android") return p;
    }
    if (cap?.isNativePlatform?.()) {
      const ua = navigator.userAgent || "";
      if (/android/i.test(ua)) return "android";
      if (/iphone|ipad|ipod/i.test(ua)) return "ios";
    }
  } catch {}
  return "web";
}

function isNative(): boolean {
  try {
    return (window as any).Capacitor?.isNativePlatform?.() === true;
  } catch { return false; }
}

/* ─── Audio engine (persistent, shared, gesture-unlocked) ──── */
let sharedCtx: AudioContext | null = null;
let audioUnlocked = false;

/** Audio HTMLElement pool keyed by src — preloaded once, reused forever. */
const audioPool = new Map<string, HTMLAudioElement>();

function getOrCreateAudio(src: string): HTMLAudioElement {
  let a = audioPool.get(src);
  if (a) return a;
  a = new Audio(src);
  a.preload = "auto";
  a.crossOrigin = "anonymous";
  // Try to preload (non-blocking)
  try { a.load(); } catch {}
  audioPool.set(src, a);
  return a;
}

function getOrCreateCtx(): AudioContext | null {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedCtx || sharedCtx.state === "closed") {
      sharedCtx = new Ctx();
    }
    return sharedCtx;
  } catch { return null; }
}

/** Force-resume the shared AudioContext (no-op if not needed). */
async function ensureCtxRunning(): Promise<void> {
  const ctx = getOrCreateCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try { await ctx.resume(); } catch {}
  }
}

/**
 * Unlock the audio pipeline. Must be called from a user gesture.
 * Idempotent — safe to call many times. Once unlocked, future
 * playRingtone() calls will work even from non-gesture contexts
 * (e.g. WebSocket message arriving in background).
 */
export function unlockAudioPlayback(): void {
  try {
    // 1. Boot/resume the shared AudioContext
    const ctx = getOrCreateCtx();
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      // play silent buffer to fully unlock
      try {
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      } catch {}
    }

    // 2. Pre-warm every file ringtone (silent muted play+pause)
    const srcs = RINGTONES.filter(r => r.kind === "file" && r.src).map(r => r.src!);
    const custom = getCustomRingtone();
    if (custom) srcs.push(custom.dataUrl);

    for (const src of srcs) {
      const a = getOrCreateAudio(src);
      const wasMuted = a.muted;
      a.muted = true;
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = wasMuted;
        }).catch(() => {
          a.muted = wasMuted;
        });
      } else {
        a.muted = wasMuted;
      }
    }

    audioUnlocked = true;
  } catch {}
}

export function isAudioUnlocked(): boolean {
  return audioUnlocked;
}

/** Attach a one-time listener that unlocks audio + asks notif permission on first gesture. */
export function installAudioUnlockOnce(opts?: { askNotifPermission?: boolean }): void {
  if (typeof window === "undefined") return;
  const askPerm = opts?.askNotifPermission !== false;

  const handler = () => {
    unlockAudioPlayback();
    if (askPerm) {
      // Request permission silently — if user already granted/denied, no popup
      requestNotifPermission().catch(() => {});
    }
    window.removeEventListener("click", handler, true);
    window.removeEventListener("touchstart", handler, true);
    window.removeEventListener("keydown", handler, true);
  };
  window.addEventListener("click", handler, true);
  window.addEventListener("touchstart", handler, true);
  window.addEventListener("keydown", handler, true);
}

/* ─── Synth tones (Web Audio fallback) ─────────────────────── */
function playSynth(id: RingtoneId, volume: number) {
  if (id === "silent") return;
  const ctx = getOrCreateCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  try {
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

/* ─── Public ringtone API ──────────────────────────────────── */
export function playRingtone(idOverride?: RingtoneId, volumeOverride?: number) {
  const id = idOverride ?? getSelectedRingtone();
  const vol = volumeOverride ?? getRingtoneVolume();
  if (id === "silent" || vol === 0) return;

  // Always try to keep ctx alive
  ensureCtxRunning();

  const tryPlayFile = (src: string) => {
    const audio = getOrCreateAudio(src);
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = vol;
      audio.muted = false;
      const p = audio.play();
      if (p && typeof p.then === "function") {
        p.catch(() => playSynth("chime", vol));
      }
    } catch {
      playSynth("chime", vol);
    }
  };

  if (id === "custom") {
    const custom = getCustomRingtone();
    if (custom) {
      tryPlayFile(custom.dataUrl);
      return;
    }
    playSynth("chime", vol);
    return;
  }

  const def = RINGTONES.find(r => r.id === id);
  if (!def) return;
  if (def.kind === "file" && def.src) {
    tryPlayFile(def.src);
  } else {
    playSynth(id, vol);
  }
}

/* ─── Backward-compat ringtone helpers ─────────────────────── */
export function playAdminAlertSound() { playRingtone(); }
export function playNotifSound() { playRingtone(); }

/* ─── Vibration (Capacitor Haptics + navigator.vibrate) ────── */
type HapticPattern = "light" | "medium" | "heavy" | "double" | "long";

export async function vibrate(pattern: HapticPattern = "medium"): Promise<void> {
  // 1. Capacitor Haptics on native
  if (isNative()) {
    try {
      const cap = (window as any).Capacitor;
      const haptics = cap?.Plugins?.Haptics;
      if (haptics) {
        if (pattern === "light") await haptics.impact?.({ style: "LIGHT" });
        else if (pattern === "heavy" || pattern === "long") await haptics.impact?.({ style: "HEAVY" });
        else if (pattern === "double") {
          await haptics.impact?.({ style: "MEDIUM" });
          setTimeout(() => haptics.impact?.({ style: "MEDIUM" }), 120);
        } else await haptics.impact?.({ style: "MEDIUM" });
        return;
      }
    } catch {}
  }
  // 2. navigator.vibrate fallback (Android web, PWA)
  try {
    const map: Record<HapticPattern, number | number[]> = {
      light: 40,
      medium: 120,
      heavy: 250,
      double: [120, 80, 120],
      long: [250, 100, 250],
    };
    navigator.vibrate?.(map[pattern]);
  } catch {}
}

/* ─── System notifications ─────────────────────────────────── */
let notifId = 1;
let channelCreated = false;

function getLocalNotificationsPlugin(): any | null {
  try { return (window as any).Capacitor?.Plugins?.LocalNotifications ?? null; }
  catch { return null; }
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
      importance: 5,
      visibility: 1,
      sound: "default",
      vibration: true,
      lights: true,
      lightColor: "#EC0000",
    });
    channelCreated = true;
  } catch {}
}

export async function requestNotifPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const plugin = getLocalNotificationsPlugin();
      if (!plugin) return false;
      await ensureNotifChannel();
      const { display } = await plugin.requestPermissions();
      return display === "granted";
    } catch { return false; }
  }
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const res = await Notification.requestPermission();
    return res === "granted";
  } catch { return false; }
}

export async function getNotifPermission(): Promise<"granted" | "denied" | "default"> {
  if (isNative()) {
    try {
      const plugin = getLocalNotificationsPlugin();
      if (!plugin) return "denied";
      const { display } = await plugin.checkPermissions();
      return display === "granted" ? "granted" : "denied";
    } catch { return "denied"; }
  }
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
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
        const r = await plugin.requestPermissions();
        if (r.display !== "granted") return;
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
      return;
    } catch (e) {
      console.error("[MAWEJA] LocalNotification error:", e);
    }
  }
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon, badge: icon, tag: `maweja-${Date.now()}` });
  } catch (e) {
    console.error("[MAWEJA] Browser Notification error:", e);
  }
}

/* ─── Master event dispatcher ──────────────────────────────── */
const STATUS_FR: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée ✅",
  preparing: "En préparation 👨‍🍳",
  ready: "Prête - Agent en route 🛵",
  picked_up: "Récupérée par l'agent 🛵",
  delivered: "Livrée ! 🎉",
  cancelled: "Annulée ❌",
};

/** Dedupe table: key → last fire timestamp. */
const lastFiredAt = new Map<string, number>();
const DEDUPE_WINDOW_MS = 1500;

function shouldFire(key: string): boolean {
  const now = Date.now();
  const prev = lastFiredAt.get(key) || 0;
  if (now - prev < DEDUPE_WINDOW_MS) return false;
  lastFiredAt.set(key, now);
  // Periodic cleanup
  if (lastFiredAt.size > 200) {
    for (const [k, t] of lastFiredAt) if (now - t > 60_000) lastFiredAt.delete(k);
  }
  return true;
}

function userPrefs() {
  return {
    appOn:      localStorage.getItem("maweja_notif_app") !== "false",
    ordersOn:   localStorage.getItem("maweja_notif_orders") !== "false",
    messagesOn: localStorage.getItem("maweja_notif_messages") !== "false",
  };
}

/**
 * Single source of truth for incoming WS events.
 * Plays sound + vibrates + shows system notification, with dedupe.
 */
export function handleWSEvent(data: any) {
  if (!data || typeof data !== "object") return;
  const prefs = userPrefs();
  if (!prefs.appOn) return;

  // Build a dedupe key per event so e.g. order_updated for same order
  // received twice in a row (server sends 2 events) only rings once.
  const orderId = data.order?.id ?? data.orderId ?? "";
  const dedupeKey = `${data.type}:${orderId || JSON.stringify(data).slice(0, 80)}`;
  if (!shouldFire(dedupeKey)) return;

  switch (data.type) {
    case "order_status": {
      if (!prefs.ordersOn) return;
      const label = STATUS_FR[data.status] || data.status;
      playRingtone(); vibrate("medium");
      showNotif("🍽️ MAWEJA – Commande", `Statut : ${label}`);
      break;
    }
    case "order_updated": {
      if (!prefs.ordersOn) return;
      const o = data.order;
      if (!o) return;
      const label = STATUS_FR[o.status] || o.status;
      playRingtone(); vibrate("medium");
      showNotif("🍽️ MAWEJA – Commande", `Commande #${o.orderNumber} : ${label}`);
      break;
    }
    case "order_assigned": {
      if (!prefs.ordersOn) return;
      playRingtone(); vibrate("double");
      showNotif("🛵 MAWEJA – Agent", "Un agent a été assigné à votre commande !");
      break;
    }
    case "new_order": {
      if (!prefs.ordersOn) return;
      const o = data.order;
      playRingtone(); vibrate("heavy");
      showNotif(
        "🛵 MAWEJA – Nouvelle commande",
        o ? `Commande #${o.orderNumber} disponible !` : "Nouvelle commande disponible !",
      );
      break;
    }
    case "order_picked_up": {
      if (!prefs.ordersOn) return;
      playRingtone(); vibrate("medium");
      const o = data.order;
      showNotif("🛵 MAWEJA – Récupérée", o ? `Commande #${o.orderNumber} en route` : "Commande récupérée");
      break;
    }
    case "order_cancelled": {
      if (!prefs.ordersOn) return;
      const oc = data.order;
      playRingtone(); vibrate("long");
      showNotif("❌ MAWEJA – Commande annulée", oc ? `Commande #${oc.orderNumber} a été annulée` : "Une commande a été annulée");
      break;
    }
    case "driver_accepted_order": {
      if (!prefs.ordersOn) return;
      playRingtone(); vibrate("medium");
      showNotif("✅ MAWEJA – Agent", "Un agent a accepté la commande");
      break;
    }
    case "driver_refused_order": {
      if (!prefs.ordersOn) return;
      vibrate("light");
      showNotif("⚠️ MAWEJA – Agent", "Un agent a refusé la commande");
      break;
    }
    case "service_update": {
      const srv = data.data || data;
      const statusMap: Record<string, string> = {
        pending: "En attente", reviewing: "En cours d'examen",
        accepted: "Acceptée ✅", rejected: "Refusée ❌", completed: "Terminée ✅",
      };
      const label = statusMap[srv.status] || srv.status;
      const note = srv.adminNotes ? `\n${srv.adminNotes}` : "";
      playRingtone(); vibrate("medium");
      showNotif("📋 MAWEJA – Service", `${srv.categoryName || "Demande"} : ${label}${note}`);
      break;
    }
    case "new_service_request": {
      playRingtone(); vibrate("medium");
      const r = data.request;
      showNotif("📋 MAWEJA – Service", r ? `Nouvelle demande : ${r.serviceType || r.categoryName || "service"}` : "Nouvelle demande de service");
      break;
    }
    case "notification": {
      const n = data.notification || data.data || {};
      const title = n.title || data.title || "MAWEJA";
      const message = n.message || data.message || "";
      if (!message) return;
      playRingtone(); vibrate("light");
      showNotif(title, message);
      break;
    }
    case "chat_message": {
      if (!prefs.messagesOn) return;
      playRingtone(); vibrate("double");
      const msg = data.notification?.message || data.message?.message || "Nouveau message reçu";
      showNotif("💬 MAWEJA – Message", msg);
      break;
    }
    case "alarm": {
      playRingtone(); vibrate("long");
      showNotif("🚨 MAWEJA – ALERTE", data.reason || "Urgence - Contactez l'administration");
      break;
    }
    case "verification_approved":
      playRingtone(); vibrate("double");
      showNotif("✅ MAWEJA – Vérification", "Votre compte a été approuvé !");
      break;
    case "verification_rejected":
      playRingtone(); vibrate("medium");
      showNotif("⚠️ MAWEJA – Vérification", "Des corrections sont requises sur votre profil.");
      break;
    case "driver_verification":
      playRingtone(); vibrate("medium");
      showNotif("📋 MAWEJA – Admin", data.driverName ? `${data.driverName} a soumis ses documents` : "Un agent a soumis ses documents pour vérification");
      break;
    case "new_user":
      playRingtone(); vibrate("light");
      showNotif("👤 MAWEJA – Admin", data.name ? `${data.name} vient de s'inscrire` : "Un nouvel utilisateur s'est inscrit");
      break;
    default:
      break;
  }
}
