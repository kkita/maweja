import type { Express } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { restaurantCategories, boutiqueCategories, menuItemCategories } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validate, schemas } from "../validators";

export function registerRestaurantsRoutes(app: Express): void {
  app.get("/api/restaurants", async (req, res) => {
    const all = await storage.getRestaurants();
    const typeFilter = req.query.type as string | undefined;
    if (typeFilter) {
      res.json(all.filter((r: any) => r.type === typeFilter));
    } else {
      res.json(all);
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    const r = await storage.getRestaurant(Number(req.params.id));
    if (!r) return res.status(404).json({ message: "Restaurant non trouve" });
    res.json(r);
  });

  app.post("/api/restaurants", requireAdmin, validate(schemas.restaurantCreate), async (req, res) => {
    const r = await storage.createRestaurant(req.body);
    res.json(r);
  });

  app.patch("/api/restaurants/reorder", requireAdmin, validate(schemas.reorderBody), async (req, res) => {
    const { order } = req.body;
    for (const item of order) {
      await storage.updateRestaurant(item.id, { sortOrder: item.sortOrder });
    }
    res.json({ success: true });
  });

  app.patch("/api/restaurants/:id", requireAdmin, validate(schemas.restaurantUpdate), async (req, res) => {
    const r = await storage.updateRestaurant(Number(req.params.id), req.body);
    res.json(r);
  });

  app.delete("/api/restaurants/:id", requireAdmin, async (req, res) => {
    await storage.deleteRestaurant(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/restaurants/:id/menu", async (req, res) => {
    const items = await storage.getMenuItems(Number(req.params.id));
    const adminView = req.query.adminView === "true";
    if (!adminView) {
      const restaurant = await storage.getRestaurant(Number(req.params.id));
      const rate = restaurant?.restaurantCommissionRate ?? 0;
      if (rate > 0) {
        const adjusted = items.map(item => ({
          ...item,
          basePrice: item.price,
          price: parseFloat((item.price * (1 + rate / 100)).toFixed(2)),
        }));
        return res.json(adjusted);
      }
    }
    res.json(items);
  });

  app.post("/api/menu-items", requireAdmin, validate(schemas.menuItemCreate), async (req, res) => {
    const item = await storage.createMenuItem(req.body);
    res.json(item);
  });

  app.patch("/api/menu-items/:id", requireAdmin, validate(schemas.menuItemUpdate), async (req, res) => {
    const item = await storage.updateMenuItem(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/menu-items/:id", requireAdmin, async (req, res) => {
    await storage.deleteMenuItem(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/restaurant-categories", async (_req, res) => {
    const rows = await db.select().from(restaurantCategories).orderBy(restaurantCategories.sortOrder, restaurantCategories.name);
    res.json(rows);
  });

  app.post("/api/restaurant-categories", requireAdmin, validate(schemas.categoryCreate), async (req, res) => {
    const { name, emoji, isActive, sortOrder } = req.body;
    const [row] = await db.insert(restaurantCategories).values({
      name, emoji: emoji || "🍽️", isActive: isActive ?? true, sortOrder: sortOrder ?? 0,
    }).returning();
    res.json(row);
  });

  app.patch("/api/restaurant-categories/:id", requireAdmin, validate(schemas.categoryUpdate), async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db.update(restaurantCategories).set(req.body).where(eq(restaurantCategories.id, id)).returning();
    res.json(row);
  });

  app.delete("/api/restaurant-categories/:id", requireAdmin, async (req, res) => {
    await db.delete(restaurantCategories).where(eq(restaurantCategories.id, Number(req.params.id)));
    res.json({ ok: true });
  });

  app.get("/api/boutique-categories", async (_req, res) => {
    const rows = await db.select().from(boutiqueCategories).orderBy(boutiqueCategories.sortOrder, boutiqueCategories.name);
    res.json(rows);
  });

  app.post("/api/boutique-categories", requireAdmin, validate(schemas.categoryCreate), async (req, res) => {
    const { name, emoji, isActive, sortOrder } = req.body;
    const [row] = await db.insert(boutiqueCategories).values({
      name, emoji: emoji || "🛍️", isActive: isActive ?? true, sortOrder: sortOrder ?? 0,
    }).returning();
    res.json(row);
  });

  app.patch("/api/boutique-categories/:id", requireAdmin, validate(schemas.categoryUpdate), async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db.update(boutiqueCategories).set(req.body).where(eq(boutiqueCategories.id, id)).returning();
    res.json(row);
  });

  app.delete("/api/boutique-categories/:id", requireAdmin, async (req, res) => {
    await db.delete(boutiqueCategories).where(eq(boutiqueCategories.id, Number(req.params.id)));
    res.json({ ok: true });
  });

  app.get("/api/menu-item-categories", async (req, res) => {
    const storeType = req.query.storeType as string | undefined;
    if (storeType) {
      const rows = await db.select().from(menuItemCategories)
        .where(eq(menuItemCategories.storeType, storeType))
        .orderBy(menuItemCategories.sortOrder, menuItemCategories.name);
      return res.json(rows);
    }
    const rows = await db.select().from(menuItemCategories).orderBy(menuItemCategories.sortOrder, menuItemCategories.name);
    res.json(rows);
  });

  app.post("/api/menu-item-categories", requireAdmin, validate(schemas.categoryCreate), async (req, res) => {
    const { name, storeType, isActive, sortOrder } = req.body;
    const [row] = await db.insert(menuItemCategories).values({
      name: name.trim(),
      storeType: storeType || "restaurant",
      isActive: isActive !== false,
      sortOrder: sortOrder || 0,
    }).returning();
    res.json(row);
  });

  app.patch("/api/menu-item-categories/:id", requireAdmin, validate(schemas.categoryUpdate), async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db.update(menuItemCategories).set(req.body).where(eq(menuItemCategories.id, id)).returning();
    res.json(row);
  });

  app.delete("/api/menu-item-categories/:id", requireAdmin, async (req, res) => {
    await db.delete(menuItemCategories).where(eq(menuItemCategories.id, Number(req.params.id)));
    res.json({ ok: true });
  });

  app.get("/api/saved-addresses", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const addresses = await storage.getSavedAddresses(userId);
    res.json(addresses);
  });

  app.post("/api/saved-addresses", requireAuth, validate(schemas.savedAddressCreate), async (req, res) => {
    const userId = (req.session as any).userId;
    const { label, address, lat, lng, isDefault } = req.body;
    if (isDefault) await storage.setDefaultAddress(userId, -1);
    const addr = await storage.createSavedAddress({ userId, label, address, lat, lng, isDefault: isDefault || false });
    res.json(addr);
  });

  app.patch("/api/saved-addresses/:id", requireAuth, validate(schemas.savedAddressUpdate), async (req, res) => {
    const userId = (req.session as any).userId;
    const existing = await storage.getSavedAddresses(userId);
    if (!existing.find(a => a.id === Number(req.params.id))) return res.status(403).json({ message: "Acces refuse" });
    const addr = await storage.updateSavedAddress(Number(req.params.id), req.body);
    if (!addr) return res.status(404).json({ message: "Adresse non trouvee" });
    res.json(addr);
  });

  app.delete("/api/saved-addresses/:id", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const existing = await storage.getSavedAddresses(userId);
    if (!existing.find(a => a.id === Number(req.params.id))) return res.status(403).json({ message: "Acces refuse" });
    await storage.deleteSavedAddress(Number(req.params.id));
    res.json({ ok: true });
  });

  app.patch("/api/saved-addresses/:id/default", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.setDefaultAddress(userId, Number(req.params.id));
    res.json({ ok: true });
  });

  app.post("/api/promo/validate", requireAuth, validate(schemas.promoValidate), async (req, res) => {
    const { code, subtotal, restaurantId } = req.body;
    if (!code) return res.status(400).json({ message: "Code promo requis" });
    const promo = await storage.getPromotionByCode(code.toUpperCase());
    if (!promo || !promo.isActive) return res.status(400).json({ message: "Code promo invalide" });
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return res.status(400).json({ message: "Code promo expire" });
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) return res.status(400).json({ message: "Code promo epuise" });
    if (promo.restaurantId && restaurantId && promo.restaurantId !== restaurantId) return res.status(400).json({ message: "Ce code promo n'est pas valide pour ce restaurant" });
    if (promo.minOrder > 0 && (subtotal || 0) < promo.minOrder) return res.status(400).json({ message: `Commande minimum: ${promo.minOrder}` });
    let discount = 0;
    if (promo.type === "percent") discount = Math.floor((subtotal || 0) * promo.value / 100);
    else if (promo.type === "fixed") discount = promo.value;
    else if (promo.type === "delivery") discount = 2500;
    res.json({ valid: true, code: promo.code, discount, description: promo.description, type: promo.type });
  });

  app.get("/api/promotions/active", async (_req, res) => {
    const allPromos = await storage.getPromotions();
    const now = new Date();
    const active = allPromos.filter(p => p.isActive && (!p.expiresAt || new Date(p.expiresAt) > now));
    res.json(active);
  });

  app.get("/api/promotions", requireAdmin, async (_req, res) => {
    res.json(await storage.getPromotions());
  });

  app.post("/api/promotions", requireAdmin, validate(schemas.promotionCreate), async (req, res) => {
    const { code, description, type, value, minOrder, maxUses, isActive, expiresAt, restaurantId } = req.body;
    const promo = await storage.createPromotion({
      code, description,
      type: type || "percent",
      value: value ?? 10,
      minOrder: minOrder ?? 0,
      maxUses: maxUses ?? 0,
      isActive: isActive !== false,
      expiresAt: expiresAt || null,
      restaurantId: restaurantId || null,
    });
    res.json(promo);
  });

  app.patch("/api/promotions/:id", requireAdmin, validate(schemas.promotionUpdate), async (req, res) => {
    const promo = await storage.updatePromotion(Number(req.params.id), req.body);
    if (!promo) return res.status(404).json({ message: "Promotion non trouvee" });
    res.json(promo);
  });

  app.delete("/api/promotions/:id", requireAdmin, async (req, res) => {
    await storage.deletePromotion(Number(req.params.id));
    res.json({ ok: true });
  });
}
