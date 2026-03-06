import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";

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
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email et mot de passe requis" });
    const user = await storage.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "Votre compte a ete bloque. Contactez le support." });
    }
    (req.session as any).userId = user.id;
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, phone, role, address } = req.body;
    if (!email || !password || !name || !phone) return res.status(400).json({ message: "Tous les champs sont requis" });
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(400).json({ message: "Cet email existe deja" });
    const user = await storage.createUser({
      email, password, name, phone, role: role || "client",
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
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Commande non trouvee" });
    res.json(order);
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    const orderNumber = `MAW-${Date.now().toString(36).toUpperCase()}`;
    const commission = Math.round(req.body.subtotal * 0.15);
    const order = await storage.createOrder({ ...req.body, orderNumber, commission });

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

  app.get("/api/chat/:userId1/:userId2", requireAuth, async (req, res) => {
    const msgs = await storage.getChatMessages(Number(req.params.userId1), Number(req.params.userId2));
    res.json(msgs);
  });

  app.post("/api/chat", requireAuth, async (req, res) => {
    const msg = await storage.createChatMessage(req.body);
    sendToUser(req.body.receiverId, { type: "chat_message", message: msg });
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
