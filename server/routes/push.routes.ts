import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth.middleware";

/**
 * Endpoints d'enregistrement des tokens push (FCM/APNs).
 * L'app mobile s'enregistre une fois au login (et à chaque rafraîchissement
 * de token) pour que le serveur puisse pousser des notifications natives.
 */
export function registerPushRoutes(app: Express): void {
  app.post("/api/push/register-token", requireAuth, async (req: any, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });
    const { token, platform } = req.body || {};
    if (!token || typeof token !== "string") return res.status(400).json({ message: "token requis" });
    const plat = ["ios", "android", "web"].includes(platform) ? platform : "android";
    await storage.updateUser(userId, { pushToken: token, pushPlatform: plat } as any);
    res.json({ ok: true });
  });

  app.post("/api/push/unregister-token", requireAuth, async (req: any, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });
    await storage.updateUser(userId, { pushToken: null, pushPlatform: null } as any);
    res.json({ ok: true });
  });
}
