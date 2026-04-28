import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, resolveUserFromRequest } from "../middleware/auth.middleware";
import { sendToUser } from "../websocket";
import { logger } from "../lib/logger";
import { schemas } from "../validators";

/**
 * PARTIE 5 — Support Center.
 *
 * Routes du système de tickets de support après livraison.
 *
 * Compatibilité historique :
 *  - POST /api/support/tickets accepte l'ancien payload `{ orderId, subject?, message? }`
 *    (sans `category`/`title`/`description`) pour ne pas casser le flux
 *    "réouverture du chat" déjà testé. Quand `category` est absent on
 *    suppose un ticket "other" et on remplit `title`/`description` à
 *    partir de `subject`/`message`.
 *  - Tant qu'un ticket est `status === "open"`, le chat client↔livreur
 *    reste autorisé (cf. chat.routes.ts).
 *
 * Routes :
 *  - POST   /api/support/tickets                        (client/driver/admin)
 *  - GET    /api/support/tickets/by-order/:orderId      (client/driver/admin)
 *  - GET    /api/support/tickets/mine                   (client)
 *  - GET    /api/support/tickets                        (admin, filtres avancés)
 *  - GET    /api/support/tickets/:id                    (propriétaire ou admin)
 *  - GET    /api/support/tickets/:id/messages           (propriétaire ou admin)
 *  - POST   /api/support/tickets/:id/messages           (propriétaire ou admin)
 *  - PATCH  /api/support/tickets/:id                    (admin : assign/status/priority/note)
 *  - POST   /api/support/tickets/:id/refund             (admin : crédit wallet idempotent)
 *  - POST   /api/support/tickets/:id/reject             (admin)
 *  - POST   /api/support/tickets/:id/resolve            (admin)
 *  - PATCH  /api/support/tickets/:id/close              (admin, legacy)
 */

const TERMINAL_STATUSES = new Set(["resolved", "rejected", "closed"]);

function refundReference(ticketId: number): string {
  return `support_ticket:${ticketId}`;
}

async function notifyUser(
  userId: number,
  payload: {
    title: string;
    message: string;
    type: string;
    data?: Record<string, unknown>;
    wsType: string;
    wsExtra?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await storage.createNotification({
      userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      data: payload.data ?? null,
      isRead: false,
    });
  } catch (e) {
    logger.error?.("[support] notify persist failed", e);
  }
  try {
    sendToUser(userId, { type: payload.wsType, ...(payload.wsExtra ?? {}) });
  } catch (e) {
    logger.error?.("[support] notify ws failed", e);
  }
}

async function notifyAllAdmins(payload: {
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
  wsType: string;
  wsExtra?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admins = await storage.getAdmins();
    for (const admin of admins) {
      await notifyUser(admin.id, payload);
    }
  } catch (e) {
    logger.error?.("[support] notify admins failed", e);
  }
}

export function registerSupportRoutes(app: Express): void {
  /**
   * Crée un ticket support.
   *
   * Payload moderne (PARTIE 5) :
   *   { orderId?, category, title, description, requestedRefundAmount?, imageUrl?, priority? }
   *
   * Payload legacy (rétro-compat) :
   *   { orderId, subject?, message? }
   *
   * Si un ticket "open" existe déjà pour la même commande, on le renvoie
   * tel quel (idempotent côté client — pas de doublon). Le chat
   * client↔livreur est ré-autorisé tant que ce ticket reste "open".
   */
  app.post("/api/support/tickets", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    if (!sessionUserId) return res.status(401).json({ message: "Non authentifie" });
    const user = await storage.getUser(sessionUserId);
    if (!user) return res.status(401).json({ message: "Non authentifie" });

    const body = req.body ?? {};
    const hasModernPayload = typeof body.category === "string" || typeof body.title === "string"
      || typeof body.description === "string" || body.requestedRefundAmount !== undefined
      || typeof body.priority === "string" || typeof body.imageUrl === "string";

    let category: string;
    let title: string;
    let description: string;
    let requestedRefundAmount: number | null = null;
    let imageUrl: string | null = null;
    let priority: string = "normal";
    let orderId: number | null = null;

    if (hasModernPayload) {
      const parsed = schemas.supportTicketCreate.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Payload invalide",
          errors: parsed.error.flatten(),
        });
      }
      category = parsed.data.category;
      title = parsed.data.title;
      description = parsed.data.description;
      requestedRefundAmount = parsed.data.requestedRefundAmount ?? null;
      imageUrl = parsed.data.imageUrl ?? null;
      priority = parsed.data.priority ?? "normal";
      orderId = parsed.data.orderId ?? null;
    } else {
      // Legacy : on accepte { orderId, subject?, message? }.
      orderId = body.orderId ? Number(body.orderId) : null;
      const subject = typeof body.subject === "string" ? body.subject : null;
      const message = typeof body.message === "string" ? body.message : null;
      if (!orderId) return res.status(400).json({ message: "orderId requis" });
      category = "other";
      title = subject?.trim() || "Ticket support";
      description = message?.trim() || subject?.trim() || "Demande d'assistance";
    }

    let order: any = null;
    if (orderId) {
      order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Commande introuvable" });
      const isOwner = order.clientId === user.id;
      const isDriver = order.driverId === user.id;
      const isAdmin = user.role === "admin";
      if (!isOwner && !isDriver && !isAdmin) {
        return res.status(403).json({ message: "Acces interdit" });
      }
      // Idempotence : un seul ticket "open" par commande.
      const existing = await storage.getOpenSupportTicketByOrder(orderId);
      if (existing) {
        return res.status(200).json({ ticket: existing, alreadyOpen: true });
      }
    }

    const ticket = await storage.createSupportTicket({
      orderId,
      userId: user.id,
      category,
      status: "open",
      priority,
      title,
      description,
      requestedRefundAmount,
      // Legacy fields conservés pour outils existants.
      subject: title,
      message: description,
    } as any);

    // Premier message de la conversation (utile pour l'admin qui ouvre
    // le ticket et veut voir tout l'historique au même endroit).
    if (description) {
      await storage.addSupportTicketMessage({
        ticketId: ticket.id,
        senderId: user.id,
        message: description,
        imageUrl,
      });
    }

    await notifyAllAdmins({
      title: "Nouveau ticket support",
      message: order
        ? `${user.name} a ouvert un ticket pour la commande ${order.orderNumber}`
        : `${user.name} a ouvert un ticket support`,
      type: "support",
      data: { orderId, ticketId: ticket.id, category, priority },
      wsType: "support_ticket_opened",
      wsExtra: {
        ticket,
        orderId,
        orderNumber: order?.orderNumber ?? null,
      },
    });

    res.status(201).json({ ticket, alreadyOpen: false });
  });

  /** Récupère le ticket open courant pour une commande, sinon null. */
  app.get("/api/support/tickets/by-order/:orderId", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    if (!sessionUserId) return res.status(401).json({ message: "Non authentifie" });
    const orderId = Number(req.params.orderId);
    if (!orderId) return res.status(400).json({ message: "orderId invalide" });

    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Commande introuvable" });

    const user = await storage.getUser(sessionUserId);
    if (!user) return res.status(401).json({ message: "Non authentifie" });

    const isOwner = order.clientId === user.id;
    const isDriver = order.driverId === user.id;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isDriver && !isAdmin) {
      return res.status(403).json({ message: "Acces interdit" });
    }

    const ticket = await storage.getOpenSupportTicketByOrder(orderId);
    res.json({ ticket: ticket ?? null });
  });

  /** Liste des tickets ouverts par le client connecté. */
  app.get("/api/support/tickets/mine", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    if (!sessionUserId) return res.status(401).json({ message: "Non authentifie" });
    const tickets = await storage.getSupportTicketsForUser(sessionUserId);
    res.json(tickets);
  });

  /**
   * Liste admin avec filtres combinables :
   * ?status=open&priority=high&category=missing_item&assignedAdminId=12
   */
  app.get("/api/support/tickets", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    if (!sessionUserId) return res.status(401).json({ message: "Non authentifie" });
    const user = await storage.getUser(sessionUserId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Acces interdit" });
    const filters: { status?: string; priority?: string; category?: string; assignedAdminId?: number } = {};
    if (typeof req.query.status === "string") filters.status = req.query.status;
    if (typeof req.query.priority === "string") filters.priority = req.query.priority;
    if (typeof req.query.category === "string") filters.category = req.query.category;
    if (typeof req.query.assignedAdminId === "string") {
      const n = Number(req.query.assignedAdminId);
      if (Number.isFinite(n)) filters.assignedAdminId = n;
    }
    const tickets = Object.keys(filters).length > 0
      ? await storage.listSupportTicketsAdvanced(filters)
      : await storage.listSupportTickets();
    res.json(tickets);
  });

  /** Détail d'un ticket — propriétaire ou admin. */
  app.get("/api/support/tickets/:id", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    if (!sessionUserId) return res.status(401).json({ message: "Non authentifie" });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id invalide" });
    const ticket = await storage.getSupportTicket(id);
    if (!ticket) return res.status(404).json({ message: "Ticket introuvable" });
    const user = await storage.getUser(sessionUserId);
    if (!user) return res.status(401).json({ message: "Non authentifie" });
    if (ticket.userId !== user.id && user.role !== "admin") {
      return res.status(403).json({ message: "Acces interdit" });
    }
    res.json(ticket);
  });

  /** Liste les messages de la conversation d'un ticket. */
  app.get("/api/support/tickets/:id/messages", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    if (!sessionUserId) return res.status(401).json({ message: "Non authentifie" });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id invalide" });
    const ticket = await storage.getSupportTicket(id);
    if (!ticket) return res.status(404).json({ message: "Ticket introuvable" });
    const user = await storage.getUser(sessionUserId);
    if (!user) return res.status(401).json({ message: "Non authentifie" });
    if (ticket.userId !== user.id && user.role !== "admin") {
      return res.status(403).json({ message: "Acces interdit" });
    }
    const messages = await storage.listSupportTicketMessages(id);
    res.json(messages);
  });

  /** Ajoute un message dans la conversation d'un ticket. */
  app.post("/api/support/tickets/:id/messages", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    if (!sessionUserId) return res.status(401).json({ message: "Non authentifie" });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id invalide" });
    const ticket = await storage.getSupportTicket(id);
    if (!ticket) return res.status(404).json({ message: "Ticket introuvable" });
    const user = await storage.getUser(sessionUserId);
    if (!user) return res.status(401).json({ message: "Non authentifie" });

    const isOwner = ticket.userId === user.id;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Acces interdit" });

    if (TERMINAL_STATUSES.has(ticket.status)) {
      return res.status(409).json({ message: "Ticket clôturé, impossible d'envoyer un message" });
    }

    const parsed = schemas.supportTicketMessage.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Payload invalide", errors: parsed.error.flatten() });
    }

    const created = await storage.addSupportTicketMessage({
      ticketId: id,
      senderId: user.id,
      message: parsed.data.message,
      imageUrl: parsed.data.imageUrl ?? null,
    });

    // Quand un admin répond → le ticket passe en "waiting_customer"
    // (sauf s'il est explicitement déjà résolu, déjà filtré au-dessus).
    // Quand le client répond → on bascule en "in_review" pour que
    // l'admin assigné voit qu'il y a une nouvelle réponse à traiter.
    let nextStatus: string | undefined;
    if (isAdmin && ticket.status !== "waiting_customer") nextStatus = "waiting_customer";
    if (!isAdmin && ticket.status === "waiting_customer") nextStatus = "in_review";
    if (nextStatus) await storage.updateSupportTicket(id, { status: nextStatus });

    // Notifier l'autre partie (client ↔ admin assigné, sinon tous les admins).
    if (isAdmin) {
      await notifyUser(ticket.userId, {
        title: "Nouvelle réponse du support",
        message: parsed.data.message.slice(0, 140),
        type: "support",
        data: { ticketId: id },
        wsType: "support_message",
        wsExtra: { ticketId: id, message: created },
      });
    } else {
      const targetAdminId = ticket.assignedAdminId;
      if (targetAdminId) {
        await notifyUser(targetAdminId, {
          title: "Réponse client sur un ticket",
          message: parsed.data.message.slice(0, 140),
          type: "support",
          data: { ticketId: id },
          wsType: "support_message",
          wsExtra: { ticketId: id, message: created },
        });
      } else {
        await notifyAllAdmins({
          title: "Réponse client sur un ticket",
          message: parsed.data.message.slice(0, 140),
          type: "support",
          data: { ticketId: id },
          wsType: "support_message",
          wsExtra: { ticketId: id, message: created },
        });
      }
    }

    res.status(201).json(created);
  });

  /**
   * Mise à jour partielle d'un ticket par l'admin
   * (assignation, statut, priorité, note de résolution).
   */
  app.patch("/api/support/tickets/:id", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    if (!sessionUserId) return res.status(401).json({ message: "Non authentifie" });
    const user = await storage.getUser(sessionUserId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Acces interdit" });

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id invalide" });
    const ticket = await storage.getSupportTicket(id);
    if (!ticket) return res.status(404).json({ message: "Ticket introuvable" });

    const parsed = schemas.supportTicketUpdate.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Payload invalide", errors: parsed.error.flatten() });
    }

    const updated = await storage.updateSupportTicket(id, parsed.data as any);
    if (!updated) return res.status(404).json({ message: "Ticket introuvable" });

    // Notifie le client de tout changement de statut.
    if (parsed.data.status && parsed.data.status !== ticket.status) {
      await notifyUser(ticket.userId, {
        title: "Statut de votre ticket mis à jour",
        message: `Statut : ${parsed.data.status}`,
        type: "support",
        data: { ticketId: id, status: parsed.data.status },
        wsType: "support_ticket_updated",
        wsExtra: { ticket: updated },
      });
    }
    res.json(updated);
  });

  /**
   * Approuve un remboursement partiel et crédite le wallet du client.
   *
   * Idempotence : un ticket déjà résolu/rejeté ou ayant déjà un
   * `approvedRefundAmount` ne peut PAS être remboursé une seconde fois.
   * Cela évite tout double crédit même si le bouton est cliqué deux fois.
   */
  app.post("/api/support/tickets/:id/refund", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    if (!sessionUserId) return res.status(401).json({ message: "Non authentifie" });
    const user = await storage.getUser(sessionUserId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Acces interdit" });

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id invalide" });
    const ticket = await storage.getSupportTicket(id);
    if (!ticket) return res.status(404).json({ message: "Ticket introuvable" });

    if (ticket.approvedRefundAmount != null) {
      return res.status(409).json({
        message: "Remboursement déjà approuvé pour ce ticket",
        ticket,
      });
    }
    if (TERMINAL_STATUSES.has(ticket.status)) {
      return res.status(409).json({
        message: "Ticket déjà clôturé",
        ticket,
      });
    }

    const parsed = schemas.supportTicketRefund.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Payload invalide", errors: parsed.error.flatten() });
    }

    const customer = await storage.getUser(ticket.userId);
    if (!customer) return res.status(404).json({ message: "Client introuvable" });

    // 1) Crédite le wallet via une transaction tracée.
    await storage.createWalletTransaction({
      userId: customer.id,
      amount: parsed.data.amount,
      type: "refund",
      description: parsed.data.note?.trim() || `Remboursement ticket ${ticket.ticketNumber ?? id}`,
      reference: refundReference(id),
      orderId: ticket.orderId ?? null,
    } as any);

    // 2) Met à jour le solde du wallet utilisateur.
    const newBalance = (customer.walletBalance ?? 0) + parsed.data.amount;
    await storage.updateUser(customer.id, { walletBalance: newBalance });

    // 3) Marque le ticket comme résolu (idempotence basée sur
    //    approvedRefundAmount IS NOT NULL + status terminal).
    const updated = await storage.updateSupportTicket(id, {
      approvedRefundAmount: parsed.data.amount,
      resolutionNote: parsed.data.note ?? null,
      status: "resolved",
      assignedAdminId: ticket.assignedAdminId ?? user.id,
      resolvedAt: new Date(),
    } as any);

    await notifyUser(customer.id, {
      title: "Remboursement approuvé",
      message: `Votre wallet a été crédité de ${parsed.data.amount} FC.`,
      type: "support",
      data: { ticketId: id, amount: parsed.data.amount },
      wsType: "support_refund_approved",
      wsExtra: { ticket: updated, amount: parsed.data.amount, newBalance },
    });

    res.json({ ticket: updated, refundAmount: parsed.data.amount, newBalance });
  });

  /** Rejet d'un ticket (motif obligatoire). */
  app.post("/api/support/tickets/:id/reject", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    if (!sessionUserId) return res.status(401).json({ message: "Non authentifie" });
    const user = await storage.getUser(sessionUserId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Acces interdit" });

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id invalide" });
    const ticket = await storage.getSupportTicket(id);
    if (!ticket) return res.status(404).json({ message: "Ticket introuvable" });
    if (TERMINAL_STATUSES.has(ticket.status)) {
      return res.status(409).json({ message: "Ticket déjà clôturé", ticket });
    }

    const parsed = schemas.supportTicketReject.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Payload invalide", errors: parsed.error.flatten() });
    }

    const updated = await storage.updateSupportTicket(id, {
      status: "rejected",
      resolutionNote: parsed.data.reason,
      assignedAdminId: ticket.assignedAdminId ?? user.id,
      resolvedAt: new Date(),
    } as any);

    await notifyUser(ticket.userId, {
      title: "Ticket rejeté",
      message: parsed.data.reason.slice(0, 140),
      type: "support",
      data: { ticketId: id },
      wsType: "support_ticket_rejected",
      wsExtra: { ticket: updated },
    });
    res.json(updated);
  });

  /** Marque un ticket comme résolu sans remboursement. */
  app.post("/api/support/tickets/:id/resolve", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    if (!sessionUserId) return res.status(401).json({ message: "Non authentifie" });
    const user = await storage.getUser(sessionUserId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Acces interdit" });

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id invalide" });
    const ticket = await storage.getSupportTicket(id);
    if (!ticket) return res.status(404).json({ message: "Ticket introuvable" });
    if (TERMINAL_STATUSES.has(ticket.status)) {
      return res.status(409).json({ message: "Ticket déjà clôturé", ticket });
    }

    const note = typeof req.body?.note === "string" ? req.body.note.trim() : null;

    const updated = await storage.updateSupportTicket(id, {
      status: "resolved",
      resolutionNote: note,
      assignedAdminId: ticket.assignedAdminId ?? user.id,
      resolvedAt: new Date(),
    } as any);

    await notifyUser(ticket.userId, {
      title: "Ticket résolu",
      message: note || "Votre ticket a été marqué comme résolu.",
      type: "support",
      data: { ticketId: id },
      wsType: "support_ticket_resolved",
      wsExtra: { ticket: updated },
    });
    res.json(updated);
  });

  /** Clôture héritée — laissée intacte pour l'ancien admin UI. */
  app.patch("/api/support/tickets/:id/close", requireAuth, async (req: any, res) => {
    const sessionUserId = await resolveUserFromRequest(req);
    if (!sessionUserId) return res.status(401).json({ message: "Non authentifie" });
    const user = await storage.getUser(sessionUserId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Acces interdit" });

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id invalide" });
    const updated = await storage.closeSupportTicket(id);
    if (!updated) return res.status(404).json({ message: "Ticket introuvable" });
    res.json(updated);
  });
}
