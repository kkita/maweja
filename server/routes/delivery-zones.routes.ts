import type { Express } from "express";
import { storage } from "../storage";
import { requireAdmin } from "../middleware/auth.middleware";

export function registerDeliveryZonesRoutes(app: Express): void {
  app.get("/api/delivery-zones", async (_req, res) => {
    try {
      const zones = await storage.getDeliveryZones();
      res.json(zones);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Erreur serveur" });
    }
  });

  app.post("/api/delivery-zones", requireAdmin, async (req, res) => {
    try {
      const { name, fee, color, neighborhoods, isActive, sortOrder } = req.body;
      if (!name?.trim()) {
        return res.status(400).json({ message: "Le nom de la zone est requis" });
      }
      const feeNum = parseFloat(fee);
      if (!isFinite(feeNum) || feeNum < 0) {
        return res.status(400).json({ message: "Frais de livraison invalides" });
      }
      const zone = await storage.createDeliveryZone({
        name: name.trim(),
        fee: feeNum,
        color: color || "#22c55e",
        neighborhoods: Array.isArray(neighborhoods) ? neighborhoods : [],
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      });
      res.json(zone);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Erreur serveur" });
    }
  });

  app.patch("/api/delivery-zones/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(400).json({ message: "ID invalide" });

      const update: Record<string, any> = {};
      if (req.body.name !== undefined) update.name = req.body.name.trim();
      if (req.body.fee !== undefined) {
        const feeNum = parseFloat(req.body.fee);
        if (!isFinite(feeNum) || feeNum < 0) {
          return res.status(400).json({ message: "Frais de livraison invalides" });
        }
        update.fee = feeNum;
      }
      if (req.body.color !== undefined) update.color = req.body.color;
      if (req.body.neighborhoods !== undefined) update.neighborhoods = Array.isArray(req.body.neighborhoods) ? req.body.neighborhoods : [];
      if (req.body.isActive !== undefined) update.isActive = Boolean(req.body.isActive);
      if (req.body.sortOrder !== undefined) update.sortOrder = Number(req.body.sortOrder);

      const zone = await storage.updateDeliveryZone(id, update);
      if (!zone) return res.status(404).json({ message: "Zone non trouvée" });
      res.json(zone);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Erreur serveur" });
    }
  });

  app.delete("/api/delivery-zones/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return res.status(400).json({ message: "ID invalide" });
      await storage.deleteDeliveryZone(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Erreur serveur" });
    }
  });
}
