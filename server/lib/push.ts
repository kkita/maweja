/**
 * Push notifications via Firebase Admin SDK (FCM) — multi-device.
 *
 * Configuration : définir l'une des variables d'environnement :
 *   • FIREBASE_SERVICE_ACCOUNT_JSON  — JSON brut du compte de service
 *   • FIREBASE_SERVICE_ACCOUNT_BASE64 — même JSON encodé en base64
 *   • GOOGLE_APPLICATION_CREDENTIALS — chemin vers le fichier .json
 *
 * Si rien n'est configuré, sendPushToUser() est un no-op silencieux et
 * loggue un avertissement une seule fois.
 *
 * Multi-device : depuis avril 2026, on supporte plusieurs appareils par
 * utilisateur via la table `push_tokens`. L'ancien champ `users.pushToken`
 * reste maintenu pour la rétro-compatibilité (clients/installations qui ne
 * sont pas encore passés à la nouvelle API).
 */
import admin from "firebase-admin";
import { storage } from "../storage";
import { logger } from "./logger";

let initialized = false;
let warned = false;
let app: admin.app.App | null = null;

/**
 * True dès qu'au moins une source de credentials Firebase est configurée
 * (la vérification effective se fait au premier sendPushToUser via tryInit).
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

function tryInit(): admin.app.App | null {
  if (initialized) return app;
  initialized = true;

  let serviceAccount: any = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON); }
    catch (e) { logger.warn?.("[push] FIREBASE_SERVICE_ACCOUNT_JSON invalide", e); }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
      serviceAccount = JSON.parse(decoded);
    } catch (e) { logger.warn?.("[push] FIREBASE_SERVICE_ACCOUNT_BASE64 invalide", e); }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      app = admin.initializeApp();
      logger.info?.("[push] Firebase Admin initialisé via GOOGLE_APPLICATION_CREDENTIALS");
      return app;
    } catch (e) {
      logger.warn?.("[push] init via GOOGLE_APPLICATION_CREDENTIALS échouée", e);
      return null;
    }
  }

  if (!serviceAccount) {
    if (!warned) {
      logger.warn?.("[push] Aucun secret Firebase configuré — push notifications désactivées (en attente de FIREBASE_SERVICE_ACCOUNT_JSON).");
      warned = true;
    }
    return null;
  }

  try {
    app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    logger.info?.(`[push] Firebase Admin initialisé (project=${serviceAccount.project_id})`);
    return app;
  } catch (e) {
    logger.warn?.("[push] init Firebase Admin échouée", e);
    return null;
  }
}

export interface PushPayload {
  title: string;
  body: string;
  /** URL absolue d'une image à afficher dans la notification (Android tray + iOS si NSE installé) */
  imageUrl?: string;
  /**
   * Données additionnelles passées au handler côté app.
   *
   * Champs standardisés (recommandés pour toute notif côté backend) :
   *   - notificationId : id de la ligne notifications
   *   - type           : "info" | "promo" | "order" | "chat" | …
   *   - eventType      : sous-type métier ("order:assigned", "chat:new", …)
   *   - orderId        : id de commande si pertinent
   *   - clickAction    : route cible côté app (deep-link, ex: "/tracking/42")
   */
  data?: Record<string, string>;
}

/**
 * Résultat agrégé d'un envoi multi-device.
 *
 * Reste rétro-compatible avec les anciens consommateurs qui ne lisent que
 * `.status` ("sent" | "skipped" | "failed").
 *   - status = "sent"    → au moins un appareil a reçu la notif
 *   - status = "skipped" → aucun appareil cible (pas de token, pas de Firebase, user introuvable)
 *   - status = "failed"  → tous les envois ont échoué
 */
export type PushResult = {
  status: "sent" | "skipped" | "failed";
  /** Nombre d'appareils ayant reçu la notif. */
  sentCount: number;
  /** Nombre d'envois en erreur (token invalide compris). */
  failedCount: number;
  /** Sous-ensemble de failedCount : tokens désinstallés, désactivés en DB. */
  invalidTokenCount: number;
  /** Raison du skip si status="skipped". */
  skippedReason?: "no-firebase" | "no-user" | "no-token";
  /** Détail par token (utile pour debug / monitoring). */
  results?: Array<{ token: string; status: "sent" | "failed"; reason?: string; messageId?: string }>;
  /** Legacy : id du dernier message FCM envoyé avec succès. */
  messageId?: string;
  /** Legacy : raison du dernier échec (premier code rencontré). */
  reason?: string;
  /** Legacy : true si au moins un token invalide a été nettoyé. */
  cleaned?: boolean;
};

/** Convertit une URL relative (/uploads/…) en URL publique absolue HTTPS */
export function toAbsoluteImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) {
    if (/localhost|127\.0\.0\.1/i.test(url)) return undefined;
    return url;
  }
  const base = (process.env.PUBLIC_BASE_URL || "https://maweja.net").replace(/\/$/, "");
  if (/localhost|127\.0\.0\.1/i.test(base)) return undefined;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function isInvalidTokenError(code: string): boolean {
  return (
    code.includes("registration-token-not-registered") ||
    code.includes("invalid-argument") ||
    code.includes("messaging/invalid-registration-token") ||
    code.includes("invalid-registration-token") ||
    code.includes("not-found") ||
    code.includes("unregistered")
  );
}

/**
 * Récupère tous les tokens cibles d'un utilisateur en fusionnant :
 *   1) la table push_tokens (multi-device, source de vérité)
 *   2) le legacy users.pushToken (si pas déjà présent dans push_tokens)
 *
 * Cette fusion garantit qu'un appareil enregistré sur l'ancienne API
 * continue à recevoir les notifications après la migration.
 */
async function collectTargetTokens(
  userId: number,
): Promise<Array<{ token: string; platform: string; legacy: boolean }>> {
  const tokens: Array<{ token: string; platform: string; legacy: boolean }> = [];
  const seen = new Set<string>();

  let active: Array<{ token: string; platform: string }> = [];
  try {
    active = await storage.getActivePushTokensByUser(userId);
  } catch (e) {
    logger.warn?.(`[push] getActivePushTokensByUser a échoué user=${userId}`, e);
  }
  for (const t of active) {
    if (!t.token || seen.has(t.token)) continue;
    seen.add(t.token);
    tokens.push({ token: t.token, platform: t.platform || "android", legacy: false });
  }

  try {
    const user = await storage.getUser(userId);
    const legacyToken = (user as any)?.pushToken as string | null | undefined;
    const legacyPlatform = (user as any)?.pushPlatform as string | null | undefined;
    if (legacyToken && !seen.has(legacyToken)) {
      seen.add(legacyToken);
      tokens.push({ token: legacyToken, platform: legacyPlatform || "android", legacy: true });
    }
  } catch {
    // ignore
  }

  return tokens;
}

/**
 * Envoie un push à TOUS les appareils actifs d'un utilisateur.
 *
 * Renvoie un PushResult agrégé : sentCount / failedCount / invalidTokenCount.
 * Les anciens appelants qui ne lisent que `result.status` continuent à
 * fonctionner sans modification.
 *
 * Tokens invalides : automatiquement désactivés (push_tokens.isActive=false
 * et users.pushToken nullé pour le legacy).
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<PushResult> {
  const a = tryInit();
  if (!a) {
    return { status: "skipped", sentCount: 0, failedCount: 0, invalidTokenCount: 0, skippedReason: "no-firebase" };
  }

  let user;
  try { user = await storage.getUser(userId); } catch {
    return { status: "skipped", sentCount: 0, failedCount: 0, invalidTokenCount: 0, skippedReason: "no-user" };
  }
  if (!user) {
    return { status: "skipped", sentCount: 0, failedCount: 0, invalidTokenCount: 0, skippedReason: "no-user" };
  }

  const targets = await collectTargetTokens(userId);
  if (targets.length === 0) {
    return { status: "skipped", sentCount: 0, failedCount: 0, invalidTokenCount: 0, skippedReason: "no-token" };
  }

  const absImg = toAbsoluteImageUrl(payload.imageUrl);

  const dataStr: Record<string, string> = Object.fromEntries(
    Object.entries(payload.data || {}).map(([k, v]) => [k, String(v ?? "")]),
  );
  if (absImg) dataStr.imageUrl = absImg;

  const results: NonNullable<PushResult["results"]> = [];
  let sentCount = 0;
  let failedCount = 0;
  let invalidTokenCount = 0;
  let lastMessageId: string | undefined;
  let firstError: string | undefined;

  // ── Coalescing chat : pour les notifs liées à un chat (type=chat ou
  // eventType=chat:*), on regroupe les notifs d'un même expéditeur sous un
  // tag stable `chat-<senderId>` (= collapse_key Android + tag webpush + tag
  // iOS thread). La nouvelle notif remplace l'ancienne au lieu d'empiler.
  const isChat =
    String(dataStr.type || "").toLowerCase() === "chat" ||
    String(dataStr.eventType || "").toLowerCase().startsWith("chat:");
  const chatTag =
    isChat && dataStr.senderId
      ? `chat-${dataStr.senderId}`
      : undefined;
  // Tag final pour grouper côté plateformes :
  //   • chat → tag stable par conversation (1 notif max par expéditeur)
  //   • autre → notificationId (legacy : 1 tag = 1 notif unique)
  const groupTag = chatTag || dataStr.notificationId || undefined;

  await Promise.all(targets.map(async (t) => {
    try {
      const messageId = await a.messaging().send({
        token: t.token,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(absImg ? { imageUrl: absImg } : {}),
        },
        data: dataStr,
        android: {
          priority: "high",
          // collapseKey : si plusieurs notifs arrivent avec la même clé alors
          // que le device est offline, FCM n'en livre qu'UNE seule à la
          // reconnexion. Limite l'empilement pour les conversations chat.
          ...(chatTag ? { collapseKey: chatTag } : {}),
          notification: {
            // ⚠️ DOIT correspondre au channel créé côté mobile
            // (cf. client/src/lib/pushNotifs.ts → ensureAndroidChannel).
            // Sinon Android utilise le canal "Misc" silencieux.
            channelId: "maweja_default",
            sound: "default",
            priority: "high",
            visibility: "public",
            defaultSound: true,
            defaultVibrateTimings: true,
            // tag Android : 2 notifs avec le même tag (et package) → la
            // nouvelle remplace l'ancienne. Indispensable pour ne pas
            // empiler N notifs d'une même conversation.
            ...(chatTag ? { tag: chatTag } : {}),
            ...(absImg ? { imageUrl: absImg } : {}),
          },
        },
        apns: {
          headers: {
            "apns-priority": "10",
            "apns-push-type": "alert",
            // collapse-id : iOS regroupe/écrase les notifs d'un même chat
            ...(chatTag ? { "apns-collapse-id": chatTag } : {}),
          },
          payload: {
            aps: {
              alert: { title: payload.title, body: payload.body },
              sound: "default",
              badge: 1,
              "mutable-content": 1 as any,
              // thread-id : groupe iOS (Notification Center les empile sous un même fil)
              ...(chatTag ? { "thread-id": chatTag } : {}),
            },
          },
          ...(absImg ? { fcmOptions: { imageUrl: absImg } as any } : {}),
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            ...(absImg ? { image: absImg } : {}),
            // tag stable → la nouvelle notif remplace l'ancienne dans le
            // tray du navigateur (renotify=true pour réveiller l'utilisateur).
            ...(groupTag ? { tag: groupTag, renotify: !!chatTag } : {}),
          },
          fcmOptions: dataStr.clickAction
            ? { link: dataStr.clickAction }
            : dataStr.orderId
              ? { link: `/tracking/${dataStr.orderId}` }
              : { link: "/notifications" },
        },
      });
      sentCount++;
      lastMessageId = messageId;
      results.push({ token: t.token, status: "sent", messageId });
    } catch (e: any) {
      const code: string = e?.errorInfo?.code || e?.code || "";
      const msg: string = e?.errorInfo?.message || e?.message || String(e);
      failedCount++;
      if (!firstError) firstError = code || msg || "unknown";
      if (isInvalidTokenError(code)) {
        invalidTokenCount++;
        try {
          await storage.deactivatePushToken(t.token);
        } catch {}
        if (t.legacy) {
          try { await storage.updateUser(userId, { pushToken: null, pushPlatform: null } as any); } catch {}
        }
        logger.warn?.(`[push] token invalide désactivé user=${userId} legacy=${t.legacy} code=${code}`);
      } else {
        logger.warn?.(`[push] envoi échoué user=${userId} code=${code} msg=${msg}`);
      }
      results.push({ token: t.token, status: "failed", reason: code || msg || "unknown" });
    }
  }));

  let status: "sent" | "skipped" | "failed";
  if (sentCount > 0) status = "sent";
  else if (failedCount > 0) status = "failed";
  else status = "skipped";

  return {
    status,
    sentCount,
    failedCount,
    invalidTokenCount,
    results,
    ...(lastMessageId ? { messageId: lastMessageId } : {}),
    ...(firstError ? { reason: firstError } : {}),
    ...(invalidTokenCount > 0 ? { cleaned: true } : {}),
  };
}

export async function sendPushToUsers(userIds: number[], payload: PushPayload): Promise<PushResult[]> {
  return Promise.all(
    userIds.map((id) =>
      sendPushToUser(id, payload).catch(
        (e): PushResult => ({
          status: "failed",
          sentCount: 0,
          failedCount: 1,
          invalidTokenCount: 0,
          reason: String(e?.message || e),
        }),
      ),
    ),
  );
}
