import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validate, schemas } from "../validators";
import { wsClients } from "../websocket";
import { WebSocket } from "ws";
import { sendPushToUser, type PushResult } from "../lib/push";
import { logger } from "../lib/logger";

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

  // Marquer UNE notification comme lue.
  // Sécurité critique : vérifier que la notif appartient bien à l'utilisateur
  // connecté (sauf pour les admins). Avant ce fix, n'importe quel user
  // authentifié pouvait marquer la notif d'un autre user comme lue.
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    const sessionUserId = (req.session as any)?.userId;
    const notifId = Number(req.params.id);
    if (!Number.isFinite(notifId) || notifId <= 0) {
      return res.status(400).json({ message: "ID invalide" });
    }
    const sessionUser = await storage.getUser(sessionUserId);
    if (!sessionUser) return res.status(401).json({ message: "Non authentifie" });

    const notif = await storage.getNotification(notifId);
    if (!notif) return res.status(404).json({ message: "Notification introuvable" });

    // Admin peut tout, sinon : ownership strict
    if (sessionUser.role !== "admin" && notif.userId !== sessionUserId) {
      return res.status(403).json({ message: "Acces refuse" });
    }
    await storage.markNotificationRead(notifId);
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
    let pushSent = 0;
    let pushFailed = 0;
    let pushSkipped = 0;
    const pushPromises: Promise<PushResult>[] = [];

    for (const u of targetUsers) {
      // skipAutoPush: on enverra le push nous-mêmes pour collecter le résultat
      const created = await storage.createNotification({
        userId: u.id,
        title: title || "Notification MAWEJA",
        message: message || "",
        type: type || "promo",
        imageUrl: imageUrl || null,
        // data persisté côté DB → contient l'image (utile pour rendu in-app)
        // notificationId est porté par la colonne `id` de la ligne.
        data: { broadcast: true, imageUrl: imageUrl || null },
        isRead: false,
      }, { skipAutoPush: true });

      // WebSocket — toujours inclure id + notificationId pour la dé-dup côté client
      const ws = wsClients.get(u.id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "notification",
          data: {
            id: created.id,
            notificationId: created.id,
            title,
            message,
            imageUrl: imageUrl || null,
            type: type || "promo",
          },
        }));
      }

      // Push natif (FCM) — collecté pour les compteurs
      pushPromises.push(sendPushToUser(u.id, {
        title: title || "MAWEJA",
        body: message || "",
        imageUrl: imageUrl || undefined,
        data: {
          type: String(type || "promo"),
          notificationId: String(created.id),
          eventType: "broadcast",
          broadcast: "true",
        },
      }).catch((e): PushResult => ({
        status: "failed",
        sentCount: 0,
        failedCount: 1,
        invalidTokenCount: 0,
        reason: String(e?.message || e),
      })));

      sent++;
    }

    const results = await Promise.all(pushPromises);
    for (const r of results) {
      if (r.status === "sent") pushSent++;
      else if (r.status === "failed") pushFailed++;
      else pushSkipped++;
    }

    logger.info?.(`[broadcast] segment=${targetSegment || "custom"} sent=${sent} pushSent=${pushSent} pushFailed=${pushFailed} pushSkipped=${pushSkipped}`);
    res.json({ success: true, sent, pushSent, pushFailed, pushSkipped });
  });
}
