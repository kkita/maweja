import express, { type Express } from "express";
import path from "path";
import crypto from "crypto";
import { storage } from "../storage";
import { objectStorageClient } from "../replit_integrations/object_storage";
import { requireAuth } from "../middleware/auth.middleware";
import { resolveUserFromRequest } from "../middleware/auth.middleware";
import { upload, uploadMedia, uploadsDir, uploadToCloudStorage } from "../middleware/upload.middleware";
import { logger } from "../lib/logger";
import {
  hashPassword,
  verifyPassword,
  loginLimiter,
  forgotPasswordLimiter,
  uploadLimiter,
  registerLimiter,
} from "../auth";
import { validate, validateParams, schemas } from "../validators";
import { sendToUser } from "../websocket";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function registerAuthRoutes(app: Express): void {
  app.get("/guide-dashboard-maweja.html", (_req, res) => {
    res.sendFile(path.resolve(process.cwd(), "guide-dashboard-maweja.html"));
  });

  app.post("/api/auth/login", loginLimiter, validate(schemas.login), async (req, res) => {
    const { email, password, expectedRole } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email ou telephone et mot de passe requis" });
    const isEmail = email.includes("@");
    const user = isEmail
      ? await storage.getUserByEmail(email)
      : await storage.getUserByPhone(email);
    if (!user) return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    const { ok, needsRehash } = await verifyPassword(password, user.password || "");
    if (!ok) return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    if (needsRehash) {
      const hashed = await hashPassword(password);
      await storage.updateUser(user.id, { password: hashed });
    }
    if (user.isBlocked) return res.status(403).json({ message: "Votre compte a ete bloque. Contactez le support." });
    if (expectedRole && user.role !== expectedRole) {
      const msgs: Record<string, string> = {
        client: "Ce compte n'est pas un compte client",
        driver: "Ce compte n'est pas un compte livreur",
        admin: "Ce compte n'est pas un compte administrateur",
      };
      return res.status(403).json({ message: msgs[expectedRole] || "Acces interdit" });
    }
    (req.session as any).userId = user.id;
    const token = generateToken();
    await storage.updateUser(user.id, { authToken: token });
    const { password: _, ...safeUser } = user;
    const responseData = { ...safeUser, authToken: token };
    req.session.save((err) => {
      if (err) {
        logger.error("Session save error", err);
        return res.status(500).json({ message: "Erreur de session" });
      }
      res.json(responseData);
    });
  });

  app.post("/api/auth/register", registerLimiter, validate(schemas.register), async (req, res) => {
    const { email, password, name, phone, role, address } = req.body;
    if (!password || !name || !phone) return res.status(400).json({ message: "Nom, telephone et mot de passe sont requis" });
    if (role === "admin") return res.status(403).json({ message: "Acces interdit" });
    if (email) {
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(400).json({ message: "Cet email existe deja" });
    }
    if (role !== "driver") {
      const existingPhone = await storage.getUserByPhone(phone);
      if (existingPhone) return res.status(400).json({ message: "Ce numero de telephone est deja utilise" });
    }
    const hashedPw = await hashPassword(password);
    const user = await storage.createUser({
      email, password: hashedPw, name, phone, role: "client",
      walletBalance: 0, loyaltyPoints: 0, isOnline: false, isBlocked: false,
      address: address || null,
    });
    (req.session as any).userId = user.id;
    const regToken = generateToken();
    await storage.updateUser(user.id, { authToken: regToken });
    const { password: _, ...safeUser } = user;
    const regResponseData = { ...safeUser, authToken: regToken };
    await new Promise<void>((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve()))
    );
    const admins = (await storage.getAllUsers()).filter(u => u.role === "admin");
    for (const admin of admins) {
      await storage.createNotification({
        userId: admin.id,
        title: "Nouvel utilisateur",
        message: `${name} (${role || "client"}) s'est inscrit`,
        type: "user",
        isRead: false,
      });
      sendToUser(admin.id, { type: "new_user", user: safeUser });
    }
    res.json(regResponseData);
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = await resolveUserFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Non authentifie" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Utilisateur non trouve" });
    if (user.isBlocked) return res.status(403).json({ message: "Compte bloque" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/logout", async (req, res) => {
    const sessionUserId = (req.session as any).userId;
    if (sessionUserId) {
      try { await storage.updateUser(sessionUserId, { authToken: null }); } catch (err) { logger.warn("Logout: failed to clear session token", err); }
    }
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const tokenUser = await storage.getUserByToken(token);
        if (tokenUser) await storage.updateUser(tokenUser.id, { authToken: null });
      } catch (err) { logger.warn("Logout: failed to clear bearer token", err); }
    }
    req.session.destroy((err) => {
      if (err) logger.error("Session destroy error", err);
      res.json({ ok: true });
    });
  });

  app.post("/api/auth/forgot-password", forgotPasswordLimiter, validate(schemas.forgotPassword), async (req, res) => {
    try {
      const { identifier, requestType, message, role } = req.body;
      if (!identifier) return res.status(400).json({ message: "Identifiant requis (email ou telephone)" });
      const isEmail = identifier.includes("@");
      const user = isEmail ? await storage.getUserByEmail(identifier) : await storage.getUserByPhone(identifier);
      const userName = user?.name || "Utilisateur inconnu";
      const userRole = user?.role || role || "client";
      const userEmail = user?.email || (isEmail ? identifier : null);
      const userPhone = user?.phone || (!isEmail ? identifier : null);
      const userId = user?.id || null;
      if (requestType === "email") {
        if (!userEmail) return res.status(400).json({ message: "Aucun email associe a ce compte. Utilisez le chat avec l'admin." });
        const token = generateToken();
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await storage.createPasswordResetRequest({
          userId, userName, userRole, userEmail, userPhone,
          status: "pending", requestType: "email",
          token, tokenExpiry,
          message: message || null, adminNote: null,
        });
        return res.json({ ok: true, message: "Demande envoyee. L'administrateur vous enverra le lien de reinitialisation par email.", method: "email" });
      } else {
        if (userId) {
          const adminUsers = (await storage.getAllUsers()).filter(u => u.role === "admin");
          const chatMsg = `Bonjour, je suis ${userName}. J'ai oublie mon mot de passe et je demande une reinitialisation de mon compte (${userRole}). ${message ? `Message: ${message}` : ""}`.trim();
          for (const admin of adminUsers) {
            await storage.createChatMessage({ senderId: userId, receiverId: admin.id, message: chatMsg, isRead: false });
            sendToUser(admin.id, { type: "new_message", message: { senderId: userId, content: chatMsg } });
          }
        }
        await storage.createPasswordResetRequest({
          userId, userName, userRole, userEmail, userPhone,
          status: "pending", requestType: "chat",
          token: null, tokenExpiry: null,
          message: message || null, adminNote: null,
        });
        return res.json({ ok: true, message: "Votre demande a ete envoyee a l'administrateur. Vous serez contacte sous peu.", method: "chat" });
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Erreur serveur" });
    }
  });

  app.post("/api/auth/reset-password/:token", validateParams(schemas.params.token), validate(schemas.resetPassword), async (req, res) => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caracteres" });
      const request = await storage.getPasswordResetRequestByToken(String(token));
      if (!request) return res.status(404).json({ message: "Lien invalide ou expire" });
      if (request.status !== "pending") return res.status(400).json({ message: "Ce lien a deja ete utilise" });
      if (request.tokenExpiry && new Date(request.tokenExpiry) < new Date()) return res.status(400).json({ message: "Ce lien a expire. Veuillez faire une nouvelle demande." });
      const hashed = await hashPassword(newPassword);
      if (request.userId) {
        await storage.updateUser(request.userId, { password: hashed });
      } else if (request.userEmail) {
        const user = await storage.getUserByEmail(request.userEmail);
        if (user) await storage.updateUser(user.id, { password: hashed });
      }
      await storage.updatePasswordResetRequest(request.id, { status: "resolved", resolvedAt: new Date() });
      res.json({ ok: true, message: "Mot de passe reinitialise avec succes" });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Erreur serveur" });
    }
  });

  app.use("/uploads", express.static(uploadsDir));

  app.get("/cloud/{*cloudPath}", async (req: any, res) => {
    const rawPath = req.params.cloudPath;
    const objectPath = Array.isArray(rawPath) ? rawPath.join("/") : rawPath;
    if (!objectPath) return res.status(400).json({ message: "Path requis" });
    if (!objectPath.startsWith("public/uploads/")) return res.status(403).json({ message: "Accès interdit" });
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) return res.status(500).json({ message: "Object Storage non configuré" });
    try {
      const bucket = objectStorageClient.bucket(bucketId);
      const file = bucket.file(objectPath);
      const [exists] = await file.exists();
      if (!exists) return res.status(404).json({ message: "Fichier introuvable" });
      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      });
      if (metadata.size) res.set("Content-Length", String(metadata.size));
      file.createReadStream().pipe(res);
    } catch (err: any) {
      logger.error("Cloud serve error", err);
      res.status(500).json({ message: "Erreur de lecture fichier" });
    }
  });

  app.post("/api/upload", requireAuth, uploadLimiter, (req: any, res: any, next: any) => {
    upload.single("file")(req, res, async (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "Fichier trop volumineux (max 10MB)" });
        }
        return res.status(400).json({ message: err.message || "Erreur lors de l'upload" });
      }
      if (!req.file) return res.status(400).json({ message: "Format non supporté. Utilisez JPG, PNG ou WEBP." });
      const url = await uploadToCloudStorage(req.file.path, req.file.filename, req.file.mimetype);
      res.json({ url });
    });
  });

  app.post("/api/upload-media", requireAuth, uploadLimiter, uploadMedia.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "Fichier requis (image ou video mp4/webm/mov, max 20MB)" });
    const url = await uploadToCloudStorage(req.file.path, req.file.filename, req.file.mimetype);
    const isVideo = req.file.mimetype.startsWith("video/");
    res.json({ url, type: isVideo ? "video" : "image" });
  });
}
