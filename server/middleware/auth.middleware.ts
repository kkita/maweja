import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export async function resolveUserFromRequest(req: any): Promise<number | null> {
  if ((req.session as any)?.userId) {
    return (req.session as any).userId;
  }
  const authHeader = req.headers["authorization"] as string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token) {
      const user = await storage.getUserByToken(token);
      if (user && !user.isBlocked) {
        (req.session as any).userId = user.id;
        return user.id;
      }
    }
  }
  return null;
}

export async function requireAuth(req: any, res: Response, next: NextFunction): Promise<void> {
  const userId = await resolveUserFromRequest(req);
  if (!userId) {
    res.status(401).json({ message: "Non authentifie" });
    return;
  }
  next();
}

export async function requireAdmin(req: any, res: Response, next: NextFunction): Promise<void> {
  const userId = await resolveUserFromRequest(req);
  if (!userId) {
    res.status(401).json({ message: "Non authentifie" });
    return;
  }
  const user = await storage.getUser(userId);
  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Acces interdit" });
    return;
  }
  if (user.isBlocked) {
    res.status(403).json({ message: "Compte bloqué par un administrateur" });
    return;
  }
  next();
}
