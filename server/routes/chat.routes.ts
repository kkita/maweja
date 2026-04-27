import type { Express } from "express";
import path from "path";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth.middleware";
import { resolveUserFromRequest } from "../middleware/auth.middleware";
import { chatUpload } from "../middleware/upload.middleware";
import { uploadLimiter } from "../auth";
import { validate, schemas } from "../validators";
import { sendToUser } from "../websocket";
import { logger } from "../lib/logger";

/* ─── Helpers : permissions de chat ──────────────────────────
   Règles MAWEJA :
   • Admin ↔ Tout le monde : autorisé en permanence
   • Client ↔ Driver : autorisé UNIQUEMENT s'il existe une commande
     active entre eux (statut ≠ delivered / cancelled / returned).
     Dès que la commande est livrée/annulée, le chat est verrouillé.
   • Toute autre combinaison (client↔client, driver↔driver) : refusée
*/
const TERMINAL_STATUSES = ["delivered", "cancelled", "returned"];

async function getActiveOrderBetween(
  clientId: number,
  driverId: number,
): Promise<{ id: number; status: string } | null> {
  const list = await storage.getOrders({ clientId, driverId });
  const active = list.find(o => !TERMINAL_STATUSES.includes(o.status));
  return active ? { id: active.id, status: active.status } : null;
}

async function canChatBetween(userAId: number, userBId: number): Promise<boolean> {
  if (userAId === userBId) return false;
  const [a, b] = await Promise.all([storage.getUser(userAId), storage.getUser(userBId)]);
  if (!a || !b) return false;
  if (a.role === "admin" || b.role === "admin") return true;
  const client = a.role === "client" ? a : b.role === "client" ? b : null;
  const driver = a.role === "driver" ? a : b.role === "driver" ? b : null;
  if (!client || !driver) return false;
  const active = await getActiveOrderBetween(client.id, driver.id);
  return !!active;
}

export function registerChatRoutes(app: Express): void {
  app.get("/api/chat/contacts/:userId", requireAuth, async (req: any, res) => {
    const sessionUserId = (req.session as any)?.userId;
    const targetId = Number(req.params.userId);
    if (sessionUserId !== targetId) {
      const sessionUser = sessionUserId ? await storage.getUser(sessionUserId) : null;
      if (!sessionUser || sessionUser.role !== "admin") return res.status(403).json({ message: "Acces interdit" });
    }
    const contacts = await storage.getChatContacts(targetId);
    res.json(contacts);
  });

  app.get("/api/chat/users-by-role/:role", requireAuth, async (req, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    const sessionUser = sessionUserId ? await storage.getUser(sessionUserId) : null;
    if (!sessionUser) return res.status(401).json({ message: "Non authentifie" });
    const requestedRole = req.params.role;
    if (sessionUser.role === "client" && requestedRole !== "admin") return res.status(403).json({ message: "Acces interdit" });
    if (sessionUser.role === "driver" && requestedRole !== "admin") return res.status(403).json({ message: "Acces interdit" });
    const all = await storage.getAllUsers();
    const filtered = all.filter(u => u.role === requestedRole).map(({ password: _, ...u }) => u);
    res.json(filtered);
  });

  /**
   * Renvoie le partenaire de chat d'une commande (driver côté client,
   * client côté driver) + l'état actif/verrouillé du chat.
   * Utilisé par le bouton "Discuter" du suivi de commande / écran agent.
   */
  app.get("/api/chat/order-partner/:orderId", requireAuth, async (req, res) => {
    const orderId = Number(req.params.orderId);
    if (!orderId) return res.status(400).json({ message: "Identifiant de commande invalide" });
    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Commande introuvable" });

    const sessionUserId = (req.session as any)?.userId;
    const sessionUser = sessionUserId ? await storage.getUser(sessionUserId) : null;
    if (!sessionUser) return res.status(401).json({ message: "Non authentifie" });

    let partnerId: number | null = null;
    if (sessionUser.role === "client" && order.clientId === sessionUser.id) {
      partnerId = order.driverId ?? null;
    } else if (sessionUser.role === "driver" && order.driverId === sessionUser.id) {
      partnerId = order.clientId;
    } else if (sessionUser.role === "admin") {
      partnerId = order.driverId ?? order.clientId;
    } else {
      return res.status(403).json({ message: "Acces interdit" });
    }

    const active = !TERMINAL_STATUSES.includes(order.status);
    if (!partnerId) {
      return res.json({ partner: null, active, orderId, status: order.status });
    }

    const partner = await storage.getUser(partnerId);
    if (!partner) return res.json({ partner: null, active, orderId, status: order.status });
    const { password: _, ...safe } = partner as any;
    res.json({ partner: safe, active, orderId, status: order.status });
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
    const sessionUser = await storage.getUser(sessionUserId);
    if (!sessionUser) return res.status(401).json({ message: "Non authentifie" });

    // L'admin lit tout. Sinon, l'utilisateur doit faire partie de la conversation
    // ET être autorisé à discuter avec l'autre partie.
    if (sessionUser.role !== "admin") {
      if (sessionUserId !== userId1 && sessionUserId !== userId2) {
        return res.status(403).json({ message: "Acces interdit" });
      }
      const allowed = await canChatBetween(userId1, userId2);
      if (!allowed) return res.status(403).json({ message: "Conversation non autorisée — aucune commande active entre vous." });
    }

    const msgs = await storage.getChatMessages(userId1, userId2);
    res.json(msgs);
  });

  app.post("/api/chat/upload", requireAuth, uploadLimiter, chatUpload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });
    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileType = ext === ".pdf" ? "pdf" : "image";
    const fileUrl = `/uploads/chat/${req.file.filename}`;
    res.json({ fileUrl, fileType, originalName: req.file.originalname });
  });

  app.post("/api/chat", requireAuth, validate(schemas.chatMessage), async (req, res) => {
    const sessionUserId = (req.session as any)?.userId;
    if (sessionUserId !== req.body.senderId) return res.status(403).json({ message: "Acces interdit" });

    const { senderId, receiverId, message = "", fileUrl, fileType, isRead } = req.body;

    // Vérifie l'autorisation client↔driver / role↔admin
    const allowed = await canChatBetween(senderId, receiverId);
    if (!allowed) {
      return res.status(403).json({ message: "Conversation non autorisée — aucune commande active entre vous." });
    }

    const msg = await storage.createChatMessage({ senderId, receiverId, message, fileUrl: fileUrl || null, fileType: fileType || null, isRead: isRead ?? false });
    sendToUser(receiverId, { type: "chat_message", message: msg });
    const sender = await storage.getUser(senderId);
    const receiver = await storage.getUser(receiverId);
    if (sender) {
      const notifText = fileType === "pdf"
        ? `📎 ${sender.name}: Document partagé`
        : fileType === "image"
        ? `🖼️ ${sender.name}: Image partagée`
        : `${sender.name}: ${(message || "").substring(0, 50)}${(message || "").length > 50 ? "..." : ""}`;
      const createdNotif = await storage.createNotification({
        userId: receiverId,
        title: "Nouveau message",
        message: notifText,
        type: "chat",
        isRead: false,
      });
      sendToUser(receiverId, {
        type: "notification",
        notification: { id: createdNotif.id, title: "Nouveau message", message: notifText, type: "chat" },
      });

      // Fanout temps-réel vers les admins (Dashboard) — sauf si l'expéditeur ou
      // le destinataire est déjà admin (évite l'auto-notification)
      const senderIsAdmin = sender.role === "admin";
      const receiverIsAdmin = receiver?.role === "admin";
      if (!senderIsAdmin && !receiverIsAdmin) {
        try {
          const admins = (await storage.getAllUsers()).filter(u => u.role === "admin");
          const adminMsg = `${sender.name} → ${receiver?.name || "destinataire"}: ${notifText.replace(`${sender.name}: `, "")}`;
          for (const admin of admins) {
            sendToUser(admin.id, {
              type: "chat_message",
              message: msg,
              meta: { adminPreview: true, senderName: sender.name, receiverName: receiver?.name },
            });
          }
        } catch (e) { logger.error("[chat] admin fanout failed", e); }
      }
    }
    res.json(msg);
  });
}
