import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth.middleware";
import { resolveUserFromRequest } from "../middleware/auth.middleware";
import { logger } from "../lib/logger";

/**
 * Endpoints d'enregistrement des tokens push (FCM/APNs) — multi-device.
 *
 * Côté app : à chaque ouverture / login / rafraîchissement de token FCM,
 * appeler POST /api/push/register-token avec { token, platform, deviceId?,
 * appVersion? }. Plusieurs appareils par utilisateur sont supportés (le
 * serveur stocke chaque token dans push_tokens). Le legacy users.pushToken
 * reste maintenu en sync avec le dernier token enregistré pour la
 * rétro-compatibilité avec les anciennes installations.
 */
export function registerPushRoutes(app: Express): void {
  app.post("/api/push/register-token", requireAuth, async (req, res) => {
    const userId = await resolveUserFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Non authentifié" });

    const { token, platform, deviceId, appVersion } = req.body || {};
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "token requis" });
    }
    const plat = ["ios", "android", "web"].includes(platform) ? platform : "android";

    try {
      const row = await storage.upsertPushToken({
        userId,
        token,
        platform: plat,
        deviceId: typeof deviceId === "string" && deviceId.length ? deviceId : null,
        appVersion: typeof appVersion === "string" && appVersion.length ? appVersion : null,
      });

      // Rétro-compatibilité : on garde users.pushToken/pushPlatform sync avec
      // le dernier appareil enregistré, pour les anciens callers qui lisent
      // encore directement la colonne.
      try {
        await storage.updateUser(userId, { pushToken: token, pushPlatform: plat } as any);
      } catch {}

      return res.json({
        ok: true,
        tokenId: row.id,
        userId: row.userId,
        platform: row.platform,
        deviceId: row.deviceId,
        appVersion: row.appVersion,
      });
    } catch (e) {
      logger.warn?.(`[push/register-token] échec user=${userId}`, e);
      return res.status(500).json({ message: "Enregistrement du token impossible" });
    }
  });

  /**
   * Désenregistre un token précis (logout sur cet appareil) ou tous les
   * tokens du user si aucun token n'est fourni (logout global).
   */
  app.post("/api/push/unregister-token", requireAuth, async (req, res) => {
    const userId = await resolveUserFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Non authentifié" });

    const { token } = req.body || {};
    try {
      if (typeof token === "string" && token.length) {
        await storage.deactivatePushToken(token);
      } else {
        await storage.deactivateAllPushTokensForUser(userId);
      }
      // Legacy : si on désactive tout (ou exactement le token legacy),
      // on nettoie aussi users.pushToken pour ne plus tenter d'envoi.
      try {
        const u = await storage.getUser(userId);
        if (u && (!token || (u as any).pushToken === token)) {
          await storage.updateUser(userId, { pushToken: null, pushPlatform: null } as any);
        }
      } catch {}
      return res.json({ ok: true });
    } catch (e) {
      logger.warn?.(`[push/unregister-token] échec user=${userId}`, e);
      return res.status(500).json({ message: "Désenregistrement impossible" });
    }
  });
}
