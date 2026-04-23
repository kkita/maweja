/**
 * Initialisation des Push Notifications natives (Capacitor + FCM/APNs).
 *
 * • Sur le web : no-op silencieux.
 * • Sur mobile (Android/iOS) :
 *     – demande la permission
 *     – enregistre le device auprès de FCM/APNs
 *     – envoie le token au serveur (/api/push/register-token)
 *     – écoute les notifications reçues (le système OS affiche déjà la notif
 *       quand l'app est en arrière-plan ; on rafraîchit juste les requêtes
 *       quand l'utilisateur revient au premier plan).
 *
 * Appelé une seule fois après login dans App.tsx.
 */
import { apiRequest } from "./queryClient";

let initialized = false;

function isCapacitor(): boolean {
  return typeof (window as any)?.Capacitor !== "undefined" && (window as any).Capacitor?.isNativePlatform?.();
}

function detectPlatform(): "ios" | "android" | "web" {
  const cap = (window as any)?.Capacitor;
  const p = cap?.getPlatform?.() || "web";
  return p === "ios" ? "ios" : p === "android" ? "android" : "web";
}

export async function initPushNotifications(): Promise<void> {
  if (initialized) return;
  initialized = true;
  if (!isCapacitor()) return;

  try {
    // Import dynamique caché de Vite — le plugin n'est livré que dans
    // mobile/{client,driver}/node_modules. Sur web/dev cet import échoue
    // silencieusement (catch) ; sur mobile le runtime Capacitor le résout.
    const pluginName = "@capacitor/push-notifications";
    const importer = new Function("p", "return import(p)") as (p: string) => Promise<any>;
    const mod = await importer(pluginName).catch(() => null);
    if (!mod?.PushNotifications) return;
    const { PushNotifications } = mod;

    // Demande permission (idempotent)
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive !== "granted") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return;

    // Listeners — à enregistrer AVANT register()
    PushNotifications.addListener("registration", async (t: any) => {
      try {
        await apiRequest("/api/push/register-token", {
          method: "POST",
          body: JSON.stringify({ token: t.value, platform: detectPlatform() }),
        });
      } catch (e) {
        // Silencieux — on retentera au prochain login
        // eslint-disable-next-line no-console
        console.warn("[push] register-token failed", e);
      }
    });

    PushNotifications.addListener("registrationError", (err: any) => {
      // eslint-disable-next-line no-console
      console.warn("[push] registrationError", err);
    });

    PushNotifications.addListener("pushNotificationReceived", () => {
      // App au premier plan : on rafraîchit les vues qui dépendent de WS,
      // le son/vibration sont déjà gérés par notify.ts
      try {
        const qc = (window as any).__MAWEJA_QC__;
        qc?.invalidateQueries?.();
      } catch {}
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action: any) => {
      // Tap sur la notif : si data.orderId présent, navigation profonde
      const data = action?.notification?.data || {};
      if (data?.orderId) {
        try { (window as any).location.assign(`/tracking/${data.orderId}`); } catch {}
      }
    });

    await PushNotifications.register();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[push] init failed", e);
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  if (!isCapacitor()) return;
  try {
    await apiRequest("/api/push/unregister-token", { method: "POST" });
  } catch {}
}
