import type { Express } from "express";
import { storage } from "../storage";
import { requireAdmin } from "../middleware/auth.middleware";
import { uploadMedia, buildUploadUrl } from "../middleware/upload.middleware";
import { validate, schemas } from "../validators";
import { logger } from "../lib/logger";

export function registerMarketingRoutes(app: Express): void {
  app.get("/api/dashboard/stats", requireAdmin, async (_req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get("/api/analytics/marketing", requireAdmin, async (req, res) => {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

    const allOrders = await storage.getOrders();
    const allUsers = await storage.getAllUsers();
    const allRestaurants = await storage.getRestaurants();
    const allMenuItems: any[] = [];
    for (const r of allRestaurants) {
      const items = await storage.getMenuItems(r.id);
      allMenuItems.push(...items);
    }

    const periodOrders = allOrders.filter(o => {
      const d = new Date(o.createdAt!);
      return d >= dateFrom && d <= dateTo;
    });

    const deliveredOrders = periodOrders.filter(o => o.status === "delivered");
    const ratedOrders = deliveredOrders.filter(o => o.rating);
    const cancelledOrders = periodOrders.filter(o => o.status === "cancelled");

    const onTimeDelivered = deliveredOrders.filter(o => {
      if (!o.estimatedDelivery || !o.updatedAt) return false;
      return new Date(o.updatedAt) <= new Date(o.estimatedDelivery);
    });

    const avgRating = ratedOrders.length > 0
      ? ratedOrders.reduce((s, o) => s + (o.rating || 0), 0) / ratedOrders.length : 0;
    const totalRevenue = periodOrders.reduce((s, o) => s + o.total, 0);
    const avgOrderAmount = periodOrders.length > 0 ? parseFloat((totalRevenue / periodOrders.length).toFixed(2)) : 0;
    const avgDeliveryCost = periodOrders.length > 0
      ? parseFloat((periodOrders.reduce((s, o) => s + o.deliveryFee, 0) / periodOrders.length).toFixed(2)) : 0;

    const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    periodOrders.forEach(o => {
      const items: any[] = (() => { try { return typeof o.items === "string" ? JSON.parse(o.items) : (o.items as any[]); } catch { return []; } })();
      items.forEach((item: any) => {
        const key = item.name;
        if (!productCounts[key]) productCounts[key] = { name: key, count: 0, revenue: 0 };
        productCounts[key].count += item.qty || 1;
        productCounts[key].revenue += (item.price || 0) * (item.qty || 1);
      });
    });
    const topProducts = Object.values(productCounts).sort((a, b) => b.count - a.count).slice(0, 10);

    const ordersByDay: Record<string, { date: string; orders: number; revenue: number }> = {};
    periodOrders.forEach(o => {
      const day = new Date(o.createdAt!).toISOString().split("T")[0];
      if (!ordersByDay[day]) ordersByDay[day] = { date: day, orders: 0, revenue: 0 };
      ordersByDay[day].orders++;
      ordersByDay[day].revenue += o.total;
    });
    const dailyTrend = Object.values(ordersByDay).sort((a, b) => a.date.localeCompare(b.date));

    const ordersByHour: number[] = new Array(24).fill(0);
    periodOrders.forEach(o => {
      const hour = new Date(o.createdAt!).getHours();
      ordersByHour[hour]++;
    });

    const clients = allUsers.filter(u => u.role === "client");
    const clientsWithOrders = clients.map(c => {
      const userOrders = periodOrders.filter(o => o.clientId === c.id);
      return {
        id: c.id, name: c.name, email: c.email, phone: c.phone,
        orderCount: userOrders.length,
        totalSpent: userOrders.reduce((s, o) => s + o.total, 0),
        avgOrder: userOrders.length > 0 ? parseFloat((userOrders.reduce((s, o) => s + o.total, 0) / userOrders.length).toFixed(2)) : 0,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 20);

    const drivers = allUsers.filter(u => u.role === "driver");
    const driverPerformance = drivers.map(d => {
      const driverDelivered = deliveredOrders.filter(o => o.driverId === d.id);
      const driverOnTime = driverDelivered.filter(o => {
        if (!o.estimatedDelivery || !o.updatedAt) return false;
        return new Date(o.updatedAt) <= new Date(o.estimatedDelivery);
      });
      const driverRated = driverDelivered.filter(o => o.rating);
      return {
        id: d.id, name: d.name, deliveries: driverDelivered.length,
        onTimeRate: driverDelivered.length > 0 ? Math.round(driverOnTime.length / driverDelivered.length * 100) : 0,
        avgRating: driverRated.length > 0 ? +(driverRated.reduce((s, o) => s + (o.rating || 0), 0) / driverRated.length).toFixed(1) : 0,
        isOnline: d.isOnline,
      };
    }).sort((a, b) => b.deliveries - a.deliveries);

    const paymentBreakdown: Record<string, number> = {};
    periodOrders.forEach(o => {
      paymentBreakdown[o.paymentMethod] = (paymentBreakdown[o.paymentMethod] || 0) + 1;
    });

    const statusBreakdown: Record<string, number> = {};
    periodOrders.forEach(o => {
      statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
    });

    const returnedOrders = periodOrders.filter(o => o.status === "returned");

    const restaurantRevenue: Record<number, { id: number; name: string; revenue: number; subtotal: number; commissionRate: number; mawejaCommission: number; restaurantNet: number; orderCount: number; avgRating: number; ratingCount: number }> = {};
    periodOrders.forEach(o => {
      const r = allRestaurants.find(r => r.id === o.restaurantId);
      if (!r) return;
      if (!restaurantRevenue[r.id]) restaurantRevenue[r.id] = { id: r.id, name: r.name, revenue: 0, subtotal: 0, commissionRate: r.restaurantCommissionRate ?? 20, mawejaCommission: 0, restaurantNet: 0, orderCount: 0, avgRating: 0, ratingCount: 0 };
      restaurantRevenue[r.id].revenue += o.total;
      restaurantRevenue[r.id].subtotal += o.subtotal;
      restaurantRevenue[r.id].orderCount++;
      if (o.rating) { restaurantRevenue[r.id].avgRating += o.rating; restaurantRevenue[r.id].ratingCount++; }
    });
    const marketShare = Object.values(restaurantRevenue).map(r => {
      const commission = parseFloat((r.subtotal * r.commissionRate / 100).toFixed(2));
      return {
        ...r,
        mawejaCommission: commission,
        restaurantNet: parseFloat((r.subtotal - commission).toFixed(2)),
        avgRating: r.ratingCount > 0 ? +(r.avgRating / r.ratingCount).toFixed(1) : 0,
        sharePercent: totalRevenue > 0 ? +(r.revenue / totalRevenue * 100).toFixed(1) : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const clientInsights = clients.map(c => {
      const userOrders = periodOrders.filter(o => o.clientId === c.id);
      const restFreq: Record<number, number> = {};
      userOrders.forEach(o => { restFreq[o.restaurantId] = (restFreq[o.restaurantId] || 0) + 1; });
      const favRestId = Object.entries(restFreq).sort((a, b) => b[1] - a[1])[0];
      const favRest = favRestId ? allRestaurants.find(r => r.id === Number(favRestId[0])) : null;
      const lastOrder = userOrders.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0];
      const daysSinceLast = lastOrder ? Math.floor((Date.now() - new Date(lastOrder.createdAt!).getTime()) / (1000 * 60 * 60 * 24)) : -1;
      const totalSpent = userOrders.reduce((s, o) => s + o.total, 0);
      const cuisines: Record<string, number> = {};
      userOrders.forEach(o => {
        const r = allRestaurants.find(r => r.id === o.restaurantId);
        if (r?.cuisine) cuisines[r.cuisine] = (cuisines[r.cuisine] || 0) + 1;
      });
      const topCuisines = Object.entries(cuisines).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
      return {
        id: c.id, name: c.name, email: c.email, phone: c.phone,
        orderCount: userOrders.length,
        totalSpent,
        avgOrder: userOrders.length > 0 ? parseFloat((totalSpent / userOrders.length).toFixed(2)) : 0,
        favoriteRestaurant: favRest?.name || null,
        favoriteRestaurantId: favRest?.id || null,
        topCuisines,
        daysSinceLastOrder: daysSinceLast,
        isInactive: daysSinceLast > 14,
        revenueContribution: totalRevenue > 0 ? +(totalSpent / totalRevenue * 100).toFixed(1) : 0,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    const newClients = clients.filter(c => {
      const firstOrder = allOrders.filter(o => o.clientId === c.id).sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())[0];
      if (!firstOrder) return false;
      const d = new Date(firstOrder.createdAt!);
      return d >= dateFrom && d <= dateTo;
    }).map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, createdAt: c.id }));

    const top20Clients = clientInsights.slice(0, 20);
    const top10Restaurants = marketShare.slice(0, 10);
    const affinityMatrix = top20Clients.map(c => {
      const row: Record<string, number> = {};
      const userOrders = periodOrders.filter(o => o.clientId === c.id);
      top10Restaurants.forEach(r => {
        row[r.name] = userOrders.filter(o => o.restaurantId === r.id).length;
      });
      return { clientName: c.name, clientId: c.id, ...row };
    });

    const ordersByDayOfWeek = new Array(7).fill(0);
    periodOrders.forEach(o => {
      ordersByDayOfWeek[new Date(o.createdAt!).getDay()]++;
    });

    res.json({
      kpis: {
        totalOrders: periodOrders.length,
        deliveredOrders: deliveredOrders.length,
        cancelledOrders: cancelledOrders.length,
        returnedOrders: returnedOrders.length,
        onTimeRate: deliveredOrders.length > 0 ? Math.round(onTimeDelivered.length / deliveredOrders.length * 100) : 0,
        avgRating: +avgRating.toFixed(1),
        totalRevenue,
        avgOrderAmount,
        avgDeliveryCost,
        totalClients: clients.length,
        newClientsCount: newClients.length,
      },
      topProducts,
      dailyTrend,
      ordersByHour,
      ordersByDayOfWeek,
      topClients: clientInsights.slice(0, 30),
      newClients,
      driverPerformance,
      paymentBreakdown,
      statusBreakdown,
      marketShare,
      affinityMatrix,
    });
  });

  app.get("/api/analytics/client-segments", requireAdmin, async (req, res) => {
    const allClients = await storage.getClients();
    const allOrders = await storage.getOrders({});
    const allServiceRequests = await storage.getServiceRequests({});
    const orderCounts: Record<number, number> = {};
    const spending: Record<number, number> = {};
    const lastOrder: Record<number, Date> = {};
    for (const o of allOrders) {
      orderCounts[o.clientId] = (orderCounts[o.clientId] || 0) + 1;
      if (o.status === "delivered") spending[o.clientId] = (spending[o.clientId] || 0) + o.total;
      const d = new Date(o.createdAt!);
      if (!lastOrder[o.clientId] || d > lastOrder[o.clientId]) lastOrder[o.clientId] = d;
    }
    const serviceRequestClients = new Set(allServiceRequests.map((r: any) => r.clientId));
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const segments = {
      all_clients: { label: "Tous les clients", count: allClients.length },
      frequent_food: { label: "Commandes frequentes (3+)", count: allClients.filter((c: any) => (orderCounts[c.id] || 0) >= 3).length },
      service_users: { label: "Utilisateurs services", count: allClients.filter((c: any) => serviceRequestClients.has(c.id)).length },
      inactive: { label: "Clients inactifs (30j)", count: allClients.filter((c: any) => !lastOrder[c.id] || lastOrder[c.id] < thirtyDaysAgo).length },
      high_value: { label: "Haute valeur ($50k+)", count: allClients.filter((c: any) => (spending[c.id] || 0) >= 50000).length },
      new_clients: { label: "Nouveaux clients (7j)", count: allClients.filter((c: any) => { const d = new Date(c.createdAt!); return d > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); }).length },
    };
    res.json(segments);
  });

  app.get("/api/advertisements", async (req, res) => {
    const activeOnly = req.query.active === "true";
    const ads = await storage.getAdvertisements(activeOnly);
    res.json(ads);
  });

  app.post("/api/advertisements", requireAdmin, uploadMedia.single("media"), async (req, res) => {
    try {
      const existingAds = await storage.getAdvertisements(true);
      if (existingAds.length >= 5) {
        return res.status(400).json({ message: "Maximum 5 publicites actives autorisees" });
      }
      let mediaUrl = req.body.mediaUrl || "";
      if (req.file) mediaUrl = buildUploadUrl(req, req.file.filename);
      if (!mediaUrl) return res.status(400).json({ message: "Une image ou video est requise" });
      const ad = await storage.createAdvertisement({
        title: req.body.title || "Publicite",
        mediaUrl,
        mediaType: req.body.mediaType || "image",
        linkUrl: req.body.linkUrl || null,
        isActive: req.body.isActive !== "false",
        sortOrder: Number(req.body.sortOrder) || 0,
      });
      res.json(ad);
    } catch (err: any) {
      logger.error("Erreur creation publicite", err);
      res.status(500).json({ message: err?.message || "Erreur lors de la creation de la publicite" });
    }
  });

  app.patch("/api/advertisements/:id", requireAdmin, uploadMedia.single("media"), async (req, res) => {
    const data: any = { ...req.body };
    if (req.file) data.mediaUrl = buildUploadUrl(req, req.file.filename);
    if (data.isActive !== undefined) data.isActive = data.isActive === "true" || data.isActive === true;
    if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder);
    const updated = await storage.updateAdvertisement(Number(req.params.id), data);
    res.json(updated);
  });

  app.delete("/api/advertisements/:id", requireAdmin, async (req, res) => {
    await storage.deleteAdvertisement(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/promo-banner", async (_req, res) => {
    const banner = await storage.getPromoBanner();
    res.json(banner || {
      tagText: "Offre Spéciale",
      title: "Livraison gratuite",
      subtitle: "Sur votre première commande",
      buttonText: "Commander maintenant",
      bgColorFrom: "#dc2626",
      bgColorTo: "#b91c1c",
      isActive: true,
      linkUrl: null,
    });
  });

  app.patch("/api/promo-banner", requireAdmin, validate(schemas.promoBanner), async (req, res) => {
    const { tagText, title, subtitle, buttonText, linkUrl, bgColorFrom, bgColorTo, isActive } = req.body;
    const banner = await storage.upsertPromoBanner({ tagText, title, subtitle, buttonText, linkUrl, bgColorFrom, bgColorTo, isActive });
    res.json(banner);
  });

  app.get("/api/finance", requireAdmin, async (req, res) => {
    const filters: any = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
    const all = await storage.getFinances(Object.keys(filters).length ? filters : undefined);
    res.json(all);
  });

  app.get("/api/finance/summary", requireAdmin, async (req, res) => {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
    const summary = await storage.getFinanceSummary(dateFrom, dateTo);
    res.json(summary);
  });

  app.post("/api/finance", requireAdmin, validate(schemas.financeCreate), async (req, res) => {
    const entry = await storage.createFinance(req.body);
    res.json(entry);
  });

  app.get("/api/finance/export", requireAdmin, async (req, res) => {
    const financeFilters: any = {};
    const orderFilters: any = {};
    if (req.query.type) financeFilters.type = req.query.type;
    if (req.query.dateFrom) {
      financeFilters.dateFrom = new Date(req.query.dateFrom as string);
      orderFilters.dateFrom = new Date(req.query.dateFrom as string);
    }
    if (req.query.dateTo) {
      financeFilters.dateTo = new Date(req.query.dateTo as string);
      orderFilters.dateTo = new Date(req.query.dateTo as string);
    }
    const [finances, orders, users, restaurants] = await Promise.all([
      storage.getFinances(Object.keys(financeFilters).length ? financeFilters : undefined),
      storage.getOrders(Object.keys(orderFilters).length ? orderFilters : undefined),
      storage.getAllUsers(),
      storage.getRestaurants(),
    ]);
    const { buildFinanceWorkbook } = await import("../lib/financeExport.js");
    const buffer = await buildFinanceWorkbook({
      orders,
      finances,
      users,
      restaurants,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
    });
    const fileName = `finances_maweja_${new Date().toISOString().split("T")[0]}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(Buffer.from(buffer));
  });

  app.get("/api/restaurant-payouts", requireAdmin, async (_req, res) => {
    const payouts = await storage.getRestaurantPayouts();
    res.json(payouts);
  });

  app.post("/api/restaurant-payouts", requireAdmin, validate(schemas.restaurantPayoutCreate), async (req, res) => {
    const payout = await storage.createRestaurantPayout(req.body);
    res.json(payout);
  });

  app.post("/api/restaurant-payouts/generate", requireAdmin, async (req, res) => {
    const { dateFrom, dateTo, period } = req.body;
    if (!dateFrom || !dateTo || !period) return res.status(400).json({ message: "dateFrom, dateTo et period sont requis" });
    const allOrders = await storage.getOrders({ dateFrom: new Date(dateFrom), dateTo: new Date(dateTo), status: "delivered" });
    const allRestaurants = await storage.getRestaurants();
    const byRestaurant: Record<number, { count: number; gross: number }> = {};
    for (const o of allOrders) {
      if (!byRestaurant[o.restaurantId]) byRestaurant[o.restaurantId] = { count: 0, gross: 0 };
      byRestaurant[o.restaurantId].count++;
      byRestaurant[o.restaurantId].gross += o.subtotal;
    }
    const created = [];
    for (const [rid, stats] of Object.entries(byRestaurant)) {
      const rest = allRestaurants.find(r => r.id === Number(rid));
      if (!rest || stats.count === 0) continue;
      const rate = rest.restaurantCommissionRate ?? 20;
      const mawejaCommission = Math.round(stats.gross * rate / 100);
      const netAmount = stats.gross - mawejaCommission;
      const payout = await storage.createRestaurantPayout({
        restaurantId: Number(rid),
        restaurantName: rest.name,
        period,
        orderCount: stats.count,
        grossAmount: stats.gross,
        mawejaCommission,
        netAmount,
        isPaid: false,
      });
      created.push(payout);
    }
    res.json({ created: created.length, payouts: created });
  });

  app.patch("/api/restaurant-payouts/:id", requireAdmin, async (req, res) => {
    const payout = await storage.updateRestaurantPayout(Number(req.params.id), req.body);
    if (!payout) return res.status(404).json({ message: "Paiement non trouvé" });
    res.json(payout);
  });

  app.delete("/api/restaurant-payouts/:id", requireAdmin, async (req, res) => {
    await storage.deleteRestaurantPayout(Number(req.params.id));
    res.json({ ok: true });
  });
}
