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

async function requireRole(role: string, req: any, res: any, next: any) {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ message: "Non authentifie" });
  const user = await storage.getUser(userId);
  if (!user || user.role !== role) return res.status(403).json({ message: "Acces interdit" });
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    (req.session as any).userId = user.id;
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, phone, role } = req.body;
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(400).json({ message: "Cet email existe deja" });
    const user = await storage.createUser({ email, password, name, phone, role: role || "client", walletBalance: 0, loyaltyPoints: 0, isOnline: false });
    (req.session as any).userId = user.id;
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Non authentifie" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Utilisateur non trouve" });
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

  app.post("/api/restaurants", async (req, res) => {
    const r = await storage.createRestaurant(req.body);
    res.json(r);
  });

  app.patch("/api/restaurants/:id", async (req, res) => {
    const r = await storage.updateRestaurant(Number(req.params.id), req.body);
    res.json(r);
  });

  // Menu items
  app.get("/api/restaurants/:id/menu", async (req, res) => {
    const items = await storage.getMenuItems(Number(req.params.id));
    res.json(items);
  });

  app.post("/api/menu-items", async (req, res) => {
    const item = await storage.createMenuItem(req.body);
    res.json(item);
  });

  app.patch("/api/menu-items/:id", async (req, res) => {
    const item = await storage.updateMenuItem(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/menu-items/:id", async (req, res) => {
    await storage.deleteMenuItem(Number(req.params.id));
    res.json({ ok: true });
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    const filters: any = {};
    if (req.query.clientId) filters.clientId = Number(req.query.clientId);
    if (req.query.driverId) filters.driverId = Number(req.query.driverId);
    if (req.query.status) filters.status = req.query.status;
    const all = await storage.getOrders(Object.keys(filters).length ? filters : undefined);
    res.json(all);
  });

  app.get("/api/orders/:id", async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Commande non trouvee" });
    res.json(order);
  });

  app.post("/api/orders", async (req, res) => {
    const orderNumber = `MAW-${String(Date.now()).slice(-6)}`;
    const order = await storage.createOrder({ ...req.body, orderNumber });

    // Notify admin
    broadcast({ type: "new_order", order });

    // Notify client
    await storage.createNotification({
      userId: order.clientId,
      title: "Commande confirmee",
      message: `Votre commande ${orderNumber} a ete recue`,
      type: "order",
      data: { orderId: order.id },
      isRead: false,
    });

    res.json(order);
  });

  app.patch("/api/orders/:id", async (req, res) => {
    const order = await storage.updateOrder(Number(req.params.id), req.body);
    if (!order) return res.status(404).json({ message: "Commande non trouvee" });

    broadcast({ type: "order_updated", order });

    if (req.body.driverId) {
      await storage.createNotification({
        userId: req.body.driverId,
        title: "Nouvelle livraison",
        message: `Commande ${order.orderNumber} vous a ete assignee`,
        type: "delivery",
        data: { orderId: order.id },
        isRead: false,
      });
    }

    if (req.body.status) {
      const statusMessages: Record<string, string> = {
        confirmed: "Votre commande a ete confirmee",
        preparing: "Votre commande est en preparation",
        ready: "Votre commande est prete",
        picked_up: "Votre commande est en route",
        delivered: "Votre commande a ete livree",
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
    }

    res.json(order);
  });

  // Drivers
  app.get("/api/drivers", async (_req, res) => {
    const drivers = await storage.getDrivers();
    res.json(drivers.map(({ password: _, ...d }) => d));
  });

  app.get("/api/drivers/online", async (_req, res) => {
    const drivers = await storage.getOnlineDrivers();
    res.json(drivers.map(({ password: _, ...d }) => d));
  });

  app.patch("/api/drivers/:id/location", async (req, res) => {
    const { lat, lng } = req.body;
    const driver = await storage.updateUser(Number(req.params.id), { lat, lng });
    broadcast({ type: "driver_location", driverId: Number(req.params.id), lat, lng });
    res.json({ ok: true });
  });

  app.patch("/api/drivers/:id/status", async (req, res) => {
    const { isOnline } = req.body;
    await storage.updateUser(Number(req.params.id), { isOnline });
    broadcast({ type: "driver_status", driverId: Number(req.params.id), isOnline });
    res.json({ ok: true });
  });

  // Notifications
  app.get("/api/notifications/:userId", async (req, res) => {
    const notifs = await storage.getNotifications(Number(req.params.userId));
    res.json(notifs);
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    await storage.markNotificationRead(Number(req.params.id));
    res.json({ ok: true });
  });

  // Chat
  app.get("/api/chat/:userId1/:userId2", async (req, res) => {
    const msgs = await storage.getChatMessages(Number(req.params.userId1), Number(req.params.userId2));
    res.json(msgs);
  });

  app.post("/api/chat", async (req, res) => {
    const msg = await storage.createChatMessage(req.body);
    sendToUser(req.body.receiverId, { type: "chat_message", message: msg });
    res.json(msg);
  });

  // Wallet
  app.get("/api/wallet/:userId", async (req, res) => {
    const txns = await storage.getWalletTransactions(Number(req.params.userId));
    res.json(txns);
  });

  app.post("/api/wallet/topup", async (req, res) => {
    const { userId, amount, method } = req.body;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouve" });
    await storage.updateUser(userId, { walletBalance: (user.walletBalance || 0) + amount });
    const txn = await storage.createWalletTransaction({
      userId, amount, type: "topup", description: `Recharge via ${method}`, reference: `TOP-${Date.now()}`
    });
    res.json(txn);
  });

  // Users
  app.get("/api/users", async (_req, res) => {
    const all = await storage.getDrivers();
    const clients: any[] = [];
    res.json([...all, ...clients].map(({ password: _, ...u }) => u));
  });

  app.patch("/api/users/:id", async (req, res) => {
    const user = await storage.updateUser(Number(req.params.id), req.body);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouve" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (_req, res) => {
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
