import type { Express } from "express";
import path from "path";
import fs from "fs";
import { storage } from "../storage";
import { db, pool } from "../db";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";
import { uploadsDir, uploadToCloudStorage } from "../middleware/upload.middleware";
import { objectStorageClient } from "../replit_integrations/object_storage";
import { hashPassword } from "../auth";
import { validate, validateParams, schemas } from "../validators";
import { sendToUser } from "../websocket";
import { logger } from "../lib/logger";
import { sendPushToUser, isFirebaseConfigured, toAbsoluteImageUrl } from "../lib/push";
import admin from "firebase-admin";

export function registerAdminRoutes(app: Express): void {
  app.get("/api/admin/password-reset-requests", requireAdmin, async (req, res) => {
    const status = req.query.status as string | undefined;
    const requests = await storage.getPasswordResetRequests(status ? { status } : undefined);
    res.json(requests);
  });

  app.patch("/api/admin/password-reset-requests/:id", requireAdmin, validate(schemas.adminResetResolve), async (req, res) => {
    const { adminNote, status } = req.body;
    const update: any = {};
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (status) {
      update.status = status;
      if (status === "resolved" || status === "rejected") update.resolvedAt = new Date();
    }
    const updated = await storage.updatePasswordResetRequest(Number(req.params.id), update);
    res.json(updated);
  });

  app.post("/api/admin/password-reset-requests/:id/set-password", requireAdmin, validate(schemas.adminSetPassword), async (req, res) => {
    try {
      const { newPassword } = req.body;
      const req2 = await storage.getPasswordResetRequests();
      const found = req2.find(r => r.id === Number(req.params.id));
      if (!found) return res.status(404).json({ message: "Demande introuvable" });
      let targetUser: any = null;
      if (found.userId) {
        targetUser = await storage.getUser(found.userId);
      } else if (found.userEmail) {
        targetUser = await storage.getUserByEmail(found.userEmail);
      } else if (found.userPhone) {
        targetUser = await storage.getUserByPhone(found.userPhone);
      }
      if (!targetUser) return res.status(404).json({ message: "Utilisateur introuvable" });
      const setHash = await hashPassword(newPassword);
      await storage.updateUser(targetUser.id, { password: setHash });
      await storage.updatePasswordResetRequest(found.id, { status: "resolved", resolvedAt: new Date(), adminNote: `Mot de passe reinitialise par l'admin` });
      if (targetUser.id) {
        sendToUser(targetUser.id, { type: "password_reset_done", message: "Votre mot de passe a ete reinitialise par l'administrateur" });
        await storage.createNotification({ userId: targetUser.id, title: "Mot de passe reinitialise", message: "L'administrateur a reinitialise votre mot de passe avec succes.", type: "user", isRead: false });
      }
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Erreur serveur" });
    }
  });

  app.get("/api/settings/:key", requireAuth, async (req, res) => {
    const result = await pool.query(`SELECT value FROM app_settings WHERE key = $1`, [req.params.key]);
    if (result.rows.length === 0) return res.json({ value: null });
    res.json({ value: (result.rows[0] as any).value });
  });

  app.put("/api/settings/:key", requireAdmin, validate(schemas.settingValue), async (req, res) => {
    const { value } = req.body;
    await pool.query(
      `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [req.params.key, String(value)]
    );
    res.json({ ok: true });
  });

  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await storage.getSettings();
      const defaults: Record<string, string> = {
        whatsapp_number: "+243802540138",
        app_name: "MAWEJA",
        delivery_fee: "200",
        min_order: "5",
        max_radius: "15",
        notifications: "true",
        auto_assign: "true",
        loyalty_enabled: "true",
        points_per_order: "10",
        currency: "USD",
        service_fee: "0.76",
      };
      res.json({ ...defaults, ...settings });
    } catch (err) { logger.error("GET /api/settings failed", err); res.json({}); }
  });

  app.patch("/api/settings", requireAdmin, async (req, res) => {
    try {
      const data: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.body)) {
        data[k] = String(v);
      }
      await storage.setSettings(data);
      res.json({ ok: true });
    } catch (err) { logger.error("PATCH /api/settings failed", err); res.status(500).json({ error: "Erreur sauvegarde" }); }
  });

  app.get("/api/clients", requireAdmin, async (_req, res) => {
    const cl = await storage.getClients();
    res.json(cl.map(({ password: _, ...c }) => c));
  });

  app.get("/api/users", requireAdmin, async (_req, res) => {
    const all = await storage.getAllUsers();
    res.json(all.map(({ password: _, ...u }) => u));
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    const sessionUserId = (req.session as any)?.userId;
    const sessionUser = sessionUserId ? await storage.getUser(sessionUserId) : null;
    if (!sessionUser) return res.status(401).json({ message: "Non authentifie" });
    const targetId = Number(req.params.id);
    if (sessionUser.role !== "admin" && sessionUserId !== targetId) {
      if (sessionUser.role === "driver") {
        const driverOrders = await storage.getOrders({ driverId: sessionUserId });
        const hasOrderForUser = driverOrders.some(o => o.clientId === targetId);
        if (!hasOrderForUser) return res.status(403).json({ message: "Acces interdit" });
      } else {
        return res.status(403).json({ message: "Acces interdit" });
      }
    }
    const user = await storage.getUser(targetId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouve" });
    const { password: _, ...safe } = user;
    if (sessionUser.role === "driver" && sessionUserId !== targetId) {
      const { name, phone } = safe;
      return res.json({ id: safe.id, name, phone, role: safe.role });
    }
    res.json(safe);
  });

  app.patch("/api/users/:id", requireAuth, validate(schemas.userUpdate), async (req: any, res) => {
    const targetId = Number(req.params.id);
    const sessionUserId = req.session?.userId;
    const requestingUser = sessionUserId ? await storage.getUser(sessionUserId) : null;
    if (!requestingUser || (requestingUser.id !== targetId && requestingUser.role !== "admin")) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    const { password, ...rest } = req.body;
    const updateData: any = { ...rest };
    if (password) {
      updateData.password = await hashPassword(password);
    }
    const updated = await storage.updateUser(targetId, updateData);
    if (!updated) return res.status(404).json({ message: "Utilisateur non trouve" });
    const { password: _, ...safeUser } = updated;
    res.json(safeUser);
  });

  // ─── Client management (advanced admin actions) ───────────────────
  app.post("/api/admin/clients/:id/wallet-adjust", requireAdmin, async (req, res) => {
    const targetId = Number(req.params.id);
    const delta = Number(req.body.delta);
    const reason = String(req.body.reason || "Ajustement administrateur").slice(0, 300);
    if (!isFinite(delta) || delta === 0) return res.status(400).json({ message: "Montant invalide" });
    const user = await storage.getUser(targetId);
    if (!user) return res.status(404).json({ message: "Client non trouvé" });
    if (user.role !== "client") return res.status(400).json({ message: "Cible non-cliente" });
    const newBalance = Math.max(0, (user.walletBalance || 0) + delta);
    await storage.updateUser(targetId, { walletBalance: newBalance });
    await storage.createWalletTransaction({
      userId: targetId,
      amount: delta,
      type: delta > 0 ? "topup" : "withdrawal",
      description: `[Admin] ${reason}`,
      reference: `ADM-${Date.now()}`,
    });
    await storage.createFinance({
      type: delta > 0 ? "expense" : "revenue",
      category: delta > 0 ? "wallet_credit_admin" : "wallet_debit_admin",
      amount: Math.abs(delta),
      description: `Ajustement wallet ${user.name} — ${reason}`,
      userId: targetId,
    });
    res.json({ ok: true, newBalance });
  });

  app.post("/api/admin/clients/:id/points-adjust", requireAdmin, async (req, res) => {
    const targetId = Number(req.params.id);
    const delta = Math.trunc(Number(req.body.delta));
    const reason = String(req.body.reason || "Ajustement administrateur").slice(0, 300);
    if (!isFinite(delta) || delta === 0) return res.status(400).json({ message: "Montant invalide" });
    const user = await storage.getUser(targetId);
    if (!user) return res.status(404).json({ message: "Client non trouvé" });
    if (user.role !== "client") return res.status(400).json({ message: "Cible non-cliente" });
    const newPoints = Math.max(0, (user.loyaltyPoints || 0) + delta);
    await storage.updateUser(targetId, { loyaltyPoints: newPoints });
    res.json({ ok: true, newPoints });
  });

  app.delete("/api/admin/clients/:id", requireAdmin, async (req, res) => {
    const targetId = Number(req.params.id);
    const user = await storage.getUser(targetId);
    if (!user) return res.status(404).json({ message: "Client non trouvé" });
    if (user.role !== "client") return res.status(400).json({ message: "Cible non-cliente" });
    // Soft-delete: anonymise + bloque (préserve l'intégrité des commandes)
    await storage.updateUser(targetId, {
      isBlocked: true,
      email: `deleted_${targetId}_${Date.now()}@maweja.deleted`,
      phone: `DEL-${targetId}`,
      name: `Compte supprimé #${targetId}`,
      avatar: null,
    });
    res.json({ ok: true });
  });

  app.get("/api/admin/accounts", requireAdmin, async (_req, res) => {
    const allUsers = await storage.getAllUsers();
    const admins = allUsers.filter(u => u.role === "admin");
    res.json(admins.map(u => ({
      id: u.id, name: u.name, email: u.email, phone: u.phone,
      adminRole: u.adminRole, adminPermissions: u.adminPermissions,
      isBlocked: u.isBlocked, createdAt: u.createdAt
    })));
  });

  app.post("/api/admin/accounts", requireAdmin, validate(schemas.adminAccountCreate), async (req, res) => {
    const { name, email, password, phone, adminRole, adminPermissions } = req.body;
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(409).json({ message: "Cet email est déjà utilisé" });
    const adminHash = await hashPassword(password);
    const user = await storage.createUser({ name, email, password: adminHash, phone, role: "admin", adminRole: adminRole || null, adminPermissions: adminPermissions || [] } as any);
    res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, adminRole: user.adminRole, adminPermissions: user.adminPermissions });
  });

  app.patch("/api/admin/accounts/:id", requireAdmin, validate(schemas.adminAccountUpdate), async (req, res) => {
    const id = Number(req.params.id);
    const { adminRole, adminPermissions, password, name, phone, isBlocked } = req.body;
    const target = await storage.getUser(id);
    if (!target) return res.status(404).json({ message: "Compte introuvable" });
    if ((target.email === "admin@maweja.cd" || target.email === "admin@maweja.net") && isBlocked) {
      return res.status(403).json({ message: "Ce compte ne peut pas être bloqué" });
    }
    const update: any = {};
    if (adminRole !== undefined) update.adminRole = adminRole;
    if (adminPermissions !== undefined) update.adminPermissions = adminPermissions;
    if (password) update.password = await hashPassword(password);
    if (name) update.name = name;
    if (phone) update.phone = phone;
    if (isBlocked !== undefined) update.isBlocked = isBlocked;
    const updated = await storage.updateUser(id, update);
    if (!updated) return res.status(404).json({ message: "Compte introuvable" });
    res.json({ id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, adminRole: updated.adminRole, adminPermissions: updated.adminPermissions, isBlocked: updated.isBlocked });
  });

  app.delete("/api/admin/accounts/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const u = await storage.getUser(id);
    if (!u) return res.status(404).json({ message: "Compte introuvable" });
    if (u.email === "admin@maweja.cd" || u.email === "admin@maweja.net") {
      return res.status(403).json({ message: "Ce compte ne peut pas être supprimé" });
    }
    await storage.deleteUser(id);
    res.json({ ok: true });
  });

  app.get("/api/admin/gallery", requireAdmin, async (req: any, res) => {
    const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0].trim() || req.protocol || "https";
    const host = (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0].trim() || req.get("host") || "localhost:5000";
    const baseUrl = `${proto}://${host}`;

    let files: Array<{ filename: string; url: string; type: string; size: number; createdAt: number; source: string }> = [];

    if (fs.existsSync(uploadsDir)) {
      const localFiles = fs.readdirSync(uploadsDir)
        .filter(f => !f.startsWith("."))
        .map(filename => {
          const filePath = path.join(uploadsDir, filename);
          const stat = fs.statSync(filePath);
          const ext = path.extname(filename).toLowerCase();
          const videoExts = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
          const type = videoExts.includes(ext) ? "video" : "image";
          return { filename, url: `${baseUrl}/uploads/${filename}`, type, size: stat.size, createdAt: stat.mtimeMs, source: "local" };
        });
      files.push(...localFiles);
    }

    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (bucketId) {
      try {
        const bucket = objectStorageClient.bucket(bucketId);
        const [cloudFiles] = await bucket.getFiles({ prefix: "public/uploads/" });
        for (const cf of cloudFiles) {
          const filename = cf.name.replace("public/uploads/", "");
          if (!filename) continue;
          const ext = path.extname(filename).toLowerCase();
          const videoExts = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
          const type = videoExts.includes(ext) ? "video" : "image";
          const meta = cf.metadata || {};
          files.push({
            filename,
            url: `${baseUrl}/cloud/public/uploads/${filename}`,
            type,
            size: Number(meta.size) || 0,
            createdAt: meta.timeCreated ? new Date(meta.timeCreated as string).getTime() : 0,
            source: "cloud",
          });
        }
      } catch (err) {
        logger.error("Cloud gallery list error", err);
      }
    }

    files.sort((a, b) => b.createdAt - a.createdAt);
    res.json(files);
  });

  app.post("/api/admin/gallery/import-url", requireAdmin, async (req: any, res) => {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== "string") return res.status(400).json({ message: "URL requise" });

    const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0].trim() || req.protocol || "https";
    const host = (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0].trim() || req.get("host") || "localhost:5000";
    const baseUrl = `${proto}://${host}`;

    try {
      let ext = path.extname(url.split("?")[0]).toLowerCase();
      const videoExts = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
      const imageExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
      if (!imageExts.includes(ext) && !videoExts.includes(ext)) ext = ".jpg";

      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      // @ts-ignore - node-fetch types not installed; (fetchModule as any) pattern handles it below
      const fetchModule = await import("node-fetch");
      const fetchFn = (fetchModule as any).default ?? fetchModule;
      const remote = await fetchFn(url, {
        headers: { "User-Agent": "Mozilla/5.0 (MAWEJA/1.0)" },
        follow: 5,
        timeout: 15000,
      });
      if (!remote.ok) return res.status(400).json({ message: `Téléchargement échoué: HTTP ${remote.status}` });

      const dest = fs.createWriteStream(filePath);
      await new Promise<void>((resolve, reject) => {
        remote.body.pipe(dest);
        remote.body.on("error", reject);
        dest.on("finish", resolve);
      });

      const stat = fs.statSync(filePath);
      if (stat.size === 0) { fs.unlinkSync(filePath); return res.status(400).json({ message: "Fichier vide téléchargé" }); }

      const mimeMap: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime" };
      const cloudUrl = await uploadToCloudStorage(filePath, filename, mimeMap[ext] || "application/octet-stream");
      const finalUrl = cloudUrl.startsWith("/cloud/") ? `${baseUrl}${cloudUrl}` : `${baseUrl}/uploads/${filename}`;

      res.json({ url: finalUrl, filename });
    } catch (err: any) {
      res.status(500).json({ message: `Erreur: ${err.message}` });
    }
  });

  app.delete("/api/admin/gallery/:filename", requireAdmin, async (req: any, res) => {
    const filename = path.basename(req.params.filename);
    let deleted = false;

    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deleted = true;
    }

    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (bucketId) {
      try {
        const bucket = objectStorageClient.bucket(bucketId);
        const file = bucket.file(`public/uploads/${filename}`);
        const [exists] = await file.exists();
        if (exists) { await file.delete(); deleted = true; }
      } catch (err) {
        logger.error("Cloud delete error", err);
      }
    }

    if (!deleted) return res.status(404).json({ message: "Fichier introuvable" });
    res.json({ ok: true });
  });

  app.post("/api/admin/gallery/fix-urls", requireAdmin, async (req: any, res) => {
    const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0].trim() || req.protocol || "https";
    const host = (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0].trim() || req.get("host") || "localhost:5000";
    const baseUrl = `${proto}://${host}`;

    const { Pool } = await import("pg");
    const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });

    const queries = [
      `UPDATE restaurants SET image = '${baseUrl}' || image WHERE image LIKE '/uploads/%'`,
      `UPDATE restaurants SET image = '${baseUrl}' || image WHERE image LIKE '/cloud/%'`,
      `UPDATE restaurants SET logo_url = '${baseUrl}' || logo_url WHERE logo_url LIKE '/uploads/%'`,
      `UPDATE restaurants SET logo_url = '${baseUrl}' || logo_url WHERE logo_url LIKE '/cloud/%'`,
      `UPDATE restaurants SET cover_video_url = '${baseUrl}' || cover_video_url WHERE cover_video_url LIKE '/uploads/%'`,
      `UPDATE restaurants SET cover_video_url = '${baseUrl}' || cover_video_url WHERE cover_video_url LIKE '/cloud/%'`,
      `UPDATE menu_items SET image = '${baseUrl}' || image WHERE image LIKE '/uploads/%'`,
      `UPDATE menu_items SET image = '${baseUrl}' || image WHERE image LIKE '/cloud/%'`,
      `UPDATE advertisements SET media_url = '${baseUrl}' || media_url WHERE media_url LIKE '/uploads/%'`,
      `UPDATE advertisements SET media_url = '${baseUrl}' || media_url WHERE media_url LIKE '/cloud/%'`,
      `UPDATE service_catalog_items SET image_url = '${baseUrl}' || image_url WHERE image_url LIKE '/uploads/%'`,
      `UPDATE service_catalog_items SET image_url = '${baseUrl}' || image_url WHERE image_url LIKE '/cloud/%'`,
    ];

    for (const q of queries) {
      await dbPool.query(q);
    }
    await dbPool.end();

    res.json({ ok: true, message: "URLs relatives migrées vers URLs absolues" });
  });

  app.post("/api/admin/gallery/migrate-to-cloud", requireAdmin, async (req: any, res) => {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) return res.status(500).json({ message: "Object Storage non configuré" });
    if (!fs.existsSync(uploadsDir)) return res.json({ migrated: 0, message: "Aucun fichier local" });

    const localFiles = fs.readdirSync(uploadsDir).filter(f => !f.startsWith("."));
    let migrated = 0;
    const migratedFilenames: string[] = [];
    const errors: string[] = [];

    for (const filename of localFiles) {
      const filePath = path.join(uploadsDir, filename);
      try {
        const ext = path.extname(filename).toLowerCase();
        const mimeMap: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime" };
        const contentType = mimeMap[ext] || "application/octet-stream";
        const cloudUrl = await uploadToCloudStorage(filePath, filename, contentType);
        if (cloudUrl.startsWith("/cloud/")) {
          migrated++;
          migratedFilenames.push(filename);
        } else {
          errors.push(filename);
        }
      } catch (err: any) {
        errors.push(`${filename}: ${err.message}`);
      }
    }

    let dbUpdated = 0;
    if (migratedFilenames.length > 0) {
      const { Pool } = await import("pg");
      const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });
      const tables = [
        { table: "restaurants", col: "image" },
        { table: "restaurants", col: "logo_url" },
        { table: "restaurants", col: "cover_video_url" },
        { table: "menu_items", col: "image" },
        { table: "advertisements", col: "media_url" },
        { table: "service_catalog_items", col: "image_url" },
        { table: "users", col: "profile_photo_url" },
        { table: "users", col: "id_photo_url" },
      ];
      for (const fn of migratedFilenames) {
        const oldPath = `/uploads/${fn}`;
        const newPath = `/cloud/public/uploads/${fn}`;
        for (const { table, col } of tables) {
          const r = await dbPool.query(`UPDATE ${table} SET ${col} = $1 WHERE ${col} = $2`, [newPath, oldPath]);
          dbUpdated += r.rowCount || 0;
        }
      }
      await dbPool.end();
    }

    res.json({ migrated, dbUpdated, errors: errors.length > 0 ? errors : undefined, message: `${migrated} fichiers migrés, ${dbUpdated} URLs DB mises à jour` });
  });

  /**
   * Envoie une notification de test à l'admin connecté ou à un userId donné.
   * Pratique pour vérifier rapidement la chaîne complète :
   *   DB notif → WebSocket → Push FCM (notif système avec image).
   *
   * Body :
   *   - userId?: number (cible — par défaut l'admin connecté)
   *   - title?: string
   *   - message?: string
   *   - imageUrl?: string
   */
  /**
   * GET /api/admin/push/debug/:userId
   *
   * Diagnostic complet de la configuration push d'un utilisateur :
   *   • état du legacy users.pushToken
   *   • liste détaillée des tokens push_tokens actifs (avec platform, lastSeen)
   *   • état Firebase Admin (configured / not configured)
   *
   * Aucune donnée sensible n'est retournée en clair (les tokens sont tronqués).
   */
  app.get("/api/admin/push/debug/:userId", requireAdmin, async (req, res) => {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: "userId invalide" });
    }
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    let activeTokens: any[] = [];
    try {
      activeTokens = await storage.getActivePushTokensByUser(userId);
    } catch (e) {
      logger.warn?.(`[admin/push/debug] getActivePushTokensByUser failed user=${userId}`, e);
    }

    const mask = (t?: string | null) =>
      !t ? null : t.length <= 12 ? `${t.slice(0, 4)}…` : `${t.slice(0, 8)}…${t.slice(-6)}`;

    const legacyToken = (user as any).pushToken as string | null | undefined;
    const legacyPlatform = (user as any).pushPlatform as string | null | undefined;

    res.json({
      userId: user.id,
      role: user.role,
      legacyPushTokenExists: !!legacyToken,
      legacyPushTokenPreview: mask(legacyToken),
      legacyPushPlatform: legacyPlatform || null,
      activeTokensCount: activeTokens.length,
      activeTokens: activeTokens.map((t: any) => ({
        id: t.id,
        platform: t.platform,
        deviceId: t.deviceId ?? null,
        appVersion: t.appVersion ?? null,
        isActive: t.isActive,
        lastSeenAt: t.lastSeenAt ?? null,
        createdAt: t.createdAt ?? null,
        tokenPreview: mask(t.token),
      })),
      firebaseConfigured: isFirebaseConfigured(),
    });
  });

  /**
   * GET /api/admin/diag/firebase-status
   *
   * Vérifie l'état de la config Firebase Admin côté serveur sans jamais
   * révéler la valeur des secrets. Indique uniquement la PRÉSENCE et la
   * SOURCE des credentials, plus les erreurs visibles dans les logs récents.
   */
  app.get("/api/admin/diag/firebase-status", requireAdmin, async (_req, res) => {
    let credentialsSource:
      | "FIREBASE_SERVICE_ACCOUNT_JSON"
      | "FIREBASE_SERVICE_ACCOUNT_BASE64"
      | "GOOGLE_APPLICATION_CREDENTIALS"
      | "none" = "none";
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) credentialsSource = "FIREBASE_SERVICE_ACCOUNT_JSON";
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) credentialsSource = "FIREBASE_SERVICE_ACCOUNT_BASE64";
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) credentialsSource = "GOOGLE_APPLICATION_CREDENTIALS";

    let projectIdHint: string | null = null;
    let parseError: string | null = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const obj = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        projectIdHint = obj?.project_id || null;
      } catch (e: any) { parseError = String(e?.message || e); }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      try {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
        const obj = JSON.parse(decoded);
        projectIdHint = obj?.project_id || null;
      } catch (e: any) { parseError = String(e?.message || e); }
    }

    res.json({
      firebaseConfigured: isFirebaseConfigured(),
      credentialsSource,
      projectIdHint,
      parseError,
      expectedAndroidPackages: {
        client: "com.edcorp.maweja",
        driver: "com.edcorp.maweja.driver",
      },
      googleServicesJsonPath: {
        client: "mobile/client/android/app/google-services.json",
        driver: "mobile/driver/android/app/google-services.json",
      },
      hint:
        credentialsSource === "none"
          ? "Définissez FIREBASE_SERVICE_ACCOUNT_JSON dans les secrets serveur pour activer FCM."
          : parseError
          ? "Le secret est défini mais ne se parse pas en JSON valide."
          : null,
    });
  });

  /**
   * POST /api/admin/push/test
   *
   * Envoi de test complet pour debug : DB notification + WebSocket + Push FCM,
   * avec retour détaillé du résultat (sentCount/failedCount/invalidTokenCount,
   * skippedReason, results par token).
   *
   * Body :
   *   { userId, title?, body?, type?, eventType?, orderId?, imageUrl? }
   */
  app.post("/api/admin/push/test", requireAdmin, async (req, res) => {
    const userId = Number(req.body?.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: "userId requis" });
    }
    const target = await storage.getUser(userId);
    if (!target) return res.status(404).json({ message: "Utilisateur introuvable" });

    const title = (req.body?.title as string) || "Test push MAWEJA";
    const body = (req.body?.body as string) || "Si vous voyez ceci, le push fonctionne.";
    const type = (req.body?.type as string) || "info";
    const eventType = (req.body?.eventType as string) || "admin_test";
    const orderIdRaw = req.body?.orderId;
    const orderId = orderIdRaw != null && orderIdRaw !== "" ? Number(orderIdRaw) : undefined;
    const imageUrl = (req.body?.imageUrl as string) || null;

    // Notif data : on garde les types natifs côté DB (numbers) — le push
    // les stringifie automatiquement (cf. server/storage.ts createNotification).
    const notifData: Record<string, any> = { type, eventType, test: true };
    if (orderId) notifData.orderId = orderId;

    // 1) DB notification (skipAutoPush — on contrôle nous-mêmes l'envoi pour
    //    récupérer le PushResult détaillé)
    const created = await storage.createNotification({
      userId,
      title,
      message: body,
      type,
      imageUrl,
      data: notifData,
      isRead: false,
    }, { skipAutoPush: true });

    // 2) WebSocket
    let websocketSent = false;
    try {
      sendToUser(userId, {
        type: "notification",
        notification: {
          id: created.id,
          title,
          message: body,
          type,
          imageUrl,
          data: notifData,
        },
      });
      websocketSent = true;
    } catch (e) {
      logger.warn?.(`[admin/push/test] WS send failed user=${userId}`, e);
    }

    // 3) Push FCM
    const pushDataStr: Record<string, string> = {
      type: String(type),
      eventType: String(eventType),
      notificationId: String(created.id),
    };
    if (orderId) pushDataStr.orderId = String(orderId);
    if (imageUrl) pushDataStr.imageUrl = imageUrl;

    const pushResult = await sendPushToUser(userId, {
      title,
      body,
      imageUrl: imageUrl || undefined,
      data: pushDataStr,
    });

    logger.info?.(`[admin/push/test] target=${userId} push=${pushResult.status} sent=${pushResult.sentCount} failed=${pushResult.failedCount}`);

    res.json({
      notificationId: created.id,
      target: { id: target.id, role: target.role },
      websocketSent,
      pushResult: {
        status: pushResult.status,
        sentCount: pushResult.sentCount,
        failedCount: pushResult.failedCount,
        invalidTokenCount: pushResult.invalidTokenCount,
        skippedReason: pushResult.skippedReason ?? null,
        results: pushResult.results ?? [],
      },
    });
  });

  /**
   * GET /api/admin/push/tokens
   *
   * Liste GLOBALE de tous les tokens push enregistrés en base, enrichie
   * avec les infos user (name/email/role). Permet à l'admin d'inspecter
   * d'un seul coup d'œil quels appareils ont enregistré un token, sur
   * quelle plateforme, et de filtrer pour identifier les manquants.
   *
   * Query :
   *   - role?: client | driver | admin
   *   - platform?: web | android | ios
   *   - activeOnly?: "true" → filtre isActive=true uniquement
   *
   * Retourne aussi un compteur par plateforme pour faciliter le diagnostic
   * "aucun token Android enregistré".
   */
  app.get("/api/admin/push/tokens", requireAdmin, async (req, res) => {
    const role = typeof req.query.role === "string" && ["client", "driver", "admin"].includes(req.query.role)
      ? req.query.role
      : undefined;
    const platform = typeof req.query.platform === "string" && ["web", "android", "ios"].includes(req.query.platform)
      ? req.query.platform
      : undefined;
    const activeOnly = req.query.activeOnly === "true";

    const mask = (t?: string | null) =>
      !t ? null : t.length <= 12 ? `${t.slice(0, 4)}…` : `${t.slice(0, 8)}…${t.slice(-6)}`;

    let rows: Array<any> = [];
    try {
      rows = await storage.getAllPushTokensWithUser({ role, platform, activeOnly });
    } catch (e) {
      logger.warn?.(`[admin/push/tokens] échec listing`, e);
      return res.status(500).json({ message: "Listing tokens impossible" });
    }

    const counts = { web: 0, android: 0, ios: 0, total: rows.length };
    for (const r of rows) {
      if (r.platform === "web") counts.web++;
      else if (r.platform === "android") counts.android++;
      else if (r.platform === "ios") counts.ios++;
    }

    res.json({
      filters: { role: role ?? null, platform: platform ?? null, activeOnly },
      counts,
      tokens: rows.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        userName: r.userName,
        userEmail: r.userEmail,
        userRole: r.userRole,
        platform: r.platform,
        deviceId: r.deviceId,
        appVersion: r.appVersion,
        isActive: r.isActive,
        lastSeenAt: r.lastSeenAt,
        createdAt: r.createdAt,
        tokenPreview: mask(r.token),
        // source: web/android/ios — synonyme de platform pour clarté UI
        source: r.platform,
      })),
      hint:
        counts.android === 0
          ? "Aucun token Android enregistré. Le problème est côté app mobile ou configuration native (vérifier google-services.json + npx cap sync android + reinstall APK)."
          : null,
    });
  });

  /**
   * POST /api/admin/push/test-token
   *
   * Envoie un push de test DIRECT sur UN token précis (pas via le user) en
   * appelant firebase-admin messaging().send() avec un payload Android
   * complet (channelId maweja_default, sound default, priority high,
   * visibility public, mutableContent iOS, image webpush). Sert à isoler
   * un appareil suspect et confirmer si le problème vient du token, du
   * payload, du canal Android ou de la conf Firebase.
   *
   * Body :
   *   { tokenId?: number, token?: string,
   *     title?: string, body?: string, imageUrl?: string, data?: object }
   *
   * Si Firebase retourne registration-token-not-registered ou
   * invalid-registration-token, le token est automatiquement désactivé
   * (isActive=false) et flagué dans la réponse.
   */
  app.post("/api/admin/push/test-token", requireAdmin, async (req, res) => {
    const { tokenId, token: rawToken, title: rawTitle, body: rawBody, imageUrl: rawImage, data: rawData } = req.body || {};

    if (!tokenId && !rawToken) {
      return res.status(400).json({ message: "tokenId ou token requis" });
    }

    let row: any = null;
    try {
      if (tokenId && Number.isFinite(Number(tokenId))) {
        row = await storage.getPushTokenById(Number(tokenId));
      } else if (typeof rawToken === "string" && rawToken.length) {
        row = await storage.getPushTokenByValue(rawToken);
      }
    } catch (e) {
      logger.warn?.(`[admin/push/test-token] lookup échec`, e);
    }

    // Si on n'a pas trouvé en DB mais que le caller a fourni un token brut,
    // on accepte de tester quand même (cas d'un token externe à débugger).
    const tokenValue: string | null = row?.token || (typeof rawToken === "string" && rawToken.length ? rawToken : null);
    if (!tokenValue) {
      return res.status(404).json({ message: "Token introuvable" });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        success: false,
        error: { code: "no-firebase", message: "Firebase Admin non configuré côté serveur (FIREBASE_SERVICE_ACCOUNT_JSON manquant)." },
        tokenId: row?.id ?? null,
        platform: row?.platform ?? null,
        userId: row?.userId ?? null,
      });
    }

    const title = (typeof rawTitle === "string" && rawTitle.length ? rawTitle : "Test push MAWEJA");
    const body = (typeof rawBody === "string" && rawBody.length ? rawBody : "Si vous voyez ceci, le push fonctionne sur cet appareil.");
    const absImg = toAbsoluteImageUrl(typeof rawImage === "string" && rawImage.length ? rawImage : null);

    const testId = `test-${Date.now()}`;
    const dataStr: Record<string, string> = {
      testId,
      type: "push_test",
      eventType: "push:test",
      source: "admin_push_diagnostics",
      timestamp: String(Date.now()),
      ...(row?.userId ? { userId: String(row.userId) } : {}),
    };
    if (rawData && typeof rawData === "object") {
      for (const [k, v] of Object.entries(rawData as Record<string, unknown>)) {
        dataStr[String(k)] = String(v ?? "");
      }
    }
    if (absImg) dataStr.imageUrl = absImg;

    // tryInit() est appelé par sendPushToUser → on s'assure ici aussi.
    // On utilise admin.messaging() directement pour avoir le payload riche
    // demandé par la spec diag (channelId maweja_default).
    const a = admin.apps.length > 0 ? admin.app() : null;
    if (!a) {
      // Force init via un envoi à vide (no-op) pour déclencher tryInit()
      try {
        await sendPushToUser(-1, { title: "_init_", body: "_init_" });
      } catch {}
    }

    try {
      const messageId = await admin.messaging().send({
        token: tokenValue,
        notification: {
          title,
          body,
          ...(absImg ? { imageUrl: absImg } : {}),
        },
        data: dataStr,
        android: {
          priority: "high",
          notification: {
            channelId: "maweja_default",
            sound: "default",
            priority: "high",
            visibility: "public",
            defaultSound: true,
            defaultVibrateTimings: true,
            ...(absImg ? { imageUrl: absImg } : {}),
          },
        },
        apns: {
          headers: {
            "apns-priority": "10",
            "apns-push-type": "alert",
          },
          payload: {
            aps: {
              alert: { title, body },
              sound: "default",
              badge: 1,
              "mutable-content": 1 as any,
            },
          },
          ...(absImg ? { fcmOptions: { imageUrl: absImg } as any } : {}),
        },
        webpush: {
          notification: {
            title,
            body,
            icon: "/icon-192.png",
            ...(absImg ? { image: absImg } : {}),
          },
        },
      });

      logger.info?.(`[admin/push/test-token] success token=${row?.id ?? "raw"} platform=${row?.platform ?? "?"} msgId=${messageId}`);

      return res.json({
        success: true,
        firebaseMessageId: messageId,
        tokenId: row?.id ?? null,
        platform: row?.platform ?? null,
        userId: row?.userId ?? null,
        deviceId: row?.deviceId ?? null,
      });
    } catch (e: any) {
      const code: string = e?.errorInfo?.code || e?.code || "unknown";
      const message: string = e?.errorInfo?.message || e?.message || String(e);

      // Désactivation automatique des tokens invalides (registration not-found, etc.)
      const isInvalid =
        code.includes("registration-token-not-registered") ||
        code.includes("invalid-registration-token") ||
        code.includes("invalid-argument") ||
        code.includes("not-found") ||
        code.includes("unregistered");

      let deactivated = false;
      if (isInvalid) {
        try {
          await storage.deactivatePushToken(tokenValue);
          deactivated = true;
          logger.warn?.(`[admin/push/test-token] token invalide désactivé id=${row?.id ?? "?"} code=${code}`);
        } catch (de) {
          logger.warn?.(`[admin/push/test-token] désactivation échec`, de);
        }
      } else {
        logger.warn?.(`[admin/push/test-token] échec envoi code=${code} msg=${message}`);
      }

      return res.json({
        success: false,
        error: { code, message },
        tokenId: row?.id ?? null,
        platform: row?.platform ?? null,
        userId: row?.userId ?? null,
        deactivated,
      });
    }
  });

  /**
   * POST /api/admin/push/test-user
   *
   * Envoie un push DIRECT (firebase-admin.messaging().send()) sur CHAQUE
   * token actif d'un utilisateur, séparément, et retourne le détail brut
   * par token. Permet d'identifier exactement quel device d'un user reçoit
   * (ou pas) et pourquoi (code FCM précis).
   *
   * Différence avec sendPushToUser : on ne masque RIEN. "success" reflète
   * uniquement le retour de firebase-admin → on ne dit jamais "envoyé" si
   * messaging().send() a levé une exception.
   *
   * Body : { userId: number, title?, body?, imageUrl?, data? }
   *
   * Réponse :
   *   {
   *     userId, totalTokens,
   *     results: [{ tokenId, platform, deviceId, tokenPreview,
   *                 success, firebaseMessageId?, errorCode?, errorMessage?,
   *                 deactivated? }],
   *     summary: { sent, failed, deactivated }
   *   }
   */
  app.post("/api/admin/push/test-user", requireAdmin, async (req, res) => {
    const { userId: rawUserId, title: rawTitle, body: rawBody, imageUrl: rawImage, data: rawData } = req.body || {};
    const userId = Number(rawUserId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: "userId requis (number)" });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          code: "no-firebase",
          message: "Firebase Admin non configuré côté serveur (FIREBASE_SERVICE_ACCOUNT_JSON manquant).",
        },
        userId,
      });
    }

    let tokens: Array<{ id: number; token: string; platform: string; deviceId: string | null }> = [];
    try {
      const all = await storage.getActivePushTokensByUser(userId);
      tokens = (all || [])
        .map((t: any) => ({
          id: t.id,
          token: t.token,
          platform: t.platform || "?",
          deviceId: t.deviceId || null,
        }));
    } catch (e) {
      logger.warn?.(`[admin/push/test-user] lookup tokens échec userId=${userId}`, e);
      return res.status(500).json({ message: "Erreur lookup tokens", userId });
    }

    if (tokens.length === 0) {
      return res.json({
        userId,
        totalTokens: 0,
        results: [],
        summary: { sent: 0, failed: 0, deactivated: 0 },
        hint: "Aucun token actif enregistré pour cet utilisateur. L'app mobile a-t-elle bien tourné une fois (init push) ?",
      });
    }

    const title = (typeof rawTitle === "string" && rawTitle.length ? rawTitle : "Test push MAWEJA");
    const body = (typeof rawBody === "string" && rawBody.length ? rawBody : "Test ciblé sur tous vos appareils — Admin Push Diagnostics.");
    const absImg = toAbsoluteImageUrl(typeof rawImage === "string" && rawImage.length ? rawImage : null);

    const testId = `test-user-${userId}-${Date.now()}`;
    const dataStr: Record<string, string> = {
      testId,
      type: "push_test",
      eventType: "push:test",
      source: "admin_push_diagnostics_user",
      userId: String(userId),
      timestamp: String(Date.now()),
    };
    if (rawData && typeof rawData === "object") {
      for (const [k, v] of Object.entries(rawData as Record<string, unknown>)) {
        dataStr[String(k)] = String(v ?? "");
      }
    }
    if (absImg) dataStr.imageUrl = absImg;

    // S'assurer que firebase-admin est initialisé (idempotent via tryInit interne)
    if (admin.apps.length === 0) {
      try {
        await sendPushToUser(-1, { title: "_init_", body: "_init_" });
      } catch {}
    }

    const results: Array<any> = [];
    let sent = 0, failed = 0, deactivated = 0;

    for (const t of tokens) {
      const tokenPreview = `${t.token.substring(0, 12)}…${t.token.substring(t.token.length - 6)}`;
      try {
        const messageId = await admin.messaging().send({
          token: t.token,
          notification: { title, body, ...(absImg ? { imageUrl: absImg } : {}) },
          data: dataStr,
          android: {
            priority: "high",
            notification: {
              channelId: "maweja_default",
              sound: "default",
              priority: "high",
              visibility: "public",
              defaultSound: true,
              defaultVibrateTimings: true,
              ...(absImg ? { imageUrl: absImg } : {}),
            },
          },
          apns: {
            headers: { "apns-priority": "10", "apns-push-type": "alert" },
            payload: {
              aps: {
                alert: { title, body },
                sound: "default",
                badge: 1,
                "mutable-content": 1 as any,
              },
            },
            ...(absImg ? { fcmOptions: { imageUrl: absImg } as any } : {}),
          },
          webpush: {
            notification: {
              title,
              body,
              icon: "/icon-192.png",
              ...(absImg ? { image: absImg } : {}),
            },
          },
        });

        sent++;
        results.push({
          tokenId: t.id,
          platform: t.platform,
          deviceId: t.deviceId,
          tokenPreview,
          success: true,
          firebaseMessageId: messageId,
        });
        logger.info?.(`[admin/push/test-user] OK userId=${userId} tokenId=${t.id} platform=${t.platform} msgId=${messageId}`);
      } catch (e: any) {
        failed++;
        const code: string = e?.errorInfo?.code || e?.code || "unknown";
        const message: string = e?.errorInfo?.message || e?.message || String(e);

        const isInvalid =
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-registration-token") ||
          code.includes("invalid-argument") ||
          code.includes("not-found") ||
          code.includes("unregistered");

        let didDeactivate = false;
        if (isInvalid) {
          try {
            await storage.deactivatePushToken(t.token);
            didDeactivate = true;
            deactivated++;
            logger.warn?.(`[admin/push/test-user] token invalide désactivé id=${t.id} code=${code}`);
          } catch (de) {
            logger.warn?.(`[admin/push/test-user] désactivation échec id=${t.id}`, de);
          }
        } else {
          logger.warn?.(`[admin/push/test-user] FAIL userId=${userId} tokenId=${t.id} code=${code} msg=${message}`);
        }

        results.push({
          tokenId: t.id,
          platform: t.platform,
          deviceId: t.deviceId,
          tokenPreview,
          success: false,
          errorCode: code,
          errorMessage: message,
          deactivated: didDeactivate,
        });
      }
    }

    return res.json({
      userId,
      totalTokens: tokens.length,
      results,
      summary: { sent, failed, deactivated },
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
   *  Page admin "Push Diagnostics" — endpoints dédiés
   *  -------------------------------------------------
   *  Trois canaux indépendants, distinguables dans le panneau admin :
   *    • POST /api/admin/diag/ws        → WS only (pas de DB, pas de push)
   *    • POST /api/admin/diag/push      → réutilise /api/admin/push/test (DB+WS+Push)
   *    • POST /api/admin/diag/chat      → simule un message chat A→B (admin override)
   * ────────────────────────────────────────────────────────────────────────── */

  /** Envoie UNIQUEMENT un événement WebSocket à un user (no DB, no push). */
  app.post("/api/admin/diag/ws", requireAdmin, async (req, res) => {
    const userId = Number(req.body?.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: "userId requis" });
    }
    const target = await storage.getUser(userId);
    if (!target) return res.status(404).json({ message: "Utilisateur introuvable" });
    const message = (req.body?.message as string) || "Test WebSocket MAWEJA (admin diag)";
    const delivered = sendToUser(userId, {
      type: "notification",
      notification: {
        id: `diag-ws-${Date.now()}`,
        title: "Test WebSocket",
        message,
        type: "info",
        data: { eventType: "admin_diag_ws", test: true },
      },
    });
    logger.info?.(`[admin/diag/ws] target=${userId} delivered=${delivered}`);
    res.json({
      ok: true,
      target: { id: target.id, role: target.role },
      websocketDelivered: delivered,
    });
  });

  /**
   * Simule un message chat A→B avec override admin. Ne vérifie PAS canChatBetween
   * (puisque c'est un test). Reproduit la pipeline complète : storage.createChatMessage
   * → WS chat_message au receiver → notif DB → push FCM (single source) → fanout
   * admin_chat_preview silent. Retourne tous les statuts pour debug.
   */
  app.post("/api/admin/diag/chat", requireAdmin, async (req, res) => {
    const senderId = Number(req.body?.senderId);
    const receiverId = Number(req.body?.receiverId);
    const body = (req.body?.message as string) || "Test chat MAWEJA (admin diag)";
    if (!Number.isFinite(senderId) || senderId <= 0 || !Number.isFinite(receiverId) || receiverId <= 0) {
      return res.status(400).json({ message: "senderId/receiverId requis" });
    }
    const [sender, receiver] = await Promise.all([
      storage.getUser(senderId),
      storage.getUser(receiverId),
    ]);
    if (!sender || !receiver) return res.status(404).json({ message: "Utilisateur introuvable" });

    // 1) Crée le message chat en DB
    const msg = await storage.createChatMessage({
      senderId,
      receiverId,
      message: body,
      fileUrl: null,
      fileType: null,
      isRead: false,
    });

    // 2) Trouve une commande active entre les deux (best-effort, sinon undefined)
    let activeOrderId: number | undefined;
    try {
      const a = sender.role === "client" ? sender : receiver.role === "client" ? receiver : null;
      const b = sender.role === "driver" ? sender : receiver.role === "driver" ? receiver : null;
      if (a && b) {
        const TERMINAL = ["delivered", "cancelled", "returned"];
        const list = await storage.getOrders({ clientId: a.id });
        const active = list.find(o => o.driverId === b.id && !TERMINAL.includes(o.status));
        if (active) activeOrderId = active.id;
      }
    } catch (e) {
      logger.warn?.("[admin/diag/chat] active order lookup failed", e);
    }

    // 3) WS chat_message au receiver (déclenche son/notif côté front)
    const wsDelivered = sendToUser(receiverId, {
      type: "chat_message",
      message: msg,
      data: { orderId: activeOrderId, senderId, type: "chat" },
    });

    // 4) Notif DB + push (single source — skipAutoPush + sendPushToUser explicite)
    const receiverIsDriver = receiver.role === "driver";
    const notifTitle = receiver.role === "client"
      ? "Message de votre agent MAWEJA"
      : receiverIsDriver
      ? "Message du client"
      : "Nouveau message";
    const deepLink = receiverIsDriver && activeOrderId
      ? `/driver/chat/order/${activeOrderId}`
      : activeOrderId
      ? `/chat/order/${activeOrderId}`
      : "/notifications";
    const notifData: Record<string, any> = {
      type: "chat",
      eventType: "chat:new_message",
      senderId,
      receiverId,
      deepLink,
      diag: true,
    };
    if (activeOrderId) notifData.orderId = activeOrderId;

    const created = await storage.createNotification({
      userId: receiverId,
      title: notifTitle,
      message: `${sender.name}: ${body.substring(0, 50)}${body.length > 50 ? "..." : ""}`,
      type: "chat",
      data: notifData,
      isRead: false,
    }, { skipAutoPush: true });

    sendToUser(receiverId, {
      type: "notification",
      notification: {
        id: created.id, title: notifTitle,
        message: `${sender.name}: ${body}`,
        type: "chat", data: notifData,
      },
    });

    const pushDataStr: Record<string, string> = {
      type: "chat",
      eventType: "chat:new_message",
      notificationId: String(created.id),
      senderId: String(senderId),
      receiverId: String(receiverId),
      deepLink,
    };
    if (activeOrderId) pushDataStr.orderId = String(activeOrderId);
    const pushResult = await sendPushToUser(receiverId, {
      title: notifTitle,
      body: `${sender.name}: ${body}`,
      data: pushDataStr,
    });

    // 5) Fanout admin silent (cohérent avec /api/chat)
    try {
      const senderIsAdmin = sender.role === "admin";
      const receiverIsAdmin = receiver.role === "admin";
      if (!senderIsAdmin && !receiverIsAdmin) {
        const admins = (await storage.getAllUsers()).filter(u => u.role === "admin");
        for (const a of admins) {
          sendToUser(a.id, {
            type: "admin_chat_preview", silent: true, message: msg,
            meta: { adminPreview: true, senderId, receiverId, senderName: sender.name, receiverName: receiver.name, orderId: activeOrderId },
          });
        }
      }
    } catch (e) { logger.warn?.("[admin/diag/chat] admin fanout failed", e); }

    logger.info?.(
      `[admin/diag/chat] sender=${senderId} receiver=${receiverId} ` +
      `wsDelivered=${wsDelivered} notif=${created.id} push=${pushResult.status} ` +
      `sent=${pushResult.sentCount} skipped=${pushResult.skippedReason ?? "n/a"}`,
    );

    res.json({
      chatMessageId: msg.id,
      notificationId: created.id,
      activeOrderId: activeOrderId ?? null,
      deepLink,
      websocketDelivered: wsDelivered,
      pushResult: {
        status: pushResult.status,
        sentCount: pushResult.sentCount,
        failedCount: pushResult.failedCount,
        invalidTokenCount: pushResult.invalidTokenCount,
        skippedReason: pushResult.skippedReason ?? null,
        results: pushResult.results ?? [],
      },
      sender: { id: sender.id, role: sender.role, name: sender.name },
      receiver: { id: receiver.id, role: receiver.role, name: receiver.name },
    });
  });

  app.post("/api/admin/notifications/test", requireAdmin, async (req: any, res) => {
    const sessionUserId = (req.session as any)?.userId;
    const targetUserId = Number(req.body?.userId) || sessionUserId;
    if (!targetUserId) return res.status(400).json({ message: "userId requis" });

    const target = await storage.getUser(targetUserId);
    if (!target) return res.status(404).json({ message: "Utilisateur introuvable" });

    const title = (req.body?.title as string) || "Test notification MAWEJA";
    const message = (req.body?.message as string) || "Si vous voyez ceci, le système push fonctionne correctement.";
    const imageUrl = (req.body?.imageUrl as string) || null;

    // 1) Création DB (sans push auto — on veut le PushResult)
    const created = await storage.createNotification({
      userId: targetUserId,
      title,
      message,
      type: "info",
      imageUrl,
      data: { test: true },
      isRead: false,
    }, { skipAutoPush: true });

    // 2) WebSocket
    try {
      sendToUser(targetUserId, {
        type: "notification",
        data: {
          id: created.id,
          notificationId: created.id,
          title,
          message,
          imageUrl,
          type: "info",
        },
      });
    } catch {}

    // 3) Push natif — résultat collecté
    const pushResult = await sendPushToUser(targetUserId, {
      title,
      body: message,
      imageUrl: imageUrl || undefined,
      data: {
        type: "info",
        notificationId: String(created.id),
        eventType: "admin_test",
        test: "true",
      },
    });

    logger.info?.(`[admin/notif/test] target=${targetUserId} push=${pushResult.status}`);
    res.json({
      success: true,
      notificationId: created.id,
      target: { id: target.id, name: (target as any).name, role: target.role },
      push: pushResult,
    });
  });

  /**
   * GET /api/admin/operations
   *
   * Vue agrégée du centre d'opérations MAWEJA. Tout-en-un pour limiter
   * les allers-retours (la page se rafraîchit toutes les 15-30s côté UI).
   *
   * Query params (filtres optionnels) :
   *  - period:        "today" | "7d"   (défaut "today")
   *  - zone:          string           (filtre order.deliveryZone)
   *  - status:        string           (filtre order.status)
   *  - driverId:      number           (filtre order.driverId)
   *  - restaurantId:  number           (filtre order.restaurantId)
   */
  app.get("/api/admin/operations", requireAdmin, async (req, res) => {
    try {
      const period = (req.query.period as string) === "7d" ? "7d" : "today";
      const zoneFilter = typeof req.query.zone === "string" && req.query.zone ? req.query.zone : null;
      const statusFilter = typeof req.query.status === "string" && req.query.status ? req.query.status : null;
      const driverFilter = req.query.driverId ? Number(req.query.driverId) : null;
      const restaurantFilter = req.query.restaurantId ? Number(req.query.restaurantId) : null;

      const now = Date.now();
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const periodFrom = period === "7d"
        ? new Date(now - 7 * 24 * 60 * 60 * 1000)
        : startOfDay;

      // Données brutes
      const [allOrders, allUsers, restaurants, zones, openTickets] = await Promise.all([
        storage.getOrders(),
        storage.getAllUsers(),
        storage.getRestaurants(),
        storage.getDeliveryZones(),
        storage.listSupportTickets({ status: "open" }),
      ]);

      const drivers = allUsers.filter(u => u.role === "driver");
      const restaurantNameById = new Map(restaurants.map(r => [r.id, r.name]));
      const userNameById = new Map(allUsers.map(u => [u.id, u.name]));

      // Application des filtres généraux à la liste de commandes
      const matchesFilters = (o: any) => {
        if (zoneFilter && (o.deliveryZone || "") !== zoneFilter) return false;
        if (statusFilter && o.status !== statusFilter) return false;
        if (driverFilter && o.driverId !== driverFilter) return false;
        if (restaurantFilter && o.restaurantId !== restaurantFilter) return false;
        return true;
      };

      const filteredOrders = allOrders.filter(matchesFilters);

      // ── Statuts opérationnels ──
      const ACTIVE_STATUSES = new Set(["pending", "confirmed", "preparing", "ready", "picked_up"]);
      const activeOrders = filteredOrders.filter(o => ACTIVE_STATUSES.has(o.status));

      // Commandes en retard : estimatedDelivery dépassé sans être livrées
      const lateOrders = activeOrders.filter(o => {
        if (!o.estimatedDelivery) return false;
        const eta = new Date(o.estimatedDelivery).getTime();
        return Number.isFinite(eta) && eta < now;
      });

      // ── Disponibilité des livreurs ──
      const busyDriverIds = new Set(
        activeOrders.filter(o => typeof o.driverId === "number").map(o => o.driverId as number)
      );
      const driversBusy = drivers.filter(d => busyDriverIds.has(d.id));
      const driversOnlineFree = drivers.filter(d => d.isOnline && !busyDriverIds.has(d.id));
      const driversOffline = drivers.filter(d => !d.isOnline);

      // ── Remboursements en attente ──
      // Commande annulée, payée (carte/wallet/mobile) mais pas encore "refunded"
      const pendingRefunds = filteredOrders.filter(o =>
        o.status === "cancelled" &&
        o.paymentMethod !== "cash" &&
        o.paymentStatus !== "refunded"
      );

      // ── Tickets support (filtrage par commande si filtre actif) ──
      const ticketsScoped = openTickets.filter(t => {
        if (!restaurantFilter && !driverFilter && !zoneFilter && !statusFilter) return true;
        const order = allOrders.find(o => o.id === t.orderId);
        return order ? matchesFilters(order) : false;
      });

      // ── Zones actives ──
      const activeZones = zones.filter(z => z.isActive);

      // ── KPIs (sur la période demandée + filtres) ──
      const periodOrders = filteredOrders.filter(o => {
        const d = o.createdAt ? new Date(o.createdAt).getTime() : 0;
        return d >= periodFrom.getTime();
      });
      const todayOrders = filteredOrders.filter(o => {
        const d = o.createdAt ? new Date(o.createdAt).getTime() : 0;
        return d >= startOfDay.getTime();
      });
      const inProgress = activeOrders.length;

      const deliveredInPeriod = periodOrders.filter(o => o.status === "delivered" && o.deliveredAt && o.createdAt);
      const avgDeliveryMinutes = deliveredInPeriod.length > 0
        ? Math.round(
            deliveredInPeriod.reduce((s, o) =>
              s + (new Date(o.deliveredAt!).getTime() - new Date(o.createdAt!).getTime()) / 60000, 0
            ) / deliveredInPeriod.length
          )
        : null;

      const cancelledInPeriod = periodOrders.filter(o => o.status === "cancelled").length;
      const cancelRate = periodOrders.length > 0
        ? Math.round((cancelledInPeriod / periodOrders.length) * 1000) / 10
        : 0;

      const driverRated = periodOrders.filter(o => o.driverId && typeof o.rating === "number");
      const avgDriverRating = driverRated.length > 0
        ? Math.round((driverRated.reduce((s, o) => s + (o.rating || 0), 0) / driverRated.length) * 10) / 10
        : null;

      // Rating restaurant : on agrège la moyenne pondérée des restaurants actifs
      const ratedRestaurants = restaurants.filter(r => typeof r.rating === "number" && r.rating > 0);
      const avgRestaurantRating = ratedRestaurants.length > 0
        ? Math.round((ratedRestaurants.reduce((s, r) => s + (r.rating || 0), 0) / ratedRestaurants.length) * 10) / 10
        : null;

      // ── Actions urgentes ──
      // Seuils opérationnels (minutes)
      const NO_DRIVER_MIN = 5;
      const BLOCKED_PENDING_MIN = 10;
      const WAITING_CLIENT_MIN = 30;
      const URGENT_TICKET_MIN = 30;

      const minutesAgo = (d: Date | string | null | undefined) =>
        d ? (now - new Date(d).getTime()) / 60000 : 0;

      const noDriver = activeOrders
        .filter(o => !o.driverId && minutesAgo(o.createdAt) >= NO_DRIVER_MIN)
        .map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          createdAt: o.createdAt,
          minutesWaiting: Math.round(minutesAgo(o.createdAt)),
          restaurantId: o.restaurantId,
          restaurantName: restaurantNameById.get(o.restaurantId) ?? "—",
          deliveryZone: o.deliveryZone ?? null,
          total: o.total,
        }));

      const blocked = activeOrders
        .filter(o => o.status === "pending" && minutesAgo(o.createdAt) >= BLOCKED_PENDING_MIN)
        .map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          minutesBlocked: Math.round(minutesAgo(o.createdAt)),
          restaurantId: o.restaurantId,
          restaurantName: restaurantNameById.get(o.restaurantId) ?? "—",
        }));

      const waitingClients = activeOrders
        .filter(o =>
          (o.status === "ready" || o.status === "picked_up") &&
          minutesAgo(o.updatedAt ?? o.createdAt) >= WAITING_CLIENT_MIN
        )
        .map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          minutesWaiting: Math.round(minutesAgo(o.updatedAt ?? o.createdAt)),
          driverId: o.driverId,
          driverName: o.driverId ? userNameById.get(o.driverId) ?? "—" : null,
        }));

      const urgentSupport = ticketsScoped
        .filter(t => minutesAgo(t.createdAt) >= URGENT_TICKET_MIN)
        .map(t => ({
          id: t.id,
          orderId: t.orderId,
          subject: t.subject,
          message: t.message,
          createdAt: t.createdAt,
          minutesOpen: Math.round(minutesAgo(t.createdAt)),
          userId: t.userId,
          userName: userNameById.get(t.userId) ?? "—",
        }));

      const refundsToValidate = pendingRefunds.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        cancelReason: o.cancelReason,
        clientId: o.clientId,
        clientName: userNameById.get(o.clientId) ?? "—",
      }));

      // ── Alertes critiques (compteur global sur le bandeau Live) ──
      const criticalAlerts =
        lateOrders.length +
        noDriver.length +
        blocked.length +
        urgentSupport.length +
        refundsToValidate.length;

      // ── Listes pour les filtres (UI) ──
      const filterMeta = {
        zones: Array.from(new Set([
          ...activeZones.map(z => z.name),
          ...allOrders.map(o => o.deliveryZone).filter((x): x is string => !!x),
        ])).sort(),
        statuses: Array.from(new Set(allOrders.map(o => o.status))).sort(),
        drivers: drivers.map(d => ({ id: d.id, name: d.name, isOnline: d.isOnline })),
        restaurants: restaurants.map(r => ({ id: r.id, name: r.name, isActive: r.isActive })),
      };

      res.json({
        period,
        appliedFilters: {
          zone: zoneFilter,
          status: statusFilter,
          driverId: driverFilter,
          restaurantId: restaurantFilter,
        },
        live: {
          activeOrders: activeOrders.length,
          lateOrders: lateOrders.length,
          driversOnline: driversOnlineFree.length,
          driversBusy: driversBusy.length,
          driversOffline: driversOffline.length,
          openSupportTickets: ticketsScoped.length,
          pendingRefunds: pendingRefunds.length,
          activeZones: activeZones.length,
          criticalAlerts,
        },
        kpis: {
          todayOrders: todayOrders.length,
          inProgressOrders: inProgress,
          avgDeliveryMinutes,
          cancelRate,
          avgDriverRating,
          avgRestaurantRating,
          openTickets: ticketsScoped.length,
        },
        urgent: {
          noDriver,
          blocked,
          waitingClients,
          urgentSupport,
          refundsToValidate,
        },
        filters: filterMeta,
        thresholds: {
          noDriverMinutes: NO_DRIVER_MIN,
          blockedPendingMinutes: BLOCKED_PENDING_MIN,
          waitingClientMinutes: WAITING_CLIENT_MIN,
          urgentTicketMinutes: URGENT_TICKET_MIN,
        },
      });
    } catch (e: any) {
      logger.error?.(`[admin/operations] ${e?.message || e}`);
      res.status(500).json({ message: "Erreur lors du chargement du centre d'opérations" });
    }
  });
}
