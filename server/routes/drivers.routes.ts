import type { Express } from "express";
import crypto from "crypto";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { hashPassword, registerLimiter } from "../auth";
import { validate, validateParams, schemas } from "../validators";
import { sendToUser, broadcast } from "../websocket";
import { computeEta, statusTextFromContext } from "../lib/eta";
import { logger } from "../lib/logger";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function registerDriversRoutes(app: Express): void {
  app.post("/api/driver/onboarding", requireAuth, validate(schemas.driverOnboarding), async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "driver") return res.status(403).json({ message: "Acces interdit" });
    const { name, sex, dateOfBirth, fullAddress, phone, idPhotoUrl, profilePhotoUrl, idNumber } = req.body;
    if (!name || !sex || !dateOfBirth || !fullAddress || !phone || !idPhotoUrl || !profilePhotoUrl) {
      return res.status(400).json({ message: "Tous les champs sont obligatoires" });
    }
    await storage.updateUser(userId, {
      name, sex, dateOfBirth, fullAddress, phone, idPhotoUrl, profilePhotoUrl,
      driverLicense: idNumber || null,
      verificationStatus: "pending",
      rejectedFields: null,
    });
    const admins = (await storage.getAllUsers()).filter(u => u.role === "admin");
    for (const admin of admins) {
      await storage.createNotification({
        userId: admin.id,
        title: "Verification livreur",
        message: `${name} a soumis ses informations pour verification`,
        type: "driver_verification",
        data: { driverId: userId },
        isRead: false,
      });
      sendToUser(admin.id, { type: "driver_verification", driverId: userId });
    }
    const updated = await storage.getUser(userId);
    const { password: _, ...safeUser } = updated!;
    res.json(safeUser);
  });

  app.get("/api/admin/verifications", requireAdmin, async (_req, res) => {
    const allDrivers = await storage.getDrivers();
    const pending = allDrivers.filter(d => d.verificationStatus === "pending" || d.verificationStatus === "rejected");
    res.json(pending.map(({ password: _, ...d }) => d));
  });

  app.post("/api/admin/verify/:driverId", requireAdmin, validateParams(schemas.params.driverId), validate(schemas.driverVerify), async (req, res) => {
    const driverId = Number(req.params.driverId);
    const { action, rejectedFields } = req.body;
    const driver = await storage.getUser(driverId);
    if (!driver || driver.role !== "driver") return res.status(404).json({ message: "Livreur non trouve" });
    if (action === "approve") {
      await storage.updateUser(driverId, { verificationStatus: "approved", rejectedFields: null });
      await storage.createNotification({
        userId: driverId,
        title: "Compte verifie!",
        message: "Votre compte a ete approuve. Vous pouvez maintenant utiliser l'application.",
        type: "verification",
        isRead: false,
      });
      sendToUser(driverId, { type: "verification_approved" });
    } else if (action === "reject") {
      if (!rejectedFields || !Array.isArray(rejectedFields) || rejectedFields.length === 0) {
        return res.status(400).json({ message: "Indiquez les champs a corriger" });
      }
      await storage.updateUser(driverId, { verificationStatus: "rejected", rejectedFields });
      await storage.createNotification({
        userId: driverId,
        title: "Corrections requises",
        message: "Certaines informations doivent etre corrigees. Veuillez les mettre a jour.",
        type: "verification",
        data: { rejectedFields },
        isRead: false,
      });
      sendToUser(driverId, { type: "verification_rejected", rejectedFields });
    }
    const updated = await storage.getUser(driverId);
    const { password: _, ...safe } = updated!;
    res.json(safe);
  });

  app.get("/api/drivers", requireAuth, async (_req, res) => {
    const drivers = await storage.getDrivers();
    res.json(drivers.map(({ password: _, ...d }) => d));
  });

  app.get("/api/drivers/online", requireAuth, async (_req, res) => {
    const drivers = await storage.getOnlineDrivers();
    res.json(drivers.map(({ password: _, ...d }) => d));
  });

  app.post("/api/drivers", requireAdmin, validate(schemas.driverCreate), async (req, res) => {
    const { email, password, name, phone, vehicleType, vehiclePlate, driverLicense, commissionRate } = req.body;
    if (email) {
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(400).json({ message: "Email deja utilise" });
    }
    const hashedPw = await hashPassword(password);
    const driver = await storage.createUser({
      email: email || null, password: hashedPw, name, phone, role: "driver",
      vehicleType, vehiclePlate, driverLicense,
      commissionRate: commissionRate || 15,
      walletBalance: 0, loyaltyPoints: 0, isOnline: false, isBlocked: false,
    });
    const { password: _, ...safe } = driver;
    res.json(safe);
  });

  app.post("/api/auth/driver-register", registerLimiter, validate(schemas.driverRegister), async (req, res) => {
    try {
      const { identifier, password, name, phone: phoneField, vehicleType } = req.body;
      const isEmail = identifier.includes("@");
      const phone = phoneField || (!isEmail ? identifier : "");
      const email = isEmail ? identifier : null;
      if (email) {
        const existing = await storage.getUserByEmail(email);
        if (existing) return res.status(400).json({ message: "Cet email est deja utilise" });
      }
      if (phone) {
        const existingPhone = await storage.getUserByPhone(phone);
        if (existingPhone) return res.status(400).json({ message: "Ce numero de telephone est deja utilise" });
      }
      const driverHash = await hashPassword(password);
      const driver = await storage.createUser({
        email: email || null, password: driverHash, name,
        phone: phone || identifier,
        role: "driver", vehicleType: vehicleType || null,
        walletBalance: 0, loyaltyPoints: 0, isOnline: false, isBlocked: false,
        verificationStatus: "not_started",
      });
      const regToken = generateToken();
      await storage.updateUser(driver.id, { authToken: regToken });
      (req.session as any).userId = driver.id;
      await new Promise<void>((resolve, reject) => req.session.save((err) => err ? reject(err) : resolve()));
      const admins = (await storage.getAllUsers()).filter(u => u.role === "admin");
      for (const admin of admins) {
        await storage.createNotification({ userId: admin.id, title: "Nouvel agent", message: `${name} vient de s'inscrire comme agent livreur`, type: "user", isRead: false });
        sendToUser(admin.id, { type: "new_user", user: { id: driver.id, name, role: "driver" } });
      }
      const { password: _, ...safe } = driver;
      res.json({ ...safe, authToken: regToken });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Erreur lors de l'inscription" });
    }
  });

  app.patch("/api/drivers/:id", requireAdmin, validate(schemas.driverUpdate), async (req, res) => {
    const driver = await storage.updateUser(Number(req.params.id), req.body);
    if (!driver) return res.status(404).json({ message: "Livreur non trouve" });
    const { password: _, ...safe } = driver;
    res.json(safe);
  });

  app.delete("/api/drivers/:id", requireAdmin, async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    res.json({ ok: true });
  });

  app.patch("/api/drivers/:id/block", requireAdmin, validate(schemas.driverBlock), async (req, res) => {
    const { isBlocked } = req.body;
    const driver = await storage.updateUser(Number(req.params.id), { isBlocked, isOnline: false });
    if (!driver) return res.status(404).json({ message: "Livreur non trouve" });
    broadcast({ type: "driver_blocked", driverId: driver.id, isBlocked });
    res.json({ ok: true });
  });

  app.patch("/api/drivers/:id/location", requireAuth, validate(schemas.driverLocation), async (req, res) => {
    const userId = (req.session as any).userId;
    const targetId = Number(req.params.id);
    const user = await storage.getUser(userId);
    if (!user || (user.role !== "admin" && userId !== targetId)) return res.status(403).json({ message: "Acces interdit" });
    const { lat, lng } = req.body;
    await storage.updateUser(targetId, { lat, lng });
    broadcast({ type: "driver_location", driverId: targetId, lat, lng });
    res.json({ ok: true });
  });

  app.patch("/api/drivers/:id/status", requireAuth, validate(schemas.driverStatus), async (req, res) => {
    const userId = (req.session as any).userId;
    const targetId = Number(req.params.id);
    const user = await storage.getUser(userId);
    if (!user || (user.role !== "admin" && userId !== targetId)) return res.status(403).json({ message: "Acces interdit" });
    const { isOnline } = req.body;
    await storage.updateUser(targetId, { isOnline });
    broadcast({ type: "driver_status", driverId: targetId, isOnline });
    res.json({ ok: true });
  });

  /**
   * PARTIE 4 — Tracking live livreur.
   *
   * Le livreur authentifié envoie sa position pendant une livraison active.
   * - Si `orderId` est fourni, on vérifie que la commande lui est bien
   *   assignée (sinon 403). Cela empêche un livreur d'injecter une fausse
   *   position pour une commande appartenant à un autre.
   * - On enregistre toujours dans `driver_locations` pour l'historique.
   * - On met aussi à jour `users.lat/lng` pour rester compatible avec les
   *   pages admin existantes qui lisent ces deux colonnes.
   * - Diffusion WebSocket :
   *     * "driver_location" (ancien format) à tous, pour rétro-compat.
   *     * "driver_location_update" ciblé client (orderId.clientId) + admins
   *       avec ETA et statusText déjà calculés.
   */
  app.post("/api/driver/location", requireAuth, validate(schemas.driverLocationPing), async (req, res) => {
    const userId = (req.session as any).userId;
    const driver = await storage.getUser(userId);
    if (!driver || driver.role !== "driver") {
      return res.status(403).json({ message: "Réservé aux livreurs" });
    }
    if (driver.isBlocked) {
      return res.status(403).json({ message: "Compte bloqué" });
    }

    const { latitude, longitude, heading, speed, accuracy, batteryLevel, orderId } = req.body;

    let order = null as Awaited<ReturnType<typeof storage.getOrder>> | null;
    if (orderId) {
      order = (await storage.getOrder(Number(orderId))) || null;
      if (!order) {
        return res.status(404).json({ message: "Commande introuvable" });
      }
      if (order.driverId !== userId) {
        return res.status(403).json({ message: "Cette commande ne vous est pas assignée" });
      }
    }

    const recorded = await storage.recordDriverLocation({
      driverId: userId,
      orderId: orderId ?? null,
      latitude,
      longitude,
      heading: heading ?? null,
      speed: speed ?? null,
      accuracy: accuracy ?? null,
      batteryLevel: batteryLevel ?? null,
      recordedAt: new Date(),
    });

    // Maintenir users.lat/lng pour les vues admin existantes (carte des
    // livreurs en ligne) sans casser les flux qui s'appuient déjà dessus.
    try {
      await storage.updateUser(userId, { lat: latitude, lng: longitude });
    } catch (err) {
      logger.warn(`[tracking] could not update user lat/lng: ${(err as Error).message}`);
    }

    // Diffusion WebSocket : ancien format conservé (rétro-compat).
    broadcast({ type: "driver_location", driverId: userId, lat: latitude, lng: longitude });

    // Format riche dédié au tracking de commande.
    if (order) {
      const dest =
        order.deliveryLat != null && order.deliveryLng != null
          ? { latitude: order.deliveryLat, longitude: order.deliveryLng }
          : null;
      const eta = computeEta({ latitude, longitude }, dest);
      const payload = {
        type: "driver_location_update" as const,
        orderId: order.id,
        driverLocation: {
          latitude,
          longitude,
          heading: heading ?? null,
          speed: speed ?? null,
          accuracy: accuracy ?? null,
          recordedAt: recorded.recordedAt,
        },
        eta,
        statusText: statusTextFromContext(order.status, eta?.distanceKm ?? null),
      };
      sendToUser(order.clientId, payload);
      const admins = (await storage.getAllUsers()).filter((u) => u.role === "admin");
      for (const admin of admins) sendToUser(admin.id, payload);
    }

    res.json({
      ok: true,
      location: {
        id: recorded.id,
        latitude: recorded.latitude,
        longitude: recorded.longitude,
        recordedAt: recorded.recordedAt,
      },
    });
  });

  app.post("/api/drivers/:id/alarm", requireAdmin, async (req, res) => {
    const driverId = Number(req.params.id);
    const { reason, orderId } = req.body;
    const driver = await storage.getUser(driverId);
    if (!driver) return res.status(404).json({ message: "Livreur non trouve" });
    sendToUser(driverId, {
      type: "alarm",
      reason: reason || "Urgence - Contactez l'administration immediatement",
      orderId: orderId || null,
    });
    await storage.createNotification({
      userId: driverId,
      title: "ALERTE URGENTE",
      message: reason || "Urgence - Contactez l'administration",
      type: "alarm",
      isRead: false,
    });
    res.json({ ok: true });
  });
}
