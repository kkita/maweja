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

vi.mock("../server/websocket", () => ({
  setupWebSocket: () => {},
  wsClients: new Map(),
  broadcast: () => {},
  sendToUser: () => {},
}));

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
