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
import { POST_DELIVERY_CHAT_WINDOW_MINUTES } from "@shared/schema";

/* ─── Helpers : permissions de chat ──────────────────────────
   Règles MAWEJA :
   • Admin ↔ Tout le monde : autorisé en permanence
   • Client ↔ Driver : autorisé si UNE des conditions ci-dessous est vraie
       1) commande active entre eux (statut ≠ delivered / cancelled / returned)
       2) commande livrée depuis moins de POST_DELIVERY_CHAT_WINDOW_MINUTES
       3) ticket support "open" lié à une commande entre eux
     Sinon, le chat avec le livreur est verrouillé (l'utilisateur est invité
     à passer par le support — il n'est PAS déconnecté).
   • Toute autre combinaison (client↔client, driver↔driver) : refusée
*/
const TERMINAL_STATUSES = ["delivered", "cancelled", "returned"];
const POST_DELIVERY_WINDOW_MS = POST_DELIVERY_CHAT_WINDOW_MINUTES * 60 * 1000;

export type ChatStatusReason =
  | "active"
  | "post_delivery_window"
  | "support_open"
  | "closed"
  | "no_history"
  | "admin"
  | "not_allowed";

export interface ChatStatus {
  allowed: boolean;
  reason: ChatStatusReason;
  orderId: number | null;
  orderStatus: string | null;
  deliveredAt: Date | null;
  /** Date d'expiration de la fenêtre post-livraison (si applicable). */
  postDeliveryExpiresAt: Date | null;
  supportTicketId: number | null;
}

async function getActiveOrderBetween(
  clientId: number,
  driverId: number,
): Promise<{ id: number; status: string } | null> {
  const list = await storage.getOrders({ clientId, driverId });
  const active = list.find(o => !TERMINAL_STATUSES.includes(o.status));
  return active ? { id: active.id, status: active.status } : null;
}

/**
 * Évalue l'état du chat entre deux utilisateurs (sans contexte de commande
 * spécifique). Renvoie la raison détaillée pour permettre à l'UI d'afficher
 * un message clair quand le chat est fermé.
 */
export async function getChatStatusBetween(
  userAId: number,
  userBId: number,
): Promise<ChatStatus> {
  const empty: ChatStatus = {
    allowed: false,
    reason: "not_allowed",
    orderId: null,
    orderStatus: null,
    deliveredAt: null,
    postDeliveryExpiresAt: null,
    supportTicketId: null,
  };
  if (userAId === userBId) return empty;
  const [a, b] = await Promise.all([storage.getUser(userAId), storage.getUser(userBId)]);
  if (!a || !b) return empty;
  if (a.role === "admin" || b.role === "admin") {
    return { ...empty, allowed: true, reason: "admin" };
  }
  const client = a.role === "client" ? a : b.role === "client" ? b : null;
  const driver = a.role === "driver" ? a : b.role === "driver" ? b : null;
  if (!client || !driver) return empty;

  const list = await storage.getOrders({ clientId: client.id, driverId: driver.id });

  // 1) commande active
  const active = list.find(o => !TERMINAL_STATUSES.includes(o.status));
  if (active) {
    return {
      allowed: true,
      reason: "active",
      orderId: active.id,
      orderStatus: active.status,
      deliveredAt: null,
      postDeliveryExpiresAt: null,
      supportTicketId: null,
    };
  }

  // 2) fenêtre post-livraison
  const delivered = list
    .filter(o => o.status === "delivered" && o.deliveredAt)
    .sort((x, y) => +new Date(y.deliveredAt!) - +new Date(x.deliveredAt!));
  const now = Date.now();
  for (const ord of delivered) {
    const dAt = new Date(ord.deliveredAt!);
    const elapsed = now - dAt.getTime();
    if (elapsed <= POST_DELIVERY_WINDOW_MS) {
      return {
        allowed: true,
        reason: "post_delivery_window",
        orderId: ord.id,
        orderStatus: ord.status,
        deliveredAt: dAt,
        postDeliveryExpiresAt: new Date(dAt.getTime() + POST_DELIVERY_WINDOW_MS),
        supportTicketId: null,
      };
    }
  }

  // 3) ticket support open lié à une de leurs commandes
  for (const ord of list) {
    const ticket = await storage.getOpenSupportTicketByOrder(ord.id);
    if (ticket) {
      return {
        allowed: true,
        reason: "support_open",
        orderId: ord.id,
        orderStatus: ord.status,
        deliveredAt: ord.deliveredAt ? new Date(ord.deliveredAt) : null,
        postDeliveryExpiresAt: null,
        supportTicketId: ticket.id,
      };
    }
  }

  // chat fermé — on renvoie quand même la dernière commande connue pour
  // que l'UI puisse présenter le bouton "Contacter le support" pour cet ordre.
  const lastOrder =
    delivered[0] ||
    list.slice().sort((x, y) => +new Date(y.createdAt!) - +new Date(x.createdAt!))[0] ||
    null;
  return {
    allowed: false,
    reason: lastOrder ? "closed" : "no_history",
    orderId: lastOrder?.id ?? null,
    orderStatus: lastOrder?.status ?? null,
    deliveredAt: lastOrder?.deliveredAt ? new Date(lastOrder.deliveredAt) : null,
    postDeliveryExpiresAt: null,
    supportTicketId: null,
  };
}

async function canChatBetween(userAId: number, userBId: number): Promise<boolean> {
  return (await getChatStatusBetween(userAId, userBId)).allowed;
}

export function registerChatRoutes(app: Express): void {
  app.get("/api/chat/contacts/:userId", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
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

    const sessionUserId = await resolveUserFromRequest(req);
    const sessionUser = sessionUserId ? await storage.getUser(sessionUserId) : null;
    if (!sessionUser) return res.status(401).json({ message: "Non authentifie" });

    let partnerId: number | null = null;
    if (sessionUser.role === "admin") {
      partnerId = order.driverId ?? order.clientId;
    } else if (sessionUser.role === "driver") {
      // L'agent doit être assigné à cette commande pour ouvrir le chat
      if (order.driverId !== sessionUser.id) {
        return res.status(403).json({ message: "Cette commande ne vous est pas assignée." });
      }
      partnerId = order.clientId;
    } else if (sessionUser.role === "client") {
      if (order.clientId !== sessionUser.id) {
        return res.status(403).json({ message: "Cette commande ne vous appartient pas." });
      }
      partnerId = order.driverId ?? null;
    } else {
      return res.status(403).json({ message: "Acces interdit" });
    }

    const active = !TERMINAL_STATUSES.includes(order.status);

    // État détaillé du chat (3 conditions cumulatives) — calculé seulement
    // si on a un partenaire client/driver identifié.
    let chatStatus: ChatStatus | null = null;
    if (partnerId && sessionUser.role !== "admin") {
      chatStatus = await getChatStatusBetween(sessionUser.id, partnerId);
    }
    // Pour l'admin on autorise toujours, pas besoin d'évaluer la fenêtre.
    const chatAllowed =
      sessionUser.role === "admin"
        ? true
        : chatStatus
        ? chatStatus.allowed
        : false;
    const chatReason = sessionUser.role === "admin" ? "admin" : chatStatus?.reason ?? "no_history";
    const supportTicketOpen = await storage.getOpenSupportTicketByOrder(order.id);

    const basePayload = {
      orderId,
      status: order.status,
      active,
      deliveredAt: order.deliveredAt ?? null,
      postDeliveryWindowMinutes: POST_DELIVERY_CHAT_WINDOW_MINUTES,
      postDeliveryExpiresAt: chatStatus?.postDeliveryExpiresAt ?? null,
      supportTicketId: supportTicketOpen?.id ?? null,
      chatAllowed,
      chatReason,
    };

    if (!partnerId) {
      return res.json({ partner: null, ...basePayload });
    }

    const partner = await storage.getUser(partnerId);
    if (!partner) return res.json({ partner: null, ...basePayload });
    const { password: _, ...safe } = partner as any;
    res.json({ partner: safe, ...basePayload });
  });

  app.get("/api/chat/unread/:userId", requireAuth, async (req, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
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
    const sessionUserId = await resolveUserFromRequest(req);
    const receiverId = Number(req.params.receiverId);
    if (sessionUserId !== receiverId) return res.status(403).json({ message: "Acces interdit" });
    const senderId = Number(req.params.senderId);
    // On charge UNIQUEMENT les messages du sender→receiver pour éviter
    // d'altérer d'autres conversations (ex: messages d'un admin parallèles).
    const msgs = await storage.getChatMessages(senderId, receiverId);
    for (const m of msgs) {
      if (m.senderId === senderId && m.receiverId === receiverId && !m.isRead) {
        await storage.updateChatMessage(m.id, { isRead: true });
      }
    }
    res.json({ ok: true });
  });

  app.get("/api/chat/:userId1/:userId2", requireAuth, async (req, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    const userId1 = Number(req.params.userId1);
    const userId2 = Number(req.params.userId2);
    const sessionUser = sessionUserId ? await storage.getUser(sessionUserId) : null;
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
    const sessionUserId = await resolveUserFromRequest(req);
    if (sessionUserId !== req.body.senderId) return res.status(403).json({ message: "Acces interdit" });

    const { senderId, receiverId, message = "", fileUrl, fileType, isRead } = req.body;

    // Vérifie l'autorisation client↔driver / role↔admin
    const allowed = await canChatBetween(senderId, receiverId);
    if (!allowed) {
      return res.status(403).json({ message: "Conversation non autorisée — aucune commande active entre vous." });
    }

    const msg = await storage.createChatMessage({ senderId, receiverId, message, fileUrl: fileUrl || null, fileType: fileType || null, isRead: isRead ?? false });
    const sender = await storage.getUser(senderId);
    const receiver = await storage.getUser(receiverId);

    // Tente de retrouver une commande active entre Agent et Client pour enrichir la notif
    let activeOrderId: number | undefined;
    if (sender && receiver) {
      const a = sender.role === "client" ? sender : receiver.role === "client" ? receiver : null;
      const b = sender.role === "driver" ? sender : receiver.role === "driver" ? receiver : null;
      if (a && b) {
        const active = await getActiveOrderBetween(a.id, b.id);
        if (active) activeOrderId = active.id;
      }
    }

    // ─── Receiver direct WS event (chat_message réel — déclenche son/notif)
    const wsDelivered = sendToUser(receiverId, {
      type: "chat_message",
      message: msg,
      data: { orderId: activeOrderId, senderId, type: "chat" },
    });

    if (sender) {
      // Titre orienté rôle pour deep-link clair côté UI
      const receiverIsClient = receiver?.role === "client";
      const receiverIsDriver = receiver?.role === "driver";
      const notifTitle = receiverIsClient
        ? "Message de votre agent MAWEJA"
        : receiverIsDriver
        ? "Message du client"
        : "Nouveau message";

      const notifText = fileType === "pdf"
        ? `📎 ${sender.name}: Document partagé`
        : fileType === "image"
        ? `🖼️ ${sender.name}: Image partagée`
        : `${sender.name}: ${(message || "").substring(0, 50)}${(message || "").length > 50 ? "..." : ""}`;

      // Deep-link cohérent (utilisé par le front pour ouvrir la bonne vue)
      const deepLink = receiverIsDriver && activeOrderId
        ? `/driver/chat/order/${activeOrderId}`
        : activeOrderId
        ? `/chat/order/${activeOrderId}`
        : "/notifications";

      // Note: types natifs (number) — le push FCM auto stringifie via storage.createNotification
      const notifData: Record<string, any> = {
        type: "chat",
        eventType: "chat:new_message",
        senderId,
        receiverId,
        deepLink,
      };
      if (activeOrderId) notifData.orderId = activeOrderId;

      // Source unique de vérité : on skip l'auto-push de createNotification()
      // pour faire UN SEUL appel sendPushToUser ici et pouvoir LOGGER le résultat
      // (status, sentCount, failedCount, skippedReason).
      const createdNotif = await storage.createNotification({
        userId: receiverId,
        title: notifTitle,
        message: notifText,
        type: "chat",
        data: notifData,
        isRead: false,
      }, { skipAutoPush: true });

      // Notif WS pour l'UI in-app (badge, toast, refresh liste notifs)
      sendToUser(receiverId, {
        type: "notification",
        notification: {
          id: createdNotif.id,
          title: notifTitle,
          message: notifText,
          type: "chat",
          data: notifData,
        },
      });

      // Push FCM (no-op si Firebase non configuré ou aucun token)
      let pushResultLabel = "skipped";
      try {
        const { sendPushToUser } = await import("../lib/push");
        const pushDataStr: Record<string, string> = {
          type: "chat",
          eventType: "chat:new_message",
          notificationId: String(createdNotif.id),
          senderId: String(senderId),
          receiverId: String(receiverId),
          deepLink,
        };
        if (activeOrderId) pushDataStr.orderId = String(activeOrderId);
        const pushResult = await sendPushToUser(receiverId, {
          title: notifTitle,
          body: notifText,
          data: pushDataStr,
        });
        pushResultLabel = pushResult.status === "skipped"
          ? `skipped:${pushResult.skippedReason ?? "unknown"}`
          : `${pushResult.status}(sent=${pushResult.sentCount}/failed=${pushResult.failedCount})`;
      } catch (e) {
        logger.error("[chat] push send failed", e);
        pushResultLabel = "error";
      }

      // Log final structuré bout-en-bout (1 ligne par champ pour grep facile)
      // Utile pour debug Push Diagnostics + tracing erreurs FCM par message.
      try {
        // Recalcule sentCount/failedCount à partir du label parsé
        const m = pushResultLabel.match(/sent=(\d+)\/failed=(\d+)/);
        const pushSent = m ? Number(m[1]) : 0;
        const pushFailed = m ? Number(m[2]) : 0;
        logger.info?.(`[chat] senderId=${senderId}`);
        logger.info?.(`[chat] receiverId=${receiverId} receiverRole=${receiver?.role ?? "?"}`);
        logger.info?.(`[chat] orderId=${activeOrderId ?? "none"}`);
        logger.info?.(`[chat] wsDelivered=${wsDelivered}`);
        logger.info?.(`[chat] notificationId=${createdNotif.id}`);
        logger.info?.(`[chat] push sentCount=${pushSent} failedCount=${pushFailed} status=${pushResultLabel}`);
      } catch {
        // Fallback ligne unique si parsing échoue
        logger.info?.(
          `[chat] delivered receiverId=${receiverId} receiverRole=${receiver?.role ?? "?"} ` +
          `wsDelivered=${wsDelivered} notificationId=${createdNotif.id} push=${pushResultLabel}`,
        );
      }

      // ─── Fanout admin (Dashboard) ─────────────────────────────────────────
      // Important : on n'envoie PAS un type "chat_message" aux admins
      // (cela déclencherait la sonnerie/notif sur le Dashboard pour des
      // conversations Client↔Agent qui ne le concernent pas).
      // → Type dédié "admin_chat_preview" avec flag silent:true que le front
      //   ignore systématiquement dans handleWSEvent.
      const senderIsAdmin = sender.role === "admin";
      const receiverIsAdmin = receiver?.role === "admin";
      if (!senderIsAdmin && !receiverIsAdmin) {
        try {
          const admins = (await storage.getAllUsers()).filter(u => u.role === "admin");
          for (const admin of admins) {
            sendToUser(admin.id, {
              type: "admin_chat_preview",
              silent: true,
              message: msg,
              meta: {
                adminPreview: true,
                senderId,
                receiverId,
                senderName: sender.name,
                receiverName: receiver?.name,
                orderId: activeOrderId,
              },
            });
          }
        } catch (e) { logger.error("[chat] admin fanout failed", e); }
      }
    }
    res.json(msg);
  });
}
