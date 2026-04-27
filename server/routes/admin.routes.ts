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
}
