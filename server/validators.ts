/**
 * server/validators.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Zod validation for all Express routes.
 *
 * Usage:
 *   import { validate, validateParams, validateQuery, schemas } from "./validators";
 *
 *   app.post("/api/foo", validate(schemas.foo.create), async (req, res) => {
 *     const body = req.body as z.infer<typeof schemas.foo.create>;
 *     // body is guaranteed to match the schema
 *   });
 *
 * Error format (HTTP 422):
 *   { errors: [{ field: "email", message: "Invalid email" }] }
 */

import { z, ZodError, ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";
import { REVIEW_TAGS } from "@shared/schema";

// ── Error helpers ─────────────────────────────────────────────────────────────

/**
 * Convert a ZodError into our standard error array.
 */
function formatZodError(err: ZodError) {
  return err.errors.map((e) => ({
    field: e.path.join(".") || "body",
    message: e.message,
  }));
}

/**
 * Generic 422 response.
 */
function unprocessable(res: Response, errors: { field: string; message: string }[]) {
  return res.status(422).json({ errors });
}

// ── Middleware factories ──────────────────────────────────────────────────────

/**
 * Validate req.body against a Zod schema.
 * On success the parsed (coerced/transformed) value replaces req.body.
 */
export function validate<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return unprocessable(res, formatZodError(result.error));
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validate req.params against a Zod schema.
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ errors: formatZodError(result.error) });
    }
    (req as any).validParams = result.data;
    next();
  };
}

/**
 * Validate req.query against a Zod schema.
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ errors: formatZodError(result.error) });
    }
    (req as any).validQuery = result.data;
    next();
  };
}

// ── Common primitives ─────────────────────────────────────────────────────────

const intId = z.coerce.number().int().positive();
const phone = z.string().min(6, "Numéro de téléphone invalide").max(30);
const emailOpt = z.string().email("Adresse email invalide").optional().or(z.literal("")).transform(v => v || undefined);
const passwordMin = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères");
const urlOpt = z.string().url("URL invalide").optional().or(z.literal("")).transform(v => v || undefined);
const positiveAmount = z.number().positive("Le montant doit être positif");

// ── Common param schemas ──────────────────────────────────────────────────────

export const params = {
  id: z.object({ id: intId }),
  userId: z.object({ userId: intId }),
  token: z.object({ token: z.string().min(1, "Token requis") }),
  driverId: z.object({ driverId: intId }),
};

// ── Domain schemas ────────────────────────────────────────────────────────────

// ─── Auth ────────────────────────────────────────────────────────────────────

const login = z.object({
  email: z.string().min(1, "Email ou téléphone requis"),
  password: z.string().min(1, "Mot de passe requis"),
  expectedRole: z.enum(["client", "driver", "admin"]).optional(),
});

const register = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  phone: phone,
  password: passwordMin,
  email: emailOpt,
  role: z.enum(["client"]).optional(),
  address: z.string().max(300).optional(),
});

const driverRegister = z.object({
  identifier: z.string().min(1, "Email ou téléphone requis"),
  password: passwordMin,
  name: z.string().min(1, "Nom requis").max(100),
  phone: phone.optional(),
  vehicleType: z.string().max(50).optional(),
});

const forgotPassword = z.object({
  identifier: z.string().min(1, "Identifiant requis (email ou téléphone)"),
  requestType: z.enum(["email", "chat"]).default("chat"),
  message: z.string().max(1000).optional(),
  role: z.enum(["client", "driver", "admin"]).optional(),
});

const resetPassword = z.object({
  newPassword: passwordMin,
});

const driverOnboarding = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  sex: z.enum(["male", "female", "other"], { message: "Sexe invalide" }),
  dateOfBirth: z.string().min(1, "Date de naissance requise"),
  fullAddress: z.string().min(1, "Adresse complète requise").max(300),
  phone: phone,
  idPhotoUrl: z.string().min(1, "Photo de la pièce d'identité requise"),
  profilePhotoUrl: z.string().min(1, "Photo de profil requise"),
  idNumber: z.string().max(50).optional(),
});

// ─── Admin Verification ───────────────────────────────────────────────────────

const driverVerify = z.object({
  action: z.enum(["approve", "reject"], { message: "Action invalide : 'approve' ou 'reject'" }),
  rejectedFields: z.array(z.string()).optional(),
});

// ─── Restaurants ─────────────────────────────────────────────────────────────

const restaurantCreate = z.object({
  name: z.string().min(1, "Nom requis").max(150),
  address: z.string().min(1, "Adresse requise").max(300),
  phone: phone.optional(),
  image: z.string().optional(),
  logoUrl: z.string().optional(),
  category: z.string().max(100).optional(),
  deliveryFee: z.coerce.number().nonnegative().optional(),
  minOrder: z.coerce.number().nonnegative().optional(),
  deliveryTime: z.string().max(50).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  isOpen: z.boolean().optional(),
  type: z.enum(["restaurant", "boutique"]).optional(),
  restaurantCommissionRate: z.coerce.number().min(0).max(100).optional(),
}).passthrough();

const restaurantUpdate = restaurantCreate.partial();

const reorderBody = z.object({
  order: z.array(z.object({
    id: intId,
    sortOrder: z.number().int(),
  })).min(1, "Tableau de tri requis"),
});

// ─── Menu items ───────────────────────────────────────────────────────────────

const menuItemCreate = z.object({
  name: z.string().min(1, "Nom requis").max(150),
  price: z.coerce.number().positive("Prix invalide"),
  description: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  restaurantId: intId,
  available: z.boolean().optional().default(true),
  image: z.string().optional(),
}).passthrough();

const menuItemUpdate = menuItemCreate.omit({ restaurantId: true }).partial();

// ─── Orders ───────────────────────────────────────────────────────────────────

const orderItem = z.object({
  id: z.number().optional(),
  menuItemId: z.number().int().positive().optional(),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  options: z.any().optional(),
  notes: z.string().max(300).optional(),
});

const orderCreate = z.object({
  restaurantId: intId,
  items: z.array(orderItem).min(1, "Au moins un article requis"),
  deliveryAddress: z.string().min(1, "Adresse de livraison requise").max(500),
  paymentMethod: z.string().min(1, "Méthode de paiement requise"),
  subtotal: z.coerce.number().nonnegative(),
  total: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative().optional(),
  deliveryFee: z.coerce.number().nonnegative().optional(),
  promoDiscount: z.coerce.number().nonnegative().optional(),
  promoCode: z.string().max(30).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  orderName: z.string().max(100).nullable().optional(),
  orderPhone: z.string().max(30).nullable().optional(),
  loyaltyPointsUsed: z.coerce.number().int().nonnegative().optional(),
  // Admin overrides
  adminOverride: z.boolean().optional(),
  zoneId: z.coerce.number().int().positive().optional(),
  clientId: z.coerce.number().int().positive().optional(),
  commission: z.coerce.number().nonnegative().optional(),
  deliveryZone: z.string().nullable().optional(),
}).passthrough();

const orderUpdate = z.object({
  status: z.enum([
    "pending", "confirmed", "preparing", "ready",
    "picked_up", "delivered", "cancelled", "returned",
  ]).optional(),
  driverId: z.coerce.number().int().positive().nullable().optional(),
  adminNote: z.string().max(1000).optional(),
  cancelReason: z.string().max(500).optional(),
}).passthrough();

const orderRemark = z.object({
  text: z.string().min(1, "Remarque requise").max(1000),
});

const orderRate = z.object({
  rating: z.number().int().min(1).max(5, "Note entre 1 et 5"),
  comment: z.string().max(500).optional(),
  driverRating: z.number().int().min(1).max(5).optional(),
});

const orderStatusOverride = z.object({
  status: z.enum([
    "pending", "confirmed", "preparing", "ready",
    "picked_up", "delivered", "cancelled", "returned",
  ], { message: "Statut invalide" }),
  reason: z.string().max(500).optional(),
});

const orderCancel = z.object({
  reason: z.string().max(500).optional(),
}).optional();

// ─── Promo ────────────────────────────────────────────────────────────────────

const promoValidate = z.object({
  code: z.string().min(1, "Code promo requis").max(30),
  subtotal: z.number().nonnegative().optional(),
  restaurantId: z.number().int().positive().optional(),
});

const promotionCreate = z.object({
  code: z.string().min(1, "Code requis").max(30).transform(v => v.toUpperCase()),
  description: z.string().min(1, "Description requise").max(300),
  type: z.enum(["percent", "fixed", "delivery"]).default("percent"),
  value: z.coerce.number().nonnegative().default(10),
  minOrder: z.coerce.number().nonnegative().default(0),
  maxUses: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional().transform(v => v ? new Date(v) : null),
  restaurantId: z.coerce.number().int().positive().optional().nullable(),
});

const promotionUpdate = promotionCreate.partial();

// ─── Categories (restaurant, boutique, menu-item) ─────────────────────────────

const categoryCreate = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  icon: z.string().max(100).optional(),
  image: z.string().optional(),
  description: z.string().max(300).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
}).passthrough();

const categoryUpdate = categoryCreate.partial();

// ─── Delivery zones ───────────────────────────────────────────────────────────

const deliveryZoneCreate = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  fee: z.coerce.number().nonnegative("Frais invalides"),
  color: z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Couleur hex invalide").optional().default("#3b82f6"),
  neighborhoods: z.array(z.string()).default([]),
  bounds: z.any().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().optional(),
});

const deliveryZoneUpdate = deliveryZoneCreate.partial();

// ─── Saved addresses ─────────────────────────────────────────────────────────

const savedAddressCreate = z.object({
  label: z.string().min(1, "Label requis").max(100),
  address: z.string().min(1, "Adresse requise").max(500),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
});

const savedAddressUpdate = savedAddressCreate.partial();

// ─── Drivers ─────────────────────────────────────────────────────────────────

const driverCreate = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  phone: phone,
  password: passwordMin,
  email: emailOpt,
  vehicleType: z.string().max(50).optional(),
  vehiclePlate: z.string().max(30).optional(),
  driverLicense: z.string().max(50).optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
});

const driverUpdate = driverCreate.omit({ password: true }).partial().extend({
  password: passwordMin.optional(),
});

const driverLocation = z.object({
  lat: z.coerce.number({ message: "Latitude invalide" }),
  lng: z.coerce.number({ message: "Longitude invalide" }),
});

/**
 * Ping de tracking livreur (PARTIE 4) — payload envoyé par
 * POST /api/driver/location pendant une livraison active.
 */
const driverLocationPing = z.object({
  latitude: z.coerce.number({ message: "Latitude invalide" }).min(-90).max(90),
  longitude: z.coerce.number({ message: "Longitude invalide" }).min(-180).max(180),
  heading: z.coerce.number().min(0).max(360).optional().nullable(),
  speed: z.coerce.number().min(0).optional().nullable(),
  accuracy: z.coerce.number().min(0).optional().nullable(),
  batteryLevel: z.coerce.number().int().min(0).max(100).optional().nullable(),
  orderId: z.coerce.number().int().positive().optional().nullable(),
});

const driverStatus = z.object({
  isOnline: z.boolean({ message: "isOnline (boolean) requis" }),
});

const driverBlock = z.object({
  isBlocked: z.boolean({ message: "isBlocked (boolean) requis" }),
});

// ─── Support tickets (PARTIE 5) ───────────────────────────────────────────────

const SUPPORT_CATEGORIES = [
  "order_problem", "missing_item", "late_delivery", "refund_request",
  "payment_problem", "driver_problem", "restaurant_problem", "other",
] as const;
const SUPPORT_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const SUPPORT_STATUSES = ["open", "in_review", "waiting_customer", "resolved", "rejected"] as const;

/**
 * Création d'un ticket support par le client.
 * `orderId` est optionnel (un client peut signaler un problème général
 * sans commande associée). Le titre est court, la description peut être
 * longue. `imageUrl` permet d'attacher une preuve.
 */
const supportTicketCreate = z.object({
  orderId: z.coerce.number().int().positive().optional().nullable(),
  category: z.enum(SUPPORT_CATEGORIES, { message: "Catégorie invalide" }),
  title: z.string().trim().min(3, "Titre trop court").max(160),
  description: z.string().trim().min(5, "Description trop courte").max(4000),
  requestedRefundAmount: z.coerce.number().min(0).optional().nullable(),
  imageUrl: z.string().trim().min(1).optional().nullable(),
  priority: z.enum(SUPPORT_PRIORITIES).optional(),
});

/** Mise à jour admin (statut, priorité, assignation, note interne). */
const supportTicketUpdate = z.object({
  status: z.enum(SUPPORT_STATUSES).optional(),
  priority: z.enum(SUPPORT_PRIORITIES).optional(),
  assignedAdminId: z.coerce.number().int().positive().nullable().optional(),
  resolutionNote: z.string().trim().max(4000).optional().nullable(),
});

/** Approbation d'un remboursement partiel. */
const supportTicketRefund = z.object({
  amount: z.coerce.number().positive("Montant requis"),
  note: z.string().trim().max(2000).optional().nullable(),
});

/** Rejet d'un ticket. Le motif est obligatoire pour la traçabilité. */
const supportTicketReject = z.object({
  reason: z.string().trim().min(3, "Motif requis").max(2000),
});

/** Message dans la conversation d'un ticket. */
const supportTicketMessage = z.object({
  message: z.string().trim().min(1, "Message vide").max(4000),
  imageUrl: z.string().trim().min(1).optional().nullable(),
});

/* ── PARTIE 6 — Reviews ────────────────────────────────────────────────── */
/**
 * Création d'un avis : au moins une note (restaurant ou livreur) doit être
 * renseignée. Les tags doivent appartenir à la liste prédéfinie côté UI.
 * `orderId` est récupéré dans l'URL côté route, pas dans le body.
 */
const reviewCreate = z.object({
  restaurantRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  driverRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  comment: z.string().trim().max(2000).optional().nullable(),
  tags: z.array(z.enum(REVIEW_TAGS)).max(REVIEW_TAGS.length).optional().nullable(),
}).refine(
  (v) => v.restaurantRating != null || v.driverRating != null,
  { message: "Au moins une note (restaurant ou livreur) est requise", path: ["restaurantRating"] },
);

// ─── Chat ─────────────────────────────────────────────────────────────────────

const chatMessage = z.object({
  senderId: intId,
  receiverId: intId,
  message: z.string().max(5000).optional().default(""),
  fileUrl: z.string().optional().nullable(),
  fileType: z.enum(["image", "pdf"]).optional().nullable(),
  isRead: z.boolean().optional().default(false),
});

// ─── Wallet ───────────────────────────────────────────────────────────────────

const walletTopup = z.object({
  userId: intId,
  amount: positiveAmount,
  method: z.string().min(1, "Méthode de paiement requise").max(50),
});

// ─── Service requests ─────────────────────────────────────────────────────────

const serviceRequestCreate = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  categoryName: z.string().max(100).optional(),
  fullName: z.string().min(1, "Nom complet requis").max(150),
  phone: phone,
  email: emailOpt,
  contactMethod: z.string().max(50).optional(),
  description: z.string().min(1, "Description requise").max(2000),
  address: z.string().max(500).optional(),
  catalogItemId: z.coerce.number().int().positive().optional().nullable(),
  additionalInfo: z.string().max(5000).optional(),
  scheduledDate: z.string().optional(),
  price: z.coerce.number().nonnegative().optional(),
}).passthrough();

const serviceRequestUpdate = z.object({
  status: z.enum(["pending", "reviewing", "accepted", "rejected", "completed"]).optional(),
  adminNotes: z.string().max(1000).optional(),
  price: z.coerce.number().nonnegative().optional(),
  scheduledDate: z.string().optional(),
  staffName: z.string().max(100).optional(),
}).passthrough();

// ─── Service categories & catalog ─────────────────────────────────────────────

const serviceCategoryCreate = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  icon: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
  imageUrl: z.string().optional(),
  customFields: z.any().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional(),
}).passthrough();

const serviceCategoryUpdate = serviceCategoryCreate.partial();

const serviceCatalogCreate = z.object({
  name: z.string().min(1, "Nom requis").max(150),
  categoryId: z.coerce.number().int().positive(),
  description: z.string().max(500).optional(),
  price: z.coerce.number().nonnegative().optional(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().optional().default(true),
}).passthrough();

const serviceCatalogUpdate = serviceCatalogCreate.partial();

// ─── Advertisements ───────────────────────────────────────────────────────────

const advertisementCreate = z.object({
  title: z.string().min(1, "Titre requis").max(150),
  description: z.string().max(500).optional(),
  mediaUrl: z.string().optional(),
  linkUrl: z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).passthrough();

const advertisementUpdate = advertisementCreate.partial();

// ─── Promo banner ─────────────────────────────────────────────────────────────

const promoBanner = z.object({
  tagText: z.string().max(50).optional(),
  title: z.string().max(150).optional(),
  subtitle: z.string().max(300).optional(),
  buttonText: z.string().max(50).optional(),
  linkUrl: z.string().max(500).optional(),
  bgColorFrom: z.string().max(30).optional(),
  bgColorTo: z.string().max(30).optional(),
  isActive: z.boolean().optional(),
});

// ─── Notifications ────────────────────────────────────────────────────────────

const broadcastNotification = z.object({
  title: z.string().min(1, "Titre requis").max(150),
  message: z.string().min(1, "Message requis").max(1000),
  type: z.string().max(50).optional(),
  targetSegment: z.string().max(50).optional(),
  targetUserIds: z.array(z.number().int().positive()).optional(),
  imageUrl: z.string().optional(),
});

// ─── Admin accounts ───────────────────────────────────────────────────────────

const adminAccountCreate = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide"),
  password: passwordMin,
  phone: phone,
  adminRole: z.string().max(50).optional().nullable(),
  adminPermissions: z.array(z.string()).optional().default([]),
});

const adminAccountUpdate = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: phone.optional(),
  password: passwordMin.optional(),
  adminRole: z.string().max(50).optional().nullable(),
  adminPermissions: z.array(z.string()).optional(),
  isBlocked: z.boolean().optional(),
});

// ─── Admin password-reset resolution ─────────────────────────────────────────

const adminResetResolve = z.object({
  status: z.enum(["pending", "resolved", "rejected"]).optional(),
  adminNote: z.string().max(500).optional(),
});

const adminSetPassword = z.object({
  newPassword: passwordMin,
});

// ─── User self-update ─────────────────────────────────────────────────────────

const userUpdate = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: phone.optional(),
  email: emailOpt,
  address: z.string().max(300).optional(),
  password: passwordMin.optional(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  isOnline: z.boolean().optional(),
  profilePhotoUrl: z.string().optional().nullable(),
  sex: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
  fullAddress: z.string().max(300).optional(),
  idPhotoUrl: z.string().optional().nullable(),
}).passthrough();

// ─── Finance ─────────────────────────────────────────────────────────────────

const financeCreate = z.object({
  type: z.enum(["revenue", "expense"]),
  category: z.string().min(1).max(100),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
  reference: z.string().max(100).optional(),
  orderId: z.coerce.number().int().positive().optional().nullable(),
  userId: z.coerce.number().int().positive().optional().nullable(),
}).passthrough();

// ─── Restaurant payouts ───────────────────────────────────────────────────────

const restaurantPayoutCreate = z.object({
  restaurantId: intId,
  grossAmount: z.number().positive(),
  mawejaCommission: z.number().nonnegative(),
  netAmount: z.number().nonnegative(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  notes: z.string().max(500).optional(),
}).passthrough();

// ─── Order modify (admin) ─────────────────────────────────────────────────────

const orderModify = z.object({
  items: z.array(orderItem).min(1).optional(),
  subtotal: z.coerce.number().nonnegative().optional(),
  total: z.coerce.number().nonnegative().optional(),
  deliveryFee: z.coerce.number().nonnegative().optional(),
  promoDiscount: z.coerce.number().nonnegative().optional(),
  adminNote: z.string().max(1000).optional(),
}).passthrough();

// ─── Settings ─────────────────────────────────────────────────────────────────

const settingValue = z.object({
  value: z.string().max(500),
});

// ── Exported schemas namespace ────────────────────────────────────────────────

export const schemas = {
  // Auth
  login,
  register,
  driverRegister,
  forgotPassword,
  resetPassword,
  driverOnboarding,

  // Admin verification
  driverVerify,

  // Restaurants & menus
  restaurantCreate,
  restaurantUpdate,
  reorderBody,
  menuItemCreate,
  menuItemUpdate,

  // Orders
  orderCreate,
  orderUpdate,
  orderRemark,
  orderRate,
  orderStatusOverride,
  orderCancel,
  orderModify,

  // Promos
  promoValidate,
  promotionCreate,
  promotionUpdate,

  // Categories
  categoryCreate,
  categoryUpdate,
  serviceCategoryCreate,
  serviceCategoryUpdate,
  serviceCatalogCreate,
  serviceCatalogUpdate,

  // Delivery zones
  deliveryZoneCreate,
  deliveryZoneUpdate,

  // Saved addresses
  savedAddressCreate,
  savedAddressUpdate,

  // Drivers
  driverCreate,
  driverUpdate,
  driverLocation,
  driverLocationPing,
  driverStatus,
  driverBlock,

  // Support tickets
  supportTicketCreate,
  supportTicketUpdate,
  supportTicketRefund,
  supportTicketReject,
  supportTicketMessage,

  // Reviews
  reviewCreate,

  // Chat
  chatMessage,

  // Wallet
  walletTopup,

  // Services
  serviceRequestCreate,
  serviceRequestUpdate,

  // Ads & banner
  advertisementCreate,
  advertisementUpdate,
  promoBanner,

  // Notifications
  broadcastNotification,

  // Admin accounts
  adminAccountCreate,
  adminAccountUpdate,
  adminResetResolve,
  adminSetPassword,

  // Users
  userUpdate,

  // Finance
  financeCreate,
  restaurantPayoutCreate,

  // Settings
  settingValue,

  // Params
  params,
} as const;

export type { ZodError };
