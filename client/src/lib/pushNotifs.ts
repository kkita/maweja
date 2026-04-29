/**
 * Push Notifications natives (Capacitor + FCM/APNs).
 *
 * Sur web : no-op silencieux.
 * Sur mobile (Android/iOS) :
 *   – demande la permission
 *   – crée le canal Android "maweja_orders" (importance HIGH, son, vibration, badge)
 *   – enregistre le device auprès de FCM/APNs
 *   – envoie le token au serveur (/api/push/register-token)
 *   – écoute les notifications reçues
 *      ▸ App en arrière-plan/fermée : OS/FCM affiche déjà la notif (via le champ
 *        top-level `notification` du payload FCM)
 *      ▸ App au PREMIER PLAN : par défaut le plugin n'affiche RIEN dans la barre
 *        système — on relaie donc nous-mêmes via @capacitor/local-notifications
 *        pour reproduire le comportement WhatsApp.
 *   – tap sur la notif → deep-link /tracking/:orderId si data.orderId présent
 */
import { apiRequest } from "./queryClient";
import { markNotifHandled, wasNotifHandled } from "./notify/notifyAudio";
import { getMessagingIfSupported, isFirebaseWebConfigured, getVapidKey } from "./firebaseWeb";

/**
 * État interne — granulaire pour permettre une ré-initialisation propre :
 *   - quand l'utilisateur change (login d'un autre compte sur le même device)
 *   - quand son rôle change (passage client → driver)
 *   - quand le token FCM tourne (rafraîchissement périodique)
 *   - quand l'enregistrement backend a échoué (réseau, 500, etc.)
 *
 * On NE bloque JAMAIS définitivement initPushNotifications via un simple booléen.
 */
type RegisterStatus =
  | null
  | "pending"        // init en cours
  | "ok"             // token enregistré côté backend
  | "failed"         // échec enregistrement backend (réessayable)
  | "no-firebase"    // Firebase Web non configuré
  | "no-permission"  // permission notif refusée
  | "no-token"       // FCM n'a pas retourné de token
  | "no-platform";   // ni Capacitor ni navigateur compatible

let initializedForUserId: number | null = null;
let initializedForRole: string | null = null;
let initializedForToken: string | null = null;
let currentToken: string | null = null;
let lastRegisterStatus: RegisterStatus = null;

/** Diagnostic state (utile pour les logs / debug admin). */
export function getPushInitState() {
  return {
    initializedForUserId,
    initializedForRole,
    initializedForToken,
    currentToken,
    lastRegisterStatus,
  };
}

/**
 * Calcule la route à ouvrir au tap sur une notification push/local.
 *
 * Priorités :
 *   1) data.deepLink fourni par le serveur (forme : "/...") → utilisée telle
 *      quelle. C'est la source de vérité pour les notifs chat (le serveur
 *      choisit /chat/order/:id pour un client et /driver/chat/order/:id pour
 *      un livreur).
 *   2) Sinon, si on a un orderId ET que la notif n'est PAS de type "chat" :
 *      fallback legacy /tracking/:id (statuts de commande, livreur en route).
 *      ⚠️ Pour type="chat", on N'UTILISE JAMAIS /tracking/:id : on retombe
 *      sur la liste des notifs.
 *   3) Sinon, si on a un notificationId : page liste des notifs (préfixée
 *      /driver pour un livreur si window.__MAWEJA_USER_ROLE__ vaut "driver").
 *   4) Défaut : "/".
 */
function resolveDeepLinkTarget(data: any): string {
  if (!data || typeof data !== "object") return "/";

  const dl = typeof data.deepLink === "string" ? data.deepLink.trim() : "";
  if (dl.startsWith("/")) return dl;

  const type = typeof data.type === "string" ? data.type : "";
  const isChat = type === "chat" || data.eventType === "chat:new_message";

  if (data.orderId && !isChat) {
    return `/tracking/${data.orderId}`;
  }

  if (data.notificationId) {
    const role =
      typeof window !== "undefined" ? (window as any).__MAWEJA_USER_ROLE__ : null;
    const prefix = role === "driver" ? "/driver" : "";
    return `${prefix}/notifications?n=${data.notificationId}`;
  }

  return "/";
}

function isCapacitor(): boolean {
  return typeof (window as any)?.Capacitor !== "undefined" && (window as any).Capacitor?.isNativePlatform?.();
}

function detectPlatform(): "ios" | "android" | "web" {
  const cap = (window as any)?.Capacitor;
  const p = cap?.getPlatform?.() || "web";
  return p === "ios" ? "ios" : p === "android" ? "android" : "web";
}

/**
 * Initialise FCM Web pour le dashboard admin (navigateur classique).
 * Demande la permission, enregistre le service worker, récupère un token FCM
 * et l'envoie au backend via /api/push/register-token.
 */
async function initWebPush(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (!isFirebaseWebConfigured()) {
    console.info("[push-web] Firebase Web non configuré (VITE_FIREBASE_* manquants) — push navigateur désactivé");
    return;
  }
  const vapidKey = getVapidKey();
  if (!vapidKey) {
    console.info("[push-web] VITE_FIREBASE_VAPID_KEY manquant — push navigateur désactivé");
    return;
  }

  // Permission navigateur
  let perm = Notification.permission;
  if (perm === "default") {
    try { perm = await Notification.requestPermission(); } catch { return; }
  }
  if (perm !== "granted") return;

  // Enregistrement du service worker FCM (config passée en query string car le SW
  // n'a pas accès aux env vars Vite).
  const env = import.meta.env;
  const swParams = new URLSearchParams({
    apiKey: String(env.VITE_FIREBASE_API_KEY || ""),
    authDomain: String(env.VITE_FIREBASE_AUTH_DOMAIN || ""),
    projectId: String(env.VITE_FIREBASE_PROJECT_ID || ""),
    storageBucket: String(env.VITE_FIREBASE_STORAGE_BUCKET || ""),
    messagingSenderId: String(env.VITE_FIREBASE_MESSAGING_SENDER_ID || ""),
    appId: String(env.VITE_FIREBASE_APP_ID || ""),
  });
  let registration: ServiceWorkerRegistration;
  try {
    registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${swParams.toString()}`,
      { scope: "/" },
    );
  } catch (e) {
    console.warn("[push-web] enregistrement du service worker échoué", e);
    return;
  }

  const messaging = await getMessagingIfSupported();
  if (!messaging) return;

  let token: string;
  try {
    const { getToken, onMessage } = await import("firebase/messaging");
    token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) {
      lastRegisterStatus = "no-token";
      return;
    }
    currentToken = token;

    // App au premier plan : afficher la notif via Notification API
    onMessage(messaging, (payload) => {
      const n = payload.notification || {};
      const data = (payload.data || {}) as Record<string, string>;
      const nid = data.notificationId;
      if (nid && wasNotifHandled(nid)) {
        try { (window as any).__MAWEJA_QC__?.invalidateQueries?.(); } catch {}
        return;
      }
      if (nid) markNotifHandled(nid);
      const title = n.title || "MAWEJA";
      try {
        registration.showNotification(title, {
          body: n.body || "",
          icon: n.icon || "/icon-192.png",
          badge: "/icon-192.png",
          ...(n.image ? { image: n.image } : {}),
          data,
          tag: nid || undefined,
        });
      } catch {}
      try { (window as any).__MAWEJA_QC__?.invalidateQueries?.(); } catch {}
    });
  } catch (e) {
    console.warn("[push-web] getToken échoué", e);
    lastRegisterStatus = "no-token";
    return;
  }

  // Envoi du token au backend — on track le succès pour permettre un retry au prochain init
  try {
    await apiRequest("/api/push/register-token", {
      method: "POST",
      body: JSON.stringify({ token, platform: "web" }),
    });
    initializedForToken = token;
    lastRegisterStatus = "ok";
  } catch (e) {
    console.warn("[push-web] register-token failed", e);
    lastRegisterStatus = "failed";
  }
}

/** Import dynamique caché de Vite — les plugins ne sont livrés que dans mobile/. */
async function importPlugin(name: string): Promise<any | null> {
  const importer = new Function("p", "return import(p)") as (p: string) => Promise<any>;
  return importer(name).catch(() => null);
}

/**
 * Affiche une notification dans la barre système quand l'app est au premier plan.
 * Reproduit le comportement WhatsApp/Telegram.
 */
async function showForegroundTrayNotif(notif: any): Promise<void> {
  try {
    const mod = await importPlugin("@capacitor/local-notifications");
    const LN = mod?.LocalNotifications;
    if (!LN) return;

    const title = notif?.title || "MAWEJA";
    const body = notif?.body || "";
    // L'image envoyée par FCM (notification.image / fcm_options.image) est
    // exposée par Capacitor sous notif.image (Android) ou notif.attachments (iOS).
    const imageUrl: string | undefined =
      notif?.image ||
      notif?.data?.image ||
      notif?.data?.imageUrl ||
      undefined;

    const data = notif?.data || {};
    const id = Math.floor(Date.now() % 2147483647);

    await LN.schedule({
      notifications: [
        {
          id,
          title,
          body,
          channelId: "maweja_orders",
          smallIcon: "ic_stat_notify",
          largeIcon: "ic_notif_large",
          iconColor: "#EC0000",
          sound: "default",
          ...(imageUrl
            ? {
                attachments: [{ id: "img", url: imageUrl, options: { typeHint: "image/jpeg" } }],
                largeBody: body,
              }
            : {}),
          extra: data,
          schedule: { at: new Date(Date.now() + 100) },
        },
      ],
    });
  } catch {
    /* silencieux */
  }
}

/** Crée le canal Android "maweja_orders" si pas déjà fait (importance HIGH, son, vibration). */
async function ensureAndroidChannel(PushNotifications: any): Promise<void> {
  if (detectPlatform() !== "android") return;
  try {
    if (typeof PushNotifications.createChannel !== "function") return;
    await PushNotifications.createChannel({
      id: "maweja_orders",
      name: "MAWEJA — Commandes & Messages",
      description: "Nouvelles commandes, messages chat et alertes importantes",
      importance: 5, // HIGH (= heads-up notification)
      visibility: 1, // PUBLIC
      sound: "default",
      vibration: true,
      lights: true,
      lightColor: "#EC0000",
    });
  } catch {
    /* canal déjà créé */
  }
}

/**
 * Initialise (ou ré-initialise) les push notifications pour un utilisateur donné.
 *
 * Idempotent ET re-déclenchable :
 *   • si rappelée pour le MÊME userId+role et que le dernier register a réussi
 *     → no-op (évite double-init dans React StrictMode / re-renders).
 *   • si l'utilisateur change, le rôle change, ou le dernier register a échoué
 *     → on relance toute la chaîne d'enregistrement.
 */
export async function initPushNotifications(
  userId?: number,
  role?: string,
): Promise<void> {
  const uid = typeof userId === "number" ? userId : null;
  const r = typeof role === "string" ? role : null;
  const platform = detectPlatform();

  console.info(`[push] init userId=${uid ?? "?"} role=${r ?? "?"} platform=${platform}`);

  // Skip uniquement si tout est aligné ET le dernier register a réussi
  if (
    initializedForUserId === uid &&
    initializedForRole === r &&
    lastRegisterStatus === "ok"
  ) {
    console.info(`[push] init skipped (already registered for user=${uid} role=${r})`);
    return;
  }

  initializedForUserId = uid;
  initializedForRole = r;
  lastRegisterStatus = "pending";

  // Navigateur web (dashboard admin) : FCM Web via Firebase JS SDK
  if (!isCapacitor()) {
    console.info("[push] platform=web → initWebPush");
    await initWebPush();
    return;
  }

  try {
    const mod = await importPlugin("@capacitor/push-notifications");
    if (!mod?.PushNotifications) {
      console.warn("[push] @capacitor/push-notifications introuvable (build mobile non lancé ?)");
      lastRegisterStatus = "no-platform";
      return;
    }
    const { PushNotifications } = mod;

    // 1. Canal Android (idempotent — à faire avant register)
    await ensureAndroidChannel(PushNotifications);
    if (platform === "android") console.info("[push] Android channel 'maweja_orders' ready");

    // 2. Permission
    let perm = await PushNotifications.checkPermissions();
    console.info(`[push] permission status (initial)=${perm?.receive}`);
    if (perm.receive !== "granted") {
      perm = await PushNotifications.requestPermissions();
      console.info(`[push] permission status (after request)=${perm?.receive}`);
    }
    if (perm.receive !== "granted") {
      console.warn(`[push] permission refusée → status=${perm.receive}`);
      lastRegisterStatus = "no-permission";
      return;
    }

    // 3. Permission LocalNotifications (pour relais foreground)
    try {
      const ln = await importPlugin("@capacitor/local-notifications");
      if (ln?.LocalNotifications?.requestPermissions) {
        await ln.LocalNotifications.requestPermissions();
        // Crée aussi le canal côté LocalNotifications (Android)
        if (detectPlatform() === "android" && ln.LocalNotifications.createChannel) {
          await ln.LocalNotifications.createChannel({
            id: "maweja_orders",
            name: "MAWEJA — Commandes & Messages",
            description: "Nouvelles commandes, messages chat et alertes importantes",
            importance: 5,
            visibility: 1,
            sound: "default",
            vibration: true,
            lights: true,
            lightColor: "#EC0000",
          }).catch(() => {});
        }
      }
    } catch {}

    // 4. Listeners — AVANT register()
    PushNotifications.addListener("registration", async (t: any) => {
      const tok = t?.value;
      if (!tok) {
        console.warn("[push] FCM registration → token vide");
        lastRegisterStatus = "no-token";
        return;
      }
      currentToken = tok;
      const preview = `${tok.substring(0, 12)}…${tok.substring(tok.length - 6)}`;
      console.info(`[push] FCM token received platform=${platform} token=${preview}`);
      try {
        await apiRequest("/api/push/register-token", {
          method: "POST",
          body: JSON.stringify({ token: tok, platform: detectPlatform() }),
        });
        initializedForToken = tok;
        lastRegisterStatus = "ok";
        console.info(`[push] register-token success userId=${initializedForUserId} role=${initializedForRole} platform=${platform}`);
      } catch (e) {
        console.warn(`[push] register-token failure userId=${initializedForUserId} platform=${platform}`, e);
        // Échec marqué → le prochain init() relancera l'enregistrement
        lastRegisterStatus = "failed";
      }
    });

    PushNotifications.addListener("registrationError", (err: any) => {
      console.warn(`[push] FCM registrationError platform=${platform} —`, err);
      console.warn("[push] cause possible : google-services.json absent dans android/app/, package_name discordant, ou Firebase project mal configuré");
      lastRegisterStatus = "no-token";
    });

    // App au premier plan : afficher dans la barre système (style WhatsApp)
    PushNotifications.addListener("pushNotificationReceived", async (notif: any) => {
      const nid = notif?.data?.notificationId;
      // Si le WS a déjà géré cette notif (sonnerie + local-notif), on skip
      if (wasNotifHandled(nid)) {
        try {
          const qc = (window as any).__MAWEJA_QC__;
          qc?.invalidateQueries?.();
        } catch {}
        return;
      }
      // Sinon on marque + on relaie en barre système
      markNotifHandled(nid);
      await showForegroundTrayNotif(notif);
      try {
        const qc = (window as any).__MAWEJA_QC__;
        qc?.invalidateQueries?.();
      } catch {}
    });

    // Tap sur la notif (système ou local) — deep-link intelligent :
    //   • data.deepLink (string commençant par '/') → priorité absolue
    //     → /chat/order/:id (client) ou /driver/chat/order/:id (driver) pour
    //       les notifs chat (le serveur calcule cela en fonction du rôle du
    //       receiver dans server/routes/chat.routes.ts).
    //     → /tracking/:id pour les notifs commande (status, livreur en route)
    //   • data.orderId sans deepLink → /tracking/:id (legacy : commandes)
    //   • data.notificationId → /notifications?n=… (avec préfixe driver si
    //     le rôle local est driver)
    //   • sinon → / (home)
    //
    // ⚠️ On NE construit PAS /tracking/:orderId pour un message de chat :
    //    pour un chat, le serveur fournit toujours data.deepLink correct
    //    (vérifié par tests Vitest section 8).
    PushNotifications.addListener("pushNotificationActionPerformed", (action: any) => {
      const data = action?.notification?.data || {};
      const target = resolveDeepLinkTarget(data);
      try { (window as any).location.assign(target); } catch {}
    });

    // Tap sur une LocalNotification (relais foreground) — même logique
    try {
      const ln = await importPlugin("@capacitor/local-notifications");
      if (ln?.LocalNotifications?.addListener) {
        ln.LocalNotifications.addListener("localNotificationActionPerformed", (action: any) => {
          const extra = action?.notification?.extra || {};
          const target = resolveDeepLinkTarget(extra);
          try { (window as any).location.assign(target); } catch {}
        });
      }
    } catch {}

    await PushNotifications.register();
  } catch (e) {
    console.warn("[push] init failed", e);
  }
}

/**
 * Désenregistre UNIQUEMENT le token push de cet appareil (logout local).
 *
 * IMPORTANT — multi-device :
 *   • si on a un token courant → on l'envoie au backend qui ne désactive QUE ce token.
 *   • si on n'a PAS de token (jamais enregistré) → no-op : on ne touche pas
 *     aux autres appareils du compte.
 *
 * Pour un logout global (désactiver tous les devices), passer `{ allDevices: true }`.
 */
export async function unregisterPushNotifications(
  opts?: { allDevices?: boolean },
): Promise<void> {
  const tok = currentToken;
  const allDevices = !!opts?.allDevices;

  // Sans token et sans demande explicite "tous les devices" → on ne fait rien
  if (!tok && !allDevices) {
    return;
  }

  try {
    await apiRequest("/api/push/unregister-token", {
      method: "POST",
      // body vide → backend désactive tous les tokens de l'utilisateur (logout global)
      body: JSON.stringify(allDevices ? {} : { token: tok }),
    });
  } catch {}

  // Reset état local pour permettre un re-init propre au prochain login
  if (allDevices) {
    currentToken = null;
  } else if (tok && currentToken === tok) {
    currentToken = null;
  }
  initializedForUserId = null;
  initializedForRole = null;
  initializedForToken = null;
  lastRegisterStatus = null;
}
