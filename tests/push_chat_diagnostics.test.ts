/**
 * ÉTAPE 9 — Tests automatisés Push & Chat Diagnostics.
 *
 * Couvre :
 *   1. POST /api/push/register-token avec platform=android crée bien
 *      un push_token avec platform=android.
 *   2. POST /api/admin/push/test-token retourne success avec firebaseMessageId
 *      quand le mock firebase-admin renvoie un messageId.
 *   3. POST /api/admin/push/test-token : si firebase throw avec
 *      "registration-token-not-registered", le token est désactivé
 *      (isActive=false) et la réponse a deactivated=true.
 *   4. POST /api/chat client → agent : pushCalls n'a qu'une entrée pour le
 *      receiver agent (pas pour le sender client).
 *   5. POST /api/chat agent → client : pushCalls n'a qu'une entrée pour le
 *      receiver client (pas pour le sender agent).
 *   6. POST /api/admin/diag/chat (admin preview) : les wsCalls vers les
 *      admins ont type=admin_chat_preview avec silent=true (pas chat_message).
 *   7. handleChatEvent (client) : si me === senderId on ne sonne pas,
 *      si me === receiverId on sonne. Test pur sur le module notifyChat.
 *   8. initPushNotifications relance bien quand userId change : on appelle
 *      successivement avec deux userId différents et on vérifie que
 *      getPushInitState().initializedForUserId reflète le dernier appel.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { memoryStorage } from "./storage.mock";

// ── Module-level mocks (hoistés par vitest avant tout import non-mocké) ──────
vi.mock("../server/storage", async () => {
  const { memoryStorage } = await import("./storage.mock");
  return { storage: memoryStorage };
});

vi.mock("../server/db", () => ({
  db: { execute: async () => ({ rows: [] }) },
  pool: { connect: async () => ({ release: () => {} }) },
}));

// Capteurs WS / Push partagés (hoistés). On capte tous les appels sortants.
const wsCalls = vi.hoisted(() => ({ list: [] as Array<{ userId: number; data: any }> }));
const pushCalls = vi.hoisted(() => ({ list: [] as Array<{ userId: number; payload: any }> }));
const fbCfg = vi.hoisted(() => ({
  // Permet aux tests de basculer dynamiquement le comportement de
  // admin.messaging().send() : success → renvoie messageId, fail → throw.
  shouldFail: false as boolean,
  errorCode: "messaging/registration-token-not-registered" as string,
  errorMessage: "Requested entity was not found." as string,
  messageId: "projects/maweja-test/messages/0:fake" as string,
  sendCalls: [] as Array<any>,
}));

// État mutable pour notifyAudio mock (utilisé par le test 9.7).
const audioState = vi.hoisted(() => ({ ring: 0, notif: 0 }));

vi.mock("../client/src/lib/notify/notifyAudio", () => ({
  playRingtone: () => { audioState.ring++; },
  vibrate: () => {},
  showNotif: () => { audioState.notif++; },
  markNotifHandled: () => {},
  wasNotifHandled: () => false,
  ensureNotifChannel: async () => {},
  getDevicePlatform: () => "web",
  unlockAudioPlayback: () => {},
  isAudioUnlocked: () => true,
  installAudioUnlockOnce: () => {},
  // Helpers de coalescing chat (notif unique par conversation + cancel au markRead)
  chatNotifTag: (otherUserId: number | string) => `chat-${otherUserId}`,
  cancelNotifByTag: async () => {},
  notifIdForKey: (key: string) => {
    let h = 5381;
    for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) | 0;
    return Math.abs(h) % 2147483647;
  },
}));

vi.mock("../server/websocket", () => ({
  setupWebSocket: () => {},
  wsClients: new Map(),
  broadcast: () => {},
  sendToUser: (userId: number, data: any) => {
    wsCalls.list.push({ userId, data });
    return false;
  },
}));

vi.mock("../server/lib/push", async () => {
  const actual = await vi.importActual<typeof import("../server/lib/push")>(
    "../server/lib/push",
  );
  return {
    ...actual,
    isFirebaseConfigured: () => true,
    sendPushToUser: async (userId: number, payload: any) => {
      pushCalls.list.push({ userId, payload });
      const tokens = await memoryStorage.getActivePushTokensByUser(userId);
      if (tokens.length === 0) {
        return {
          status: "skipped" as const,
          sentCount: 0,
          failedCount: 0,
          invalidTokenCount: 0,
          skippedReason: "no-token" as const,
        };
      }
      return {
        status: "sent" as const,
        sentCount: tokens.length,
        failedCount: 0,
        invalidTokenCount: 0,
        results: tokens.map((t) => ({ token: t.token, status: "sent" as const })),
      };
    },
  };
});

// firebase-admin mock — on simule app initialisée + send() pilotable.
vi.mock("firebase-admin", () => {
  const messaging = {
    send: async (msg: any) => {
      fbCfg.sendCalls.push(msg);
      if (fbCfg.shouldFail) {
        const err: any = new Error(fbCfg.errorMessage);
        err.errorInfo = { code: fbCfg.errorCode, message: fbCfg.errorMessage };
        err.code = fbCfg.errorCode;
        throw err;
      }
      return fbCfg.messageId;
    },
  };
  const fakeApp = { name: "[DEFAULT]" };
  const adminApi = {
    apps: [fakeApp],
    app: () => fakeApp,
    initializeApp: () => fakeApp,
    messaging: () => messaging,
    credential: { cert: () => ({}), applicationDefault: () => ({}) },
  };
  return { default: adminApi, ...adminApi };
});

vi.mock("../server/lib/cloudSync", () => ({
  normalizeUploadUrls: async () => {},
  syncLocalUploadsToCloud: async () => {},
}));

// ── Imports après les mocks ─────────────────────────────────────────────────
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import bcrypt from "bcryptjs";
import { registerAuthRoutes } from "../server/routes/auth.routes";
import { registerPushRoutes } from "../server/routes/push.routes";
import { registerChatRoutes } from "../server/routes/chat.routes";
import { registerNotificationsRoutes } from "../server/routes/notifications.routes";
import { registerAdminRoutes } from "../server/routes/admin.routes";

type TestSession = { userId?: number; save: (cb?: (err?: unknown) => void) => void };
type RequestWithSession = Request & { session: TestSession };

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const r = req as RequestWithSession;
    r.session = r.session ?? { save: (cb) => cb && cb() };
    if (!r.session.save) r.session.save = (cb) => cb && cb();
    next();
  });
  registerAuthRoutes(app);
  registerPushRoutes(app);
  registerNotificationsRoutes(app);
  registerChatRoutes(app);
  registerAdminRoutes(app);
  return app;
}

const TOKEN_CLIENT = "tok-client-99";
const TOKEN_DRIVER = "tok-driver-99";
const TOKEN_ADMIN = "tok-admin-99";

async function seedTriad() {
  const hashed = await bcrypt.hash("secret123", 4);
  const client = await memoryStorage.createUser({
    email: "client@maweja.test",
    phone: "+243900000001",
    name: "Client Test",
    password: hashed,
    role: "client",
    isOnline: false,
    isBlocked: false,
    authToken: TOKEN_CLIENT,
  });
  const driver = await memoryStorage.createUser({
    email: "driver@maweja.test",
    phone: "+243900000002",
    name: "Driver Test",
    password: hashed,
    role: "driver",
    isOnline: true,
    isBlocked: false,
    authToken: TOKEN_DRIVER,
  });
  const admin = await memoryStorage.createUser({
    email: "admin@maweja.test",
    phone: "+243900000003",
    name: "Admin Test",
    password: hashed,
    role: "admin",
    isOnline: false,
    isBlocked: false,
    authToken: TOKEN_ADMIN,
  });
  return { client, driver, admin };
}

beforeEach(() => {
  memoryStorage.reset();
  wsCalls.list.length = 0;
  pushCalls.list.length = 0;
  fbCfg.sendCalls.length = 0;
  fbCfg.shouldFail = false;
  fbCfg.errorCode = "messaging/registration-token-not-registered";
  fbCfg.errorMessage = "Requested entity was not found.";
  fbCfg.messageId = "projects/maweja-test/messages/0:fake";
});

// ──────────────────────────────────────────────────────────────────────────────
// 1. register-token android crée push_tokens platform=android
// ──────────────────────────────────────────────────────────────────────────────
describe("ÉTAPE 9.1 — POST /api/push/register-token (android)", () => {
  it("crée une ligne push_tokens avec platform=android et isActive=true", async () => {
    const { client } = await seedTriad();
    const app = buildApp();

    const res = await request(app)
      .post("/api/push/register-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({
        token: "fcm-android-token-AAAA",
        platform: "android",
        deviceId: "pixel-7-AAA",
        appVersion: "1.0.42",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.platform).toBe("android");
    expect(res.body.userId).toBe(client.id);

    const tokens = await memoryStorage.getActivePushTokensByUser(client.id);
    expect(tokens.length).toBe(1);
    expect(tokens[0].platform).toBe("android");
    expect(tokens[0].token).toBe("fcm-android-token-AAAA");
    expect(tokens[0].deviceId).toBe("pixel-7-AAA");
    expect(tokens[0].isActive).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. test-token retourne success avec Firebase mock
// ──────────────────────────────────────────────────────────────────────────────
describe("ÉTAPE 9.2 — POST /api/admin/push/test-token (success)", () => {
  it("renvoie success=true + firebaseMessageId quand le mock send() résout", async () => {
    const { client, admin } = await seedTriad();
    const tok = await memoryStorage.upsertPushToken({
      userId: client.id,
      token: "fcm-good-token-1",
      platform: "android",
      deviceId: "pixel-7-OK",
      appVersion: "1.0.42",
    });

    fbCfg.shouldFail = false;
    fbCfg.messageId = "projects/maweja-test/messages/0:OK-12345";

    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/push/test-token")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ tokenId: tok.id, title: "T1", body: "B1" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.firebaseMessageId).toBe("projects/maweja-test/messages/0:OK-12345");
    if (res.body.userId !== client.id) {
      // debug
      console.error("DEBUG body=", JSON.stringify(res.body), "client.id=", client.id, "tok=", tok);
    }
    expect(res.body.tokenId).toBe(tok.id);
    expect(res.body.platform).toBe("android");
    expect(res.body.userId).toBe(client.id);

    // Le payload envoyé à Firebase doit cibler le bon token + channel maweja_default.
    const lastSend = fbCfg.sendCalls.at(-1);
    expect(lastSend?.token).toBe("fcm-good-token-1");
    expect(lastSend?.android?.notification?.channelId).toBe("maweja_default");
    void admin; // évite le warning unused
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. token invalide → désactivation auto isActive=false
// ──────────────────────────────────────────────────────────────────────────────
describe("ÉTAPE 9.3 — POST /api/admin/push/test-token (token invalide)", () => {
  it("désactive le token (isActive=false) si firebase code=registration-token-not-registered", async () => {
    const { client } = await seedTriad();
    const tok = await memoryStorage.upsertPushToken({
      userId: client.id,
      token: "fcm-dead-token-XYZ",
      platform: "android",
      deviceId: "old-device",
    });

    fbCfg.shouldFail = true;
    fbCfg.errorCode = "messaging/registration-token-not-registered";

    const app = buildApp();
    const res = await request(app)
      .post("/api/admin/push/test-token")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ tokenId: tok.id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.deactivated).toBe(true);
    expect(res.body.error?.code).toContain("registration-token-not-registered");

    // Le token doit être marqué isActive=false dans le storage.
    const stored = await memoryStorage.getPushTokenByValue("fcm-dead-token-XYZ");
    expect(stored?.isActive).toBe(false);
    // Plus aucun token actif pour ce user.
    const active = await memoryStorage.getActivePushTokensByUser(client.id);
    expect(active.length).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. chat client → agent : push uniquement vers le receiver agent
// ──────────────────────────────────────────────────────────────────────────────
describe("ÉTAPE 9.4 — POST /api/chat (client → agent)", () => {
  it("envoie le push UNIQUEMENT au receiver agent, pas au sender client", async () => {
    const { client, driver } = await seedTriad();
    // On donne aux deux des tokens push pour s'assurer que l'absence d'envoi
    // au sender ne vient pas d'une absence de token.
    await memoryStorage.upsertPushToken({
      userId: client.id, token: "tok-client-A", platform: "android",
    });
    await memoryStorage.upsertPushToken({
      userId: driver.id, token: "tok-driver-A", platform: "android",
    });
    // Une commande client-driver active pour autoriser le chat
    await memoryStorage.createOrder({
      clientId: client.id,
      driverId: driver.id,
      restaurantId: 1,
      items: [],
      subtotal: 0, deliveryFee: 0, total: 0,
      status: "out-for-delivery",
      paymentMethod: "cash",
      deliveryAddress: "addr",
      paymentStatus: "pending",
    } as any);

    const app = buildApp();
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ senderId: client.id, receiverId: driver.id, message: "Bonjour agent !" });

    expect([200, 201]).toContain(res.status);

    // Aucune entrée pushCalls vers le sender (client.id)
    const toClient = pushCalls.list.filter((c) => c.userId === client.id);
    const toDriver = pushCalls.list.filter((c) => c.userId === driver.id);
    expect(toClient.length).toBe(0);
    expect(toDriver.length).toBeGreaterThanOrEqual(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. chat agent → client : push uniquement vers le receiver client
// ──────────────────────────────────────────────────────────────────────────────
describe("ÉTAPE 9.5 — POST /api/chat (agent → client)", () => {
  it("envoie le push UNIQUEMENT au receiver client, pas au sender agent", async () => {
    const { client, driver } = await seedTriad();
    await memoryStorage.upsertPushToken({
      userId: client.id, token: "tok-client-B", platform: "android",
    });
    await memoryStorage.upsertPushToken({
      userId: driver.id, token: "tok-driver-B", platform: "android",
    });
    await memoryStorage.createOrder({
      clientId: client.id,
      driverId: driver.id,
      restaurantId: 1,
      items: [],
      subtotal: 0, deliveryFee: 0, total: 0,
      status: "out-for-delivery",
      paymentMethod: "cash",
      deliveryAddress: "addr",
      paymentStatus: "pending",
    } as any);

    const app = buildApp();
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`)
      .send({ senderId: driver.id, receiverId: client.id, message: "J'arrive dans 3 minutes" });

    expect([200, 201]).toContain(res.status);

    const toClient = pushCalls.list.filter((c) => c.userId === client.id);
    const toDriver = pushCalls.list.filter((c) => c.userId === driver.id);
    expect(toDriver.length).toBe(0);
    expect(toClient.length).toBeGreaterThanOrEqual(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. admin preview est silent — pas de chat_message vers admin
// ──────────────────────────────────────────────────────────────────────────────
describe("ÉTAPE 9.6 — admin chat preview silencieux", () => {
  it("envoie type=admin_chat_preview silent:true aux admins (pas chat_message)", async () => {
    const { client, driver, admin } = await seedTriad();
    await memoryStorage.createOrder({
      clientId: client.id,
      driverId: driver.id,
      restaurantId: 1,
      items: [],
      subtotal: 0, deliveryFee: 0, total: 0,
      status: "out-for-delivery",
      paymentMethod: "cash",
      deliveryAddress: "addr",
      paymentStatus: "pending",
    } as any);

    const app = buildApp();
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ senderId: client.id, receiverId: driver.id, message: "Hello" });
    expect([200, 201]).toContain(res.status);

    const toAdmin = wsCalls.list.filter((c) => c.userId === admin.id);
    // Tous les events ws envoyés à l'admin doivent être admin_chat_preview silent.
    const previews = toAdmin.filter((c) => c.data?.type === "admin_chat_preview");
    const directChat = toAdmin.filter((c) => c.data?.type === "chat_message");
    expect(directChat.length).toBe(0);
    if (previews.length > 0) {
      for (const p of previews) {
        expect(p.data.silent).toBe(true);
      }
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. handleChatEvent — receiver sonne, sender ne sonne pas
// ──────────────────────────────────────────────────────────────────────────────
describe("ÉTAPE 9.7 — notifyChat.handleChatEvent (foreground)", () => {
  it("ne sonne pas pour le sender, sonne pour le receiver", async () => {
    // Polyfills minimum pour le module client.
    (globalThis as any).window = (globalThis as any).window || {
      dispatchEvent: () => true,
    };
    (globalThis as any).document = (globalThis as any).document || { hidden: false };
    (globalThis as any).navigator = (globalThis as any).navigator || { userAgent: "node-test" };

    const mod = await import("../client/src/lib/notify/notifyChat");

    // Cas A : me === sender (10) → ne sonne pas (filtre self-echo).
    (window as any).__MAWEJA_USER_ID__ = 10;
    audioState.ring = 0; audioState.notif = 0;
    mod.handleChatEvent({
      type: "chat_message",
      message: { id: "msg-A", message: "Hello", senderId: 10, receiverId: 20 },
    });
    expect(audioState.ring).toBe(0);
    expect(audioState.notif).toBe(0);

    // Cas B : me === receiver (20) → sonne ET notif.
    (window as any).__MAWEJA_USER_ID__ = 20;
    audioState.ring = 0; audioState.notif = 0;
    mod.handleChatEvent({
      type: "chat_message",
      message: { id: "msg-B", message: "Hello back", senderId: 10, receiverId: 20 },
    });
    expect(audioState.ring).toBe(1);
    expect(audioState.notif).toBe(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 8. initPushNotifications relance bien quand userId change
// ──────────────────────────────────────────────────────────────────────────────
describe("ÉTAPE 9.8 — initPushNotifications change de userId", () => {
  it("getPushInitState.initializedForUserId reflète le dernier userId même si plusieurs appels", async () => {
    // Polyfills (web pas Capacitor → init va sortir tôt en 'web'/'denied'
    // mais initializedForUserId est mis à jour AVANT le early-exit Capacitor).
    (globalThis as any).window = (globalThis as any).window || {
      dispatchEvent: () => true,
    };
    (globalThis as any).navigator = (globalThis as any).navigator || {
      userAgent: "node-test", serviceWorker: undefined,
    };
    (globalThis as any).document = (globalThis as any).document || { hidden: false };
    const memStore: Record<string, string> = {};
    (globalThis as any).localStorage = (globalThis as any).localStorage || {
      getItem: (k: string) => (k in memStore ? memStore[k] : null),
      setItem: (k: string, v: string) => { memStore[k] = String(v); },
      removeItem: (k: string) => { delete memStore[k]; },
      clear: () => { for (const k of Object.keys(memStore)) delete memStore[k]; },
    };

    // On stub Capacitor pour que ce ne soit PAS une plateforme native (force web → exit propre).
    vi.doMock("@capacitor/core", () => ({
      Capacitor: {
        isNativePlatform: () => false,
        getPlatform: () => "web",
      },
    }));
    vi.doMock("@capacitor/push-notifications", () => ({
      PushNotifications: {
        addListener: async () => ({ remove: () => {} }),
        removeAllListeners: async () => {},
        register: async () => {},
        requestPermissions: async () => ({ receive: "denied" }),
      },
    }));

    const pushNotifs = await import("../client/src/lib/pushNotifs");

    // 1er appel : userId=11 (signature : initPushNotifications(userId?, role?))
    await pushNotifs.initPushNotifications(11, "client");
    expect(pushNotifs.getPushInitState().initializedForUserId).toBe(11);

    // 2e appel avec userId=22 → doit relancer et mettre à jour l'état.
    await pushNotifs.initPushNotifications(22, "client");
    expect(pushNotifs.getPushInitState().initializedForUserId).toBe(22);

    vi.doUnmock("@capacitor/core");
    vi.doUnmock("@capacitor/push-notifications");
  });
});
