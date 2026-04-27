/* ─────────────────────────────────────────────────────────────
   MAWEJA — Notify : événements chat & notifications génériques
   ───────────────────────────────────────────────────────────── */
import { playRingtone, vibrate, showNotif, markNotifHandled, wasNotifHandled } from "./notifyAudio";

export interface ChatEventData {
  type: string;
  notification?: { id?: string | number; title?: string; message?: string } | null;
  message?: { id?: string | number; message?: string } | null;
  data?: { title?: string; message?: string } | null;
  title?: string;
  message_text?: string;
  id?: string | number;
  [k: string]: unknown;
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
      showNotif(title, message);
      return true;
    }
    case "chat_message": {
      const msg = data.notification?.message || data.message?.message || "Nouveau message reçu";
      const nid = data.notification?.id ?? data.message?.id;
      if (wasNotifHandled(nid)) return true;
      markNotifHandled(nid);
      playRingtone(); vibrate("double");
      showNotif("💬 MAWEJA – Message", msg);
      return true;
    }
    default:
      return false;
  }
}
