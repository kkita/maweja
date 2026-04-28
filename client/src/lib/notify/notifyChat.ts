/* ─────────────────────────────────────────────────────────────
   MAWEJA — Notify : événements chat & notifications génériques
   ───────────────────────────────────────────────────────────── */
import { playRingtone, vibrate, showNotif, markNotifHandled, wasNotifHandled } from "./notifyAudio";

export interface ChatEventData {
  type: string;
  notification?: {
    id?: string | number;
    title?: string;
    message?: string;
    imageUrl?: string | null;
  } | null;
  message?: { id?: string | number; message?: string; imageUrl?: string | null } | null;
  data?: { title?: string; message?: string; imageUrl?: string | null } | null;
  title?: string;
  message_text?: string;
  imageUrl?: string | null;
  id?: string | number;
  [k: string]: unknown;
}

/** Extrait imageUrl en testant tous les emplacements possibles du payload WS. */
function extractImageUrl(data: ChatEventData): string | undefined {
  const candidates = [
    data.notification?.imageUrl,
    data.message?.imageUrl,
    data.data?.imageUrl,
    data.imageUrl,
  ];
  for (const c of candidates) {
    if (c) return c;
  }
  return undefined;
}

/**
 * Returns true if the event was matched & handled.
 * Caller controls dedupe windowing and user prefs (messagesOn).
 */
export function handleChatEvent(data: ChatEventData): boolean {
  switch (data.type) {
    case "notification": {
      const n = data.notification || data.data || {};
      const title = n.title || data.title || "MAWEJA";
      const message = (n as { message?: string }).message || (data as { message?: string }).message || "";
      if (!message) return true;
      const nid = (n as { id?: string | number }).id ?? data.id;
      if (wasNotifHandled(nid)) return true;
      markNotifHandled(nid);
      playRingtone(); vibrate("light");
      const img = extractImageUrl(data);
      showNotif(title, message, undefined, img);
      return true;
    }
    case "chat_message": {
      const msg = data.notification?.message || data.message?.message || "Nouveau message reçu";
      const nid = data.notification?.id ?? data.message?.id;
      if (wasNotifHandled(nid)) return true;
      markNotifHandled(nid);
      playRingtone(); vibrate("double");
      const img = extractImageUrl(data);
      showNotif("💬 MAWEJA – Message", msg, undefined, img);
      return true;
    }
    default:
      return false;
  }
}
