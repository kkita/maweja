/* ─────────────────────────────────────────────────────────────
   MAWEJA — Notify : barrel public (API publique inchangée)
   Implémentation éclatée en 4 modules thématiques :
   • notifyAudio.ts   primitives de livraison (audio, vibration, OS)
   • notifyOrder.ts   événements commandes & services
   • notifyChat.ts    événements chat & notifications génériques
   • notifyDriver.ts  événements agents, vérifications & alertes
   ───────────────────────────────────────────────────────────── */
export type { RingtoneId, Ringtone, CustomRingtone, HapticPattern, DevicePlatform } from "./notifyAudio";
export {
  RINGTONES,
  getCustomRingtone, setCustomRingtone, clearCustomRingtone, fileToDataUrl,
  getSelectedRingtone, setSelectedRingtone,
  getRingtoneVolume, setRingtoneVolume,
  unlockAudioPlayback, isAudioUnlocked, installAudioUnlockOnce,
  playRingtone, playAdminAlertSound, playNotifSound,
  vibrate,
  getDevicePlatform,
  ensureNotifChannel, requestNotifPermission, getNotifPermission,
  NOTIF_LOGO, showNotif,
  markNotifHandled, wasNotifHandled,
  cancelNotifByTag, chatNotifTag, notifIdForKey,
} from "./notifyAudio";

import { cancelNotifByTag as _cancelNotifByTag, chatNotifTag as _chatNotifTag } from "./notifyAudio";

/**
 * Helper haut-niveau : annule la notif système liée à une conversation chat
 * (ex: après markRead). À appeler côté UI quand l'utilisateur ouvre un fil
 * de discussion → la notif persistante du tray Android/iOS disparaît.
 */
export function cancelChatNotifs(otherUserId: number | string | null | undefined): void {
  if (otherUserId === null || otherUserId === undefined || otherUserId === "") return;
  _cancelNotifByTag(_chatNotifTag(otherUserId)).catch(() => {});
}

import { handleOrderEvent, type OrderEventData } from "./notifyOrder";
import { handleChatEvent, type ChatEventData } from "./notifyChat";
import { handleDriverEvent, type DriverEventData } from "./notifyDriver";

/* ─── Dedupe par évènement (fenêtre 1.5 s) ─────────────────── */
const lastFiredAt = new Map<string, number>();
const DEDUPE_WINDOW_MS = 1500;

function shouldFire(key: string): boolean {
  const now = Date.now();
  const prev = lastFiredAt.get(key) || 0;
  if (now - prev < DEDUPE_WINDOW_MS) return false;
  lastFiredAt.set(key, now);
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

const ORDER_TYPES = new Set([
  "order_status", "order_updated", "order_assigned", "new_order",
  "order_picked_up", "order_cancelled",
  "driver_accepted_order", "driver_refused_order",
  "service_update", "new_service_request",
]);
const CHAT_TYPES = new Set(["notification", "chat_message"]);

export interface WSEventData {
  type?: string;
  order?: { id?: number };
  orderId?: number | string;
  silent?: boolean;
  meta?: { adminPreview?: boolean; [k: string]: unknown } | null;
  [k: string]: unknown;
}

/**
 * Single source of truth for incoming WS events.
 * Routes to thematic handlers (order/chat/driver) with global dedupe & prefs.
 *
 * IMPORTANT — Filtre des previews admin :
 * Le serveur peut diffuser certains events vers le Dashboard pour un simple
 * rafraîchissement de liste (ex: aperçu de chat Client↔Agent). Ces events
 * portent `silent:true`, `meta.adminPreview:true` ou `type:"admin_chat_preview"`.
 * On les ignore systématiquement ici pour qu'ils ne déclenchent NI son NI
 * notification système sur le Dashboard. Ils restent disponibles pour les
 * écouteurs spécifiques de la page admin (qui s'abonnent en propre au WS).
 */
export function handleWSEvent(data: WSEventData) {
  if (!data || typeof data !== "object" || !data.type) return;

  // Filtre admin preview (silent fanout) — jamais de son ni de notif visuelle
  if (
    data.silent === true ||
    data.meta?.adminPreview === true ||
    data.type === "admin_chat_preview"
  ) {
    return;
  }

  const prefs = userPrefs();
  if (!prefs.appOn) return;

  const orderId = data.order?.id ?? data.orderId ?? "";
  const dedupeKey = `${data.type}:${orderId || JSON.stringify(data).slice(0, 80)}`;
  if (!shouldFire(dedupeKey)) return;

  if (ORDER_TYPES.has(data.type)) {
    if (!prefs.ordersOn) return;
    handleOrderEvent(data as OrderEventData);
    return;
  }
  if (CHAT_TYPES.has(data.type)) {
    if (data.type === "chat_message" && !prefs.messagesOn) return;
    handleChatEvent(data as ChatEventData);
    return;
  }
  handleDriverEvent(data as DriverEventData);
}
