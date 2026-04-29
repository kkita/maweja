/**
 * Integration tests for the most critical routes.
 *
 *   POST /api/auth/login
 *   POST /api/auth/register
 *   POST /api/orders
 *   POST /api/wallet/topup
 *   POST /api/push/register-token
 *
 * Storage, the WebSocket, and the raw Drizzle `db` import are all mocked at
 * module-resolution time so the suite never touches PostgreSQL or opens any
 * network listener.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { memoryStorage } from "./storage.mock";

// ── Module-level mocks (hoisted by Vitest before any import below) ───────────
vi.mock("../server/storage", async () => {
  const { memoryStorage } = await import("./storage.mock");
  return { storage: memoryStorage };
});

vi.mock("../server/db", () => ({
  db: {
    execute: async (_q: unknown) => ({ rows: [] }),
  },
  pool: { connect: async () => ({ release: () => {} }) },
}));

/**
 * Capteurs partagés (hoisted) pour les appels WebSocket et Push FCM.
 *   - wsCalls.list  : tout appel à sendToUser(userId, data) y est poussé.
 *   - pushCalls.list: tout appel à sendPushToUser(userId, payload) y est poussé.
 *
 * `pushMockCfg` permet aux tests de simuler dynamiquement les états :
 *   - firebaseConfigured = false → tous les sendPushToUser renvoient
 *     { status: "skipped", skippedReason: "no-firebase" }.
 *   - firebaseConfigured = true (par défaut) → on renvoie un PushResult
 *     "sent" basé sur le nombre de tokens actifs en DB (storage memory).
 */
const wsCalls = vi.hoisted(() => ({
  list: [] as Array<{ userId: number; data: any }>,
}));
const pushCalls = vi.hoisted(() => ({
  list: [] as Array<{ userId: number; payload: any }>,
}));
const pushMockCfg = vi.hoisted(() => ({
  firebaseConfigured: true,
}));

vi.mock("../server/websocket", () => ({
  setupWebSocket: () => {},
  wsClients: new Map(),
  broadcast: () => {},
  sendToUser: (userId: number, data: any) => {
    wsCalls.list.push({ userId, data });
    return false; // pas de connexion réelle dans les tests
  },
}));

vi.mock("../server/lib/push", async () => {
  const actual = await vi.importActual<typeof import("../server/lib/push")>(
    "../server/lib/push",
  );
  return {
    ...actual,
    isFirebaseConfigured: () => pushMockCfg.firebaseConfigured,
    sendPushToUser: async (userId: number, payload: any) => {
      pushCalls.list.push({ userId, payload });
      if (!pushMockCfg.firebaseConfigured) {
        return {
          status: "skipped" as const,
          sentCount: 0,
          failedCount: 0,
          invalidTokenCount: 0,
          skippedReason: "no-firebase" as const,
        };
      }
      // Compte les tokens actifs depuis le mock storage pour simuler "sent"
      const { memoryStorage } = await import("./storage.mock");
      const tokens = await memoryStorage.getActivePushTokensByUser(userId);
      const user = await memoryStorage.getUser(userId);
      const legacyToken = (user as any)?.pushToken || null;
      const count =
        tokens.length + (legacyToken && !tokens.find((t) => t.token === legacyToken) ? 1 : 0);
      if (count === 0) {
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
        sentCount: count,
        failedCount: 0,
        invalidTokenCount: 0,
        results: tokens.map((t) => ({ token: t.token, status: "sent" as const })),
      };
    },
  };
});

vi.mock("../server/lib/cloudSync", () => ({
  normalizeUploadUrls: async () => {},
  syncLocalUploadsToCloud: async () => {},
}));

// ── Now safe to import the route registrars ──────────────────────────────────
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import bcrypt from "bcryptjs";
import { registerAuthRoutes } from "../server/routes/auth.routes";
import { registerWalletRoutes } from "../server/routes/wallet.routes";
import { registerPushRoutes } from "../server/routes/push.routes";
import { registerOrdersRoutes } from "../server/routes/orders.routes";
import { registerNotificationsRoutes } from "../server/routes/notifications.routes";
import { registerChatRoutes } from "../server/routes/chat.routes";
import { registerSupportRoutes } from "../server/routes/support.routes";
import { registerReviewsRoutes } from "../server/routes/reviews.routes";
import { registerAdminRoutes } from "../server/routes/admin.routes";
import { registerDriversRoutes } from "../server/routes/drivers.routes";
import { toAbsoluteImageUrl } from "../server/lib/push";

/** Minimal shape of the session shim used by the route handlers under test. */
type TestSession = {
  userId?: number;
  save: (cb?: (err?: unknown) => void) => void;
};
type RequestWithSession = Request & { session: TestSession };

function buildApp() {
  const app = express();
  app.use(express.json());
  // Session cookies are not required for these tests because we authenticate
  // via Bearer token (resolveUserFromRequest reads it from the Authorization
  // header and writes the userId back into req.session).
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const r = req as RequestWithSession;
    r.session = r.session ?? { save: (cb) => cb && cb() };
    if (!r.session.save) r.session.save = (cb) => cb && cb();
    next();
  });
  registerAuthRoutes(app);
  registerWalletRoutes(app);
  registerPushRoutes(app);
  registerOrdersRoutes(app);
  registerNotificationsRoutes(app);
  registerChatRoutes(app);
  registerSupportRoutes(app);
  registerReviewsRoutes(app);
  registerAdminRoutes(app);
  registerDriversRoutes(app);
  return app;
}

const TOKEN_CLIENT = "test-token-client";
const TOKEN_ADMIN = "test-token-admin";

async function seedClient() {
  const hashed = await bcrypt.hash("secret123", 4);
  return memoryStorage.createUser({
    email: "alice@example.com",
    phone: "+243999111222",
    name: "Alice",
    password: hashed,
    role: "client",
    walletBalance: 50,
    isOnline: false,
    isBlocked: false,
    authToken: TOKEN_CLIENT,
  });
}

async function seedAdmin() {
  const hashed = await bcrypt.hash("secret123", 4);
  return memoryStorage.createUser({
    email: "admin@example.com",
    phone: "+243999000000",
    name: "Admin",
    password: hashed,
    role: "admin",
    isBlocked: false,
    authToken: TOKEN_ADMIN,
  });
}

async function seedRestaurant() {
  return memoryStorage.createRestaurant({
    name: "Chez Maman",
    description: "Cuisine maison",
    cuisine: "Local",
    image: "/cloud/public/uploads/r.jpg",
    address: "12 av. Lumumba",
    rating: 4.5,
    deliveryTime: "30",
    deliveryFee: 2,
    minOrder: 5,
    isActive: true,
    restaurantCommissionRate: 20,
  });
}

async function seedZone() {
  return memoryStorage.createDeliveryZone({
    name: "Zone Gombe",
    fee: 1.5,
    color: "#22c55e",
    neighborhoods: ["Gombe"],
    isActive: true,
    sortOrder: 0,
  });
}

beforeEach(() => {
  memoryStorage.reset();
  // Reset des capteurs WS/Push (les nouveaux tests "Section 8" en dépendent
  // mais ne pas les vider entre tests pollue d'autres assertions).
  wsCalls.list.length = 0;
  pushCalls.list.length = 0;
  pushMockCfg.firebaseConfigured = true;
});

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns 422 when body is invalid", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("errors");
  });

  it("returns 401 when credentials are wrong", async () => {
    await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  it("returns user + authToken on success", async () => {
    await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "secret123" });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("alice@example.com");
    expect(typeof res.body.authToken).toBe("string");
    expect(res.body).not.toHaveProperty("password");
  });

  it("rejects when expectedRole does not match", async () => {
    await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "secret123", expectedRole: "admin" });
    expect(res.status).toBe(403);
  });
});

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("returns 422 when body is invalid", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/auth/register").send({ name: "" });
    expect(res.status).toBe(422);
  });

  it("creates a user and returns authToken", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/auth/register").send({
      name: "New User",
      phone: "+243777000000",
      password: "secret123",
      email: "new@example.com",
    });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("new@example.com");
    expect(typeof res.body.authToken).toBe("string");
    expect(res.body).not.toHaveProperty("password");
    // Stored password must be bcrypt-hashed, not the plaintext we sent
    const stored = await memoryStorage.getUserByEmail("new@example.com");
    expect(stored?.password).not.toBe("secret123");
    expect(String(stored?.password || "").startsWith("$2")).toBe(true);
  });

  it("rejects an already-used phone number", async () => {
    await seedClient();
    const app = buildApp();
    const res = await request(app).post("/api/auth/register").send({
      name: "Dup", phone: "+243999111222", password: "secret123",
    });
    expect(res.status).toBe(400);
  });

  it("forbids client-side admin role escalation", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/auth/register").send({
      name: "Hacker", phone: "+243777111000", password: "secret123",
      role: "admin",
    });
    // The schema accepts only "client" but rejects "admin" with 422 first.
    expect([403, 422]).toContain(res.status);
  });
});

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/orders", () => {
  it("returns 401 without authentication", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/orders").send({});
    expect(res.status).toBe(401);
  });

  it("returns 422 when body is invalid", async () => {
    await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ restaurantId: 1, items: [] });
    expect(res.status).toBe(422);
  });

  it("rejects an out-of-zone delivery address", async () => {
    await seedClient();
    await seedRestaurant();
    await seedZone();
    const app = buildApp();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({
        restaurantId: 1,
        items: [{ name: "Poulet", price: 12, quantity: 2 }],
        deliveryAddress: "Quelque part hors zone, Brazzaville",
        paymentMethod: "cash",
        subtotal: 24,
        total: 24,
      });
    expect(res.status).toBe(400);
  });

  it("creates an order when address falls inside a zone", async () => {
    await seedClient();
    await seedRestaurant();
    await seedZone();
    const app = buildApp();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({
        restaurantId: 1,
        items: [{ name: "Poulet", price: 12, quantity: 2 }],
        deliveryAddress: "12 av. Lumumba, Gombe, Kinshasa",
        paymentMethod: "cash",
        subtotal: 24,
        total: 24,
      });
    expect(res.status).toBe(200);
    expect(res.body.orderNumber).toMatch(/^M\d{8}$/);
    expect(res.body.deliveryZone).toBe("Zone Gombe");
    expect(res.body.deliveryFee).toBe(1.5);
    // Server recomputes total: 24 (subtotal) + 1.5 (delivery) + 0.76 (default service fee)
    expect(res.body.total).toBeCloseTo(26.26, 2);
  });
});

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/wallet/topup", () => {
  it("returns 401 without authentication", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/wallet/topup").send({});
    expect(res.status).toBe(401);
  });

  it("returns 422 when body is invalid", async () => {
    await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/wallet/topup")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ userId: -1, amount: -5, method: "" });
    expect(res.status).toBe(422);
  });

  it("returns 403 WALLET_TOPUP_DISABLED when called by a client (faille de self-credit)", async () => {
    const client = await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/wallet/topup")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ userId: client.id, amount: 25, method: "mobile_money" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("WALLET_TOPUP_DISABLED");
    const fresh = await memoryStorage.getUser(client.id);
    expect(fresh?.walletBalance).toBe(50); // unchanged
  });

  it("returns 404 when target user does not exist (admin)", async () => {
    await seedAdmin();
    const app = buildApp();
    const res = await request(app)
      .post("/api/wallet/topup")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ userId: 9999, amount: 10, method: "mobile_money" });
    expect(res.status).toBe(404);
  });

  it("credits the wallet on success when called by admin", async () => {
    const client = await seedClient();
    await seedAdmin();
    const app = buildApp();
    const res = await request(app)
      .post("/api/wallet/topup")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ userId: client.id, amount: 25, method: "mobile_money" });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(25);
    expect(res.body.type).toBe("topup");
    const fresh = await memoryStorage.getUser(client.id);
    expect(fresh?.walletBalance).toBe(75); // 50 (seed) + 25
  });
});

// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/push/register-token", () => {
  it("returns 401 without authentication", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/push/register-token")
      .send({ token: "abc", platform: "android" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when token is missing", async () => {
    await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/push/register-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ platform: "android" });
    expect(res.status).toBe(400);
  });

  it("stores the push token on the user", async () => {
    const client = await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/push/register-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ token: "fcm-token-xyz", platform: "android" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const fresh = await memoryStorage.getUser(client.id);
    expect(fresh?.pushToken).toBe("fcm-token-xyz");
    expect(fresh?.pushPlatform).toBe("android");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Production hardening — règles métier critiques
// ──────────────────────────────────────────────────────────────────────────────

const TOKEN_DRIVER = "test-token-driver";

async function seedDriver() {
  const hashed = await bcrypt.hash("secret123", 4);
  return memoryStorage.createUser({
    email: "drv@example.com",
    phone: "+243999333444",
    name: "Driver",
    password: hashed,
    role: "driver",
    walletBalance: 0,
    isOnline: true,
    isBlocked: false,
    authToken: TOKEN_DRIVER,
  });
}

function inZoneOrderBody(extra: Record<string, unknown> = {}) {
  return {
    restaurantId: 1,
    items: [{ name: "Poulet", price: 12, quantity: 2 }],
    deliveryAddress: "12 av. Lumumba, Gombe, Kinshasa",
    paymentMethod: "cash",
    subtotal: 24,
    total: 24,
    ...extra,
  };
}

describe("POST /api/orders — wallet hardening", () => {
  it("refuse 400 INSUFFICIENT_WALLET_BALANCE quand le solde est insuffisant", async () => {
    const client = await seedClient(); // walletBalance=50
    await seedRestaurant();
    await seedZone();
    const app = buildApp();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send(inZoneOrderBody({ paymentMethod: "wallet", subtotal: 100, total: 100 }));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INSUFFICIENT_WALLET_BALANCE");
    // Aucun débit, aucune commande créée
    const fresh = await memoryStorage.getUser(client.id);
    expect(fresh?.walletBalance).toBe(50);
    expect(memoryStorage.orders.length).toBe(0);
  });

  it("accepte un paiement wallet quand le solde est suffisant et débite le portefeuille", async () => {
    const client = await seedClient();
    await seedRestaurant();
    await seedZone();
    const app = buildApp();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send(inZoneOrderBody({ paymentMethod: "wallet" })); // total ~26.26
    expect(res.status).toBe(200);
    expect(res.body.orderNumber).toMatch(/^M\d{8}$/);
    const fresh = await memoryStorage.getUser(client.id);
    // 50 - 26.26 = 23.74
    expect(fresh?.walletBalance).toBeCloseTo(23.74, 2);
  });
});

describe("POST /api/orders — orderNumber unique sous concurrence", () => {
  it("génère deux numéros distincts pour deux commandes successives", async () => {
    await seedClient();
    await seedRestaurant();
    await seedZone();
    const app = buildApp();
    const r1 = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send(inZoneOrderBody());
    const r2 = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send(inZoneOrderBody());
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r1.body.orderNumber).not.toBe(r2.body.orderNumber);
    expect(r1.body.orderNumber).toMatch(/^M\d{8}$/);
    expect(r2.body.orderNumber).toMatch(/^M\d{8}$/);
  });
});

describe("PATCH /api/orders/:id — anti double-remboursement", () => {
  it("ne rembourse qu'une seule fois même si l'admin renvoie status=cancelled", async () => {
    const client = await seedClient();
    await seedAdmin();
    await seedRestaurant();
    await seedZone();
    const app = buildApp();

    // 1. Création d'une commande wallet (débite 26.26)
    const created = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send(inZoneOrderBody({ paymentMethod: "wallet" }));
    expect(created.status).toBe(200);
    const orderId = created.body.id;
    const total = created.body.total;
    let cur = await memoryStorage.getUser(client.id);
    const balanceAfterDebit = cur?.walletBalance || 0;
    expect(balanceAfterDebit).toBeCloseTo(50 - total, 2);

    // 2. Premier cancel (admin) — refund attendu
    const cancel1 = await request(app)
      .patch(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ status: "cancelled" });
    expect(cancel1.status).toBe(200);
    cur = await memoryStorage.getUser(client.id);
    expect(cur?.walletBalance).toBeCloseTo(50, 2);
    const refunded = await memoryStorage.getOrder(orderId);
    expect(refunded?.paymentStatus).toBe("refunded");

    // 3. Deuxième cancel — doit être un no-op côté solde
    const cancel2 = await request(app)
      .patch(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ status: "cancelled" });
    // Soit 200 (no-op : même statut), soit 400 (transition refusée). Dans tous les cas pas de second refund.
    expect([200, 400]).toContain(cancel2.status);
    cur = await memoryStorage.getUser(client.id);
    expect(cur?.walletBalance).toBeCloseTo(50, 2);
    // Une seule transaction de remboursement enregistrée pour cette commande
    const refundTxns = memoryStorage.walletTxns.filter(
      (t) => t.userId === client.id && t.type === "refund" && t.orderId === orderId,
    );
    expect(refundTxns.length).toBe(1);
  });

  it("PATCH /api/orders/:id/cancel par le client ne rembourse qu'une fois", async () => {
    const client = await seedClient();
    await seedRestaurant();
    await seedZone();
    const app = buildApp();
    const created = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send(inZoneOrderBody({ paymentMethod: "wallet" }));
    const orderId = created.body.id;

    const c1 = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ reason: "Erreur" });
    expect(c1.status).toBe(200);

    const c2 = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ reason: "Encore" });
    // Statut déjà cancelled — la garde existante ["pending","confirmed"] le bloque
    expect(c2.status).toBe(400);

    const fresh = await memoryStorage.getUser(client.id);
    expect(fresh?.walletBalance).toBeCloseTo(50, 2);
    const refundTxns = memoryStorage.walletTxns.filter(
      (t) => t.userId === client.id && t.type === "refund" && t.orderId === orderId,
    );
    expect(refundTxns.length).toBe(1);
  });
});

describe("PATCH /api/orders/:id — transitions de statut", () => {
  it("interdit à un livreur de passer une commande en 'cancelled'", async () => {
    await seedAdmin();
    const driver = await seedDriver();
    await seedRestaurant();
    await seedZone();
    // Une commande confirmée assignée au livreur
    const order = await memoryStorage.createOrder({
      orderNumber: "M00000099",
      clientId: 1,
      restaurantId: 1,
      driverId: driver.id,
      status: "confirmed",
      items: [{ name: "x", price: 1, quantity: 1 }],
      subtotal: 10,
      deliveryFee: 1.5,
      commission: 2,
      total: 11.5,
      paymentMethod: "cash",
      paymentStatus: "pending",
      deliveryAddress: "Gombe",
      taxAmount: 0,
      promoDiscount: 0,
      driverAccepted: true,
      loyaltyPointsAwarded: false,
      loyaltyCreditDiscount: 0,
    });
    const app = buildApp();
    const res = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`)
      .send({ status: "cancelled" });
    expect(res.status).toBe(400);
    expect(String(res.body.message || "")).toMatch(/livreur/i);
    const fresh = await memoryStorage.getOrder(order.id);
    expect(fresh?.status).toBe("confirmed");
  });

  it("interdit à un admin de modifier une commande déjà en statut terminal", async () => {
    await seedAdmin();
    await seedRestaurant();
    const order = await memoryStorage.createOrder({
      orderNumber: "M00000098",
      clientId: 1,
      restaurantId: 1,
      driverId: null,
      status: "delivered",
      items: [{ name: "x", price: 1, quantity: 1 }],
      subtotal: 10,
      deliveryFee: 1.5,
      commission: 2,
      total: 11.5,
      paymentMethod: "cash",
      paymentStatus: "paid",
      deliveryAddress: "Gombe",
      taxAmount: 0,
      promoDiscount: 0,
      driverAccepted: false,
      loyaltyPointsAwarded: true,
      loyaltyCreditDiscount: 0,
    });
    const app = buildApp();
    const res = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ status: "confirmed" });
    expect(res.status).toBe(400);
    expect(String(res.body.message || "")).toMatch(/final|code d'accès/i);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Notifications — sécurité, ownership, broadcast, push payload
// ──────────────────────────────────────────────────────────────────────────────

describe("Notifications system", () => {
  it("GET /api/notifications/:userId retourne les notifs SANS les marquer lues automatiquement", async () => {
    await seedClient();
    const n = await memoryStorage.createNotification(
      { userId: 1, title: "T1", message: "M1", isRead: false } as any,
      { skipAutoPush: true },
    );
    const app = buildApp();
    const res = await request(app)
      .get("/api/notifications/1")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const fresh = await memoryStorage.getNotification(n.id);
    expect(fresh?.isRead).toBe(false);
  });

  it("PATCH /api/notifications/:id/read marque UNE seule notification (pas toutes)", async () => {
    await seedClient();
    const n1 = await memoryStorage.createNotification(
      { userId: 1, title: "A", message: "a", isRead: false } as any,
      { skipAutoPush: true },
    );
    const n2 = await memoryStorage.createNotification(
      { userId: 1, title: "B", message: "b", isRead: false } as any,
      { skipAutoPush: true },
    );
    const app = buildApp();
    const res = await request(app)
      .patch(`/api/notifications/${n1.id}/read`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(res.status).toBe(200);
    const fresh1 = await memoryStorage.getNotification(n1.id);
    const fresh2 = await memoryStorage.getNotification(n2.id);
    expect(fresh1?.isRead).toBe(true);
    expect(fresh2?.isRead).toBe(false);
  });

  it("PATCH /api/notifications/read-all est scopé à l'utilisateur courant", async () => {
    await seedClient();
    await seedAdmin();
    const own = await memoryStorage.createNotification(
      { userId: 1, title: "mine", message: "m", isRead: false } as any,
      { skipAutoPush: true },
    );
    const other = await memoryStorage.createNotification(
      { userId: 2, title: "other", message: "o", isRead: false } as any,
      { skipAutoPush: true },
    );
    const app = buildApp();
    const res = await request(app)
      .patch("/api/notifications/read-all/1")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(res.status).toBe(200);
    expect(await memoryStorage.getNotification(own.id).then(n => n?.isRead)).toBe(true);
    expect(await memoryStorage.getNotification(other.id).then(n => n?.isRead)).toBe(false);
  });

  it("PATCH /api/notifications/:id/read interdit (403) à un user de marquer la notif d'un autre", async () => {
    await seedClient();
    await seedAdmin();
    const otherNotif = await memoryStorage.createNotification(
      { userId: 999, title: "secret", message: "x", isRead: false } as any,
      { skipAutoPush: true },
    );
    const app = buildApp();
    const res = await request(app)
      .patch(`/api/notifications/${otherNotif.id}/read`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(res.status).toBe(403);
    const fresh = await memoryStorage.getNotification(otherNotif.id);
    expect(fresh?.isRead).toBe(false);
  });

  it("POST /api/notifications/broadcast (admin) crée des notifs avec imageUrl propagé", async () => {
    await seedClient();
    await seedAdmin();
    const app = buildApp();
    const res = await request(app)
      .post("/api/notifications/broadcast")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({
        title: "Promo",
        message: "Soldes du week-end",
        type: "promo",
        imageUrl: "/cloud/public/uploads/promo.jpg",
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("sent");
    expect(typeof res.body.pushSent).toBe("number");
    expect(typeof res.body.pushFailed).toBe("number");
    expect(typeof res.body.pushSkipped).toBe("number");
    const clientNotifs = await memoryStorage.getNotifications(1);
    const created = clientNotifs.filter((n: any) => n.title === "Promo");
    expect(created.length).toBeGreaterThan(0);
    expect(created[0].imageUrl).toBe("/cloud/public/uploads/promo.jpg");
  });

  it("toAbsoluteImageUrl convertit une URL relative en HTTPS absolue et rejette localhost", () => {
    const prev = process.env.PUBLIC_BASE_URL;
    process.env.PUBLIC_BASE_URL = "https://maweja.cd";
    try {
      const abs = toAbsoluteImageUrl("/cloud/public/uploads/x.jpg");
      expect(abs).toBe("https://maweja.cd/cloud/public/uploads/x.jpg");
      const passthrough = toAbsoluteImageUrl("https://cdn.example.com/y.png");
      expect(passthrough).toBe("https://cdn.example.com/y.png");
      expect(toAbsoluteImageUrl("http://localhost:5000/x.jpg")).toBeUndefined();
      expect(toAbsoluteImageUrl("http://127.0.0.1/x.jpg")).toBeUndefined();
      expect(toAbsoluteImageUrl(undefined)).toBeUndefined();
      expect(toAbsoluteImageUrl("")).toBeUndefined();
    } finally {
      if (prev === undefined) delete process.env.PUBLIC_BASE_URL;
      else process.env.PUBLIC_BASE_URL = prev;
    }
  });

  it("broadcast → la notif persistée porte data.imageUrl + data.broadcast pour rendu in-app", async () => {
    await seedClient();
    await seedAdmin();
    const app = buildApp();
    const res = await request(app)
      .post("/api/notifications/broadcast")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({
        title: "Hello",
        message: "World",
        type: "system",
        imageUrl: "/cloud/public/uploads/h.jpg",
      });
    expect(res.status).toBe(200);
    const clientNotifs = await memoryStorage.getNotifications(1);
    const created = clientNotifs.find((n: any) => n.title === "Hello");
    expect(created).toBeTruthy();
    const data = (created as any)?.data || {};
    expect(data.imageUrl).toBe("/cloud/public/uploads/h.jpg");
    expect(data.broadcast).toBe(true);
    // L'id existe toujours sur la ligne — utilisé par les payloads WS/Push pour deep-link
    expect(typeof (created as any).id).toBe("number");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Driver notifications — page Agent : ownership, lecture ciblée, payload UI
// ──────────────────────────────────────────────────────────────────────────────

describe("Driver notifications page", () => {
  it("GET /api/notifications/:driverId retourne ses notifications (rôle agent)", async () => {
    await seedDriver();
    await memoryStorage.createNotification(
      { userId: 1, title: "Nouvelle livraison", message: "Course #M01 dispo", type: "order_assigned", isRead: false } as any,
      { skipAutoPush: true },
    );
    await memoryStorage.createNotification(
      { userId: 1, title: "Welcome", message: "Bienvenue agent", type: "system", isRead: true } as any,
      { skipAutoPush: true },
    );
    const app = buildApp();
    const res = await request(app)
      .get("/api/notifications/1")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it("le compte de notifications non lues correspond au filtre isRead=false", async () => {
    await seedDriver();
    await memoryStorage.createNotification(
      { userId: 1, title: "A", message: "a", isRead: false } as any,
      { skipAutoPush: true },
    );
    await memoryStorage.createNotification(
      { userId: 1, title: "B", message: "b", isRead: false } as any,
      { skipAutoPush: true },
    );
    await memoryStorage.createNotification(
      { userId: 1, title: "C", message: "c", isRead: true } as any,
      { skipAutoPush: true },
    );
    const app = buildApp();
    const res = await request(app)
      .get("/api/notifications/1")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(res.status).toBe(200);
    const unread = (res.body as any[]).filter(n => !n.isRead);
    expect(unread.length).toBe(2);
  });

  it("PATCH /:id/read agent : marque UNE seule notif (les autres restent non lues)", async () => {
    await seedDriver();
    const n1 = await memoryStorage.createNotification(
      { userId: 1, title: "A", message: "a", isRead: false } as any,
      { skipAutoPush: true },
    );
    const n2 = await memoryStorage.createNotification(
      { userId: 1, title: "B", message: "b", isRead: false } as any,
      { skipAutoPush: true },
    );
    const app = buildApp();
    const res = await request(app)
      .patch(`/api/notifications/${n1.id}/read`)
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(res.status).toBe(200);
    expect((await memoryStorage.getNotification(n1.id))?.isRead).toBe(true);
    expect((await memoryStorage.getNotification(n2.id))?.isRead).toBe(false);
  });

  it("PATCH /read-all/:driverId remet le compteur du driver à zéro", async () => {
    await seedDriver();
    await memoryStorage.createNotification(
      { userId: 1, title: "X", message: "x", isRead: false } as any,
      { skipAutoPush: true },
    );
    await memoryStorage.createNotification(
      { userId: 1, title: "Y", message: "y", isRead: false } as any,
      { skipAutoPush: true },
    );
    const app = buildApp();
    const res = await request(app)
      .patch("/api/notifications/read-all/1")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(res.status).toBe(200);
    const after = await memoryStorage.getNotifications(1);
    expect(after.every(n => n.isRead)).toBe(true);
  });

  it("ouvrir la liste GET /:driverId ne marque RIEN comme lu automatiquement", async () => {
    await seedDriver();
    const n = await memoryStorage.createNotification(
      { userId: 1, title: "Z", message: "z", isRead: false } as any,
      { skipAutoPush: true },
    );
    const app = buildApp();
    await request(app)
      .get("/api/notifications/1")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    // un second GET ne doit pas non plus changer l'état
    await request(app)
      .get("/api/notifications/1")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    const fresh = await memoryStorage.getNotification(n.id);
    expect(fresh?.isRead).toBe(false);
  });

  it("un agent ne peut PAS marquer comme lue la notif d'un autre utilisateur (403)", async () => {
    await seedDriver();
    await seedClient();
    const otherNotif = await memoryStorage.createNotification(
      { userId: 2, title: "secret client", message: "x", isRead: false } as any,
      { skipAutoPush: true },
    );
    const app = buildApp();
    const res = await request(app)
      .patch(`/api/notifications/${otherNotif.id}/read`)
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(res.status).toBe(403);
    const fresh = await memoryStorage.getNotification(otherNotif.id);
    expect(fresh?.isRead).toBe(false);
  });

  it("notification avec data.orderId est exposée → la page peut afficher le bouton 'Voir la livraison'", async () => {
    await seedDriver();
    await memoryStorage.createNotification(
      {
        userId: 1,
        title: "Course assignée",
        message: "Allez chercher la commande M00000123",
        type: "order_assigned",
        isRead: false,
        data: { orderId: 123, orderNumber: "M00000123" },
      } as any,
      { skipAutoPush: true },
    );
    const app = buildApp();
    const res = await request(app)
      .get("/api/notifications/1")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(res.status).toBe(200);
    const notif = (res.body as any[])[0];
    expect(notif?.data?.orderId).toBe(123);
    expect(notif?.type).toBe("order_assigned");
  });

  it("notification avec imageUrl est exposée → la page peut afficher la miniature et l'image large", async () => {
    await seedDriver();
    await memoryStorage.createNotification(
      {
        userId: 1,
        title: "Promo agent",
        message: "Bonus du week-end",
        type: "promo",
        imageUrl: "/cloud/public/uploads/bonus.jpg",
        isRead: false,
      } as any,
      { skipAutoPush: true },
    );
    const app = buildApp();
    const res = await request(app)
      .get("/api/notifications/1")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(res.status).toBe(200);
    const notif = (res.body as any[])[0];
    expect(notif?.imageUrl).toBe("/cloud/public/uploads/bonus.jpg");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/orders/:id — assignation livreur (notif Agent + dédup + payload)
// ──────────────────────────────────────────────────────────────────────────────

describe("PATCH /api/orders/:id — assignation livreur", () => {
  async function seedClientWithOrder(overrides: Partial<any> = {}) {
    await seedClient();
    await seedRestaurant();
    return memoryStorage.createOrder({
      orderNumber: "M00000200",
      clientId: 1,
      restaurantId: 1,
      driverId: null,
      status: "pending",
      items: [{ name: "x", price: 1, quantity: 1 }],
      subtotal: 10,
      deliveryFee: 1.5,
      commission: 2,
      total: 11.5,
      paymentMethod: "cash",
      paymentStatus: "pending",
      deliveryAddress: "Gombe",
      taxAmount: 0,
      promoDiscount: 0,
      driverAccepted: false,
      loyaltyPointsAwarded: false,
      loyaltyCreditDiscount: 0,
      ...overrides,
    });
  }

  it("admin envoie { driverId, status: 'confirmed' } → le livreur reçoit une notification 'delivery'", async () => {
    await seedAdmin();
    const driver = await seedDriver();
    const order = await seedClientWithOrder();
    const app = buildApp();

    const res = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ driverId: driver.id, status: "confirmed" });

    expect(res.status).toBe(200);
    const driverNotifs = await memoryStorage.getNotifications(driver.id);
    const assigned = driverNotifs.find(n => n.type === "delivery" && n.title?.includes("livraison"));
    expect(assigned).toBeTruthy();
    expect((assigned as any).data?.eventType).toBe("driver_assigned");
    expect((assigned as any).data?.orderId).toBe(order.id);
  });

  it("admin envoie seulement { driverId } → le livreur reçoit une notification 'delivery'", async () => {
    await seedAdmin();
    const driver = await seedDriver();
    const order = await seedClientWithOrder();
    const app = buildApp();

    const res = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ driverId: driver.id });

    expect(res.status).toBe(200);
    const driverNotifs = await memoryStorage.getNotifications(driver.id);
    const assigned = driverNotifs.find(n => n.type === "delivery");
    expect(assigned).toBeTruthy();
    expect((assigned as any).data?.eventType).toBe("driver_assigned");
  });

  it("le même driverId renvoyé sur la même commande NE crée PAS de doublon", async () => {
    await seedAdmin();
    const driver = await seedDriver();
    const order = await seedClientWithOrder({ driverId: null });
    const app = buildApp();

    // Première assignation → notif
    await request(app)
      .patch(`/api/orders/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ driverId: driver.id });

    const before = (await memoryStorage.getNotifications(driver.id))
      .filter(n => n.type === "delivery").length;

    // Renvoyer le même driverId (par exemple via un changement de statut)
    await request(app)
      .patch(`/api/orders/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ driverId: driver.id, status: "preparing" });

    const after = (await memoryStorage.getNotifications(driver.id))
      .filter(n => n.type === "delivery").length;

    expect(after).toBe(before);
  });

  it("changer driverId d'un agent vers un autre → seul le NOUVEL agent est notifié", async () => {
    await seedAdmin();
    const driverA = await seedDriver();
    // Second driver
    const hashed = await bcrypt.hash("secret123", 4);
    const driverB = await memoryStorage.createUser({
      email: "drvB@example.com",
      phone: "+243999333555",
      name: "DriverB",
      password: hashed,
      role: "driver",
      walletBalance: 0,
      isOnline: true,
      isBlocked: false,
      authToken: "test-token-driverB",
    });
    const order = await seedClientWithOrder({ driverId: driverA.id });
    const app = buildApp();

    const before = (await memoryStorage.getNotifications(driverA.id))
      .filter(n => n.type === "delivery").length;

    await request(app)
      .patch(`/api/orders/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ driverId: driverB.id });

    const newNotifsB = (await memoryStorage.getNotifications(driverB.id))
      .filter(n => n.type === "delivery");
    const newNotifsA = (await memoryStorage.getNotifications(driverA.id))
      .filter(n => n.type === "delivery").length;

    expect(newNotifsB.length).toBeGreaterThan(0);
    expect((newNotifsB[0] as any).data?.eventType).toBe("driver_assigned");
    expect(newNotifsA).toBe(before);
  });

  it("le client reçoit une notif 'order' UNIQUEMENT lors d'une nouvelle assignation", async () => {
    await seedAdmin();
    const driver = await seedDriver();
    const order = await seedClientWithOrder();
    const app = buildApp();

    // Première assignation → client notifié
    await request(app)
      .patch(`/api/orders/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ driverId: driver.id });

    const clientNotifs1 = (await memoryStorage.getNotifications(order.clientId))
      .filter(n => n.type === "order" && (n as any).data?.eventType === "driver_assigned");
    expect(clientNotifs1.length).toBe(1);

    // Renvoyer le même driverId (changement de statut) → pas de nouvelle notif client "driver_assigned"
    await request(app)
      .patch(`/api/orders/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ driverId: driver.id, status: "preparing" });

    const clientNotifs2 = (await memoryStorage.getNotifications(order.clientId))
      .filter(n => n.type === "order" && (n as any).data?.eventType === "driver_assigned");
    expect(clientNotifs2.length).toBe(1);
  });

  it("la notif livreur persistée contient orderId, orderNumber et eventType pour le payload push", async () => {
    await seedAdmin();
    const driver = await seedDriver();
    const order = await seedClientWithOrder({ orderNumber: "M00000777" });
    const app = buildApp();

    await request(app)
      .patch(`/api/orders/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ driverId: driver.id });

    const notif = (await memoryStorage.getNotifications(driver.id))
      .find(n => n.type === "delivery");
    expect(notif).toBeTruthy();
    const data = (notif as any).data || {};
    expect(data.orderId).toBe(order.id);
    expect(data.orderNumber).toBe("M00000777");
    expect(data.eventType).toBe("driver_assigned");
    // notificationId est porté par la colonne id de la ligne — utilisé dans le payload WS/Push
    expect(typeof (notif as any).id).toBe("number");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Chat Agent ↔ Client lié à une commande — auth header, autorisations, payload
// ──────────────────────────────────────────────────────────────────────────────

describe("Chat Agent ↔ Client lié à la commande", () => {
  async function seedChatTrio() {
    const admin = await seedAdmin();
    const client = await seedClient();
    const driver = await seedDriver();
    await seedRestaurant();
    return { admin, client, driver };
  }

  async function seedActiveOrder(clientId: number, driverId: number, status = "confirmed") {
    return memoryStorage.createOrder({
      orderNumber: `M${String(900 + Math.floor(Math.random() * 99)).padStart(8, "0")}`,
      clientId,
      restaurantId: 1,
      driverId,
      status,
      items: [{ name: "x", price: 1, quantity: 1 }],
      subtotal: 10,
      deliveryFee: 1.5,
      commission: 2,
      total: 11.5,
      paymentMethod: "cash",
      paymentStatus: "pending",
      deliveryAddress: "Gombe",
      taxAmount: 0,
      promoDiscount: 0,
      driverAccepted: true,
      loyaltyPointsAwarded: false,
      loyaltyCreditDiscount: 0,
    });
  }

  // 1
  it("agent assigné peut résoudre le partenaire d'une commande via Bearer token mobile", async () => {
    const { client, driver } = await seedChatTrio();
    const order = await seedActiveOrder(client.id, driver.id);
    const app = buildApp();
    const res = await request(app)
      .get(`/api/chat/order-partner/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(res.status).toBe(200);
    expect(res.body.partner?.id).toBe(client.id);
    expect(res.body.active).toBe(true);
  });

  // 2 — l'auth-via-token NE doit JAMAIS retourner 401 quand le token est valide
  it("Bearer token agent : ouvrir le chat ne renvoie PAS 401 (pas de déconnexion)", async () => {
    const { client, driver } = await seedChatTrio();
    const order = await seedActiveOrder(client.id, driver.id);
    const app = buildApp();
    const res = await request(app)
      .get(`/api/chat/order-partner/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(res.status).not.toBe(401);
  });

  // 3
  it("un agent non assigné est refusé (403) sur le chat d'une autre commande", async () => {
    const { client } = await seedChatTrio();
    // Créer un 2e driver et lui assigner la commande
    const hashed = await bcrypt.hash("secret123", 4);
    const otherDriver = await memoryStorage.createUser({
      email: "drv2@example.com", phone: "+243999333666", name: "Drv2",
      password: hashed, role: "driver", walletBalance: 0, isOnline: true,
      isBlocked: false, authToken: "test-token-driver2",
    });
    const order = await seedActiveOrder(client.id, otherDriver.id);
    const app = buildApp();
    const res = await request(app)
      .get(`/api/chat/order-partner/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(res.status).toBe(403);
    // Toujours JSON propre, pas une 500 ni une page HTML qui casse le client mobile
    expect(typeof res.body.message).toBe("string");
  });

  // 4
  it("le client de la commande peut résoudre son partenaire (l'agent)", async () => {
    const { client, driver } = await seedChatTrio();
    const order = await seedActiveOrder(client.id, driver.id);
    const app = buildApp();
    const res = await request(app)
      .get(`/api/chat/order-partner/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(res.status).toBe(200);
    expect(res.body.partner?.id).toBe(driver.id);
  });

  // 5
  it("agent peut envoyer un message au client → notification 'chat' avec orderId", async () => {
    const { client, driver } = await seedChatTrio();
    const order = await seedActiveOrder(client.id, driver.id);
    const app = buildApp();
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`)
      .send({ senderId: driver.id, receiverId: client.id, message: "Bonjour, j'arrive" });
    expect(res.status).toBe(200);
    const clientNotifs = await memoryStorage.getNotifications(client.id);
    const chatNotif = clientNotifs.find(n => n.type === "chat");
    expect(chatNotif).toBeTruthy();
    expect((chatNotif as any).data?.orderId).toBe(order.id);
    expect((chatNotif as any).data?.senderId).toBe(driver.id);
    expect((chatNotif as any).data?.type).toBe("chat");
    expect(chatNotif!.title).toMatch(/agent MAWEJA/i);
  });

  // 6
  it("client peut répondre à l'agent → notification 'chat' au driver avec orderId", async () => {
    const { client, driver } = await seedChatTrio();
    const order = await seedActiveOrder(client.id, driver.id);
    const app = buildApp();
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ senderId: client.id, receiverId: driver.id, message: "Merci !" });
    expect(res.status).toBe(200);
    const driverNotifs = await memoryStorage.getNotifications(driver.id);
    const chatNotif = driverNotifs.find(n => n.type === "chat");
    expect(chatNotif).toBeTruthy();
    expect((chatNotif as any).data?.orderId).toBe(order.id);
    expect(chatNotif!.title).toMatch(/client/i);
  });

  // 7
  it("PATCH read marque UNIQUEMENT les messages sender→receiver comme lus", async () => {
    const { client, driver, admin } = await seedChatTrio();
    await seedActiveOrder(client.id, driver.id);
    const app = buildApp();

    // Driver → Client
    await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`)
      .send({ senderId: driver.id, receiverId: client.id, message: "M1" });
    // Admin → Client (autre conversation, doit rester non-lue)
    await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ senderId: admin.id, receiverId: client.id, message: "Hello from admin" });

    // Client marque comme lus uniquement les messages venant du driver
    const res = await request(app)
      .patch(`/api/chat/read/${driver.id}/${client.id}`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(res.status).toBe(200);

    const fromDriver = await memoryStorage.getChatMessages(driver.id, client.id);
    const fromAdmin = await memoryStorage.getChatMessages(admin.id, client.id);
    expect(fromDriver.every(m => m.isRead === true)).toBe(true);
    expect(fromAdmin.every(m => m.isRead === false)).toBe(true);
  });

  // 8
  it("erreur 401/403 chat reste un JSON {message} : ne touche pas au token (pas de logout)", async () => {
    const { client, driver } = await seedChatTrio();
    // Order assignée à un AUTRE driver
    const hashed = await bcrypt.hash("secret123", 4);
    const otherDriver = await memoryStorage.createUser({
      email: "drv3@example.com", phone: "+243999444777", name: "Drv3",
      password: hashed, role: "driver", walletBalance: 0, isOnline: true,
      isBlocked: false, authToken: "test-token-driver3",
    });
    const order = await seedActiveOrder(client.id, otherDriver.id);

    const app = buildApp();
    const res = await request(app)
      .get(`/api/chat/order-partner/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("message");
    // Le token reste valide : on peut toujours appeler une route authentifiée
    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(me.status).toBe(200);
    expect(me.body.id).toBe(driver.id);
  });

  // 9
  it("notification chat porte data.orderId pour le deep-link push", async () => {
    const { client, driver } = await seedChatTrio();
    const order = await seedActiveOrder(client.id, driver.id);
    const app = buildApp();
    await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`)
      .send({ senderId: driver.id, receiverId: client.id, message: "Coucou" });
    const notifs = await memoryStorage.getNotifications(client.id);
    const chat = notifs.find(n => n.type === "chat");
    expect((chat as any)?.data?.orderId).toBe(order.id);
  });

  // 10 — 'route ouverte selon le rôle' : le titre+data sont distincts pour client vs agent
  it("titre de notif distinct selon le rôle du destinataire (deep-link UI)", async () => {
    const { client, driver } = await seedChatTrio();
    await seedActiveOrder(client.id, driver.id);
    const app = buildApp();

    await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`)
      .send({ senderId: driver.id, receiverId: client.id, message: "→ client" });
    await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ senderId: client.id, receiverId: driver.id, message: "→ driver" });

    const clientNotif = (await memoryStorage.getNotifications(client.id))
      .find(n => n.type === "chat");
    const driverNotif = (await memoryStorage.getNotifications(driver.id))
      .find(n => n.type === "chat");

    expect(clientNotif!.title).toMatch(/agent MAWEJA/i);
    expect(driverNotif!.title).toMatch(/client/i);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Push notifications multi-device — un user peut avoir N appareils enregistrés
// ──────────────────────────────────────────────────────────────────────────────

describe("Push notifications multi-device", () => {
  beforeEach(() => {
    memoryStorage.reset();
  });

  // 1
  it("upsertPushToken : un user peut avoir plusieurs tokens actifs (deux appareils différents)", async () => {
    const u = await seedClient();
    await memoryStorage.upsertPushToken({
      userId: u.id,
      token: "tok-android-1",
      platform: "android",
      deviceId: "dev-1",
    });
    await memoryStorage.upsertPushToken({
      userId: u.id,
      token: "tok-ios-1",
      platform: "ios",
      deviceId: "dev-2",
    });
    const active = await memoryStorage.getActivePushTokensByUser(u.id);
    expect(active.map((t) => t.token).sort()).toEqual(["tok-android-1", "tok-ios-1"]);
    expect(active.every((t) => t.isActive)).toBe(true);
    const platforms = active.map((t) => t.platform).sort();
    expect(platforms).toEqual(["android", "ios"]);
  });

  // 2
  it("upsertPushToken : enregistrer le même token deux fois met à jour, ne crée pas de doublon", async () => {
    const u = await seedClient();
    await memoryStorage.upsertPushToken({
      userId: u.id,
      token: "tok-same",
      platform: "android",
      deviceId: "dev-A",
      appVersion: "1.0.0",
    });
    await memoryStorage.upsertPushToken({
      userId: u.id,
      token: "tok-same",
      platform: "android",
      deviceId: "dev-A",
      appVersion: "1.2.3",
    });
    const all = memoryStorage.pushTokens.filter((t) => t.token === "tok-same");
    expect(all).toHaveLength(1);
    expect(all[0].appVersion).toBe("1.2.3");
    expect(all[0].isActive).toBe(true);
  });

  // 3
  it("upsertPushToken : enregistrer un nouveau token n'écrase pas les autres appareils du même user", async () => {
    const u = await seedClient();
    await memoryStorage.upsertPushToken({ userId: u.id, token: "tok-A", platform: "android" });
    await memoryStorage.upsertPushToken({ userId: u.id, token: "tok-B", platform: "ios" });
    await memoryStorage.upsertPushToken({ userId: u.id, token: "tok-C", platform: "web" });
    const active = await memoryStorage.getActivePushTokensByUser(u.id);
    expect(active).toHaveLength(3);
    expect(active.map((t) => t.token).sort()).toEqual(["tok-A", "tok-B", "tok-C"]);
  });

  // 4
  it("POST /api/push/register-token : crée la ligne push_tokens et garde users.pushToken en sync (legacy)", async () => {
    const client = await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/push/register-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({
        token: "fcm-multi-1",
        platform: "android",
        deviceId: "device-pixel-7",
        appVersion: "2.0.0",
      });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.platform).toBe("android");
    expect(res.body.deviceId).toBe("device-pixel-7");

    const active = await memoryStorage.getActivePushTokensByUser(client.id);
    expect(active).toHaveLength(1);
    expect(active[0].token).toBe("fcm-multi-1");
    expect(active[0].deviceId).toBe("device-pixel-7");
    expect(active[0].appVersion).toBe("2.0.0");

    // Legacy users.pushToken reste sync avec le dernier appareil enregistré
    const fresh = await memoryStorage.getUser(client.id);
    expect(fresh?.pushToken).toBe("fcm-multi-1");
    expect(fresh?.pushPlatform).toBe("android");
  });

  // 5
  it("POST /api/push/register-token : enregistre 2 appareils sans en perdre un", async () => {
    const client = await seedClient();
    const app = buildApp();
    await request(app)
      .post("/api/push/register-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ token: "fcm-android", platform: "android", deviceId: "dev-android" });
    await request(app)
      .post("/api/push/register-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ token: "fcm-ios", platform: "ios", deviceId: "dev-ios" });

    const active = await memoryStorage.getActivePushTokensByUser(client.id);
    expect(active).toHaveLength(2);
    const tokens = active.map((t) => t.token).sort();
    expect(tokens).toEqual(["fcm-android", "fcm-ios"]);
  });

  // 6
  it("POST /api/push/unregister-token : sans body désactive TOUS les tokens du user", async () => {
    const client = await seedClient();
    const app = buildApp();
    await memoryStorage.upsertPushToken({ userId: client.id, token: "t1", platform: "android" });
    await memoryStorage.upsertPushToken({ userId: client.id, token: "t2", platform: "ios" });

    const res = await request(app)
      .post("/api/push/unregister-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({});
    expect(res.status).toBe(200);
    const active = await memoryStorage.getActivePushTokensByUser(client.id);
    expect(active).toHaveLength(0);
  });

  // 7
  it("POST /api/push/unregister-token : avec un token précis ne désactive que cet appareil", async () => {
    const client = await seedClient();
    const app = buildApp();
    await memoryStorage.upsertPushToken({ userId: client.id, token: "tok-keep", platform: "android" });
    await memoryStorage.upsertPushToken({ userId: client.id, token: "tok-remove", platform: "ios" });

    await request(app)
      .post("/api/push/unregister-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ token: "tok-remove" });

    const active = await memoryStorage.getActivePushTokensByUser(client.id);
    expect(active.map((t) => t.token)).toEqual(["tok-keep"]);
  });

  // 8
  it("deactivatePushToken : marque isActive=false (l'invalidation côté FCM passe par là)", async () => {
    const u = await seedClient();
    await memoryStorage.upsertPushToken({ userId: u.id, token: "bad-token", platform: "android" });
    await memoryStorage.deactivatePushToken("bad-token");
    const active = await memoryStorage.getActivePushTokensByUser(u.id);
    expect(active).toHaveLength(0);
    const all = memoryStorage.pushTokens.filter((t) => t.userId === u.id);
    expect(all[0].isActive).toBe(false);
  });

  // 9
  it("re-registering after deactivation reactivates the token row instead of duplicating", async () => {
    const u = await seedClient();
    await memoryStorage.upsertPushToken({ userId: u.id, token: "tok-resub", platform: "android" });
    await memoryStorage.deactivatePushToken("tok-resub");
    await memoryStorage.upsertPushToken({ userId: u.id, token: "tok-resub", platform: "android" });
    const all = memoryStorage.pushTokens.filter((t) => t.token === "tok-resub");
    expect(all).toHaveLength(1);
    expect(all[0].isActive).toBe(true);
  });

  // 10
  it("legacy users.pushToken reste compatible : un user uniquement legacy a bien un token cible", async () => {
    const u = await seedClient();
    await memoryStorage.updateUser(u.id, {
      pushToken: "legacy-token-xyz",
      pushPlatform: "android",
    } as any);
    // Aucune ligne push_tokens — uniquement le legacy
    expect(memoryStorage.pushTokens.filter((t) => t.userId === u.id)).toHaveLength(0);
    const fresh = await memoryStorage.getUser(u.id);
    expect(fresh?.pushToken).toBe("legacy-token-xyz");
  });

  // 11
  it("register-token requiert le champ token", async () => {
    await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/push/register-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ platform: "android" });
    expect(res.status).toBe(400);
  });

  // 12
  it("register-token sans Authorization renvoie 401", async () => {
    await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/push/register-token")
      .send({ token: "x", platform: "android" });
    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Chat post-livraison (étape 2) — fenêtre 60 min + bouton support
// ──────────────────────────────────────────────────────────────────────────────

import { POST_DELIVERY_CHAT_WINDOW_MINUTES } from "@shared/schema";

describe("Chat post-livraison + tickets support", () => {
  beforeEach(() => {
    memoryStorage.reset();
  });

  async function trio() {
    const admin = await seedAdmin();
    const client = await seedClient();
    const driver = await seedDriver();
    await seedRestaurant();
    return { admin, client, driver };
  }

  async function makeOrder(
    clientId: number,
    driverId: number,
    overrides: Partial<{ status: string; deliveredAt: Date | null }> = {},
  ) {
    return memoryStorage.createOrder({
      orderNumber: `M${String(700 + Math.floor(Math.random() * 999)).padStart(8, "0")}`,
      clientId,
      restaurantId: 1,
      driverId,
      status: overrides.status ?? "confirmed",
      deliveredAt: overrides.deliveredAt ?? null,
      items: [{ name: "x", price: 1, quantity: 1 }],
      subtotal: 10,
      deliveryFee: 1.5,
      commission: 2,
      total: 11.5,
      paymentMethod: "cash",
      paymentStatus: "pending",
      deliveryAddress: "Gombe",
      taxAmount: 0,
      promoDiscount: 0,
      driverAccepted: true,
      loyaltyPointsAwarded: false,
      loyaltyCreditDiscount: 0,
    });
  }

  // 1 — pendant la livraison active
  it("chat autorisé pendant une livraison active (statut 'confirmed')", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id, { status: "confirmed" });
    const app = buildApp();
    const res = await request(app)
      .get(`/api/chat/order-partner/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(res.status).toBe(200);
    expect(res.body.chatAllowed).toBe(true);
    expect(res.body.chatReason).toBe("active");
    expect(res.body.active).toBe(true);
    expect(res.body.postDeliveryWindowMinutes).toBe(POST_DELIVERY_CHAT_WINDOW_MINUTES);

    // Et un message peut être envoyé
    const send = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ senderId: client.id, receiverId: driver.id, message: "salut" });
    expect(send.status).toBe(200);
  });

  // 2 — moins de 60 minutes après livraison
  it("chat autorisé si la commande a été livrée il y a moins de 60 minutes", async () => {
    const { client, driver } = await trio();
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const order = await makeOrder(client.id, driver.id, {
      status: "delivered",
      deliveredAt: fifteenMinAgo,
    });
    const app = buildApp();
    const res = await request(app)
      .get(`/api/chat/order-partner/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(res.status).toBe(200);
    expect(res.body.chatAllowed).toBe(true);
    expect(res.body.chatReason).toBe("post_delivery_window");
    expect(res.body.active).toBe(false);
    expect(res.body.postDeliveryExpiresAt).toBeTruthy();

    // Et un message peut être envoyé pendant la fenêtre
    const send = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ senderId: client.id, receiverId: driver.id, message: "encore une question" });
    expect(send.status).toBe(200);
  });

  // 3 — au-delà de la fenêtre, le chat est verrouillé
  it("chat bloqué après expiration de la fenêtre de 60 minutes", async () => {
    const { client, driver } = await trio();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const order = await makeOrder(client.id, driver.id, {
      status: "delivered",
      deliveredAt: twoHoursAgo,
    });
    const app = buildApp();
    const res = await request(app)
      .get(`/api/chat/order-partner/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(res.status).toBe(200);
    expect(res.body.chatAllowed).toBe(false);
    expect(res.body.chatReason).toBe("closed");
    expect(res.body.supportTicketId).toBeNull();

    // Et l'envoi est explicitement refusé (403, pas 401 — l'utilisateur n'est PAS déconnecté)
    const send = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ senderId: client.id, receiverId: driver.id, message: "ça passe pas" });
    expect(send.status).toBe(403);
    expect(send.status).not.toBe(401);
  });

  // 4 — le support reste disponible (ouverture d'un ticket réautorise le chat)
  it("après expiration, ouvrir un ticket support ré-autorise le chat client↔livreur", async () => {
    const { client, driver } = await trio();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const order = await makeOrder(client.id, driver.id, {
      status: "delivered",
      deliveredAt: twoHoursAgo,
    });
    const app = buildApp();

    // État initial : chat fermé
    const before = await request(app)
      .get(`/api/chat/order-partner/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(before.body.chatAllowed).toBe(false);

    // Le client ouvre un ticket support pour cette commande
    const ticketRes = await request(app)
      .post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id, message: "Le repas était froid" });
    expect(ticketRes.status).toBe(201);
    expect(ticketRes.body.ticket.status).toBe("open");
    expect(ticketRes.body.ticket.orderId).toBe(order.id);

    // Le chat est de nouveau autorisé tant que le ticket est open
    const after = await request(app)
      .get(`/api/chat/order-partner/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(after.body.chatAllowed).toBe(true);
    expect(after.body.chatReason).toBe("support_open");
    expect(after.body.supportTicketId).toBe(ticketRes.body.ticket.id);

    // Le client peut à nouveau écrire au livreur
    const send = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ senderId: client.id, receiverId: driver.id, message: "encore là ?" });
    expect(send.status).toBe(200);
  });

  // 5 — la création d'un ticket est idempotente (pas de doublon)
  it("ouvrir un ticket alors qu'il y en a déjà un open est idempotent", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id, {
      status: "delivered",
      deliveredAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    });
    const app = buildApp();
    const first = await request(app)
      .post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id });
    expect(second.status).toBe(200);
    expect(second.body.alreadyOpen).toBe(true);
    expect(second.body.ticket.id).toBe(first.body.ticket.id);
    expect(memoryStorage.supportTickets.filter(t => t.orderId === order.id)).toHaveLength(1);
  });

  // 6 — un admin peut clôturer un ticket → le chat se reverrouille
  it("clôturer un ticket reverrouille le chat hors fenêtre", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id, {
      status: "delivered",
      deliveredAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    });
    const app = buildApp();

    const t = await request(app)
      .post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id });
    expect(t.status).toBe(201);
    const ticketId = t.body.ticket.id;

    const close = await request(app)
      .patch(`/api/support/tickets/${ticketId}/close`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({});
    expect(close.status).toBe(200);
    expect(close.body.status).toBe("closed");

    const after = await request(app)
      .get(`/api/chat/order-partner/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(after.body.chatAllowed).toBe(false);
  });

  // 7 — un user externe ne peut pas ouvrir de ticket pour la commande d'un autre
  it("un user qui n'est ni client/agent/admin de la commande ne peut PAS ouvrir un ticket", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    // Crée un autre client
    const bcrypt = await import("bcryptjs");
    const hashed = await bcrypt.hash("secret123", 4);
    const stranger = await memoryStorage.createUser({
      email: "stranger@example.com",
      phone: "+243888777666",
      name: "Stranger",
      password: hashed,
      role: "client",
      walletBalance: 0,
      isOnline: false,
      isBlocked: false,
      authToken: "test-token-stranger",
    });
    expect(stranger.id).toBeGreaterThan(0);
    const app = buildApp();
    const res = await request(app)
      .post("/api/support/tickets")
      .set("Authorization", `Bearer test-token-stranger`)
      .send({ orderId: order.id });
    expect(res.status).toBe(403);
  });

  // 8 — admin peut chater même quand le chat client/driver est fermé
  it("admin peut continuer à discuter avec le client ou l'agent même quand le chat client/driver est fermé", async () => {
    const { admin, client, driver } = await trio();
    await makeOrder(client.id, driver.id, {
      status: "delivered",
      deliveredAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    });
    const app = buildApp();
    // Admin → client doit toujours être autorisé
    const send = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ senderId: admin.id, receiverId: client.id, message: "Bonjour, MAWEJA support" });
    expect(send.status).toBe(200);
  });

  // 9 — la transition d'une commande vers "delivered" via PATCH renseigne deliveredAt
  it("PATCH /api/orders/:id status=delivered renseigne automatiquement deliveredAt", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id, { status: "picked_up" });
    const app = buildApp();
    const res = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ status: "delivered" });
    expect(res.status).toBe(200);
    const fresh = await memoryStorage.getOrder(order.id);
    expect(fresh?.status).toBe("delivered");
    expect(fresh?.deliveredAt).toBeTruthy();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Centre d'opérations admin (PARTIE 3)
// ──────────────────────────────────────────────────────────────────────────────

describe("GET /api/admin/operations — centre d'opérations", () => {
  beforeEach(() => {
    memoryStorage.reset();
  });

  async function setupOps() {
    await seedAdmin();
    const client = await seedClient();
    const driver = await seedDriver();
    await seedRestaurant();
    await seedZone();
    return { client, driver };
  }

  async function makeOrder(overrides: Partial<any>) {
    return memoryStorage.createOrder({
      orderNumber: `M${String(100 + Math.floor(Math.random() * 9999)).padStart(8, "0")}`,
      restaurantId: 1,
      status: "pending",
      items: [{ name: "x", price: 1, quantity: 1 }],
      subtotal: 10,
      deliveryFee: 1.5,
      commission: 2,
      total: 11.5,
      paymentMethod: "cash",
      paymentStatus: "pending",
      deliveryAddress: "Gombe",
      taxAmount: 0,
      promoDiscount: 0,
      driverAccepted: false,
      loyaltyPointsAwarded: false,
      loyaltyCreditDiscount: 0,
      ...overrides,
    });
  }

  it("refuse l'accès sans Authorization (401) et aux non-admins (403)", async () => {
    await setupOps();
    const app = buildApp();
    const noAuth = await request(app).get("/api/admin/operations");
    expect(noAuth.status).toBe(401);
    const asClient = await request(app)
      .get("/api/admin/operations")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(asClient.status).toBe(403);
  });

  it("retourne les blocs live, kpis, urgent, filters avec un schéma stable", async () => {
    await setupOps();
    const app = buildApp();
    const res = await request(app)
      .get("/api/admin/operations")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      period: "today",
      live: expect.objectContaining({
        activeOrders: expect.any(Number),
        lateOrders: expect.any(Number),
        driversOnline: expect.any(Number),
        driversBusy: expect.any(Number),
        driversOffline: expect.any(Number),
        openSupportTickets: expect.any(Number),
        pendingRefunds: expect.any(Number),
        activeZones: expect.any(Number),
        criticalAlerts: expect.any(Number),
      }),
      kpis: expect.objectContaining({
        todayOrders: expect.any(Number),
        inProgressOrders: expect.any(Number),
        cancelRate: expect.any(Number),
        openTickets: expect.any(Number),
      }),
      urgent: expect.objectContaining({
        noDriver: expect.any(Array),
        blocked: expect.any(Array),
        waitingClients: expect.any(Array),
        urgentSupport: expect.any(Array),
        refundsToValidate: expect.any(Array),
      }),
      filters: expect.objectContaining({
        zones: expect.any(Array),
        statuses: expect.any(Array),
        drivers: expect.any(Array),
        restaurants: expect.any(Array),
      }),
    });
  });

  it("classe les livreurs en ligne / occupés / hors ligne et calcule les commandes actives", async () => {
    const { client, driver } = await setupOps();

    // Un autre livreur en ligne sans commande active
    const bcrypt = await import("bcryptjs");
    const hashed = await bcrypt.hash("secret123", 4);
    const driverFree = await memoryStorage.createUser({
      email: "drvfree@example.com", phone: "+243888111222", name: "Free",
      password: hashed, role: "driver", walletBalance: 0, isOnline: true,
      isBlocked: false, authToken: "test-token-driver-free",
    });
    // Un livreur hors ligne
    await memoryStorage.createUser({
      email: "drvoff@example.com", phone: "+243888111333", name: "Offline",
      password: hashed, role: "driver", walletBalance: 0, isOnline: false,
      isBlocked: false, authToken: "test-token-driver-off",
    });

    // Driver "occupé" : a une commande active assignée
    await makeOrder({
      clientId: client.id, driverId: driver.id, status: "picked_up",
    });

    const app = buildApp();
    const res = await request(app)
      .get("/api/admin/operations")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(res.status).toBe(200);
    expect(res.body.live.activeOrders).toBe(1);
    expect(res.body.live.driversBusy).toBe(1);
    expect(res.body.live.driversOnline).toBe(1); // driverFree
    expect(res.body.live.driversOffline).toBe(1);
    expect(driverFree.id).toBeGreaterThan(0);
  });

  it("compte les commandes en retard (estimatedDelivery dépassé) et les actions urgentes", async () => {
    const { client, driver } = await setupOps();

    // Commande en retard : ETA passée mais toujours en cours
    await makeOrder({
      clientId: client.id, driverId: driver.id, status: "picked_up",
      estimatedDelivery: new Date(Date.now() - 30 * 60_000).toISOString(),
    });

    // Commande sans livreur depuis > 5 min → urgent.noDriver
    const noDriverOrder = await makeOrder({
      clientId: client.id, status: "confirmed", driverId: null,
    });
    // Ramener le createdAt 10 min en arrière
    await memoryStorage.updateOrder(noDriverOrder.id, {
      createdAt: new Date(Date.now() - 10 * 60_000),
    } as any);

    // Commande bloquée : pending depuis > 10 min → urgent.blocked
    const blocked = await makeOrder({ clientId: client.id, status: "pending" });
    await memoryStorage.updateOrder(blocked.id, {
      createdAt: new Date(Date.now() - 20 * 60_000),
    } as any);

    const app = buildApp();
    const res = await request(app)
      .get("/api/admin/operations")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(res.status).toBe(200);
    expect(res.body.live.lateOrders).toBe(1);
    expect(res.body.urgent.noDriver.length).toBeGreaterThanOrEqual(1);
    expect(res.body.urgent.blocked.length).toBeGreaterThanOrEqual(1);
    expect(res.body.live.criticalAlerts).toBeGreaterThanOrEqual(2);
  });

  it("liste les remboursements en attente (commande annulée + payée non remboursée)", async () => {
    const { client } = await setupOps();
    await makeOrder({
      clientId: client.id, status: "cancelled",
      paymentMethod: "wallet", paymentStatus: "paid",
      cancelReason: "Restaurant indisponible",
    });
    // Cash annulée → pas un remboursement à valider
    await makeOrder({
      clientId: client.id, status: "cancelled",
      paymentMethod: "cash", paymentStatus: "pending",
    });
    const app = buildApp();
    const res = await request(app)
      .get("/api/admin/operations")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(res.body.live.pendingRefunds).toBe(1);
    expect(res.body.urgent.refundsToValidate).toHaveLength(1);
    expect(res.body.urgent.refundsToValidate[0].paymentMethod).toBe("wallet");
  });

  it("agrège les tickets support ouverts et signale les tickets urgents (>30 min)", async () => {
    const { client } = await setupOps();
    const order = await makeOrder({ clientId: client.id, status: "delivered" });

    // Ticket récent (< 30 min) → ne remonte que dans openSupportTickets
    await memoryStorage.createSupportTicket({
      orderId: order.id, userId: client.id,
      subject: null, message: "récent", status: "open",
    });

    // Ticket "ancien" (> 30 min) → urgent.
    // createSupportTicket renvoie un clone, on remonte le createdAt
    // directement dans le tableau interne pour simuler un ticket vieux.
    await memoryStorage.createSupportTicket({
      orderId: order.id, userId: client.id,
      subject: "Bug paiement", message: "vieux", status: "open",
    });
    const last = memoryStorage.supportTickets[memoryStorage.supportTickets.length - 1];
    last.createdAt = new Date(Date.now() - 60 * 60_000);

    const app = buildApp();
    const res = await request(app)
      .get("/api/admin/operations")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(res.body.live.openSupportTickets).toBe(2);
    expect(res.body.urgent.urgentSupport.length).toBeGreaterThanOrEqual(1);
    expect(res.body.kpis.openTickets).toBe(2);
  });

  it("applique le filtre status et restaurantId", async () => {
    const { client, driver } = await setupOps();
    await makeOrder({ clientId: client.id, driverId: driver.id, status: "preparing" });
    await makeOrder({ clientId: client.id, driverId: driver.id, status: "delivered" });
    const app = buildApp();
    const filtered = await request(app)
      .get("/api/admin/operations?status=preparing&restaurantId=1")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.appliedFilters).toMatchObject({
      status: "preparing", restaurantId: 1,
    });
    expect(filtered.body.live.activeOrders).toBe(1);
  });

  it("calcule le temps moyen de livraison sur la période et le taux d'annulation", async () => {
    const { client, driver } = await setupOps();
    // 1 livrée en 30 min
    const delivered = await makeOrder({
      clientId: client.id, driverId: driver.id, status: "delivered",
    });
    await memoryStorage.updateOrder(delivered.id, {
      createdAt: new Date(Date.now() - 60 * 60_000),
      deliveredAt: new Date(Date.now() - 30 * 60_000),
    } as any);
    // 1 annulée
    await makeOrder({ clientId: client.id, status: "cancelled" });

    const app = buildApp();
    const res = await request(app)
      .get("/api/admin/operations?period=today")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(res.body.kpis.avgDeliveryMinutes).toBe(30);
    // 1 cancelled / 2 total = 50%
    expect(res.body.kpis.cancelRate).toBe(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 4 — Tracking live livreur
// ─────────────────────────────────────────────────────────────────────────────
describe("PARTIE 4 — tracking live livreur", () => {
  async function makeAssignedOrder(clientId: number, driverId: number) {
    return memoryStorage.createOrder({
      orderNumber: `MTRK${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
      clientId,
      restaurantId: 1,
      driverId,
      status: "picked_up",
      items: [{ name: "Poulet", price: 12, quantity: 1 }],
      subtotal: 12,
      deliveryFee: 1.5,
      commission: 2,
      total: 15.5,
      paymentMethod: "cash",
      paymentStatus: "pending",
      deliveryAddress: "10 av. Lumumba, Gombe, Kinshasa",
      deliveryLat: -4.32,
      deliveryLng: 15.31,
      taxAmount: 0,
      promoDiscount: 0,
      driverAccepted: true,
      loyaltyPointsAwarded: false,
      loyaltyCreditDiscount: 0,
    });
  }

  it("POST /api/driver/location refuse un client (rôle non livreur)", async () => {
    await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/driver/location")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ latitude: -4.32, longitude: 15.31 });
    expect(res.status).toBe(403);
  });

  it("POST /api/driver/location enregistre un ping sans orderId", async () => {
    const driver = await seedDriver();
    const app = buildApp();
    const res = await request(app)
      .post("/api/driver/location")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`)
      .send({ latitude: -4.32, longitude: 15.31, heading: 90, speed: 18 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const last = await memoryStorage.getLatestDriverLocation(driver.id);
    expect(last?.latitude).toBe(-4.32);
    expect(last?.longitude).toBe(15.31);
  });

  it("POST /api/driver/location refuse une commande non assignée au livreur", async () => {
    const client = await seedClient();
    const driver = await seedDriver();
    // commande assignée à personne (driverId null)
    const order = await makeAssignedOrder(client.id, driver.id);
    await memoryStorage.updateOrder(order.id, { driverId: null } as any);
    const app = buildApp();
    const res = await request(app)
      .post("/api/driver/location")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`)
      .send({ latitude: -4.32, longitude: 15.31, orderId: order.id });
    expect(res.status).toBe(403);
  });

  it("POST /api/driver/location accepte la commande assignée et calcule un ETA broadcasté", async () => {
    const client = await seedClient();
    const driver = await seedDriver();
    const order = await makeAssignedOrder(client.id, driver.id);
    const app = buildApp();
    const res = await request(app)
      .post("/api/driver/location")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`)
      .send({ latitude: -4.33, longitude: 15.32, orderId: order.id });
    expect(res.status).toBe(200);
    const stored = await memoryStorage.getLatestDriverLocationForOrder(order.id);
    expect(stored?.driverId).toBe(driver.id);
    // users.lat/lng mis à jour aussi pour rester compatible avec la carte admin
    const updated = await memoryStorage.getUser(driver.id);
    expect(updated?.lat).toBe(-4.33);
    expect(updated?.lng).toBe(15.32);
  });

  it("GET /api/orders/:id/tracking refuse un autre client", async () => {
    const owner = await seedClient();
    const driver = await seedDriver();
    const order = await makeAssignedOrder(owner.id, driver.id);
    // un autre client (avec un token différent)
    const hashed = await bcrypt.hash("secret123", 4);
    const intruder = await memoryStorage.createUser({
      email: "intruder@x.com",
      phone: "+243999000000",
      name: "Intruder",
      password: hashed,
      role: "client",
      authToken: "test-token-intruder",
      walletBalance: 0,
      isOnline: false,
      isBlocked: false,
    });
    expect(intruder.id).not.toBe(owner.id);
    const app = buildApp();
    const res = await request(app)
      .get(`/api/orders/${order.id}/tracking`)
      .set("Authorization", `Bearer test-token-intruder`);
    expect(res.status).toBe(403);
  });

  it("GET /api/orders/:id/tracking renvoie statut, position, ETA et infos livreur au client propriétaire", async () => {
    const client = await seedClient();
    const driver = await seedDriver();
    const order = await makeAssignedOrder(client.id, driver.id);
    await memoryStorage.recordDriverLocation({
      driverId: driver.id,
      orderId: order.id,
      latitude: -4.33,
      longitude: 15.32,
      heading: 45,
      speed: 20,
      accuracy: 10,
      batteryLevel: 75,
      recordedAt: new Date(),
    });
    const app = buildApp();
    const res = await request(app)
      .get(`/api/orders/${order.id}/tracking`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe(order.id);
    expect(res.body.status).toBe("picked_up");
    expect(res.body.driverLocation).toMatchObject({ latitude: -4.33, longitude: 15.32 });
    expect(res.body.driver).toMatchObject({ id: driver.id, name: "Driver", phone: "+243999333444" });
    // pas de fuite de credentials
    expect(res.body.driver).not.toHaveProperty("password");
    expect(res.body.driver).not.toHaveProperty("authToken");
    expect(res.body.eta).not.toBeNull();
    expect(typeof res.body.eta.minutes).toBe("number");
    expect(typeof res.body.eta.distanceKm).toBe("number");
    expect(res.body.eta.arrivalAt).toBeTruthy();
    expect(typeof res.body.statusText).toBe("string");
    expect(res.body.channels.canCall).toBe(true);
    expect(res.body.channels.canChat).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 5 — Support Center (création, conversation, refund idempotent, admin)
// ─────────────────────────────────────────────────────────────────────────────

describe("PARTIE 5 — Support Center", () => {
  beforeEach(() => memoryStorage.reset());

  async function trio() {
    const admin = await seedAdmin();
    const client = await seedClient();
    const driver = await seedDriver();
    await seedRestaurant();
    return { admin, client, driver };
  }

  async function makeOrder(clientId: number, driverId: number) {
    return memoryStorage.createOrder({
      orderNumber: `M${String(8000 + Math.floor(Math.random() * 999)).padStart(8, "0")}`,
      clientId,
      restaurantId: 1,
      driverId,
      status: "delivered",
      deliveredAt: new Date(Date.now() - 60 * 60 * 1000),
      items: [{ name: "x", price: 1, quantity: 1 }],
      subtotal: 10,
      deliveryFee: 1.5,
      commission: 2,
      total: 11.5,
      paymentMethod: "cash",
      paymentStatus: "paid",
      deliveryAddress: "Gombe",
      taxAmount: 0,
      promoDiscount: 0,
      driverAccepted: true,
      loyaltyPointsAwarded: false,
      loyaltyCreditDiscount: 0,
    });
  }

  it("crée un ticket avec catégorie/title/description et génère un ticketNumber + 1er message", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();

    const res = await request(app)
      .post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({
        orderId: order.id,
        category: "missing_item",
        title: "Plat manquant",
        description: "Il manque le riz dans ma commande",
        requestedRefundAmount: 3,
        priority: "high",
      });

    expect(res.status).toBe(201);
    expect(res.body.ticket).toMatchObject({
      orderId: order.id,
      userId: client.id,
      category: "missing_item",
      title: "Plat manquant",
      status: "open",
      priority: "high",
      requestedRefundAmount: 3,
    });
    expect(res.body.ticket.ticketNumber).toMatch(/^TKT-\d{6}$/);

    const msgsRes = await request(app)
      .get(`/api/support/tickets/${res.body.ticket.id}/messages`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(msgsRes.status).toBe(200);
    expect(msgsRes.body).toHaveLength(1);
    expect(msgsRes.body[0].message).toBe("Il manque le riz dans ma commande");
  });

  it("rejette un payload moderne invalide (catégorie inconnue)", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();
    const res = await request(app)
      .post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id, category: "alien", title: "Probleme", description: "Bonjour, j ai un souci" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("autorise un ticket sans orderId (problème général)", async () => {
    const { client } = await trio();
    const app = buildApp();
    const res = await request(app)
      .post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({
        category: "payment_problem",
        title: "Recharge bloquée",
        description: "Mon top-up n'apparaît pas dans le wallet",
      });
    expect(res.status).toBe(201);
    expect(res.body.ticket.orderId).toBeNull();
    expect(res.body.ticket.userId).toBe(client.id);
  });

  it("client peut envoyer/lire des messages, admin reçoit notification", async () => {
    const { admin, client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();

    const create = await request(app)
      .post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id, category: "other", title: "Souci", description: "Bonjour" });
    const ticketId = create.body.ticket.id;

    // Admin répond → ticket bascule en "waiting_customer"
    const adminMsg = await request(app)
      .post(`/api/support/tickets/${ticketId}/messages`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ message: "Bonjour, nous regardons votre dossier." });
    expect(adminMsg.status).toBe(201);

    const t1 = await request(app)
      .get(`/api/support/tickets/${ticketId}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(t1.body.status).toBe("waiting_customer");

    // Client répond → bascule en "in_review"
    const cliMsg = await request(app)
      .post(`/api/support/tickets/${ticketId}/messages`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ message: "Merci pour le retour" });
    expect(cliMsg.status).toBe(201);

    const t2 = await request(app)
      .get(`/api/support/tickets/${ticketId}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(t2.body.status).toBe("in_review");

    // L'admin a reçu une notification persistante pour la réponse du client
    const adminNotifs = memoryStorage.notifications.filter(n => n.userId === admin.id && n.type === "support");
    expect(adminNotifs.length).toBeGreaterThanOrEqual(2); // ouverture + réponse client

    // Le client a reçu la notif de la réponse admin
    const clientNotifs = memoryStorage.notifications.filter(n => n.userId === client.id && n.type === "support");
    expect(clientNotifs.length).toBeGreaterThanOrEqual(1);
  });

  it("admin peut filtrer la liste par status/priority/category", async () => {
    const { admin, client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();

    await request(app).post("/api/support/tickets").set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id, category: "missing_item", title: "Probleme A", description: "Description A complete", priority: "urgent" });
    await request(app).post("/api/support/tickets").set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ category: "payment_problem", title: "Probleme B", description: "Description B complete", priority: "low" });

    const r1 = await request(app)
      .get("/api/support/tickets?priority=urgent")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(r1.status).toBe(200);
    expect(r1.body).toHaveLength(1);
    expect(r1.body[0].category).toBe("missing_item");

    const r2 = await request(app)
      .get("/api/support/tickets?category=payment_problem")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(r2.body).toHaveLength(1);
    expect(r2.body[0].title).toBe("Probleme B");

    const r3 = await request(app)
      .get("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(r3.body).toHaveLength(2);
    void admin;
  });

  it("admin peut s'assigner un ticket et notifier le changement de statut", async () => {
    const { admin, client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();
    const create = await request(app).post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id, category: "other", title: "Probleme", description: "Bonjour, j ai un souci" });
    const id = create.body.ticket.id;

    const patch = await request(app)
      .patch(`/api/support/tickets/${id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ status: "in_review", assignedAdminId: admin.id });
    expect(patch.status).toBe(200);
    expect(patch.body.status).toBe("in_review");
    expect(patch.body.assignedAdminId).toBe(admin.id);

    const notifs = memoryStorage.notifications.filter(n => n.userId === client.id && n.type === "support");
    expect(notifs.find(n => n.message?.includes("in_review"))).toBeTruthy();
  });

  it("approbation d'un remboursement crédite le wallet et marque le ticket résolu", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();

    const balanceBefore = (await memoryStorage.getUser(client.id))!.walletBalance ?? 0;

    const create = await request(app).post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id, category: "missing_item", title: "Probleme", description: "Bonjour, j ai un souci", requestedRefundAmount: 4 });
    const id = create.body.ticket.id;

    const refund = await request(app)
      .post(`/api/support/tickets/${id}/refund`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ amount: 4, note: "Compensation accord" });
    expect(refund.status).toBe(200);
    expect(refund.body.refundAmount).toBe(4);
    expect(refund.body.ticket.status).toBe("resolved");
    expect(refund.body.ticket.approvedRefundAmount).toBe(4);
    expect(refund.body.newBalance).toBe(balanceBefore + 4);

    // Wallet effectivement mis à jour
    const after = await memoryStorage.getUser(client.id);
    expect(after!.walletBalance).toBe(balanceBefore + 4);

    // Une seule transaction wallet créée, avec la bonne référence
    const txns = memoryStorage.walletTxns.filter(t => t.reference === `support_ticket:${id}`);
    expect(txns).toHaveLength(1);
    expect(txns[0].amount).toBe(4);
    expect(txns[0].type).toBe("refund");
    expect(txns[0].orderId).toBe(order.id);
  });

  it("remboursement idempotent : rejette un second appel et ne crédite pas deux fois", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();
    const before = (await memoryStorage.getUser(client.id))!.walletBalance ?? 0;

    const create = await request(app).post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id, category: "missing_item", title: "Probleme", description: "Bonjour, j ai un souci" });
    const id = create.body.ticket.id;

    const r1 = await request(app).post(`/api/support/tickets/${id}/refund`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`).send({ amount: 5 });
    expect(r1.status).toBe(200);

    const r2 = await request(app).post(`/api/support/tickets/${id}/refund`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`).send({ amount: 5 });
    expect(r2.status).toBe(409);
    expect(r2.body.message).toMatch(/déjà approuvé/i);

    const after = (await memoryStorage.getUser(client.id))!.walletBalance ?? 0;
    expect(after).toBe(before + 5); // pas + 10
    const txns = memoryStorage.walletTxns.filter(t => t.reference === `support_ticket:${id}`);
    expect(txns).toHaveLength(1);
  });

  it("rejet d'un ticket : motif obligatoire, statut rejected, notif client", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();

    const create = await request(app).post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id, category: "other", title: "Probleme", description: "Bonjour, j ai un souci" });
    const id = create.body.ticket.id;

    const noReason = await request(app).post(`/api/support/tickets/${id}/reject`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`).send({});
    expect(noReason.status).toBe(400);

    const ok = await request(app).post(`/api/support/tickets/${id}/reject`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ reason: "Pas éligible : article consommé" });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe("rejected");
    expect(ok.body.resolutionNote).toMatch(/Pas éligible/);

    // Pas de remboursement dans le wallet
    const txns = memoryStorage.walletTxns.filter(t => t.reference === `support_ticket:${id}`);
    expect(txns).toHaveLength(0);

    // Ne peut plus envoyer de message
    const cant = await request(app).post(`/api/support/tickets/${id}/messages`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`).send({ message: "et là ?" });
    expect(cant.status).toBe(409);
  });

  it("résolution sans remboursement passe le statut à 'resolved'", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();
    const create = await request(app).post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id, category: "other", title: "Probleme", description: "Bonjour, j ai un souci" });
    const id = create.body.ticket.id;

    const r = await request(app).post(`/api/support/tickets/${id}/resolve`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ note: "Résolu par téléphone" });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("resolved");
    expect(r.body.resolutionNote).toBe("Résolu par téléphone");
    expect(r.body.approvedRefundAmount).toBeNull();
  });

  it("non-admin ne peut pas accéder à la liste admin ni rembourser", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();
    const create = await request(app).post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id, category: "other", title: "Probleme", description: "Bonjour, j ai un souci" });
    const id = create.body.ticket.id;

    const list = await request(app).get("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(list.status).toBe(403);

    const refund = await request(app).post(`/api/support/tickets/${id}/refund`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`).send({ amount: 1 });
    expect(refund.status).toBe(403);
  });

  it("/mine ne renvoie que les tickets du user et bloque l'accès à un ticket d'autrui", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();
    await request(app).post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id, category: "other", title: "Probleme", description: "Bonjour, j ai un souci" });

    // Crée un autre client
    const bcrypt = await import("bcryptjs");
    const hashed = await bcrypt.hash("secret123", 4);
    const other = await memoryStorage.createUser({
      email: "other@example.com", phone: "+243777666555", name: "Other",
      password: hashed, role: "client", walletBalance: 0,
      isOnline: false, isBlocked: false, authToken: "other-token",
    });
    void other;

    const mine = await request(app).get("/api/support/tickets/mine")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(mine.status).toBe(200);
    expect(mine.body).toHaveLength(1);

    const empty = await request(app).get("/api/support/tickets/mine")
      .set("Authorization", `Bearer other-token`);
    expect(empty.body).toHaveLength(0);

    const ticketId = mine.body[0].id;
    const cross = await request(app).get(`/api/support/tickets/${ticketId}`)
      .set("Authorization", `Bearer other-token`);
    expect(cross.status).toBe(403);
  });

  it("rétro-compat : l'ancien payload {orderId,message} fonctionne et reste idempotent", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();
    const r1 = await request(app).post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id, message: "Le repas était froid" });
    expect(r1.status).toBe(201);
    expect(r1.body.ticket.category).toBe("other");
    expect(r1.body.ticket.description).toBe("Le repas était froid");

    const r2 = await request(app).post("/api/support/tickets")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ orderId: order.id });
    expect(r2.status).toBe(200);
    expect(r2.body.alreadyOpen).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 6 — Système d'avis et notes (type Uber Eats)
// ─────────────────────────────────────────────────────────────────────────────

describe("PARTIE 6 — Reviews", () => {
  beforeEach(() => memoryStorage.reset());

  async function trio() {
    const admin = await seedAdmin();
    const client = await seedClient();
    const driver = await seedDriver();
    await seedRestaurant();
    return { admin, client, driver };
  }

  async function makeOrder(
    clientId: number,
    driverId: number,
    overrides: Partial<{ status: string; deliveredAt: Date | null; restaurantId: number }> = {},
  ) {
    return memoryStorage.createOrder({
      orderNumber: `M${String(9000 + Math.floor(Math.random() * 999)).padStart(8, "0")}`,
      clientId,
      restaurantId: overrides.restaurantId ?? 1,
      driverId,
      status: overrides.status ?? "delivered",
      deliveredAt: overrides.deliveredAt === undefined ? new Date(Date.now() - 60 * 1000) : overrides.deliveredAt,
      items: [{ name: "x", price: 1, quantity: 1 }],
      subtotal: 10,
      deliveryFee: 1.5,
      commission: 2,
      total: 11.5,
      paymentMethod: "cash",
      paymentStatus: "paid",
      deliveryAddress: "Gombe",
      taxAmount: 0,
      promoDiscount: 0,
      driverAccepted: true,
      loyaltyPointsAwarded: false,
      loyaltyCreditDiscount: 0,
    });
  }

  it("client peut noter une commande livrée (restaurant + livreur + tags)", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();

    const res = await request(app)
      .post(`/api/orders/${order.id}/review`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ restaurantRating: 5, driverRating: 4, comment: "Top !", tags: ["rapide", "poli"] });

    expect(res.status).toBe(201);
    expect(res.body.review).toMatchObject({
      orderId: order.id,
      userId: client.id,
      restaurantRating: 5,
      driverRating: 4,
      comment: "Top !",
    });
    expect(res.body.review.tags).toEqual(["rapide", "poli"]);
  });

  it("refuse un second avis sur la même commande (orderId UNIQUE)", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();

    const r1 = await request(app)
      .post(`/api/orders/${order.id}/review`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ restaurantRating: 5 });
    expect(r1.status).toBe(201);

    const r2 = await request(app)
      .post(`/api/orders/${order.id}/review`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ restaurantRating: 4 });
    expect(r2.status).toBe(409);
  });

  it("refuse un avis sur une commande non livrée", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id, { status: "preparing", deliveredAt: null });
    const app = buildApp();

    const res = await request(app)
      .post(`/api/orders/${order.id}/review`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ restaurantRating: 5 });
    expect(res.status).toBe(409);
  });

  it("refuse un avis si l'utilisateur n'est pas le propriétaire de la commande", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const other = await memoryStorage.createUser({
      email: "bob@x.com", phone: "+243888", name: "Bob",
      password: "x", role: "client", isBlocked: false, authToken: "tok-bob",
    });
    void other;
    const app = buildApp();

    const res = await request(app)
      .post(`/api/orders/${order.id}/review`)
      .set("Authorization", `Bearer tok-bob`)
      .send({ restaurantRating: 5 });
    expect(res.status).toBe(403);
  });

  it("refuse un payload sans aucune note (refine validateur)", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();
    const res = await request(app)
      .post(`/api/orders/${order.id}/review`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ comment: "rien à dire" });
    expect(res.status).toBe(422);
  });

  it("calcule la moyenne restaurant et la moyenne livreur", async () => {
    const { client, driver } = await trio();
    const o1 = await makeOrder(client.id, driver.id);
    const o2 = await makeOrder(client.id, driver.id);
    const o3 = await makeOrder(client.id, driver.id);
    const app = buildApp();

    for (const [order, rr, dr] of [
      [o1, 5, 4],
      [o2, 3, 5],
      [o3, 4, 3],
    ] as const) {
      const r = await request(app)
        .post(`/api/orders/${order.id}/review`)
        .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
        .send({ restaurantRating: rr, driverRating: dr });
      expect(r.status).toBe(201);
    }

    const restoSummary = await request(app).get("/api/restaurants/1/rating-summary");
    expect(restoSummary.status).toBe(200);
    expect(restoSummary.body.count).toBe(3);
    expect(restoSummary.body.average).toBeCloseTo(4, 1);

    const driverSummary = await request(app).get(`/api/drivers/${driver.id}/rating-summary`);
    expect(driverSummary.status).toBe(200);
    expect(driverSummary.body.count).toBe(3);
    expect(driverSummary.body.average).toBeCloseTo(4, 1);
  });

  it("admin peut lister les avis et signaler les notes faibles", async () => {
    const { client, driver } = await trio();
    for (let i = 0; i < 3; i++) {
      const o = await makeOrder(client.id, driver.id);
      const app = buildApp();
      await request(app)
        .post(`/api/orders/${o.id}/review`)
        .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
        .send({ restaurantRating: 2, driverRating: 1 });
    }
    const app = buildApp();
    const list = await request(app).get("/api/reviews")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBe(3);

    const low = await request(app).get("/api/reviews/low-rated")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(low.status).toBe(200);
    expect(low.body.restaurants?.length ?? 0).toBeGreaterThan(0);
    expect(low.body.drivers?.length ?? 0).toBeGreaterThan(0);
  });

  it("ACL admin : un client ne peut pas accéder à /api/reviews", async () => {
    await trio();
    const app = buildApp();
    const res = await request(app).get("/api/reviews")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`);
    expect(res.status).toBe(403);
  });

  it("livreur reçoit son feedback anonymisé (sans email/téléphone du client)", async () => {
    const { client, driver } = await trio();
    const order = await makeOrder(client.id, driver.id);
    const app = buildApp();
    await request(app)
      .post(`/api/orders/${order.id}/review`)
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({
        driverRating: 5,
        comment: `Bravo ! Contactez-moi alice@example.com ou +243999111222`,
        tags: ["poli", "rapide"],
      });

    const res = await request(app).get("/api/drivers/me/feedback")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`);
    expect(res.status).toBe(200);
    expect(res.body.summary.count).toBe(1);
    expect(res.body.summary.average).toBe(5);
    expect(res.body.recentComments).toHaveLength(1);
    const r = res.body.recentComments[0];
    expect(r.comment).not.toContain("alice@example.com");
    expect(r.comment).not.toContain("+243999111222");
    expect(r.userName).toBeUndefined();
    expect(r.userEmail).toBeUndefined();
    expect(res.body.tagCounts).toBeTruthy();
    expect(res.body.ratingHistogram).toBeTruthy();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 8 — Tests automatisés notif/push/chat (refonte 2026-04)
// ──────────────────────────────────────────────────────────────────────────────

describe("Section 8.1 — Client → Driver : chat_message + notif DB + push + admin silencieux", () => {
  beforeEach(() => memoryStorage.reset());

  async function trio() {
    const admin = await seedAdmin();
    const client = await seedClient();
    const driver = await seedDriver();
    await seedRestaurant();
    return { admin, client, driver };
  }

  async function activeOrder(clientId: number, driverId: number) {
    return memoryStorage.createOrder({
      orderNumber: `M${String(800 + Math.floor(Math.random() * 999)).padStart(8, "0")}`,
      clientId, restaurantId: 1, driverId, status: "in_delivery",
      items: [{ name: "x", price: 1, quantity: 1 }],
      subtotal: 10, deliveryFee: 1.5, commission: 2, total: 11.5,
      paymentMethod: "cash", paymentStatus: "pending",
      deliveryAddress: "Gombe", taxAmount: 0, promoDiscount: 0,
      driverAccepted: true, loyaltyPointsAwarded: false, loyaltyCreditDiscount: 0,
    });
  }

  it("envoie un WS chat_message au driver, crée une notif DB ciblée, push avec eventType chat:new_message, et l'admin reçoit du admin_chat_preview silent (pas de chat_message)", async () => {
    const { admin, client, driver } = await trio();
    const order = await activeOrder(client.id, driver.id);
    // Token push driver pour que le mock renvoie "sent"
    await memoryStorage.upsertPushToken({
      userId: driver.id, token: "tok-driver-1", platform: "android",
    });

    const app = buildApp();
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ senderId: client.id, receiverId: driver.id, message: "Où es-tu ?" });
    expect(res.status).toBe(200);

    // (a) WS chat_message envoyé au driver
    const chatMsgToDriver = wsCalls.list.find(
      c => c.userId === driver.id && c.data?.type === "chat_message",
    );
    expect(chatMsgToDriver).toBeTruthy();
    expect(chatMsgToDriver!.data?.message?.message).toBe("Où es-tu ?");

    // (b) notification DB persistée pour userId=driverId
    const driverNotifs = await memoryStorage.getNotifications(driver.id);
    const chatNotif = driverNotifs.find(n => n.type === "chat");
    expect(chatNotif).toBeTruthy();
    expect((chatNotif as any).data?.orderId).toBe(order.id);
    expect((chatNotif as any).data?.eventType).toBe("chat:new_message");
    expect((chatNotif as any).data?.deepLink).toBe(`/driver/chat/order/${order.id}`);

    // (c) push payload avec eventType chat:new_message
    const pushToDriver = pushCalls.list.find(p => p.userId === driver.id);
    expect(pushToDriver).toBeTruthy();
    expect(pushToDriver!.payload?.data?.eventType).toBe("chat:new_message");
    expect(pushToDriver!.payload?.data?.type).toBe("chat");
    expect(pushToDriver!.payload?.data?.orderId).toBe(String(order.id));

    // (d) le dashboard admin NE reçoit PAS de chat_message sonore.
    //     Il reçoit un admin_chat_preview avec silent=true.
    const adminChatMsg = wsCalls.list.find(
      c => c.userId === admin.id && c.data?.type === "chat_message",
    );
    expect(adminChatMsg).toBeUndefined();
    const adminPreview = wsCalls.list.find(
      c => c.userId === admin.id && c.data?.type === "admin_chat_preview",
    );
    expect(adminPreview).toBeTruthy();
    expect(adminPreview!.data?.silent).toBe(true);
  });
});

describe("Section 8.2 — Driver → Client : chat_message + notif DB + push avec orderId + deepLink client", () => {
  beforeEach(() => memoryStorage.reset());

  async function trio() {
    const admin = await seedAdmin();
    const client = await seedClient();
    const driver = await seedDriver();
    await seedRestaurant();
    return { admin, client, driver };
  }

  async function activeOrder(clientId: number, driverId: number) {
    return memoryStorage.createOrder({
      orderNumber: `M${String(700 + Math.floor(Math.random() * 999)).padStart(8, "0")}`,
      clientId, restaurantId: 1, driverId, status: "in_delivery",
      items: [{ name: "x", price: 1, quantity: 1 }],
      subtotal: 10, deliveryFee: 1.5, commission: 2, total: 11.5,
      paymentMethod: "cash", paymentStatus: "pending",
      deliveryAddress: "Gombe", taxAmount: 0, promoDiscount: 0,
      driverAccepted: true, loyaltyPointsAwarded: false, loyaltyCreditDiscount: 0,
    });
  }

  it("envoie un WS chat_message au client, notif DB userId=clientId, push porte orderId et deepLink /chat/order/:id", async () => {
    const { client, driver } = await trio();
    const order = await activeOrder(client.id, driver.id);
    await memoryStorage.upsertPushToken({
      userId: client.id, token: "tok-client-1", platform: "ios",
    });

    const app = buildApp();
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`)
      .send({ senderId: driver.id, receiverId: client.id, message: "J'arrive dans 5 min" });
    expect(res.status).toBe(200);

    // (a) WS chat_message au client
    const chatMsgToClient = wsCalls.list.find(
      c => c.userId === client.id && c.data?.type === "chat_message",
    );
    expect(chatMsgToClient).toBeTruthy();

    // (b) notif DB persistée pour userId=clientId
    const clientNotifs = await memoryStorage.getNotifications(client.id);
    const chatNotif = clientNotifs.find(n => n.type === "chat");
    expect(chatNotif).toBeTruthy();
    expect((chatNotif as any).userId).toBe(client.id);
    expect((chatNotif as any).data?.orderId).toBe(order.id);

    // (c) push payload avec orderId + deepLink correct côté client
    const pushToClient = pushCalls.list.find(p => p.userId === client.id);
    expect(pushToClient).toBeTruthy();
    expect(pushToClient!.payload?.data?.orderId).toBe(String(order.id));
    expect(pushToClient!.payload?.data?.deepLink).toBe(`/chat/order/${order.id}`);
    // Important : NE doit PAS pointer vers /tracking pour un message chat
    expect(pushToClient!.payload?.data?.deepLink).not.toMatch(/^\/tracking\//);
  });
});

describe("Section 8.3 — Admin preview : silent + pas de sonnerie globale", () => {
  beforeEach(() => memoryStorage.reset());

  it("le fanout vers l'admin pour un chat client↔driver est admin_chat_preview avec silent=true (pas de chat_message)", async () => {
    const admin = await seedAdmin();
    const client = await seedClient();
    const driver = await seedDriver();
    await seedRestaurant();
    await memoryStorage.createOrder({
      orderNumber: "M00099001", clientId: client.id, restaurantId: 1, driverId: driver.id,
      status: "in_delivery",
      items: [{ name: "x", price: 1, quantity: 1 }],
      subtotal: 10, deliveryFee: 1.5, commission: 2, total: 11.5,
      paymentMethod: "cash", paymentStatus: "pending",
      deliveryAddress: "Gombe", taxAmount: 0, promoDiscount: 0,
      driverAccepted: true, loyaltyPointsAwarded: false, loyaltyCreditDiscount: 0,
    });

    const app = buildApp();
    await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${TOKEN_DRIVER}`)
      .send({ senderId: driver.id, receiverId: client.id, message: "Hello" });

    const adminPreviews = wsCalls.list.filter(
      c => c.userId === admin.id && c.data?.type === "admin_chat_preview",
    );
    expect(adminPreviews.length).toBeGreaterThan(0);
    expect(adminPreviews[0].data?.silent).toBe(true);
    expect(adminPreviews[0].data?.meta?.adminPreview).toBe(true);

    // Aucun chat_message envoyé à l'admin (rien qui ferait sonner le Dashboard)
    const adminChatMsgs = wsCalls.list.filter(
      c => c.userId === admin.id && c.data?.type === "chat_message",
    );
    expect(adminChatMsgs).toHaveLength(0);

    // Pas de notif DB de type "chat" pour l'admin
    const adminNotifs = await memoryStorage.getNotifications(admin.id);
    expect(adminNotifs.find(n => n.type === "chat")).toBeUndefined();
  });
});

describe("Section 8.4 — Push tokens : multi-device + logout single-device", () => {
  beforeEach(() => memoryStorage.reset());

  it("register-token crée la ligne push_tokens", async () => {
    const u = await seedClient();
    const app = buildApp();
    const res = await request(app)
      .post("/api/push/register-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ token: "fcm-A", platform: "android", deviceId: "dev-A" });
    expect(res.status).toBe(200);
    const rows = memoryStorage.pushTokens.filter(t => t.userId === u.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].token).toBe("fcm-A");
    expect(rows[0].isActive).toBe(true);
  });

  it("plusieurs tokens par user restent actifs simultanément (Android + iOS + Web)", async () => {
    const u = await seedClient();
    const app = buildApp();
    await request(app).post("/api/push/register-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ token: "fcm-A", platform: "android", deviceId: "dev-A" });
    await request(app).post("/api/push/register-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ token: "fcm-I", platform: "ios", deviceId: "dev-I" });
    await request(app).post("/api/push/register-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ token: "fcm-W", platform: "web", deviceId: "dev-W" });

    const active = await memoryStorage.getActivePushTokensByUser(u.id);
    expect(active).toHaveLength(3);
    expect(active.every(t => t.isActive)).toBe(true);
    expect(active.map(t => t.token).sort()).toEqual(["fcm-A", "fcm-I", "fcm-W"]);
  });

  it("logout d'un appareil : unregister-token avec token précis ne désactive QUE ce token", async () => {
    const u = await seedClient();
    const app = buildApp();
    await memoryStorage.upsertPushToken({ userId: u.id, token: "tok-keep-1", platform: "android" });
    await memoryStorage.upsertPushToken({ userId: u.id, token: "tok-keep-2", platform: "ios" });
    await memoryStorage.upsertPushToken({ userId: u.id, token: "tok-bye", platform: "web" });

    const res = await request(app)
      .post("/api/push/unregister-token")
      .set("Authorization", `Bearer ${TOKEN_CLIENT}`)
      .send({ token: "tok-bye" });
    expect(res.status).toBe(200);

    const active = await memoryStorage.getActivePushTokensByUser(u.id);
    expect(active.map(t => t.token).sort()).toEqual(["tok-keep-1", "tok-keep-2"]);
    // Le token retiré existe encore en DB mais avec isActive=false
    const all = memoryStorage.pushTokens.filter(t => t.token === "tok-bye");
    expect(all).toHaveLength(1);
    expect(all[0].isActive).toBe(false);
  });
});

describe("Section 8.5 — Admin GET /api/admin/push/debug : no-token / no-firebase / sentCount > 0", () => {
  beforeEach(() => memoryStorage.reset());

  it("renvoie 0 tokens et firebaseConfigured=true quand l'utilisateur n'a aucun token", async () => {
    await seedAdmin();
    const u = await seedClient();
    pushMockCfg.firebaseConfigured = true;
    const app = buildApp();
    const res = await request(app)
      .get(`/api/admin/push/debug/${u.id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(res.status).toBe(200);
    expect(res.body.activeTokensCount).toBe(0);
    expect(res.body.legacyPushTokenExists).toBe(false);
    expect(res.body.firebaseConfigured).toBe(true);
  });

  it("renvoie firebaseConfigured=false quand Firebase n'est pas configuré (et POST /test renvoie skipped:no-firebase)", async () => {
    await seedAdmin();
    const u = await seedClient();
    await memoryStorage.upsertPushToken({ userId: u.id, token: "tok-x", platform: "android" });
    pushMockCfg.firebaseConfigured = false;
    const app = buildApp();

    const dbg = await request(app)
      .get(`/api/admin/push/debug/${u.id}`)
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`);
    expect(dbg.status).toBe(200);
    expect(dbg.body.firebaseConfigured).toBe(false);
    expect(dbg.body.activeTokensCount).toBe(1);

    const test = await request(app)
      .post("/api/admin/push/test")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ userId: u.id, title: "T", body: "B" });
    expect(test.status).toBe(200);
    expect(test.body.pushResult?.status).toBe("skipped");
    expect(test.body.pushResult?.skippedReason).toBe("no-firebase");
    expect(test.body.pushResult?.sentCount).toBe(0);
  });

  it("POST /api/admin/push/test : renvoie sentCount > 0 quand un token valide est mocké", async () => {
    await seedAdmin();
    const u = await seedClient();
    await memoryStorage.upsertPushToken({ userId: u.id, token: "tok-valid-1", platform: "android" });
    await memoryStorage.upsertPushToken({ userId: u.id, token: "tok-valid-2", platform: "ios" });
    pushMockCfg.firebaseConfigured = true;
    const app = buildApp();

    const res = await request(app)
      .post("/api/admin/push/test")
      .set("Authorization", `Bearer ${TOKEN_ADMIN}`)
      .send({ userId: u.id, title: "Hello", body: "World" });
    expect(res.status).toBe(200);
    expect(res.body.pushResult?.status).toBe("sent");
    expect(res.body.pushResult?.sentCount).toBe(2);
    expect(res.body.pushResult?.failedCount).toBe(0);
    // Vérifie que sendPushToUser a bien été appelé une seule fois pour ce user
    const callsForUser = pushCalls.list.filter(p => p.userId === u.id);
    expect(callsForUser).toHaveLength(1);
  });
});
