/* ─────────────────────────────────────────────────────────────
   MAWEJA — Notify : primitives de livraison (audio, vibration, système)
   Tous les "comment notifier" : sonneries, vibrations, perm. & notifs OS.
   ───────────────────────────────────────────────────────────── */

/* ─── Plate-forme ──────────────────────────────────────────── */
export type DevicePlatform = "ios" | "android" | "web";

interface CapacitorWindow {
  Capacitor?: {
    getPlatform?: () => string;
    isNativePlatform?: () => boolean;
    Plugins?: {
      LocalNotifications?: LocalNotificationsPlugin;
      Haptics?: HapticsPlugin;
    };
  };
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

interface LocalNotificationsPlugin {
  createChannel?: (cfg: Record<string, unknown>) => Promise<void>;
  requestPermissions: () => Promise<{ display: string }>;
  checkPermissions: () => Promise<{ display: string }>;
  schedule: (cfg: { notifications: Array<Record<string, unknown>> }) => Promise<void>;
  cancel?: (cfg: { notifications: Array<{ id: number }> }) => Promise<void>;
  removeDeliveredNotifications?: (cfg: { notifications: Array<{ id: number }> }) => Promise<void>;
  getDeliveredNotifications?: () => Promise<{ notifications: Array<{ id: number; tag?: string; extra?: any }> }>;
}

interface HapticsPlugin {
  impact?: (cfg: { style: "LIGHT" | "MEDIUM" | "HEAVY" }) => Promise<void>;
}

const win = (): CapacitorWindow => (typeof window === "undefined" ? {} : (window as unknown as CapacitorWindow));

export function getDevicePlatform(): DevicePlatform {
  try {
    const cap = win().Capacitor;
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
  try { return win().Capacitor?.isNativePlatform?.() === true; }
  catch { return false; }
}

/* ─── Sonneries (catalogue + persistance) ──────────────────── */
export type RingtoneId = "maweja" | "classic" | "chime" | "bell" | "ding" | "digital" | "silent" | "custom";

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

export interface CustomRingtone { dataUrl: string; name: string; }

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

/* ─── Moteur audio (AudioContext + pool <audio>) ──────────── */
let sharedCtx: AudioContext | null = null;
let audioUnlocked = false;
const audioPool = new Map<string, HTMLAudioElement>();

function getOrCreateAudio(src: string): HTMLAudioElement {
  let a = audioPool.get(src);
  if (a) return a;
  a = new Audio(src);
  a.preload = "auto";
  a.crossOrigin = "anonymous";
  try { a.load(); } catch {}
  audioPool.set(src, a);
  return a;
}

function getOrCreateCtx(): AudioContext | null {
  try {
    const w = win();
    const Ctx = w.AudioContext || w.webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedCtx || sharedCtx.state === "closed") sharedCtx = new Ctx();
    return sharedCtx;
  } catch { return null; }
}

async function ensureCtxRunning(): Promise<void> {
  const ctx = getOrCreateCtx();
  if (ctx?.state === "suspended") { try { await ctx.resume(); } catch {} }
}

export function unlockAudioPlayback(): void {
  try {
    const ctx = getOrCreateCtx();
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      try {
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      } catch {}
    }
    const srcs = RINGTONES.filter(r => r.kind === "file" && r.src).map(r => r.src!);
    const custom = getCustomRingtone();
    if (custom) srcs.push(custom.dataUrl);
    for (const src of srcs) {
      const a = getOrCreateAudio(src);
      const wasMuted = a.muted;
      a.muted = true;
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.then(() => { a.pause(); a.currentTime = 0; a.muted = wasMuted; })
         .catch(() => { a.muted = wasMuted; });
      } else {
        a.muted = wasMuted;
      }
    }
    audioUnlocked = true;
  } catch {}
}

export function isAudioUnlocked(): boolean { return audioUnlocked; }

export function installAudioUnlockOnce(opts?: { askNotifPermission?: boolean }): void {
  if (typeof window === "undefined") return;
  const askPerm = opts?.askNotifPermission !== false;
  const handler = () => {
    unlockAudioPlayback();
    if (askPerm) requestNotifPermission().catch(() => {});
    window.removeEventListener("click", handler, true);
    window.removeEventListener("touchstart", handler, true);
    window.removeEventListener("keydown", handler, true);
  };
  window.addEventListener("click", handler, true);
  window.addEventListener("touchstart", handler, true);
  window.addEventListener("keydown", handler, true);
}

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
      osc.connect(g); g.connect(master);
      const t0 = ctx.currentTime + start;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    };
    switch (id) {
      case "chime":   note(523.25, 0, 0.45); note(659.25, 0.18, 0.45); note(783.99, 0.36, 0.55); break;
      case "bell":    note(880, 0, 0.9, "triangle", 0.45); note(660, 0.05, 0.9, "sine", 0.25); break;
      case "ding":    note(1046.5, 0, 0.6, "sine", 0.5); break;
      case "digital": note(1200, 0, 0.12, "square", 0.25); note(1600, 0.15, 0.12, "square", 0.25); note(1200, 0.30, 0.18, "square", 0.25); break;
      default:        note(659.25, 0, 0.4);
    }
  } catch {}
}

export function playRingtone(idOverride?: RingtoneId, volumeOverride?: number) {
  const id = idOverride ?? getSelectedRingtone();
  const vol = volumeOverride ?? getRingtoneVolume();
  if (id === "silent" || vol === 0) return;
  ensureCtxRunning();
  const tryPlayFile = (src: string) => {
    const audio = getOrCreateAudio(src);
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = vol;
      audio.muted = false;
      const p = audio.play();
      if (p && typeof p.then === "function") p.catch(() => playSynth("chime", vol));
    } catch { playSynth("chime", vol); }
  };
  if (id === "custom") {
    const custom = getCustomRingtone();
    if (custom) { tryPlayFile(custom.dataUrl); return; }
    playSynth("chime", vol); return;
  }
  const def = RINGTONES.find(r => r.id === id);
  if (!def) return;
  if (def.kind === "file" && def.src) tryPlayFile(def.src);
  else playSynth(id, vol);
}

export function playAdminAlertSound() { playRingtone(); }
export function playNotifSound() { playRingtone(); }

/* ─── Vibrations (Capacitor Haptics + navigator.vibrate) ───── */
export type HapticPattern = "light" | "medium" | "heavy" | "double" | "long";

export async function vibrate(pattern: HapticPattern = "medium"): Promise<void> {
  if (isNative()) {
    try {
      const haptics = win().Capacitor?.Plugins?.Haptics;
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
  try {
    const map: Record<HapticPattern, number | number[]> = {
      light: 40, medium: 120, heavy: 250, double: [120, 80, 120], long: [250, 100, 250],
    };
    navigator.vibrate?.(map[pattern]);
  } catch {}
}

/* ─── Notifications système (Capacitor + Notification API) ── */
let notifId = 1;
let channelCreated = false;

function getLocalNotificationsPlugin(): LocalNotificationsPlugin | null {
  try { return win().Capacitor?.Plugins?.LocalNotifications ?? null; }
  catch { return null; }
}

export async function ensureNotifChannel() {
  if (channelCreated || !isNative()) return;
  try {
    const plugin = getLocalNotificationsPlugin();
    if (!plugin?.createChannel) return;
    // ⚠️ id="maweja_default" : DOIT correspondre au channelId envoyé par
    // le serveur dans les payloads FCM (cf. server/lib/push.ts) sinon
    // Android utilise un canal "Misc" silencieux.
    await plugin.createChannel({
      id: "maweja_default",
      name: "MAWEJA Notifications",
      description: "Nouvelles commandes, messages chat et alertes importantes",
      importance: 5,
      visibility: 1,
      sound: "default",
      vibration: true,
      lights: true,
      lightColor: "#EC0000",
    });
    // Compat : ancien id, conservé pour les payloads en transit
    try {
      await plugin.createChannel({
        id: "maweja_orders",
        name: "MAWEJA — Commandes & Messages (legacy)",
        description: "Nouvelles commandes, messages chat et alertes importantes",
        importance: 5,
        visibility: 1,
        sound: "default",
        vibration: true,
        lights: true,
        lightColor: "#EC0000",
      });
    } catch {}
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
  try { return (await Notification.requestPermission()) === "granted"; }
  catch { return false; }
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

export const NOTIF_LOGO = "/maweja-logo-red.png";

/**
 * Résout une URL d'image en URL absolue HTTPS quand on tourne en natif
 * (les LocalNotifications mobiles refusent les chemins relatifs).
 */
function absolutizeImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^(https?:|data:|file:)/i.test(url)) return url;
  try {
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
    }
  } catch {}
  return url;
}

/**
 * Convertit une clé arbitraire (ex: "chat-42") en id numérique 32-bit
 * stable pour LocalNotifications (Android/iOS exigent un int).
 * Deux notifs avec la même clé → même id → la nouvelle remplace l'ancienne.
 */
export function notifIdForKey(key: string): number {
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  // Toujours positif et < 2^31
  return Math.abs(h) % 2147483647;
}

export async function showNotif(
  title: string,
  body: string,
  iconOrImage: string = NOTIF_LOGO,
  imageUrl?: string | null,
  opts?: { tag?: string; groupKey?: string },
) {
  // Compat : ancien appel showNotif(title, body, iconUrl) reste valable.
  // Nouveau 4ᵉ argument facultatif : grande image attachée à la notif.
  // Nouveau 5ᵉ argument facultatif : tag/groupKey pour coalescer les notifs
  // d'une même conversation chat (la nouvelle remplace l'ancienne).
  const absImg = absolutizeImageUrl(imageUrl);
  const tag = opts?.tag;
  const stableId = tag ? notifIdForKey(tag) : notifId++;

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
          id: stableId, title, body,
          smallIcon: "ic_stat_notify",
          largeIcon: "ic_notif_large",
          iconColor: "#EC0000",
          sound: "default",
          autoCancel: true,
          channelId: "maweja_default",
          ...(tag ? { tag, group: opts?.groupKey || tag, extra: { tag } } : {}),
          ...(absImg
            ? {
                attachments: [{ id: "img", url: absImg, options: { typeHint: "image/jpeg" } }],
                largeBody: body,
              }
            : {}),
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
    new Notification(title, {
      body,
      icon: iconOrImage,
      badge: iconOrImage,
      ...(absImg ? { image: absImg } as any : {}),
      // tag stable → la nouvelle notif remplace l'ancienne pour la même conversation
      tag: tag || `maweja-${Date.now()}`,
      renotify: !!tag,
    } as NotificationOptions);
  } catch (e) {
    console.error("[MAWEJA] Browser Notification error:", e);
  }
}

/**
 * Annule (efface) toutes les notifs système liées à une clé donnée.
 * Utilisé quand l'utilisateur lit une conversation chat : on retire
 * la notif persistante du tray Android/iOS et on close la web Notification.
 */
export async function cancelNotifByTag(tag: string): Promise<void> {
  const stableId = notifIdForKey(tag);
  if (isNative()) {
    try {
      const plugin = getLocalNotificationsPlugin();
      if (plugin?.removeDeliveredNotifications) {
        await plugin.removeDeliveredNotifications({ notifications: [{ id: stableId }] });
      }
      if (plugin?.cancel) {
        await plugin.cancel({ notifications: [{ id: stableId }] });
      }
    } catch {}
    return;
  }
  // Web : crée une Notification éphémère avec le même tag puis la ferme aussitôt
  // (l'API Notification ne permet pas de retrouver les notifs existantes,
  // mais renotify=false + tag identique remplace silencieusement l'ancienne).
  try {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const n = new Notification("", { tag, silent: true } as NotificationOptions);
      setTimeout(() => { try { n.close(); } catch {} }, 50);
    }
  } catch {}
}

/** Helper pratique : tag standardisé pour une conversation 1↔1. */
export function chatNotifTag(otherUserId: number | string): string {
  return `chat-${otherUserId}`;
}

/* ─── Dedupe (utilisé par les modules d'événements) ────────── */
const handledNotifIds = new Map<string, number>();
const NOTIFID_DEDUPE_MS = 8000;

export function markNotifHandled(id: string | number | null | undefined): void {
  if (id === null || id === undefined || id === "") return;
  const k = String(id);
  handledNotifIds.set(k, Date.now() + NOTIFID_DEDUPE_MS);
  if (handledNotifIds.size > 100) {
    const now = Date.now();
    for (const [key, exp] of handledNotifIds) if (exp < now) handledNotifIds.delete(key);
  }
}

export function wasNotifHandled(id: string | number | null | undefined): boolean {
  if (id === null || id === undefined || id === "") return false;
  const k = String(id);
  const exp = handledNotifIds.get(k);
  if (!exp) return false;
  if (exp < Date.now()) { handledNotifIds.delete(k); return false; }
  return true;
}
