/* ─────────────────────────────────────────────────────────────
   MAWEJA — Notify : événements chat & notifications génériques
   ───────────────────────────────────────────────────────────── */
import { playRingtone, vibrate, showNotif, markNotifHandled, wasNotifHandled, chatNotifTag } from "./notifyAudio";

export interface ChatEventData {
  type: string;
  notification?: {
    id?: string | number;
    title?: string;
    message?: string;
    imageUrl?: string | null;
    data?: { senderId?: string | number; receiverId?: string | number; orderId?: string | number; [k: string]: unknown } | null;
  } | null;
  message?: {
    id?: string | number;
    message?: string;
    imageUrl?: string | null;
    senderId?: string | number;
    receiverId?: string | number;
  } | null;
  data?: {
    title?: string;
    message?: string;
    imageUrl?: string | null;
    senderId?: string | number;
    receiverId?: string | number;
    orderId?: string | number;
    [k: string]: unknown;
  } | null;
  title?: string;
  message_text?: string;
  imageUrl?: string | null;
  id?: string | number;
  [k: string]: unknown;
}

/** Récupère l'id de l'utilisateur courant (exposé par App.tsx via window). */
function currentUserId(): number | null {
  const v = (typeof window !== "undefined" ? (window as any).__MAWEJA_USER_ID__ : null);
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Invalide les caches chat/notifications après réception d'un event chat. */
function invalidateChatCaches(): void {
  try {
    const qc = (window as any).__MAWEJA_QC__;
    if (!qc?.invalidateQueries) return;
    qc.invalidateQueries({ queryKey: ["/api/chat"] });
    qc.invalidateQueries({ queryKey: ["/api/chat/unread"] });
    qc.invalidateQueries({ queryKey: ["/api/notifications"] });
  } catch { /* ignore */ }
}

/**
 * Extrait sender/receiver depuis le payload (variantes selon `type`).
 * Le serveur envoie :
 *   - chat_message  → { message: {senderId, receiverId, ...}, data: {senderId, ...} }
 *   - notification  → { notification: { data: {senderId, receiverId, ...} } }
 */
function extractParties(data: ChatEventData): { senderId: number | null; receiverId: number | null } {
  const num = (v: unknown): number | null => {
    const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
    return Number.isFinite(n) ? n : null;
  };
  const senderId =
    num((data.message as any)?.senderId) ??
    num((data.data as any)?.senderId) ??
    num((data.notification as any)?.data?.senderId);
  const receiverId =
    num((data.message as any)?.receiverId) ??
    num((data.data as any)?.receiverId) ??
    num((data.notification as any)?.data?.receiverId);
  return { senderId, receiverId };
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
 *
 * Règles anti-bruit :
 *   • Si on connaît un senderId/receiverId et que senderId === currentUserId,
 *     on N'AJOUTE NI son NI notif système (c'est l'écho de notre propre envoi).
 *   • Pour les events "chat_message", la sonnerie est conditionnée à
 *     receiverId === currentUserId (quand l'info est présente). Si absente,
 *     on retombe sur le comportement legacy (sonner — le serveur n'envoie
 *     déjà ce message qu'au receiver, donc en pratique c'est correct).
 *   • Dans tous les cas chat (sonné ou non), on invalide les caches
 *     /api/chat, /api/chat/unread, /api/notifications.
 */
export function handleChatEvent(data: ChatEventData): boolean {
  switch (data.type) {
    case "notification": {
      const n = data.notification || data.data || {};
      const title = n.title || data.title || "MAWEJA";
      const message = (n as { message?: string }).message || (data as { message?: string }).message || "";
      if (!message) return true;

      // ── Toujours rafraîchir les listes (badge, page notifications), MÊME
      // si l'event est dédupliqué ailleurs (push FCM en parallèle) — sinon
      // le badge cloche peut rater une mise à jour.
      invalidateChatCaches();

      const nid = (n as { id?: string | number }).id ?? data.id;
      if (wasNotifHandled(nid)) return true;
      markNotifHandled(nid);

      // Filtre "écho de soi-même" : si la notif référence un sender qui est nous
      const me = currentUserId();
      const { senderId, receiverId } = extractParties(data);
      if (me !== null && senderId === me) return true;
      // Si on a un receiverId explicite et qu'il n'est pas nous, on ignore le son
      if (me !== null && receiverId !== null && receiverId !== me) return true;

      playRingtone(); vibrate("light");
      const img = extractImageUrl(data);
      // Coalescing : tag stable par "expéditeur" si on connaît le sender
      const tag = senderId !== null ? chatNotifTag(senderId) : undefined;
      showNotif(title, message, undefined, img, tag ? { tag } : undefined);
      return true;
    }
    case "chat_message": {
      const msg = data.notification?.message || data.message?.message || "Nouveau message reçu";

      // ── Invalidation systématique (badge unread, liste chats, notifs)
      invalidateChatCaches();

      const nid = data.notification?.id ?? data.message?.id;
      if (wasNotifHandled(nid)) return true;
      markNotifHandled(nid);

      // Filtre "écho de soi-même" : si on est le sender, c'est notre propre msg
      const me = currentUserId();
      const { senderId, receiverId } = extractParties(data);
      if (me !== null && senderId !== null && senderId === me) return true;
      // Si receiverId est explicite ET différent de nous → ignorer
      // (on a relâché vs avant : si receiverId est NULL, on sonne quand même
      //  car le serveur n'envoie déjà ce payload qu'au receiver direct.)
      if (me !== null && receiverId !== null && receiverId !== me) return true;

      playRingtone(); vibrate("double");
      const img = extractImageUrl(data);
      // Coalescing : 1 notif système max par conversation (même expéditeur)
      // → la nouvelle remplace l'ancienne au lieu d'empiler N notifs.
      const tag = senderId !== null ? chatNotifTag(senderId) : undefined;
      showNotif("💬 MAWEJA – Message", msg, undefined, img, tag ? { tag } : undefined);
      return true;
    }
    default:
      return false;
  }
}
