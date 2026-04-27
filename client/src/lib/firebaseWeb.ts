/**
 * Firebase Web SDK — initialisation paresseuse pour le dashboard admin
 * (et tout autre usage navigateur).
 *
 * Sert uniquement à FCM Web (push notifications dans le navigateur).
 * Renvoie `null` silencieusement si :
 *   – on est sur Capacitor (le natif gère déjà FCM via Capacitor PushNotifications)
 *   – les variables VITE_FIREBASE_* ne sont pas configurées
 *   – le navigateur ne supporte pas Service Worker / Push API (ex. Safari < 16.4)
 */
import type { FirebaseApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";

let appCache: FirebaseApp | null = null;
let messagingCache: Messaging | null = null;
let initTried = false;

function isCapacitor(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap !== "undefined" && !!cap?.isNativePlatform?.();
}

function readConfig() {
  const env = import.meta.env;
  const cfg = {
    apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
    projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
    appId: env.VITE_FIREBASE_APP_ID as string | undefined,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
  };
  if (!cfg.apiKey || !cfg.projectId || !cfg.appId || !cfg.messagingSenderId) return null;
  return cfg as Required<Pick<typeof cfg, "apiKey" | "projectId" | "appId" | "messagingSenderId">> & typeof cfg;
}

export function isFirebaseWebConfigured(): boolean {
  return readConfig() !== null;
}

export function getVapidKey(): string | undefined {
  const k = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
  return k && k.length > 10 ? k : undefined;
}

/** Initialise (une seule fois) le SDK Firebase Web. Renvoie `null` si pas dispo. */
export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (appCache) return appCache;
  if (initTried) return appCache;
  initTried = true;

  if (typeof window === "undefined") return null;
  if (isCapacitor()) return null;
  const cfg = readConfig();
  if (!cfg) return null;

  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    appCache = getApps().length ? getApp() : initializeApp(cfg);
    return appCache;
  } catch (e) {
    console.warn("[firebaseWeb] init échouée", e);
    return null;
  }
}

/** Renvoie l'instance Messaging si le navigateur supporte FCM Web, sinon `null`. */
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (messagingCache) return messagingCache;
  const app = await getFirebaseApp();
  if (!app) return null;
  try {
    const { isSupported, getMessaging } = await import("firebase/messaging");
    if (!(await isSupported())) return null;
    messagingCache = getMessaging(app);
    return messagingCache;
  } catch (e) {
    console.warn("[firebaseWeb] messaging non disponible", e);
    return null;
  }
}
