/* eslint-disable no-undef */
/**
 * Service worker FCM pour le dashboard admin (FCM Web).
 * Affiche les notifications quand l'onglet est en arrière-plan ou fermé.
 *
 * La config Firebase est passée en query string par firebaseWeb.ts au moment
 * de l'enregistrement du service worker — c'est nécessaire car un service
 * worker n'a pas accès aux variables Vite.
 */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

const params = new URL(location).searchParams;
const cfg = {
  apiKey: params.get("apiKey") || "",
  authDomain: params.get("authDomain") || "",
  projectId: params.get("projectId") || "",
  storageBucket: params.get("storageBucket") || "",
  messagingSenderId: params.get("messagingSenderId") || "",
  appId: params.get("appId") || "",
};

if (cfg.apiKey && cfg.projectId && cfg.appId) {
  try {
    firebase.initializeApp(cfg);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const n = payload.notification || {};
      const data = payload.data || {};
      const title = n.title || "MAWEJA";
      const body = n.body || "";
      const icon = n.icon || "/icon-192.png";
      const image = n.image || data.image || data.imageUrl;
      self.registration.showNotification(title, {
        body,
        icon,
        badge: "/icon-192.png",
        ...(image ? { image } : {}),
        data,
        tag: data.notificationId || undefined,
        renotify: !!data.notificationId,
      });
    });
  } catch (e) {
    console.warn("[fcm-sw] init failed", e);
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.orderId ? `/tracking/${data.orderId}` : (data.url || "/");
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && "focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
