import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validate, schemas } from "../validators";
import { wsClients } from "../websocket";
import { WebSocket } from "ws";

export function registerServicesRoutes(app: Express): void {
  app.get("/api/service-categories", async (_req, res) => {
    const cats = await storage.getServiceCategories();
    res.json(cats);
  });

  app.post("/api/service-categories", requireAdmin, validate(schemas.serviceCategoryCreate), async (req, res) => {
    const cat = await storage.createServiceCategory(req.body);
    res.json(cat);
  });

  app.patch("/api/service-categories/reorder", requireAdmin, async (req, res) => {
    const { order } = req.body as { order?: { id: number; sortOrder: number }[] };
    if (!Array.isArray(order)) return res.status(400).json({ message: "order[] requis" });
    for (const item of order) {
      await storage.updateServiceCategory(item.id, { sortOrder: item.sortOrder });
    }
    res.json({ success: true });
  });

  app.patch("/api/service-categories/:id", requireAdmin, validate(schemas.serviceCategoryUpdate), async (req, res) => {
    const updated = await storage.updateServiceCategory(Number(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/service-categories/:id", requireAdmin, async (req, res) => {
    await storage.deleteServiceCategory(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/service-catalog", async (req, res) => {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const items = await storage.getServiceCatalogItems(categoryId);
    res.json(items);
  });

  app.post("/api/service-catalog", requireAdmin, validate(schemas.serviceCatalogCreate), async (req, res) => {
    const item = await storage.createServiceCatalogItem(req.body);
    res.json(item);
  });

  app.patch("/api/service-catalog/:id", requireAdmin, validate(schemas.serviceCatalogUpdate), async (req, res) => {
    const updated = await storage.updateServiceCatalogItem(Number(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/service-catalog/:id", requireAdmin, async (req, res) => {
    await storage.deleteServiceCatalogItem(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/service-requests", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Non autorise" });
    const filters: any = {};
    if (user.role === "client") filters.clientId = userId;
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.categoryId) filters.categoryId = Number(req.query.categoryId);
    const requests = await storage.getServiceRequests(filters);
    res.json(requests);
  });

  app.get("/api/service-requests/:id", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Non autorise" });
    const sr = await storage.getServiceRequest(Number(req.params.id));
    if (!sr) return res.status(404).json({ message: "Non trouve" });
    if (user.role === "client" && sr.clientId !== userId) return res.status(403).json({ message: "Acces refuse" });
    res.json(sr);
  });

  app.post("/api/service-requests", requireAuth, validate(schemas.serviceRequestCreate), async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "client") return res.status(403).json({ message: "Acces interdit" });
    const sr = await storage.createServiceRequest({ ...req.body, clientId: userId });
    const admins = (await storage.getAllUsers()).filter(u => u.role === "admin");
    for (const admin of admins) {
      await storage.createNotification({
        userId: admin.id,
        title: "Nouvelle demande de service",
        message: `Demande de ${sr.categoryName} par ${sr.fullName}`,
        type: "service_request",
        data: { serviceRequestId: sr.id },
      });
    }
    for (const admin of admins) {
      const ws = wsClients.get(admin.id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "service_request", data: sr }));
      }
    }
    res.json(sr);
  });

  app.patch("/api/service-requests/:id", requireAdmin, validate(schemas.serviceRequestUpdate), async (req, res) => {
    const updated = await storage.updateServiceRequest(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Non trouve" });
    if (updated.clientId) {
      const statusLabelMap: Record<string, string> = {
        pending: "En attente",
        reviewing: "En cours d'examen",
        accepted: "Acceptee",
        rejected: "Refusee",
        completed: "Terminee",
      };
      const statusLabel = statusLabelMap[updated.status] || updated.status;
      const noteFragment = updated.adminNotes ? ` — ${updated.adminNotes}` : "";
      await storage.createNotification({
        userId: updated.clientId,
        title: `Mise a jour : ${updated.categoryName || "Service"}`,
        message: `Statut : ${statusLabel}${noteFragment}`,
        type: "service_update",
        data: { serviceRequestId: updated.id, status: updated.status },
        isRead: false,
      });
      const ws = wsClients.get(updated.clientId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "service_update", data: updated }));
      }
    }
    res.json(updated);
  });
}
