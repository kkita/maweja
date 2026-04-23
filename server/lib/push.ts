/**
 * Push notifications via Firebase Admin SDK (FCM).
 *
 * Configuration : définir l'une des variables d'environnement :
 *   • FIREBASE_SERVICE_ACCOUNT_JSON  — JSON brut du compte de service
 *   • FIREBASE_SERVICE_ACCOUNT_BASE64 — même JSON encodé en base64
 *   • GOOGLE_APPLICATION_CREDENTIALS — chemin vers le fichier .json
 *
 * Si rien n'est configuré, sendPushToUser() est un no-op silencieux et
 * loggue un avertissement une seule fois.
 */
import admin from "firebase-admin";
import { storage } from "../storage";
import { logger } from "./logger";

let initialized = false;
let warned = false;
let app: admin.app.App | null = null;

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
    // Le SDK lit automatiquement la variable
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
  /** Données additionnelles passées au handler côté app (orderId, type, etc.) */
  data?: Record<string, string>;
}

/**
 * Envoie un push à un utilisateur (silencieux s'il n'a pas de token ou si
 * Firebase n'est pas configuré).
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  const a = tryInit();
  if (!a) return;
  let user;
  try { user = await storage.getUser(userId); } catch { return; }
  if (!user || !(user as any).pushToken) return;
  const token: string = (user as any).pushToken;

  try {
    await a.messaging().send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data || {},
      android: {
        priority: "high",
        notification: {
          channelId: "maweja_orders",
          sound: "default",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: { sound: "default", badge: 1, contentAvailable: true },
        },
      },
    });
  } catch (e: any) {
    const code = e?.errorInfo?.code || e?.code || "";
    // Token invalide / désinstallé — on nettoie côté DB
    if (code.includes("registration-token-not-registered") || code.includes("invalid-argument")) {
      try { await storage.updateUser(userId, { pushToken: null, pushPlatform: null } as any); } catch {}
    } else {
      logger.warn?.(`[push] envoi échoué user=${userId}: ${code || e?.message}`);
    }
  }
}

export async function sendPushToUsers(userIds: number[], payload: PushPayload): Promise<void> {
  await Promise.all(userIds.map(id => sendPushToUser(id, payload).catch(() => {})));
}
