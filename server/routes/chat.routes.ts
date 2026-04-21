import type { Express } from "express";
import path from "path";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth.middleware";
import { resolveUserFromRequest } from "../middleware/auth.middleware";
import { chatUpload } from "../middleware/upload.middleware";
import { uploadLimiter } from "../auth";
import { validate, schemas } from "../validators";
import { sendToUser } from "../websocket";

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
    const msg = await storage.createChatMessage({ senderId, receiverId, message, fileUrl: fileUrl || null, fileType: fileType || null, isRead: isRead ?? false });
    sendToUser(receiverId, { type: "chat_message", message: msg });
    const sender = await storage.getUser(senderId);
    if (sender) {
      const notifText = fileType === "pdf"
        ? `📎 ${sender.name}: Document partagé`
        : fileType === "image"
        ? `🖼️ ${sender.name}: Image partagée`
        : `${sender.name}: ${(message || "").substring(0, 50)}${(message || "").length > 50 ? "..." : ""}`;
      await storage.createNotification({
        userId: receiverId,
        title: "Nouveau message",
        message: notifText,
        type: "chat",
        isRead: false,
      });
      sendToUser(receiverId, {
        type: "notification",
        notification: { title: "Nouveau message", message: notifText },
      });
    }
    res.json(msg);
  });
}
