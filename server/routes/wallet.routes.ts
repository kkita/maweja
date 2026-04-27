import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth.middleware";
import { walletLimiter } from "../auth";
import { validate, schemas } from "../validators";

export function registerWalletRoutes(app: Express): void {
  app.get("/api/loyalty/credits", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const credits = await storage.getLoyaltyCredits(userId);
    const now = new Date();
    const result = credits.map(c => ({
      ...c,
      isExpired: new Date(c.expiresAt) < now,
      isActive: !c.isUsed && new Date(c.expiresAt) >= now,
    }));
    res.json(result);
  });

  app.get("/api/wallet/:userId", requireAuth, async (req, res) => {
    const sessionUserId = (req.session as any)?.userId;
    const targetId = Number(req.params.userId);
    if (sessionUserId !== targetId) {
      const sessionUser = sessionUserId ? await storage.getUser(sessionUserId) : null;
      if (!sessionUser || sessionUser.role !== "admin") return res.status(403).json({ message: "Acces interdit" });
    }
    const txns = await storage.getWalletTransactions(targetId);
    res.json(txns);
  });

  // ⚠️ Recharge wallet — RÉSERVÉE AUX ADMINS.
  //
  // Auparavant cette route créditait instantanément le wallet de n'importe quel
  // utilisateur authentifié sans vérification de paiement → tout client pouvait
  // s'auto-créditer indéfiniment (faille critique).
  //
  // En attendant l'intégration d'un vrai gateway de paiement (Mobile Money,
  // Stripe, etc.), seul un admin peut désormais créditer un wallet — typiquement
  // après avoir vérifié manuellement la réception d'un paiement (Mobile Money,
  // virement, espèces). Les points de fidélité continuent de s'accumuler
  // automatiquement à chaque commande.
  app.post("/api/wallet/topup", requireAuth, walletLimiter, validate(schemas.walletTopup), async (req, res) => {
    const sessionUserId = (req.session as any)?.userId;
    const sessionUser = sessionUserId ? await storage.getUser(sessionUserId) : null;
    if (!sessionUser || sessionUser.role !== "admin") {
      return res.status(403).json({
        message: "La recharge directe du wallet est temporairement désactivée. Contactez le support pour créditer votre solde.",
        code: "WALLET_TOPUP_DISABLED",
      });
    }

    const { userId, amount, method } = req.body;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouve" });
    await storage.updateUser(userId, { walletBalance: (user.walletBalance || 0) + amount });
    const txn = await storage.createWalletTransaction({
      userId, amount, type: "topup",
      description: `Recharge admin via ${method} (par ${sessionUser.name || sessionUser.phone || `#${sessionUser.id}`})`,
      reference: `TOP-${Date.now()}`,
    });
    await storage.createFinance({
      type: "revenue", category: "wallet_topup", amount,
      description: `Recharge wallet ${user.name} via ${method} (admin ${sessionUser.name || sessionUser.id})`,
      userId,
    });
    res.json(txn);
  });
}
