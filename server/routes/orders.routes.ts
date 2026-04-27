import type { Express } from "express";
import crypto from "crypto";
import { storage } from "../storage";
import { db } from "../db";
import { detectZone, type DeliveryZoneData } from "@shared/deliveryZones";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validate, schemas } from "../validators";
import { broadcast, sendToUser } from "../websocket";
import { logger } from "../lib/logger";

const ORDER_STATUS_SEQUENCE = ["pending", "confirmed", "picked_up", "delivered"];
const TERMINAL_STATUSES = ["delivered", "cancelled", "returned"];

function isGeneralAdmin(user: any): boolean {
  const perms = user.adminPermissions as string[] | null;
  return user.adminRole === "superadmin" || (!user.adminRole && (!perms || perms.length === 0));
}

function canTransitionStatus(currentStatus: string, newStatus: string, user: any): { allowed: boolean; message?: string } {
  if (currentStatus === newStatus) {
    return { allowed: false, message: "Le statut est déjà à cette valeur" };
  }
  if (TERMINAL_STATUSES.includes(currentStatus)) {
    return { allowed: false, message: `Statut final — utilisez le code d'accès pour modifier ce statut` };
  }
  // Drivers : aucune annulation/retour possible et progression strictement linéaire
  if (user.role === "driver") {
    if (newStatus === "cancelled" || newStatus === "returned") {
      return { allowed: false, message: "Un livreur ne peut pas annuler ou marquer comme retournée une commande" };
    }
    const cIdx = ORDER_STATUS_SEQUENCE.indexOf(currentStatus);
    const nIdx = ORDER_STATUS_SEQUENCE.indexOf(newStatus);
    if (cIdx === -1 || nIdx === -1 || nIdx !== cIdx + 1) {
      return { allowed: false, message: "Transition non autorisée pour un livreur" };
    }
    return { allowed: true };
  }
  if (newStatus === "cancelled" || newStatus === "returned") return { allowed: true };
  if (isGeneralAdmin(user)) return { allowed: true };
  const currentIdx = ORDER_STATUS_SEQUENCE.indexOf(currentStatus);
  const newIdx = ORDER_STATUS_SEQUENCE.indexOf(newStatus);
  if (currentIdx === -1 || newIdx === -1) return { allowed: true };
  if (newIdx <= currentIdx) {
    return { allowed: false, message: "Impossible de revenir en arrière dans le processus de commande" };
  }
  return { allowed: true };
}

// Génération du numéro de commande robuste : pré-check + retry sur conflit
// (la colonne order_number a déjà une contrainte UNIQUE en base — code 23505)
async function createOrderWithUniqueNumber(orderData: any, maxAttempts = 5): Promise<any> {
  let lastErr: any = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let baseNum = 1;
    try {
      const r = await db.execute(
        `SELECT order_number FROM orders WHERE order_number LIKE 'M%' AND LENGTH(order_number) = 9 ORDER BY order_number DESC LIMIT 1`
      );
      if (r.rows.length > 0) {
        const lastNum = parseInt((r.rows[0] as any).order_number.substring(1), 10);
        if (!isNaN(lastNum)) baseNum = lastNum + 1;
      }
    } catch (e) {
      logger.error("[orders] failed to read last order_number", e);
    }
    const orderNumber = `M${(baseNum + attempt).toString().padStart(8, "0")}`;

    // Pré-check via storage : couvre le cas in-memory et réduit les conflits réels
    const existing = await storage.getOrderByNumber(orderNumber);
    if (existing) continue;

    try {
      return await storage.createOrder({ ...orderData, orderNumber });
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || "");
      const isDup = err?.code === "23505" || /unique|duplicate/i.test(msg);
      if (isDup && attempt < maxAttempts - 1) continue;
      throw err;
    }
  }
  throw lastErr || new Error("ORDER_NUMBER_GENERATION_FAILED");
}

export function registerOrdersRoutes(app: Express): void {
  app.get("/api/orders", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Non authentifie" });

    const filters: any = {};
    if (user.role === "client") {
      filters.clientId = userId;
    } else if (user.role === "driver") {
      if (req.query.driverId) {
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

  app.get("/api/orders/export", requireAdmin, async (req, res) => {
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
    let data = await storage.getOrders(Object.keys(filters).length ? filters : undefined);
    if (req.query.restaurantId) {
      data = data.filter(o => o.restaurantId === Number(req.query.restaurantId));
    }

    const allUsers = await storage.getAllUsers();
    const allRestaurants = await storage.getRestaurants();
    const getUserName = (id: number) => allUsers.find(u => u.id === id)?.name || "";
    const getRestName = (id: number) => allRestaurants.find(r => r.id === id)?.name || "";
    const getRestCommission = (restaurantId: number) => {
      const r = allRestaurants.find(r => r.id === restaurantId);
      return r?.restaurantCommissionRate ?? 20;
    };
    const parseJsonbArr = (v: any): any[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      try { return JSON.parse(v); } catch { return []; }
    };

    const csv = [
      "Numero,Statut,Client,Restaurant,Livreur,Total ($),Sous-total,Frais Livraison,Taxes,Code Promo,Reduction Promo,Taux Commission (%),Commission Maweja ($),Revenu Restaurant ($),Methode Paiement,Statut Paiement,Adresse,Date,Remarques Admin,Nb Modifications",
      ...data.map(o => {
        const rate = getRestCommission(o.restaurantId);
        const mawejaCommission = parseFloat((o.subtotal * rate / 100).toFixed(2));
        const restaurantRevenue = parseFloat((o.subtotal - mawejaCommission).toFixed(2));
        const remarks = parseJsonbArr((o as any).adminRemarks).map((r: any) => `[${new Date(r.createdAt).toLocaleDateString("fr-CD")} - ${r.adminName}] ${r.text}`).join(" | ");
        const nbMods = parseJsonbArr((o as any).orderModifications).length;
        return `${o.orderNumber},${o.status},"${getUserName(o.clientId)}","${getRestName(o.restaurantId)}","${o.driverId ? getUserName(o.driverId) : ""}",${o.total},${o.subtotal},${o.deliveryFee},${o.taxAmount},${o.promoCode || ""},${o.promoDiscount},${rate},${mawejaCommission},${restaurantRevenue},"${o.paymentMethod}",${o.paymentStatus},"${o.deliveryAddress}",${o.createdAt},"${remarks.replace(/"/g, "'")}",${nbMods}`;
      }),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=commandes_maweja_${new Date().toISOString().split("T")[0]}.csv`);
    res.send(csv);
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

  app.post("/api/orders/:id/remarks", requireAdmin, validate(schemas.orderRemark), async (req, res) => {
    const orderId = Number(req.params.id);
    const { text } = req.body;
    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Commande non trouvee" });
    const adminUser = await storage.getUser((req.session as any).userId);
    const remark = {
      id: crypto.randomUUID(),
      text: text.trim(),
      adminName: adminUser?.name || "Admin",
      adminId: adminUser?.id,
      createdAt: new Date().toISOString(),
    };
    const existing: any[] = Array.isArray(order.adminRemarks) ? order.adminRemarks as any[] : [];
    const updated = await storage.updateOrder(orderId, { adminRemarks: [...existing, remark] } as any);
    res.json(updated);
  });

  app.patch("/api/orders/:id/modify", requireAdmin, validate(schemas.orderModify), async (req, res) => {
    const orderId = Number(req.params.id);
    const { remark, items, subtotal, deliveryFee, taxAmount, total } = req.body;
    if (!remark || !remark.trim()) return res.status(400).json({ message: "Une remarque explicative est obligatoire pour toute modification" });
    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Commande non trouvee" });
    const adminUser = await storage.getUser((req.session as any).userId);
    const modification = {
      id: crypto.randomUUID(),
      remark: remark.trim(),
      adminName: adminUser?.name || "Admin",
      adminId: adminUser?.id,
      createdAt: new Date().toISOString(),
      previousItems: order.items,
      newItems: items !== undefined ? items : order.items,
      previousSubtotal: order.subtotal,
      newSubtotal: subtotal !== undefined ? subtotal : order.subtotal,
      previousDeliveryFee: order.deliveryFee,
      newDeliveryFee: deliveryFee !== undefined ? deliveryFee : order.deliveryFee,
      previousTotal: order.total,
      newTotal: total !== undefined ? total : order.total,
    };
    const existingMods: any[] = Array.isArray(order.orderModifications) ? order.orderModifications as any[] : [];
    const patch: any = { orderModifications: [...existingMods, modification] };
    if (items !== undefined) patch.items = items;
    if (subtotal !== undefined) patch.subtotal = subtotal;
    if (deliveryFee !== undefined) patch.deliveryFee = deliveryFee;
    if (taxAmount !== undefined) patch.taxAmount = taxAmount;
    if (total !== undefined) patch.total = total;
    const updated = await storage.updateOrder(orderId, patch);
    res.json(updated);
  });

  app.post("/api/orders", requireAuth, validate(schemas.orderCreate), async (req, res) => {
    const sessionUserId = (req.session as any).userId;
    const sessionUser = await storage.getUser(sessionUserId);
    let clientId = sessionUserId;
    if (sessionUser?.role === "admin" && req.body.clientId) {
      clientId = req.body.clientId;
    }
    const dbZones = await storage.getDeliveryZones();
    const zonesData: DeliveryZoneData[] = dbZones.map(z => ({
      id: z.id, name: z.name, fee: z.fee, color: z.color,
      neighborhoods: (z.neighborhoods as string[]) || [], isActive: z.isActive, sortOrder: z.sortOrder,
    }));

    if (sessionUser?.role === "admin" && req.body.adminOverride === true) {
      if (req.body.zoneId) {
        const selectedZone = dbZones.find(z => z.id === Number(req.body.zoneId));
        if (selectedZone) {
          req.body.deliveryZone = selectedZone.name;
          if (req.body.deliveryFee === undefined || req.body.deliveryFee === null) {
            req.body.deliveryFee = parseFloat(selectedZone.fee.toFixed(2));
          }
        }
      }
      req.body.deliveryFee = parseFloat(Number(req.body.deliveryFee || 0).toFixed(2));
    } else {
      const zoneResult = detectZone(req.body.deliveryAddress || "", zonesData);
      if (!zoneResult.allowed) {
        return res.status(400).json({ message: "Livraison impossible — adresse hors de notre zone de couverture." });
      }
      req.body.deliveryZone = zoneResult.zone?.name || null;
      req.body.deliveryFee = parseFloat(zoneResult.fee.toFixed(2));
    }

    req.body.subtotal = parseFloat(Number(req.body.subtotal).toFixed(2));
    req.body.promoDiscount = parseFloat(Number(req.body.promoDiscount || 0).toFixed(2));

    // Enforce service fee from app settings — admin override may bypass this
    const appSettings = await storage.getSettings();
    if (sessionUser?.role === "admin" && req.body.adminOverride === true && req.body.taxAmount !== undefined) {
      req.body.taxAmount = parseFloat(Number(req.body.taxAmount || 0).toFixed(2));
    } else {
      const settingsServiceFee = parseFloat(appSettings.service_fee || "0.76");
      req.body.taxAmount = isFinite(settingsServiceFee) && settingsServiceFee >= 0
        ? parseFloat(settingsServiceFee.toFixed(2))
        : 0;
    }

    // Validate loyalty credit discount against actual credit in DB
    let loyaltyCreditDiscount = 0;
    if (req.body.loyaltyCreditId && Number(req.body.loyaltyCreditDiscount) > 0) {
      const activeCredits = await storage.getActiveLoyaltyCredits(clientId);
      const credit = activeCredits.find(c => c.id === Number(req.body.loyaltyCreditId));
      loyaltyCreditDiscount = credit ? parseFloat(credit.amount.toFixed(2)) : 0;
      req.body.loyaltyCreditDiscount = loyaltyCreditDiscount;
    } else {
      req.body.loyaltyCreditDiscount = 0;
    }

    // Recompute total server-side to prevent price manipulation
    req.body.total = parseFloat(
      (req.body.subtotal + req.body.deliveryFee + req.body.taxAmount - req.body.promoDiscount - loyaltyCreditDiscount).toFixed(2)
    );
    if (req.body.total < 0) req.body.total = 0;

    // SÉCURITÉ : refus paiement wallet si solde insuffisant (évite les soldes négatifs masqués)
    if (req.body.paymentMethod === "wallet") {
      const payer = await storage.getUser(clientId);
      const balance = Number(payer?.walletBalance || 0);
      if (!payer || balance < req.body.total) {
        return res.status(400).json({
          message: "Solde du portefeuille insuffisant pour cette commande",
          code: "INSUFFICIENT_WALLET_BALANCE",
          balance,
          required: req.body.total,
        });
      }
    }

    const restaurant = await storage.getRestaurant(req.body.restaurantId);
    const commissionRate = restaurant?.restaurantCommissionRate ?? 20;
    const commission = req.body.adminOverride && req.body.commission !== undefined
      ? parseFloat(Number(req.body.commission).toFixed(2))
      : parseFloat((req.body.subtotal * commissionRate / 100).toFixed(2));
    const deliveryMinutes = restaurant?.deliveryTime ? parseInt(restaurant.deliveryTime) || 45 : 45;
    const estimatedDelivery = new Date(Date.now() + deliveryMinutes * 60 * 1000).toISOString();

    const { adminOverride: _ao, zoneId: _zi, clientName: _cn, clientPhone: _cp, ...orderBody } = req.body;
    if (_cn && !orderBody.orderName) orderBody.orderName = _cn;
    if (_cp && !orderBody.orderPhone) orderBody.orderPhone = _cp;

    let order: any;
    try {
      order = await createOrderWithUniqueNumber({ ...orderBody, clientId, commission, estimatedDelivery });
    } catch (err) {
      logger.error("[orders] createOrderWithUniqueNumber failed", err);
      return res.status(500).json({
        message: "Impossible de générer un numéro de commande unique. Veuillez réessayer.",
        code: "ORDER_NUMBER_GENERATION_FAILED",
      });
    }
    const orderNumber = order.orderNumber;

    await storage.createFinance({ type: "revenue", category: "order", amount: order.total, description: `Commande ${orderNumber}`, orderId: order.id, userId: order.clientId });
    await storage.createFinance({ type: "revenue", category: "delivery_fee", amount: order.deliveryFee, description: `Frais livraison ${orderNumber}`, orderId: order.id });
    await storage.createFinance({ type: "revenue", category: "commission", amount: commission, description: `Commission ${orderNumber} (${commissionRate}%)`, orderId: order.id });

    const admins = (await storage.getAllUsers()).filter(u => u.role === "admin");
    for (const admin of admins) {
      await storage.createNotification({ userId: admin.id, title: "Nouvelle commande", message: `Commande ${orderNumber} recue - $${order.total}`, type: "order", data: { orderId: order.id }, isRead: false });
      sendToUser(admin.id, { type: "new_order", order });
    }

    // Notifier tous les agents en ligne pour qu'ils sachent qu'une nouvelle commande est disponible
    try {
      const onlineDrivers = await storage.getOnlineDrivers();
      for (const drv of onlineDrivers) {
        await storage.createNotification({ userId: drv.id, title: "Nouvelle commande disponible", message: `Commande ${orderNumber} en attente d'attribution`, type: "delivery", data: { orderId: order.id }, isRead: false });
        sendToUser(drv.id, { type: "new_order", order });
      }
    } catch (e) {
      logger.error("[orders] notify online drivers failed", e);
    }

    await storage.createNotification({ userId: order.clientId, title: "Commande confirmee", message: `Votre commande ${orderNumber} a ete recue et sera traitee sous peu`, type: "order", data: { orderId: order.id }, isRead: false });

    if (req.body.paymentMethod === "wallet") {
      const client = await storage.getUser(order.clientId);
      if (client) {
        await storage.updateUser(client.id, { walletBalance: Math.max(0, (client.walletBalance || 0) - order.total) });
        await storage.createWalletTransaction({ userId: client.id, amount: -order.total, type: "payment", description: `Paiement commande ${orderNumber}`, orderId: order.id });
      }
    }

    if (req.body.promoCode) {
      const promo = await storage.getPromotionByCode(req.body.promoCode);
      if (promo) {
        await storage.updatePromotion(promo.id, { usedCount: promo.usedCount + 1 });
      }
    }

    if (req.body.loyaltyCreditId && req.body.loyaltyCreditDiscount > 0) {
      const creditId = Number(req.body.loyaltyCreditId);
      const activeCredits = await storage.getActiveLoyaltyCredits(order.clientId);
      const credit = activeCredits.find(c => c.id === creditId);
      if (credit) {
        await storage.markLoyaltyCreditUsed(credit.id, order.id);
      }
    }

    res.json(order);
  });

  app.patch("/api/orders/:id", requireAuth, validate(schemas.orderUpdate), async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || (user.role !== "admin" && user.role !== "driver")) {
      return res.status(403).json({ message: "Acces refuse" });
    }
    const existingOrder = await storage.getOrder(Number(req.params.id));
    if (!existingOrder) return res.status(404).json({ message: "Commande non trouvee" });
    // Snapshot des champs sensibles AVANT toute mutation (les refunds doivent se baser sur l'état d'origine)
    const prevStatus = existingOrder.status;
    const prevPaymentStatus = existingOrder.paymentStatus;

    if (req.body.status && req.body.status !== existingOrder.status) {
      const transition = canTransitionStatus(existingOrder.status, req.body.status, user);
      if (!transition.allowed) {
        return res.status(400).json({ message: transition.message });
      }
    }

    const auditEntry = {
      action: req.body.status ? `status_${req.body.status}` : req.body.driverId ? "driver_assigned" : "modified",
      by: user.name,
      byId: user.id,
      role: user.role,
      timestamp: new Date().toISOString(),
      details: req.body.status ? `Statut: ${existingOrder.status} → ${req.body.status}` : req.body.driverId ? `Livreur assigne: ${req.body.driverId}` : "Modification",
    };
    const currentLog = (existingOrder.auditLog as any[]) || [];
    req.body.auditLog = [...currentLog, auditEntry];

    const order = await storage.updateOrder(Number(req.params.id), req.body);
    if (!order) return res.status(404).json({ message: "Commande non trouvee" });

    broadcast({ type: "order_updated", order });

    if (req.body.driverId && !req.body.status) {
      await storage.createNotification({ userId: req.body.driverId, title: "Nouvelle livraison assignee", message: `Commande ${order.orderNumber} vous a ete assignee`, type: "delivery", data: { orderId: order.id }, isRead: false });
      sendToUser(req.body.driverId, { type: "order_assigned", order });
      await storage.createNotification({ userId: order.clientId, title: `Commande ${order.orderNumber}`, message: "Un livreur a ete assigne a votre commande", type: "order", data: { orderId: order.id }, isRead: false });
      sendToUser(order.clientId, { type: "order_assigned", order });
    }

    if (req.body.status) {
      const statusMessages: Record<string, string> = {
        confirmed: "Votre commande a ete confirmee",
        picked_up: "Votre livreur a recupere votre commande — en route!",
        delivered: "Votre commande a ete livree avec succes 🎉",
        cancelled: "Votre commande a ete annulee",
        returned: "Votre commande a ete retournee",
      };
      if (statusMessages[req.body.status]) {
        await storage.createNotification({ userId: order.clientId, title: `Commande ${order.orderNumber}`, message: statusMessages[req.body.status], type: "order", data: { orderId: order.id }, isRead: false });
        sendToUser(order.clientId, { type: "order_status", orderId: order.id, status: req.body.status });
      }

      if (req.body.status === "picked_up" && order.driverId) {
        const driver = await storage.getUser(order.driverId);
        const adminList = await storage.getAdmins();
        for (const admin of adminList) {
          await storage.createNotification({ userId: admin.id, title: "Commande récupérée", message: `${driver?.name || "L'agent"} a récupéré la commande ${order.orderNumber} — en route`, type: "order", data: { orderId: order.id }, isRead: false });
          sendToUser(admin.id, { type: "order_picked_up", order, driverName: driver?.name });
        }
      }

      if (req.body.status === "delivered" && order.driverId) {
        // Driver gets 80% of delivery fee, MAWEJA keeps 20%
        const driverEarning = parseFloat((order.deliveryFee * 0.8).toFixed(2));
        const mawejaShare = parseFloat((order.deliveryFee - driverEarning).toFixed(2));
        const driver = await storage.getUser(order.driverId);
        if (driver) {
          await storage.updateUser(driver.id, { walletBalance: (driver.walletBalance || 0) + driverEarning });
          await storage.createWalletTransaction({ userId: driver.id, amount: driverEarning, type: "earning", description: `Gain livraison ${order.orderNumber} (80%)`, orderId: order.id });
          await storage.createFinance({ type: "expense", category: "driver_payment", amount: driverEarning, description: `Paiement livreur ${driver.name} - ${order.orderNumber} (80% de $${order.deliveryFee.toFixed(2)})`, orderId: order.id, userId: driver.id });
          if (mawejaShare > 0) {
            await storage.createFinance({ type: "revenue", category: "delivery_commission", amount: mawejaShare, description: `Commission livraison MAWEJA ${order.orderNumber} (20%)`, orderId: order.id });
          }
        }
        await storage.updateOrder(order.id, { paymentStatus: "paid" });

        if (!order.loyaltyPointsAwarded) {
          const client = await storage.getUser(order.clientId);
          if (client) {
            const pointsEarned = Math.floor(order.subtotal);
            const newTotal = (client.loyaltyPoints || 0) + pointsEarned;
            const tranches = Math.floor(newTotal / 1000);
            const remainingPoints = newTotal % 1000;

            let creditsCreated = 0;
            for (let i = 0; i < tranches; i++) {
              const expiresAt = new Date();
              expiresAt.setMonth(expiresAt.getMonth() + 3);
              await storage.createLoyaltyCredit({ userId: client.id, amount: 10, pointsConverted: 1000, sourceOrderId: order.id, isUsed: false, expiresAt });
              creditsCreated++;
            }

            await storage.updateUser(client.id, { loyaltyPoints: remainingPoints });
            await storage.updateOrder(order.id, { loyaltyPointsAwarded: true });

            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 3);
            const expiryStr = expiryDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
            if (creditsCreated > 0) {
              await storage.createNotification({ userId: client.id, title: "Points convertis en crédit fidélité 🎉", message: `${tranches * 1000} points convertis en ${creditsCreated * 10}$ de crédit wallet. Utilisez-les avant le ${expiryStr} !`, type: "loyalty", data: { pointsEarned, creditsCreated, remainingPoints }, isRead: false });
            } else {
              await storage.createNotification({ userId: client.id, title: `+${pointsEarned} points de fidélité gagnés !`, message: `Vous avez ${remainingPoints} points. Encore ${1000 - remainingPoints} points pour obtenir 10$ de crédit !`, type: "loyalty", data: { pointsEarned, remainingPoints }, isRead: false });
            }
            sendToUser(client.id, { type: "loyalty_update", pointsEarned, newPoints: remainingPoints, creditsCreated });
          }
        }
      }

      // SÉCURITÉ : remboursement retour — protégé contre les doubles via paymentStatus="refunded"
      // et contre la transition "returned"→"returned" via le snapshot prevStatus
      if (
        req.body.status === "returned" &&
        prevStatus !== "returned" &&
        prevPaymentStatus !== "refunded"
      ) {
        await storage.createFinance({ type: "expense", category: "return", amount: order.total, description: `Retour commande ${order.orderNumber}`, orderId: order.id, userId: order.clientId });
        if (order.paymentMethod === "wallet") {
          const client = await storage.getUser(order.clientId);
          if (client) {
            await storage.updateUser(client.id, { walletBalance: (client.walletBalance || 0) + order.total });
            await storage.createWalletTransaction({ userId: client.id, amount: order.total, type: "refund", description: `Remboursement retour ${order.orderNumber}`, orderId: order.id });
            await storage.updateOrder(order.id, { paymentStatus: "refunded" });
          }
        }
      }

      // SÉCURITÉ : remboursement annulation — mêmes garde-fous
      if (
        req.body.status === "cancelled" &&
        prevStatus !== "cancelled" &&
        order.paymentMethod === "wallet" &&
        prevPaymentStatus !== "refunded"
      ) {
        const client = await storage.getUser(order.clientId);
        if (client) {
          await storage.updateUser(client.id, { walletBalance: (client.walletBalance || 0) + order.total });
          await storage.createWalletTransaction({ userId: client.id, amount: order.total, type: "refund", description: `Remboursement commande ${order.orderNumber}`, orderId: order.id });
          await storage.createFinance({ type: "expense", category: "refund", amount: order.total, description: `Remboursement ${order.orderNumber}`, orderId: order.id, userId: client.id });
          await storage.updateOrder(order.id, { paymentStatus: "refunded" });
        }
      }
    }

    res.json(order);
  });

  app.post("/api/orders/:id/rate", requireAuth, validate(schemas.orderRate), async (req, res) => {
    const { rating, feedback } = req.body;
    const order = await storage.updateOrder(Number(req.params.id), { rating, feedback });
    res.json(order);
  });

  app.post("/api/orders/:id/accept", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "driver") return res.status(403).json({ message: "Acces refuse" });

    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Commande non trouvee" });
    if (order.driverId !== userId) return res.status(403).json({ message: "Cette commande ne vous est pas assignee" });
    if (order.driverAccepted) return res.status(400).json({ message: "Commande deja acceptee" });

    const auditEntry = { action: "driver_accepted", by: user.name, byId: user.id, role: "driver", timestamp: new Date().toISOString(), details: `Commande acceptée par ${user.name}` };
    const currentLog = (order.auditLog as any[]) || [];
    const updated = await storage.updateOrder(order.id, { driverAccepted: true, auditLog: [...currentLog, auditEntry] });

    const adminList = await storage.getAdmins();
    for (const admin of adminList) {
      await storage.createNotification({ userId: admin.id, title: "Livraison acceptée ✓", message: `${user.name} a accepté la commande ${order.orderNumber}`, type: "order", data: { orderId: order.id }, isRead: false });
      sendToUser(admin.id, { type: "driver_accepted_order", order: updated, driverName: user.name });
    }

    broadcast({ type: "order_updated", order: updated });
    res.json({ success: true, order: updated });
  });

  app.post("/api/orders/:id/refuse", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "driver") return res.status(403).json({ message: "Acces refuse" });

    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Commande non trouvee" });
    if (order.driverId !== userId) return res.status(403).json({ message: "Cette commande ne vous est pas assignee" });

    const { reason } = req.body;
    if (!reason || !reason.trim()) return res.status(400).json({ message: "Vous devez indiquer un motif de refus" });

    const auditEntry = { action: "driver_refused", by: user.name, byId: user.id, role: "driver", timestamp: new Date().toISOString(), details: `Refus par ${user.name}: ${reason}` };
    const currentLog = (order.auditLog as any[]) || [];
    const updated = await storage.updateOrder(order.id, { driverId: null, driverAccepted: false, refusalReason: reason.trim(), auditLog: [...currentLog, auditEntry] });

    const adminList = await storage.getAdmins();
    for (const admin of adminList) {
      await storage.createNotification({ userId: admin.id, title: "Livraison refusée ✗", message: `${user.name} a refusé la commande ${order.orderNumber}: "${reason}"`, type: "order", data: { orderId: order.id }, isRead: false });
      sendToUser(admin.id, { type: "driver_refused_order", order: updated, driverName: user.name, reason });
    }

    broadcast({ type: "order_updated", order: updated });
    res.json({ success: true, order: updated });
  });

  app.post("/api/orders/:id/status-override", requireAdmin, validate(schemas.orderStatusOverride), async (req, res) => {
    const { code, newStatus } = req.body;
    if (!code || !newStatus) return res.status(400).json({ message: "Code et nouveau statut requis" });
    const settings = await storage.getSettings();
    const storedCode = settings.override_code || "MAWEJA2025";
    if (code !== storedCode) return res.status(403).json({ message: "Code d'accès incorrect" });
    const existingOrder = await storage.getOrder(Number(req.params.id));
    if (!existingOrder) return res.status(404).json({ message: "Commande non trouvee" });

    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    const currentLog = (existingOrder.auditLog as any[]) || [];
    const auditEntry = { action: `override_${newStatus}`, by: user!.name, byId: user!.id, role: user!.role, timestamp: new Date().toISOString(), details: `🔓 OVERRIDE — Statut forcé: ${existingOrder.status} → ${newStatus} (code d'accès utilisé)` };
    const updated = await storage.updateOrder(existingOrder.id, { status: newStatus, auditLog: [...currentLog, auditEntry] });
    if (!updated) return res.status(500).json({ message: "Erreur de mise à jour" });
    broadcast({ type: "order_updated", order: updated });
    res.json(updated);
  });

  app.patch("/api/orders/:id/cancel", requireAuth, validate(schemas.orderCancel), async (req, res) => {
    const userId = (req.session as any).userId;
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Commande non trouvee" });
    if (order.clientId !== userId) return res.status(403).json({ message: "Acces refuse" });
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({ message: "Cette commande ne peut plus etre annulee" });
    }
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: "Raison requise" });
    let updated = await storage.updateOrder(order.id, { status: "cancelled", cancelReason: reason });
    // SÉCURITÉ : un seul remboursement par commande, marqué via paymentStatus="refunded"
    if (order.paymentStatus !== "refunded" && (order.paymentMethod === "wallet" || order.paymentStatus === "paid")) {
      const fresh = await storage.getUser(order.clientId);
      if (fresh) {
        await storage.updateUser(order.clientId, { walletBalance: (fresh.walletBalance || 0) + order.total });
      }
      await storage.createWalletTransaction({ userId: order.clientId, amount: order.total, type: "refund", description: `Remboursement commande ${order.orderNumber}`, orderId: order.id });
      await storage.createFinance({ type: "expense", category: "refund", amount: order.total, description: `Remboursement ${order.orderNumber}`, orderId: order.id });
      updated = await storage.updateOrder(order.id, { paymentStatus: "refunded" });
    }
    broadcast({ type: "order_cancelled", order: updated });
    res.json(updated);
  });
}
