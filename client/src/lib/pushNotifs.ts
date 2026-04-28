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

let initialized = false;

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
    if (!token) return;

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
    return;
  }

  // Envoi du token au backend
  try {
    await apiRequest("/api/push/register-token", {
      method: "POST",
      body: JSON.stringify({ token, platform: "web" }),
    });
  } catch (e) {
    console.warn("[push-web] register-token failed", e);
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

export async function initPushNotifications(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Navigateur web (dashboard admin) : FCM Web via Firebase JS SDK
  if (!isCapacitor()) {
    await initWebPush();
    return;
  }

  try {
    const mod = await importPlugin("@capacitor/push-notifications");
    if (!mod?.PushNotifications) return;
    const { PushNotifications } = mod;

    // 1. Canal Android (idempotent — à faire avant register)
    await ensureAndroidChannel(PushNotifications);

    // 2. Permission
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive !== "granted") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return;

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
      try {
        await apiRequest("/api/push/register-token", {
          method: "POST",
          body: JSON.stringify({ token: t.value, platform: detectPlatform() }),
        });
      } catch (e) {
        console.warn("[push] register-token failed", e);
      }
    });

    PushNotifications.addListener("registrationError", (err: any) => {
      console.warn("[push] registrationError", err);
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
    //   • orderId → /tracking/:id (priorité)
    //   • sinon notificationId → /notifications (page liste)
    //   • sinon ouvrir / (home)
    PushNotifications.addListener("pushNotificationActionPerformed", (action: any) => {
      const data = action?.notification?.data || {};
      const target = data?.orderId
        ? `/tracking/${data.orderId}`
        : data?.notificationId
        ? "/notifications"
        : "/";
      try { (window as any).location.assign(target); } catch {}
    });

    // Tap sur une LocalNotification (relais foreground) — même logique
    try {
      const ln = await importPlugin("@capacitor/local-notifications");
      if (ln?.LocalNotifications?.addListener) {
        ln.LocalNotifications.addListener("localNotificationActionPerformed", (action: any) => {
          const extra = action?.notification?.extra || {};
          const target = extra?.orderId
            ? `/tracking/${extra.orderId}`
            : extra?.notificationId
            ? "/notifications"
            : "/";
          try { (window as any).location.assign(target); } catch {}
        });
      }
    } catch {}

    await PushNotifications.register();
  } catch (e) {
    console.warn("[push] init failed", e);
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  if (!isCapacitor()) return;
  try {
    await apiRequest("/api/push/unregister-token", { method: "POST" });
  } catch {}
}
