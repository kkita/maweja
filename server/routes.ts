import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage: mediaStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype.replace("image/", "")));
  },
});

const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const imageExts = /jpeg|jpg|png|webp/;
    const videoExts = /mp4|webm|mov/;
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const isImage = imageExts.test(ext) && file.mimetype.startsWith("image/");
    const isVideo = videoExts.test(ext) && file.mimetype.startsWith("video/");
    cb(null, isImage || isVideo);
  },
});

const clients = new Map<number, WebSocket>();

function broadcast(data: any) {
  const msg = JSON.stringify(data);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

function sendToUser(userId: number, data: any) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any)?.userId) {
    return res.status(401).json({ message: "Non authentifie" });
  }
  next();
}

async function requireAdmin(req: any, res: any, next: any) {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ message: "Non authentifie" });
  const user = await storage.getUser(userId);
  if (!user || user.role !== "admin") return res.status(403).json({ message: "Acces interdit" });
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth
  app.post("/api/auth/login", async (req, res) => {
    const { email, password, expectedRole } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email et mot de passe requis" });
    const user = await storage.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "Votre compte a ete bloque. Contactez le support." });
    }
    if (expectedRole && user.role !== expectedRole) {
      const msgs: Record<string, string> = {
        client: "Ce compte n'est pas un compte client",
        driver: "Ce compte n'est pas un compte livreur",
        admin: "Ce compte n'est pas un compte administrateur",
      };
      return res.status(403).json({ message: msgs[expectedRole] || "Acces interdit" });
    }
    (req.session as any).userId = user.id;
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, phone, role, address } = req.body;
    if (!email || !password || !name || !phone) return res.status(400).json({ message: "Tous les champs sont requis" });
    if (role === "driver") return res.status(403).json({ message: "Les comptes livreurs sont crees uniquement par l'administration" });
    if (role === "admin") return res.status(403).json({ message: "Acces interdit" });
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(400).json({ message: "Cet email existe deja" });
    const user = await storage.createUser({
      email, password, name, phone, role: "client",
      walletBalance: 0, loyaltyPoints: 0, isOnline: false, isBlocked: false,
      address: address || null,
    });
    (req.session as any).userId = user.id;
    const { password: _, ...safeUser } = user;

    // Notify admins of new registration
    const admins = (await storage.getAllUsers()).filter(u => u.role === "admin");
    for (const admin of admins) {
      await storage.createNotification({
        userId: admin.id,
        title: "Nouvel utilisateur",
        message: `${name} (${role || "client"}) s'est inscrit`,
        type: "user",
        isRead: false,
      });
      sendToUser(admin.id, { type: "new_user", user: safeUser });
    }

    res.json(safeUser);
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Non authentifie" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Utilisateur non trouve" });
    if (user.isBlocked) return res.status(403).json({ message: "Compte bloque" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ ok: true });
  });

  app.use("/uploads", (await import("express")).default.static(uploadsDir));

  app.post("/api/upload", requireAuth, upload.single("file"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "Fichier requis (jpg, png, webp, max 5MB)" });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  app.post("/api/upload-media", requireAuth, uploadMedia.single("file"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "Fichier requis (image ou video mp4/webm/mov, max 20MB)" });
    const url = `/uploads/${req.file.filename}`;
    const isVideo = req.file.mimetype.startsWith("video/");
    res.json({ url, type: isVideo ? "video" : "image" });
  });

  app.post("/api/driver/onboarding", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "driver") return res.status(403).json({ message: "Acces interdit" });
    const { name, sex, dateOfBirth, fullAddress, email, phone, idPhotoUrl, profilePhotoUrl } = req.body;
    if (!name || !sex || !dateOfBirth || !fullAddress || !email || !phone || !idPhotoUrl || !profilePhotoUrl) {
      return res.status(400).json({ message: "Tous les champs sont obligatoires" });
    }
    await storage.updateUser(userId, {
      name, sex, dateOfBirth, fullAddress, email, phone, idPhotoUrl, profilePhotoUrl,
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

  app.post("/api/admin/verify/:driverId", requireAdmin, async (req, res) => {
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

  // Restaurants
  app.get("/api/restaurants", async (_req, res) => {
    const all = await storage.getRestaurants();
    res.json(all);
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    const r = await storage.getRestaurant(Number(req.params.id));
    if (!r) return res.status(404).json({ message: "Restaurant non trouve" });
    res.json(r);
  });

  app.post("/api/restaurants", requireAdmin, async (req, res) => {
    const r = await storage.createRestaurant(req.body);
    res.json(r);
  });

  app.patch("/api/restaurants/:id", requireAdmin, async (req, res) => {
    const r = await storage.updateRestaurant(Number(req.params.id), req.body);
    res.json(r);
  });

  app.delete("/api/restaurants/:id", requireAdmin, async (req, res) => {
    await storage.deleteRestaurant(Number(req.params.id));
    res.json({ ok: true });
  });

  // Menu items
  app.get("/api/restaurants/:id/menu", async (req, res) => {
    const items = await storage.getMenuItems(Number(req.params.id));
    res.json(items);
  });

  app.post("/api/menu-items", requireAdmin, async (req, res) => {
    const item = await storage.createMenuItem(req.body);
    res.json(item);
  });

  app.patch("/api/menu-items/:id", requireAdmin, async (req, res) => {
    const item = await storage.updateMenuItem(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/menu-items/:id", requireAdmin, async (req, res) => {
    await storage.deleteMenuItem(Number(req.params.id));
    res.json({ ok: true });
  });

  // Orders
  app.get("/api/orders", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Non authentifie" });

    const filters: any = {};
    if (user.role === "client") {
      filters.clientId = userId;
    } else if (user.role === "driver") {
      if (req.query.status && req.query.status === "ready") {
        filters.status = "ready";
      } else if (req.query.driverId) {
        filters.driverId = Number(req.query.driverId);
      } else {
        filters.driverId = userId;
      }
    }
    if (user.role === "admin") {
      if (req.query.clientId) filters.clientId = Number(req.query.clientId);
      if (req.query.driverId) filters.driverId = Number(req.query.driverId);
      if (req.query.status) filters.status = req.query.status;
      if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
    }
    const all = await storage.getOrders(Object.keys(filters).length ? filters : undefined);
    res.json(all);
  });

  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Commande non trouvee" });
    if (user?.role === "client" && order.clientId !== userId) return res.status(403).json({ message: "Acces refuse" });
    if (user?.role === "driver" && order.driverId !== userId) return res.status(403).json({ message: "Acces refuse" });
    res.json(order);
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    const sessionUserId = (req.session as any).userId;
    const orderNumber = `MAW-${Date.now().toString(36).toUpperCase()}`;
    const commission = Math.round(req.body.subtotal * 0.15);
    const restaurant = await storage.getRestaurant(req.body.restaurantId);
    const deliveryMinutes = restaurant?.deliveryTime ? parseInt(restaurant.deliveryTime) || 45 : 45;
    const estimatedDelivery = new Date(Date.now() + deliveryMinutes * 60 * 1000).toISOString();
    const order = await storage.createOrder({ ...req.body, clientId: sessionUserId, orderNumber, commission, estimatedDelivery });

    // Record finance entries
    await storage.createFinance({
      type: "revenue", category: "order", amount: order.total,
      description: `Commande ${orderNumber}`, orderId: order.id, userId: order.clientId,
    });
    await storage.createFinance({
      type: "revenue", category: "delivery_fee", amount: order.deliveryFee,
      description: `Frais livraison ${orderNumber}`, orderId: order.id,
    });
    await storage.createFinance({
      type: "revenue", category: "commission", amount: commission,
      description: `Commission ${orderNumber} (15%)`, orderId: order.id,
    });

    // Notify admin
    const admins = (await storage.getAllUsers()).filter(u => u.role === "admin");
    for (const admin of admins) {
      await storage.createNotification({
        userId: admin.id,
        title: "Nouvelle commande",
        message: `Commande ${orderNumber} recue - ${order.total} FC`,
        type: "order",
        data: { orderId: order.id },
        isRead: false,
      });
      sendToUser(admin.id, { type: "new_order", order });
    }

    broadcast({ type: "new_order", order });

    // Notify client
    await storage.createNotification({
      userId: order.clientId,
      title: "Commande confirmee",
      message: `Votre commande ${orderNumber} a ete recue et sera traitee sous peu`,
      type: "order",
      data: { orderId: order.id },
      isRead: false,
    });

    // If wallet payment, deduct balance
    if (req.body.paymentMethod === "wallet") {
      const client = await storage.getUser(order.clientId);
      if (client) {
        await storage.updateUser(client.id, { walletBalance: Math.max(0, (client.walletBalance || 0) - order.total) });
        await storage.createWalletTransaction({
          userId: client.id, amount: -order.total, type: "payment",
          description: `Paiement commande ${orderNumber}`, orderId: order.id,
        });
      }
    }

    // Debit loyalty points if used
    if (req.body.pointsUsed && req.body.pointsUsed > 0) {
      const client = await storage.getUser(order.clientId);
      if (client) {
        const newPoints = Math.max(0, (client.loyaltyPoints || 0) - req.body.pointsUsed);
        await storage.updateUser(client.id, { loyaltyPoints: newPoints });
      }
    }

    // Award loyalty points
    const points = Math.floor(order.total / 1000);
    if (points > 0) {
      const client = await storage.getUser(order.clientId);
      if (client) {
        await storage.updateUser(client.id, { loyaltyPoints: (client.loyaltyPoints || 0) + points });
      }
    }

    res.json(order);
  });

  app.patch("/api/orders/:id", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || (user.role !== "admin" && user.role !== "driver")) {
      return res.status(403).json({ message: "Acces refuse" });
    }
    const order = await storage.updateOrder(Number(req.params.id), req.body);
    if (!order) return res.status(404).json({ message: "Commande non trouvee" });

    broadcast({ type: "order_updated", order });

    if (req.body.driverId && !req.body.status) {
      await storage.createNotification({
        userId: req.body.driverId,
        title: "Nouvelle livraison assignee",
        message: `Commande ${order.orderNumber} vous a ete assignee`,
        type: "delivery",
        data: { orderId: order.id },
        isRead: false,
      });
      sendToUser(req.body.driverId, { type: "order_assigned", order });
    }

    if (req.body.status) {
      const statusMessages: Record<string, string> = {
        confirmed: "Votre commande a ete confirmee par le restaurant",
        preparing: "Votre commande est en cours de preparation",
        ready: "Votre commande est prete pour la collecte",
        picked_up: "Votre livreur a recupere votre commande",
        delivered: "Votre commande a ete livree avec succes",
        cancelled: "Votre commande a ete annulee",
      };
      if (statusMessages[req.body.status]) {
        await storage.createNotification({
          userId: order.clientId,
          title: `Commande ${order.orderNumber}`,
          message: statusMessages[req.body.status],
          type: "order",
          data: { orderId: order.id },
          isRead: false,
        });
        sendToUser(order.clientId, { type: "order_status", orderId: order.id, status: req.body.status });
      }

      // On delivery complete, pay driver
      if (req.body.status === "delivered" && order.driverId) {
        const driverEarning = order.deliveryFee;
        const driver = await storage.getUser(order.driverId);
        if (driver) {
          await storage.updateUser(driver.id, { walletBalance: (driver.walletBalance || 0) + driverEarning });
          await storage.createWalletTransaction({
            userId: driver.id, amount: driverEarning, type: "earning",
            description: `Gain livraison ${order.orderNumber}`, orderId: order.id,
          });
          await storage.createFinance({
            type: "expense", category: "driver_payment", amount: driverEarning,
            description: `Paiement livreur ${driver.name} - ${order.orderNumber}`, orderId: order.id, userId: driver.id,
          });
        }
        // Update payment status
        await storage.updateOrder(order.id, { paymentStatus: "paid" });
      }

      // On cancel, refund wallet if applicable
      if (req.body.status === "cancelled" && order.paymentMethod === "wallet") {
        const client = await storage.getUser(order.clientId);
        if (client) {
          await storage.updateUser(client.id, { walletBalance: (client.walletBalance || 0) + order.total });
          await storage.createWalletTransaction({
            userId: client.id, amount: order.total, type: "refund",
            description: `Remboursement commande ${order.orderNumber}`, orderId: order.id,
          });
          await storage.createFinance({
            type: "expense", category: "refund", amount: order.total,
            description: `Remboursement ${order.orderNumber}`, orderId: order.id, userId: client.id,
          });
        }
      }
    }

    res.json(order);
  });

  // Order rating
  app.post("/api/orders/:id/rate", requireAuth, async (req, res) => {
    const { rating, feedback } = req.body;
    const order = await storage.updateOrder(Number(req.params.id), { rating, feedback });
    res.json(order);
  });

  // Cancel order with reason
  app.patch("/api/orders/:id/cancel", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Commande non trouvee" });
    if (order.clientId !== userId) return res.status(403).json({ message: "Acces refuse" });
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({ message: "Cette commande ne peut plus etre annulee" });
    }
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: "Raison requise" });
    const updated = await storage.updateOrder(order.id, { status: "cancelled", cancelReason: reason });
    if (order.paymentMethod === "wallet" || order.paymentStatus === "paid") {
      await storage.updateUser(order.clientId, { walletBalance: (await storage.getUser(order.clientId))!.walletBalance + order.total });
      await storage.createWalletTransaction({ userId: order.clientId, amount: order.total, type: "refund", description: `Remboursement commande ${order.orderNumber}` });
      await storage.createFinance({ type: "expense", category: "refund", amount: order.total, description: `Remboursement ${order.orderNumber}`, orderId: order.id });
    }
    broadcast({ type: "order_cancelled", order: updated });
    res.json(updated);
  });

  // Promo code validation
  app.post("/api/promo/validate", requireAuth, async (req, res) => {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ message: "Code promo requis" });
    const promoCodes: Record<string, { type: string; value: number; description: string }> = {
      "MAWEJA10": { type: "percent", value: 10, description: "10% de reduction" },
      "MAWEJA20": { type: "percent", value: 20, description: "20% de reduction" },
      "LIVRAISON": { type: "delivery", value: 100, description: "Livraison gratuite" },
      "BIENVENUE": { type: "fixed", value: 2000, description: "2000 FC de reduction" },
    };
    const promo = promoCodes[code.toUpperCase()];
    if (!promo) return res.status(400).json({ message: "Code promo invalide" });
    let discount = 0;
    if (promo.type === "percent") discount = Math.floor((subtotal || 0) * promo.value / 100);
    else if (promo.type === "fixed") discount = promo.value;
    else if (promo.type === "delivery") discount = 2500;
    res.json({ valid: true, code: code.toUpperCase(), discount, description: promo.description, type: promo.type });
  });

  // Saved addresses
  app.get("/api/saved-addresses", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const addresses = await storage.getSavedAddresses(userId);
    res.json(addresses);
  });

  app.post("/api/saved-addresses", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const { label, address, lat, lng, isDefault } = req.body;
    if (!label || !address) return res.status(400).json({ message: "Label et adresse requis" });
    if (isDefault) await storage.setDefaultAddress(userId, -1);
    const addr = await storage.createSavedAddress({ userId, label, address, lat, lng, isDefault: isDefault || false });
    res.json(addr);
  });

  app.patch("/api/saved-addresses/:id", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const existing = await storage.getSavedAddresses(userId);
    if (!existing.find(a => a.id === Number(req.params.id))) return res.status(403).json({ message: "Acces refuse" });
    const addr = await storage.updateSavedAddress(Number(req.params.id), req.body);
    if (!addr) return res.status(404).json({ message: "Adresse non trouvee" });
    res.json(addr);
  });

  app.delete("/api/saved-addresses/:id", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const existing = await storage.getSavedAddresses(userId);
    if (!existing.find(a => a.id === Number(req.params.id))) return res.status(403).json({ message: "Acces refuse" });
    await storage.deleteSavedAddress(Number(req.params.id));
    res.json({ ok: true });
  });

  app.patch("/api/saved-addresses/:id/default", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.setDefaultAddress(userId, Number(req.params.id));
    res.json({ ok: true });
  });

  // Drivers CRUD
  app.get("/api/drivers", requireAuth, async (_req, res) => {
    const drivers = await storage.getDrivers();
    res.json(drivers.map(({ password: _, ...d }) => d));
  });

  app.get("/api/drivers/online", requireAuth, async (_req, res) => {
    const drivers = await storage.getOnlineDrivers();
    res.json(drivers.map(({ password: _, ...d }) => d));
  });

  app.post("/api/drivers", requireAdmin, async (req, res) => {
    const { email, password, name, phone, vehicleType, vehiclePlate, driverLicense, commissionRate } = req.body;
    if (!email || !password || !name || !phone) return res.status(400).json({ message: "Champs requis manquants" });
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(400).json({ message: "Email deja utilise" });
    const driver = await storage.createUser({
      email, password, name, phone, role: "driver",
      vehicleType, vehiclePlate, driverLicense,
      commissionRate: commissionRate || 15,
      walletBalance: 0, loyaltyPoints: 0, isOnline: false, isBlocked: false,
    });
    const { password: _, ...safe } = driver;
    res.json(safe);
  });

  app.patch("/api/drivers/:id", requireAdmin, async (req, res) => {
    const driver = await storage.updateUser(Number(req.params.id), req.body);
    if (!driver) return res.status(404).json({ message: "Livreur non trouve" });
    const { password: _, ...safe } = driver;
    res.json(safe);
  });

  app.delete("/api/drivers/:id", requireAdmin, async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    res.json({ ok: true });
  });

  app.patch("/api/drivers/:id/block", requireAdmin, async (req, res) => {
    const { isBlocked } = req.body;
    const driver = await storage.updateUser(Number(req.params.id), { isBlocked, isOnline: false });
    if (!driver) return res.status(404).json({ message: "Livreur non trouve" });
    broadcast({ type: "driver_blocked", driverId: driver.id, isBlocked });
    res.json({ ok: true });
  });

  app.patch("/api/drivers/:id/location", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const targetId = Number(req.params.id);
    const user = await storage.getUser(userId);
    if (!user || (user.role !== "admin" && userId !== targetId)) return res.status(403).json({ message: "Acces interdit" });
    const { lat, lng } = req.body;
    await storage.updateUser(targetId, { lat, lng });
    broadcast({ type: "driver_location", driverId: targetId, lat, lng });
    res.json({ ok: true });
  });

  app.patch("/api/drivers/:id/status", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const targetId = Number(req.params.id);
    const user = await storage.getUser(userId);
    if (!user || (user.role !== "admin" && userId !== targetId)) return res.status(403).json({ message: "Acces interdit" });
    const { isOnline } = req.body;
    await storage.updateUser(targetId, { isOnline });
    broadcast({ type: "driver_status", driverId: targetId, isOnline });
    res.json({ ok: true });
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

  // Clients
  app.get("/api/clients", requireAdmin, async (_req, res) => {
    const cl = await storage.getClients();
    res.json(cl.map(({ password: _, ...c }) => c));
  });

  // Notifications
  app.get("/api/notifications/:userId", requireAuth, async (req, res) => {
    const notifs = await storage.getNotifications(Number(req.params.userId));
    res.json(notifs);
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    await storage.markNotificationRead(Number(req.params.id));
    res.json({ ok: true });
  });

  app.patch("/api/notifications/read-all/:userId", requireAuth, async (req, res) => {
    await storage.markAllNotificationsRead(Number(req.params.userId));
    res.json({ ok: true });
  });

  // Chat
  app.get("/api/chat/contacts/:userId", requireAuth, async (req, res) => {
    const contacts = await storage.getChatContacts(Number(req.params.userId));
    res.json(contacts);
  });

  app.get("/api/chat/users-by-role/:role", requireAuth, async (req, res) => {
    const sessionUserId = (req.session as any)?.userId;
    const sessionUser = await storage.getUser(sessionUserId);
    if (!sessionUser) return res.status(401).json({ message: "Non authentifie" });
    const requestedRole = req.params.role;
    if (sessionUser.role === "client" && requestedRole !== "admin") return res.status(403).json({ message: "Acces interdit" });
    if (sessionUser.role === "driver" && requestedRole !== "admin") return res.status(403).json({ message: "Acces interdit" });
    const all = await storage.getAllUsers();
    const filtered = all
      .filter(u => u.role === requestedRole)
      .map(({ password: _, ...u }) => u);
    res.json(filtered);
  });

  app.get("/api/chat/unread/:userId", requireAuth, async (req, res) => {
    const sessionUserId = (req.session as any)?.userId;
    const userId = Number(req.params.userId);
    if (sessionUserId !== userId) return res.status(403).json({ message: "Acces interdit" });
    const all = await storage.getAllUsers();
    const counts: Record<number, number> = {};
    for (const u of all) {
      if (u.id === userId) continue;
      const msgs = await storage.getChatMessages(userId, u.id);
      const unread = msgs.filter(m => m.receiverId === userId && !m.isRead).length;
      if (unread > 0) counts[u.id] = unread;
    }
    res.json(counts);
  });

  app.patch("/api/chat/read/:senderId/:receiverId", requireAuth, async (req, res) => {
    const sessionUserId = (req.session as any)?.userId;
    const receiverId = Number(req.params.receiverId);
    if (sessionUserId !== receiverId) return res.status(403).json({ message: "Acces interdit" });
    const senderId = Number(req.params.senderId);
    const msgs = await storage.getChatMessages(senderId, receiverId);
    for (const m of msgs) {
      if (m.receiverId === receiverId && !m.isRead) {
        await storage.updateChatMessage(m.id, { isRead: true });
      }
    }
    res.json({ ok: true });
  });

  app.get("/api/chat/:userId1/:userId2", requireAuth, async (req, res) => {
    const sessionUserId = (req.session as any)?.userId;
    const userId1 = Number(req.params.userId1);
    const userId2 = Number(req.params.userId2);
    if (sessionUserId !== userId1 && sessionUserId !== userId2) {
      const sessionUser = await storage.getUser(sessionUserId);
      if (!sessionUser || sessionUser.role !== "admin") return res.status(403).json({ message: "Acces interdit" });
    }
    const msgs = await storage.getChatMessages(userId1, userId2);
    res.json(msgs);
  });

  app.post("/api/chat", requireAuth, async (req, res) => {
    const sessionUserId = (req.session as any)?.userId;
    if (sessionUserId !== req.body.senderId) return res.status(403).json({ message: "Acces interdit" });
    const msg = await storage.createChatMessage(req.body);
    sendToUser(req.body.receiverId, { type: "chat_message", message: msg });
    const sender = await storage.getUser(req.body.senderId);
    if (sender) {
      await storage.createNotification({
        userId: req.body.receiverId,
        title: "Nouveau message",
        message: `${sender.name}: ${req.body.message.substring(0, 50)}${req.body.message.length > 50 ? "..." : ""}`,
        type: "chat",
        isRead: false,
      });
      sendToUser(req.body.receiverId, {
        type: "notification",
        notification: { title: "Nouveau message", message: `${sender.name}: ${req.body.message.substring(0, 50)}` },
      });
    }
    res.json(msg);
  });

  // Wallet
  app.get("/api/wallet/:userId", requireAuth, async (req, res) => {
    const txns = await storage.getWalletTransactions(Number(req.params.userId));
    res.json(txns);
  });

  app.post("/api/wallet/topup", requireAuth, async (req, res) => {
    const { userId, amount, method } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Montant invalide" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouve" });
    await storage.updateUser(userId, { walletBalance: (user.walletBalance || 0) + amount });
    const txn = await storage.createWalletTransaction({
      userId, amount, type: "topup", description: `Recharge via ${method}`, reference: `TOP-${Date.now()}`
    });
    await storage.createFinance({
      type: "revenue", category: "wallet_topup", amount,
      description: `Recharge wallet ${user.name} via ${method}`, userId,
    });
    res.json(txn);
  });

  // Users management
  app.get("/api/users", requireAdmin, async (_req, res) => {
    const all = await storage.getAllUsers();
    res.json(all.map(({ password: _, ...u }) => u));
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    const user = await storage.updateUser(Number(req.params.id), req.body);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouve" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  // Finance
  app.get("/api/finance", requireAdmin, async (req, res) => {
    const filters: any = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
    const all = await storage.getFinances(Object.keys(filters).length ? filters : undefined);
    res.json(all);
  });

  app.get("/api/finance/summary", requireAdmin, async (req, res) => {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
    const summary = await storage.getFinanceSummary(dateFrom, dateTo);
    res.json(summary);
  });

  app.post("/api/finance", requireAdmin, async (req, res) => {
    const entry = await storage.createFinance(req.body);
    res.json(entry);
  });

  app.get("/api/finance/export", requireAdmin, async (req, res) => {
    const filters: any = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
    const data = await storage.getFinances(Object.keys(filters).length ? filters : undefined);

    const csv = [
      "ID,Type,Categorie,Montant (FC),Description,Reference,Date",
      ...data.map(f => `${f.id},${f.type},${f.category},${f.amount},"${f.description}",${f.reference || ""},${f.createdAt}`),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=finances_maweja_${new Date().toISOString().split("T")[0]}.csv`);
    res.send(csv);
  });

  app.get("/api/orders/export", requireAdmin, async (req, res) => {
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
    const data = await storage.getOrders(Object.keys(filters).length ? filters : undefined);

    const csv = [
      "Numero,Statut,Client ID,Restaurant ID,Livreur ID,Total (FC),Frais Livraison,Commission,Methode Paiement,Statut Paiement,Adresse,Date",
      ...data.map(o => `${o.orderNumber},${o.status},${o.clientId},${o.restaurantId},${o.driverId || ""},${o.total},${o.deliveryFee},${o.commission},"${o.paymentMethod}",${o.paymentStatus},"${o.deliveryAddress}",${o.createdAt}`),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=commandes_maweja_${new Date().toISOString().split("T")[0]}.csv`);
    res.send(csv);
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAdmin, async (_req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  const httpServer = createServer(app);

  // WebSocket
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const userId = Number(url.searchParams.get("userId"));
    if (userId) {
      clients.set(userId, ws);
      ws.on("close", () => clients.delete(userId));
    }
    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "ping") ws.send(JSON.stringify({ type: "pong" }));
      } catch {}
    });
  });

  return httpServer;
}
