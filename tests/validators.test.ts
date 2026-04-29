/**
 * Schema-level tests for every validator exported from server/validators.ts.
 *
 * For each entry in `schemas` we exercise:
 *   - happy path  → a representative valid payload must parse
 *   - reject path → an obviously invalid payload must fail
 *
 * Adding a new schema? Add it to `happyFixtures` and `rejectFixtures` below.
 * The bottom describe block fails fast if a key is missing on either side, so
 * coverage stays in lock-step with the validator surface area.
 */
import { describe, it, expect } from "vitest";
import type { ZodTypeAny, ZodIssue } from "zod";
import { schemas } from "../server/validators";

type Fixture = Record<string, unknown>;
type SafeParseFailure = { success: false; error: { errors: ZodIssue[] } };

// ── Happy fixtures ────────────────────────────────────────────────────────────
const happyFixtures: Record<string, Fixture | unknown> = {
  // Auth
  login: { email: "alice@example.com", password: "secret123" },
  register: { name: "Alice", phone: "+243999111222", password: "secret123", email: "alice@example.com" },
  driverRegister: { identifier: "driver@x.com", password: "secret123", name: "Bob", phone: "+243888111222" },
  forgotPassword: { identifier: "alice@example.com", requestType: "chat" },
  resetPassword: { newPassword: "secret123" },
  driverOnboarding: {
    name: "Bob", sex: "male", dateOfBirth: "1990-01-01",
    fullAddress: "12 av. Kasa-Vubu, Kinshasa", phone: "+243888111222",
    idPhotoUrl: "/cloud/public/uploads/id.png",
    profilePhotoUrl: "/cloud/public/uploads/me.png",
  },
  driverVerify: { action: "approve" },

  // Restaurants & menus
  restaurantCreate: { name: "Chez Maman", address: "12 av. Lumumba", deliveryFee: 2.5 },
  restaurantUpdate: { name: "Chez Maman 2" },
  reorderBody: { order: [{ id: 1, sortOrder: 0 }, { id: 2, sortOrder: 1 }] },
  menuItemCreate: { name: "Poulet braisé", price: 12, restaurantId: 1 },
  menuItemUpdate: { price: 14 },

  // Orders
  orderCreate: {
    restaurantId: 1,
    items: [{ name: "Poulet", price: 12, quantity: 2 }],
    deliveryAddress: "5 av. Kasa-Vubu, Kinshasa",
    paymentMethod: "cash",
    subtotal: 24,
    total: 26.5,
  },
  orderUpdate: { status: "confirmed" },
  orderRemark: { text: "Client a appelé pour modifier l'adresse." },
  orderRate: { rating: 5, comment: "Excellent service" },
  orderStatusOverride: { code: "MAWEJA2025", newStatus: "delivered", reason: "Confirmé par téléphone" },
  orderCancel: { reason: "Client a annulé" },
  orderModify: {
    items: [{ name: "Poulet", price: 12, quantity: 1 }],
    subtotal: 12,
    total: 14.5,
  },

  // Promos
  promoValidate: { code: "WELCOME10", subtotal: 30 },
  promotionCreate: { code: "summer", description: "Promo été", value: 15 },
  promotionUpdate: { value: 20 },

  // Categories
  categoryCreate: { name: "Pizza", icon: "🍕" },
  categoryUpdate: { name: "Pizzas" },
  serviceCategoryCreate: { name: "Plomberie", icon: "Wrench" },
  serviceCategoryUpdate: { name: "Plomberie pro" },
  serviceCatalogCreate: { name: "Réparation fuite", categoryId: 1, price: 25 },
  serviceCatalogUpdate: { price: 30 },

  // Delivery zones
  deliveryZoneCreate: { name: "Zone A", fee: 1.5, neighborhoods: ["Gombe", "Limete"] },
  deliveryZoneUpdate: { fee: 2 },

  // Saved addresses
  savedAddressCreate: { label: "Maison", address: "12 av. Lumumba" },
  savedAddressUpdate: { label: "Bureau" },

  // Drivers
  driverCreate: { name: "Bob", phone: "+243888111222", password: "secret123" },
  driverUpdate: { name: "Bob (modifié)" },
  driverLocation: { lat: -4.32, lng: 15.31 },
  driverLocationPing: { latitude: -4.32, longitude: 15.31, heading: 90, speed: 18, accuracy: 12, batteryLevel: 80, orderId: 5 },
  driverStatus: { isOnline: true },
  driverBlock: { isBlocked: true },

  // Chat
  chatMessage: { senderId: 1, receiverId: 2, message: "Bonjour" },

  // Wallet
  walletTopup: { userId: 1, amount: 25, method: "mobile_money" },

  // Service requests
  serviceRequestCreate: {
    fullName: "Alice", phone: "+243999111222",
    description: "Besoin d'un plombier dès que possible",
  },
  serviceRequestUpdate: { status: "accepted", price: 30 },

  // Ads & banner
  advertisementCreate: { title: "Promo Pâques", mediaUrl: "/cloud/public/uploads/ad.jpg" },
  advertisementUpdate: { title: "Promo de printemps" },
  promoBanner: { title: "Livraison gratuite" },

  // Notifications
  broadcastNotification: { title: "Maintenance", message: "Service indisponible 5 min" },

  // Admin accounts
  adminAccountCreate: {
    name: "Admin Sarah", email: "sarah@maweja.cd", password: "secret123",
    phone: "+243999000111",
  },
  adminAccountUpdate: { name: "Sarah (modifiée)" },
  adminResetResolve: { status: "resolved", adminNote: "Mot de passe réinitialisé." },
  adminSetPassword: { newPassword: "secret123" },

  // Users
  userUpdate: { name: "Alice (mise à jour)" },

  // Finance
  financeCreate: { type: "revenue", category: "order", amount: 25 },
  restaurantPayoutCreate: {
    restaurantId: 1, grossAmount: 100, mawejaCommission: 20, netAmount: 80,
  },

  // Settings
  settingValue: { value: "0.76" },

  // Support tickets (PARTIE 5)
  supportTicketCreate: {
    orderId: 1,
    category: "missing_item",
    title: "Plat manquant",
    description: "Il manque le riz dans ma commande.",
  },
  supportTicketUpdate: { status: "in_review", priority: "high", assignedAdminId: 2 },
  supportTicketRefund: { amount: 5.5, note: "Compensation partielle" },
  supportTicketReject: { reason: "Demande non recevable, fournisseur OK" },
  supportTicketMessage: { message: "Je vous tiens au courant." },

  // Reviews (PARTIE 6)
  reviewCreate: {
    restaurantRating: 5,
    driverRating: 4,
    comment: "Tout était parfait, livreur très poli.",
    tags: ["rapide", "poli"],
  },

  // Params (nested namespace — covered separately below)
  params: undefined,
};

// ── Reject fixtures ───────────────────────────────────────────────────────────
const rejectFixtures: Record<string, Fixture | unknown> = {
  // Required fields missing or invalid types
  login: { email: "", password: "" },
  register: { name: "", phone: "x", password: "1" },
  driverRegister: { identifier: "", password: "1", name: "" },
  forgotPassword: { identifier: "" },
  resetPassword: { newPassword: "1" },
  driverOnboarding: { name: "Bob" },
  driverVerify: { action: "maybe" },

  restaurantCreate: { address: "12 av." }, // missing name
  restaurantUpdate: { rating: 9 },
  reorderBody: { order: [] },
  menuItemCreate: { name: "Poulet", price: -3, restaurantId: 1 },
  menuItemUpdate: { price: "free" },

  orderCreate: {
    restaurantId: 1,
    items: [],
    deliveryAddress: "",
    paymentMethod: "",
    subtotal: -1,
    total: -1,
  },
  orderUpdate: { status: "alien" },
  orderRemark: { text: "" },
  orderRate: { rating: 9 },
  orderStatusOverride: { code: "secret", newStatus: "??" },
  orderCancel: { reason: 123 },
  orderModify: { items: [] },

  promoValidate: { code: "" },
  promotionCreate: { description: "no code" },
  promotionUpdate: { value: "free" },

  categoryCreate: { name: "" },
  categoryUpdate: { sortOrder: "first" },
  serviceCategoryCreate: { name: "" },
  serviceCategoryUpdate: { sortOrder: "x" },
  serviceCatalogCreate: { name: "X", categoryId: -1 },
  serviceCatalogUpdate: { price: -2 },

  deliveryZoneCreate: { name: "", fee: -1 },
  deliveryZoneUpdate: { fee: -5 },

  savedAddressCreate: { label: "" },
  savedAddressUpdate: { lat: "north" },

  driverCreate: { name: "", phone: "x", password: "1" },
  driverUpdate: { phone: "x" },
  driverLocation: { lat: "north" },
  driverLocationPing: { latitude: "north", longitude: null },
  driverStatus: { isOnline: "yes" },
  driverBlock: { isBlocked: "no" },

  chatMessage: { senderId: -1, receiverId: -2 },

  walletTopup: { userId: 0, amount: -10, method: "" },

  serviceRequestCreate: { fullName: "", phone: "", description: "" },
  serviceRequestUpdate: { status: "alien" },

  advertisementCreate: { title: "" },
  advertisementUpdate: { isActive: "yes" },
  promoBanner: { title: 123 },

  broadcastNotification: { title: "", message: "" },

  adminAccountCreate: { name: "X", email: "not-an-email", password: "1", phone: "x" },
  adminAccountUpdate: { phone: "x" },
  adminResetResolve: { status: "alien" },
  adminSetPassword: { newPassword: "1" },

  userUpdate: { phone: "x" },

  financeCreate: { type: "donation", category: "x", amount: -5 },
  restaurantPayoutCreate: { restaurantId: -1, grossAmount: -1, mawejaCommission: -1, netAmount: -1 },

  settingValue: { value: 123 },

  // Support tickets (PARTIE 5)
  supportTicketCreate: { category: "alien", title: "x", description: "y" },
  supportTicketUpdate: { status: "alien" },
  supportTicketRefund: { amount: -1 },
  supportTicketReject: { reason: "" },
  supportTicketMessage: { message: "" },

  // Reviews (PARTIE 6) — aucune note, refusé par .refine()
  reviewCreate: { comment: "Pas de note" },

  params: undefined, // covered separately below
};

// ── Tests ─────────────────────────────────────────────────────────────────────

const NESTED_NAMESPACES = new Set(["params"]);

describe("server/validators — schema coverage", () => {
  const keys = Object.keys(schemas) as (keyof typeof schemas)[];

  it("exposes a non-empty schemas namespace", () => {
    expect(keys.length).toBeGreaterThan(40);
  });

  it("every schema key has both a happy and a reject fixture", () => {
    const missing: string[] = [];
    for (const key of keys) {
      if (NESTED_NAMESPACES.has(key as string)) continue;
      if (!(key in happyFixtures)) missing.push(`happy:${String(key)}`);
      if (!(key in rejectFixtures)) missing.push(`reject:${String(key)}`);
    }
    expect(missing).toEqual([]);
  });

  for (const key of keys) {
    if (NESTED_NAMESPACES.has(key as string)) continue;
    const schema = schemas[key] as unknown as ZodTypeAny;

    describe(`schema: ${String(key)}`, () => {
      it("accepts a valid payload (happy path)", () => {
        const fixture = happyFixtures[key as string];
        const result = schema.safeParse(fixture);
        if (!result.success) {
          // Surface helpful diagnostics when a fixture drifts out of date
          // eslint-disable-next-line no-console
          console.error(
            `[validators] happy failed for ${String(key)}`,
            (result as SafeParseFailure).error.errors,
          );
        }
        expect(result.success).toBe(true);
      });

      it("rejects an obviously invalid payload", () => {
        const fixture = rejectFixtures[key as string];
        const result = schema.safeParse(fixture);
        expect(result.success).toBe(false);
      });
    });
  }
});

// ── params namespace ─────────────────────────────────────────────────────────

describe("server/validators — params namespace", () => {
  const params = schemas.params;

  const cases: Array<{ name: keyof typeof params; ok: unknown; ko: unknown }> = [
    { name: "id", ok: { id: "12" }, ko: { id: "abc" } },
    { name: "userId", ok: { userId: "7" }, ko: { userId: "-1" } },
    { name: "token", ok: { token: "abcdef" }, ko: { token: "" } },
    { name: "driverId", ok: { driverId: "3" }, ko: { driverId: "0" } },
  ];

  for (const c of cases) {
    const sub = params[c.name] as unknown as ZodTypeAny;
    it(`params.${String(c.name)} accepts valid input`, () => {
      expect(sub.safeParse(c.ok).success).toBe(true);
    });
    it(`params.${String(c.name)} rejects invalid input`, () => {
      expect(sub.safeParse(c.ko).success).toBe(false);
    });
  }
});
