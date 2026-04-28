/**
 * server/routes/reviews.routes.ts
 * ───────────────────────────────────────────────────────────────────────────
 * PARTIE 6 — Avis et notes (à la Uber Eats).
 *
 * Endpoints :
 *   POST   /api/orders/:orderId/review                 — création d'un avis (client owner, livré, unique)
 *   GET    /api/orders/:orderId/review                 — l'avis du client courant pour cette commande
 *   GET    /api/restaurants/:id/reviews                — public : tous les avis d'un restaurant
 *   GET    /api/restaurants/:id/rating-summary         — public : moyenne + nombre
 *   GET    /api/drivers/:id/reviews                    — admin uniquement (commentaires sensibles)
 *   GET    /api/drivers/:id/rating-summary             — public : moyenne + nombre (chiffre seul)
 *   GET    /api/drivers/me/feedback                    — livreur connecté : sa moyenne + tags agrégés
 *                                                       + commentaires anonymisés (sans nom client)
 *   GET    /api/reviews                                — admin : liste filtrée + flags faibles notes
 *   GET    /api/reviews/low-rated                      — admin : restaurants/livreurs avec moyenne < seuil
 */
import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth.middleware";
import { validate, schemas } from "../validators";
import { sendToUser } from "../websocket";

async function notifyAdmins(payload: {
  title: string; message: string; type: string; data?: Record<string, unknown>;
}): Promise<void> {
  const admins = await storage.getAdmins();
  for (const admin of admins) {
    const n = await storage.createNotification({
      userId: admin.id, title: payload.title, message: payload.message,
      type: payload.type, data: payload.data ?? null, isRead: false,
    });
    sendToUser(admin.id, { type: "review_alert", notification: n });
  }
}

/** Seuil en-dessous duquel on signale un acteur (note faible). */
const LOW_RATING_THRESHOLD = 3.5;

/** Anonymise un commentaire en supprimant les éléments les plus sensibles. */
function sanitizeForDriverView(text: string | null): string | null {
  if (!text) return text;
  // Retire les numéros (téléphone, adresses) et adresses email pour préserver
  // un minimum d'anonymat dans la vue livreur.
  return text
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "[email]")
    .replace(/\b(?:\+?\d[\d\s.-]{6,}\d)\b/g, "[numéro]");
}

export function registerReviewsRoutes(app: Express): void {
  // ── Création d'un avis ────────────────────────────────────────────────
  app.post(
    "/api/orders/:orderId/review",
    requireAuth,
    validate(schemas.reviewCreate),
    async (req: any, res) => {
      const userId = req.session.userId as number;
      const orderId = Number(req.params.orderId);
      if (!Number.isFinite(orderId)) {
        return res.status(400).json({ message: "orderId invalide" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Commande introuvable" });

      // Règles métier strictes :
      // 1. Seul le propriétaire de la commande peut noter.
      if (order.clientId !== userId) {
        return res.status(403).json({ message: "Vous ne pouvez noter que vos propres commandes" });
      }
      // 2. Uniquement après livraison effective.
      if (order.status !== "delivered") {
        return res.status(409).json({ message: "Vous ne pouvez noter qu'une commande livrée" });
      }
      // 3. Pas de doublon (la contrainte UNIQUE protège aussi en BDD).
      const existing = await storage.getReviewByOrder(orderId);
      if (existing) {
        return res.status(409).json({ message: "Cette commande a déjà été notée", review: existing });
      }

      const body = req.body;
      // Si le client donne une note livreur mais aucun livreur n'est associé,
      // on ignore silencieusement (le frontend ne propose pas le slider dans
      // ce cas, mais on durcit le serveur).
      const driverRating = order.driverId ? body.driverRating ?? null : null;
      const restaurantRating = order.restaurantId ? body.restaurantRating ?? null : null;

      const review = await storage.createReview({
        orderId,
        userId,
        restaurantId: order.restaurantId ?? null,
        driverId: order.driverId ?? null,
        restaurantRating,
        driverRating,
        comment: body.comment ?? null,
        tags: body.tags ?? null,
      });

      // Notifications : informer le livreur et l'admin si la note est faible.
      const lowestRating = Math.min(
        restaurantRating ?? 5,
        driverRating ?? 5,
      );
      if (lowestRating <= 2) {
        // Notif admins : signal d'alerte qualité.
        await notifyAdmins({
          title: "Avis négatif reçu",
          message: `Commande ${order.orderNumber} notée ${lowestRating}/5`,
          type: "support",
          data: { reviewId: review.id, orderId, restaurantId: order.restaurantId, driverId: order.driverId },
        });
      }
      // Notif livreur (sans détails sensibles).
      if (order.driverId && driverRating != null) {
        const notif = await storage.createNotification({
          userId: order.driverId,
          title: "Nouvelle évaluation",
          message: `Vous avez reçu ${driverRating}/5 sur la commande ${order.orderNumber}`,
          type: "delivery",
          data: { orderId, rating: driverRating },
          isRead: false,
        });
        sendToUser(order.driverId, { type: "review_received", notification: notif });
      }

      res.status(201).json({ review });
    },
  );

  // ── Lecture pour le client ────────────────────────────────────────────
  app.get("/api/orders/:orderId/review", requireAuth, async (req: any, res) => {
    const userId = req.session.userId as number;
    const orderId = Number(req.params.orderId);
    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Commande introuvable" });
    if (order.clientId !== userId) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    const review = await storage.getReviewByOrder(orderId);
    res.json({ review: review ?? null });
  });

  // ── Vue publique restaurant ───────────────────────────────────────────
  app.get("/api/restaurants/:id/reviews", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "id invalide" });
    const list = await storage.getReviewsByRestaurant(id);
    // Limite l'exposition : pas d'userId/driverId pour les visiteurs.
    res.json(
      list.map((r) => ({
        id: r.id,
        restaurantRating: r.restaurantRating,
        comment: r.comment,
        tags: r.tags,
        createdAt: r.createdAt,
      })),
    );
  });

  app.get("/api/restaurants/:id/rating-summary", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "id invalide" });
    const summary = await storage.getRestaurantRatingSummary(id);
    res.json(summary);
  });

  // ── Vue publique livreur (chiffre seulement) ──────────────────────────
  app.get("/api/drivers/:id/rating-summary", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "id invalide" });
    const summary = await storage.getDriverRatingSummary(id);
    res.json(summary);
  });

  // ── Vue admin : avis détaillés d'un livreur (avec commentaires) ───────
  app.get("/api/drivers/:id/reviews", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Réservé aux admins" });
    }
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "id invalide" });
    const list = await storage.getReviewsByDriver(id);
    res.json(list);
  });

  // ── Vue livreur connecté : feedback global anonymisé ──────────────────
  app.get("/api/drivers/me/feedback", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "driver") {
      return res.status(403).json({ message: "Réservé aux livreurs" });
    }
    const reviews = await storage.getReviewsByDriver(user.id);
    const summary = await storage.getDriverRatingSummary(user.id);

    // Agrégat des tags pour donner une vue globale rapide.
    const tagCounts: Record<string, number> = {};
    const ratingHistogram: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    for (const r of reviews) {
      if (r.driverRating != null) ratingHistogram[String(r.driverRating)]++;
      for (const t of r.tags ?? []) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }

    // Liste de commentaires : tronqués + anonymisés, et seulement ceux qui
    // concernent vraiment le livreur (driverRating renseigné).
    const recentComments = reviews
      .filter((r) => r.driverRating != null && r.comment)
      .slice(0, 20)
      .map((r) => ({
        id: r.id,
        rating: r.driverRating,
        comment: sanitizeForDriverView(r.comment),
        createdAt: r.createdAt,
      }));

    res.json({
      summary,
      tagCounts,
      ratingHistogram,
      recentComments,
      lowRatingFlag: summary.count >= 5 && summary.average < LOW_RATING_THRESHOLD,
    });
  });

  // ── Admin : liste filtrée ─────────────────────────────────────────────
  app.get("/api/reviews", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Réservé aux admins" });
    }
    const restaurantId = req.query.restaurantId ? Number(req.query.restaurantId) : undefined;
    const driverId = req.query.driverId ? Number(req.query.driverId) : undefined;
    const minRating = req.query.minRating ? Number(req.query.minRating) : undefined;
    const maxRating = req.query.maxRating ? Number(req.query.maxRating) : undefined;
    const list = await storage.listReviews({ restaurantId, driverId, minRating, maxRating });
    res.json(list);
  });

  // ── Admin : signaler les acteurs avec faible note ─────────────────────
  app.get("/api/reviews/low-rated", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Réservé aux admins" });
    }
    const threshold = req.query.threshold ? Number(req.query.threshold) : LOW_RATING_THRESHOLD;
    const minCount = req.query.minCount ? Number(req.query.minCount) : 3;

    const allReviews = await storage.listReviews();
    const restaurantStats = new Map<number, { sum: number; count: number }>();
    const driverStats = new Map<number, { sum: number; count: number }>();
    for (const r of allReviews) {
      if (r.restaurantId && r.restaurantRating != null) {
        const s = restaurantStats.get(r.restaurantId) ?? { sum: 0, count: 0 };
        s.sum += r.restaurantRating;
        s.count++;
        restaurantStats.set(r.restaurantId, s);
      }
      if (r.driverId && r.driverRating != null) {
        const s = driverStats.get(r.driverId) ?? { sum: 0, count: 0 };
        s.sum += r.driverRating;
        s.count++;
        driverStats.set(r.driverId, s);
      }
    }

    const restaurants = await storage.getRestaurants();
    const flaggedRestaurants = Array.from(restaurantStats.entries())
      .map(([id, s]) => ({
        id, average: s.sum / s.count, count: s.count,
        name: restaurants.find((r) => r.id === id)?.name ?? `Restaurant #${id}`,
      }))
      .filter((r) => r.count >= minCount && r.average < threshold)
      .sort((a, b) => a.average - b.average);

    const flaggedDrivers: Array<{ id: number; name: string; average: number; count: number }> = [];
    for (const [id, s] of driverStats) {
      if (s.count < minCount || s.sum / s.count >= threshold) continue;
      const u = await storage.getUser(id);
      flaggedDrivers.push({
        id, average: s.sum / s.count, count: s.count,
        name: u?.name ?? `Livreur #${id}`,
      });
    }
    flaggedDrivers.sort((a, b) => a.average - b.average);

    res.json({ threshold, minCount, restaurants: flaggedRestaurants, drivers: flaggedDrivers });
  });
}
