import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validate, schemas } from "../validators";
import { wsClients } from "../websocket";
import { WebSocket } from "ws";

export function registerNotificationsRoutes(app: Express): void {
  app.get("/api/notifications/:userId", requireAuth, async (req, res) => {
    const sessionUserId = (req.session as any)?.userId;
    const targetUserId = Number(req.params.userId);
    const sessionUser = await storage.getUser(sessionUserId);
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUserId !== targetUserId)) {
      return res.status(403).json({ message: "Acces refuse" });
    }
    const notifs = await storage.getNotifications(targetUserId);
    res.json(notifs);
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    await storage.markNotificationRead(Number(req.params.id));
    res.json({ ok: true });
  });

  app.patch("/api/notifications/read-all/:userId", requireAuth, async (req, res) => {
    const sessionUserId = (req.session as any)?.userId;
    const targetUserId = Number(req.params.userId);
    const sessionUser = await storage.getUser(sessionUserId);
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUserId !== targetUserId)) {
      return res.status(403).json({ message: "Acces refuse" });
    }
    await storage.markAllNotificationsRead(targetUserId);
    res.json({ ok: true });
  });

  app.post("/api/notifications/broadcast", requireAdmin, validate(schemas.broadcastNotification), async (req, res) => {
    const { title, message, type, targetSegment, targetUserIds, imageUrl } = req.body;
    let targetUsers: any[] = [];
    if (targetUserIds && targetUserIds.length > 0) {
      const allUsers = await storage.getAllUsers();
      targetUsers = allUsers.filter((u: any) => targetUserIds.includes(u.id));
    } else if (targetSegment === "all_clients") {
      targetUsers = await storage.getClients();
    } else if (targetSegment === "frequent_food") {
      const allClients = await storage.getClients();
      const allOrders = await storage.getOrders({});
      const orderCounts: Record<number, number> = {};
      for (const o of allOrders) {
        orderCounts[o.clientId] = (orderCounts[o.clientId] || 0) + 1;
      }
      targetUsers = allClients.filter((c: any) => (orderCounts[c.id] || 0) >= 3);
    } else if (targetSegment === "service_users") {
      const allRequests = await storage.getServiceRequests({});
      const clientIds = [...new Set(allRequests.map((r: any) => r.clientId))];
      const allUsers = await storage.getAllUsers();
      targetUsers = allUsers.filter((u: any) => clientIds.includes(u.id));
    } else if (targetSegment === "inactive") {
      const allClients = await storage.getClients();
      const allOrders = await storage.getOrders({});
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const activeClientIds = new Set(allOrders.filter((o: any) => new Date(o.createdAt!) > thirtyDaysAgo).map((o: any) => o.clientId));
      targetUsers = allClients.filter((c: any) => !activeClientIds.has(c.id));
    } else if (targetSegment === "high_value") {
      const allClients = await storage.getClients();
      const allOrders = await storage.getOrders({});
      const spending: Record<number, number> = {};
      for (const o of allOrders) if (o.status === "delivered") spending[o.clientId] = (spending[o.clientId] || 0) + o.total;
      targetUsers = allClients.filter((c: any) => (spending[c.id] || 0) >= 50000);
    } else if (targetSegment === "new_clients") {
      const allClients = await storage.getClients();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      targetUsers = allClients.filter((c: any) => new Date(c.createdAt!) > sevenDaysAgo);
    } else {
      targetUsers = await storage.getClients();
    }
    let sent = 0;
    for (const u of targetUsers) {
      await storage.createNotification({
        userId: u.id,
        title: title || "Notification MAWEJA",
        message: message || "",
        type: type || "promo",
        imageUrl: imageUrl || null,
        data: { broadcast: true },
        isRead: false,
      });
      const ws = wsClients.get(u.id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "notification", data: { title, message, imageUrl: imageUrl || null } }));
      }
      sent++;
    }
    res.json({ success: true, sent });
  });
}
