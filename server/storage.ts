import { db } from "./db";
import { eq, desc, and, or, sql, gte, lte, ne } from "drizzle-orm";
import {
  users, restaurants, menuItems, orders, notifications, chatMessages, walletTransactions, finances, savedAddresses,
  serviceCategories, serviceRequests, serviceCatalogItems, advertisements, promoBanners, appSettings, restaurantPayouts,
  promotions, deliveryZones, passwordResetRequests, loyaltyCredits, pushTokens, supportTickets, supportTicketMessages,
  driverLocations, reviews,
  type User, type InsertUser, type Restaurant, type InsertRestaurant,
  type MenuItem, type InsertMenuItem, type Order, type InsertOrder,
  type Notification, type InsertNotification, type ChatMessage, type InsertChatMessage,
  type WalletTransaction, type InsertWalletTransaction,
  type Finance, type InsertFinance,
  type SavedAddress, type InsertSavedAddress,
  type ServiceCategory, type InsertServiceCategory,
  type ServiceRequest, type InsertServiceRequest,
  type ServiceCatalogItem, type InsertServiceCatalogItem,
  type Advertisement, type InsertAdvertisement,
  type PromoBanner, type InsertPromoBanner,
  type RestaurantPayout, type InsertRestaurantPayout,
  type Promotion, type InsertPromotion,
  type DeliveryZone, type InsertDeliveryZone,
  type PasswordResetRequest, type InsertPasswordResetRequest,
  type LoyaltyCredit, type InsertLoyaltyCredit,
  type PushToken,
  type SupportTicket, type InsertSupportTicket,
  type SupportTicketMessage, type InsertSupportTicketMessage,
  type DriverLocation, type InsertDriverLocation,
  type Review, type InsertReview,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  getDrivers(): Promise<User[]>;
  getOnlineDrivers(): Promise<User[]>;
  getClients(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getAdmins(): Promise<User[]>;

  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  createRestaurant(r: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: number): Promise<void>;

  getMenuItems(restaurantId: number): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, data: Partial<MenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<void>;

  getOrders(filters?: { clientId?: number; driverId?: number; status?: string; dateFrom?: Date; dateTo?: Date }): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined>;

  getNotifications(userId: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  /**
   * Crée une notification en DB et déclenche un push natif (fire-and-forget).
   * Passer `{ skipAutoPush: true }` pour désactiver le push automatique
   * (utile lorsque l'appelant veut envoyer le push lui-même et collecter
   * le PushResult, ex: route broadcast admin pour compter sent/failed).
   */
  createNotification(n: InsertNotification, opts?: { skipAutoPush?: boolean }): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;

  getChatMessages(userId1: number, userId2: number): Promise<ChatMessage[]>;
  getChatContacts(userId: number): Promise<any[]>;
  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;
  updateChatMessage(id: number, data: Partial<ChatMessage>): Promise<void>;

  getWalletTransactions(userId: number): Promise<WalletTransaction[]>;
  createWalletTransaction(t: InsertWalletTransaction): Promise<WalletTransaction>;

  getFinances(filters?: { type?: string; dateFrom?: Date; dateTo?: Date }): Promise<Finance[]>;
  createFinance(f: InsertFinance): Promise<Finance>;
  getFinanceSummary(dateFrom?: Date, dateTo?: Date): Promise<any>;

  getSavedAddresses(userId: number): Promise<SavedAddress[]>;
  createSavedAddress(addr: InsertSavedAddress): Promise<SavedAddress>;
  updateSavedAddress(id: number, data: Partial<SavedAddress>): Promise<SavedAddress | undefined>;
  deleteSavedAddress(id: number): Promise<void>;
  setDefaultAddress(userId: number, addressId: number): Promise<void>;

  getServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(id: number): Promise<ServiceCategory | undefined>;
  createServiceCategory(cat: InsertServiceCategory): Promise<ServiceCategory>;
  updateServiceCategory(id: number, data: Partial<ServiceCategory>): Promise<ServiceCategory | undefined>;
  deleteServiceCategory(id: number): Promise<void>;

  getServiceRequests(filters?: { clientId?: number; status?: string; categoryId?: number }): Promise<ServiceRequest[]>;
  getServiceRequest(id: number): Promise<ServiceRequest | undefined>;
  createServiceRequest(req: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: number, data: Partial<ServiceRequest>): Promise<ServiceRequest | undefined>;

  getServiceCatalogItems(categoryId?: number): Promise<ServiceCatalogItem[]>;
  getServiceCatalogItem(id: number): Promise<ServiceCatalogItem | undefined>;
  createServiceCatalogItem(item: InsertServiceCatalogItem): Promise<ServiceCatalogItem>;
  updateServiceCatalogItem(id: number, data: Partial<ServiceCatalogItem>): Promise<ServiceCatalogItem | undefined>;
  deleteServiceCatalogItem(id: number): Promise<void>;

  getAdvertisements(activeOnly?: boolean): Promise<Advertisement[]>;
  getAdvertisement(id: number): Promise<Advertisement | undefined>;
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  updateAdvertisement(id: number, data: Partial<Advertisement>): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: number): Promise<void>;
  getPromoBanner(): Promise<PromoBanner | undefined>;
  getSettings(): Promise<Record<string, string>>;
  setSetting(key: string, value: string): Promise<void>;
  setSettings(data: Record<string, string>): Promise<void>;
  upsertPromoBanner(data: Partial<InsertPromoBanner>): Promise<PromoBanner>;

  getRestaurantPayouts(): Promise<RestaurantPayout[]>;
  getRestaurantPayout(id: number): Promise<RestaurantPayout | undefined>;
  createRestaurantPayout(data: InsertRestaurantPayout): Promise<RestaurantPayout>;
  updateRestaurantPayout(id: number, data: Partial<RestaurantPayout>): Promise<RestaurantPayout | undefined>;
  deleteRestaurantPayout(id: number): Promise<void>;

  getPromotions(): Promise<Promotion[]>;
  getPromotion(id: number): Promise<Promotion | undefined>;
  getPromotionByCode(code: string): Promise<Promotion | undefined>;
  createPromotion(data: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: number, data: Partial<Promotion>): Promise<Promotion | undefined>;
  deletePromotion(id: number): Promise<void>;

  getDeliveryZones(): Promise<DeliveryZone[]>;
  getDeliveryZone(id: number): Promise<DeliveryZone | undefined>;
  createDeliveryZone(data: InsertDeliveryZone): Promise<DeliveryZone>;
  updateDeliveryZone(id: number, data: Partial<DeliveryZone>): Promise<DeliveryZone | undefined>;
  deleteDeliveryZone(id: number): Promise<void>;

  getDashboardStats(): Promise<any>;

  createPasswordResetRequest(data: InsertPasswordResetRequest): Promise<PasswordResetRequest>;
  getPasswordResetRequests(filters?: { status?: string }): Promise<PasswordResetRequest[]>;
  getPasswordResetRequestByToken(token: string): Promise<PasswordResetRequest | undefined>;
  updatePasswordResetRequest(id: number, data: Partial<PasswordResetRequest>): Promise<PasswordResetRequest | undefined>;

  // ── Push tokens (multi-device) ──────────────────────────────────────────
  /** Tokens FCM/APNs actifs d'un utilisateur (tous les appareils). */
  getActivePushTokensByUser(userId: number): Promise<PushToken[]>;
  /**
   * Upsert : si le token existe déjà (UNIQUE), on met à jour platform/deviceId/
   * appVersion/lastSeenAt et on réactive la ligne. Sinon on l'insère.
   * NE TOUCHE PAS aux autres tokens du même utilisateur (multi-device safe).
   */
  upsertPushToken(data: {
    userId: number;
    token: string;
    platform: string;
    deviceId?: string | null;
    appVersion?: string | null;
  }): Promise<PushToken>;
  /** Marque le token comme inactif (utilisé après une erreur FCM). */
  deactivatePushToken(token: string): Promise<void>;
  /** Désactive tous les tokens du user (logout complet). */
  deactivateAllPushTokensForUser(userId: number): Promise<void>;

  // ── Support tickets ────────────────────────────────────────────────────
  /** Crée un ticket support pour une commande (status par défaut: "open"). */
  createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket>;
  /** Renvoie le premier ticket "open" lié à une commande, sinon undefined. */
  getOpenSupportTicketByOrder(orderId: number): Promise<SupportTicket | undefined>;
  /** Tous les tickets liés à une commande, du plus récent au plus ancien. */
  getSupportTicketsByOrder(orderId: number): Promise<SupportTicket[]>;
  /** Liste paginée pour l'admin (status optionnel). */
  listSupportTickets(filters?: { status?: string }): Promise<SupportTicket[]>;
  /** Marque un ticket comme "closed" + closedAt = now. */
  closeSupportTicket(id: number): Promise<SupportTicket | undefined>;
  // PARTIE 5 — Support Center
  /** Lecture unitaire d'un ticket. */
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  /** Tickets ouverts ou archivés d'un utilisateur (du + récent au + ancien). */
  getSupportTicketsForUser(userId: number): Promise<SupportTicket[]>;
  /** Liste avancée admin avec filtres combinables (status/priority/category/assignedAdminId). */
  listSupportTicketsAdvanced(filters?: {
    status?: string; priority?: string; category?: string; assignedAdminId?: number;
  }): Promise<SupportTicket[]>;
  /** Mise à jour partielle d'un ticket (assignation, statut, priorité, note). */
  updateSupportTicket(id: number, patch: Partial<SupportTicket>): Promise<SupportTicket | undefined>;
  /** Ajoute un message dans la conversation du ticket. */
  addSupportTicketMessage(data: InsertSupportTicketMessage): Promise<SupportTicketMessage>;
  /** Liste les messages d'un ticket dans l'ordre chronologique. */
  listSupportTicketMessages(ticketId: number): Promise<SupportTicketMessage[]>;

  getLoyaltyCredits(userId: number): Promise<LoyaltyCredit[]>;
  getActiveLoyaltyCredits(userId: number): Promise<LoyaltyCredit[]>;
  createLoyaltyCredit(data: InsertLoyaltyCredit): Promise<LoyaltyCredit>;
  markLoyaltyCreditUsed(id: number, usedOnOrderId: number): Promise<void>;

  // ── Driver tracking (PARTIE 4) ─────────────────────────────────────────
  /** Enregistre un ping GPS d'un livreur (et optionnellement sa commande active). */
  recordDriverLocation(data: InsertDriverLocation): Promise<DriverLocation>;
  /** Dernière position connue d'un livreur (toutes commandes confondues). */
  getLatestDriverLocation(driverId: number): Promise<DriverLocation | undefined>;
  /** Dernière position connue d'un livreur pour une commande donnée. */
  getLatestDriverLocationForOrder(orderId: number): Promise<DriverLocation | undefined>;

  // ── Reviews (PARTIE 6) ────────────────────────────────────────────────
  /** Crée un avis. La contrainte d'unicité sur orderId garantit qu'un client
   *  ne note qu'une seule fois par commande. */
  createReview(data: InsertReview): Promise<Review>;
  /** Récupère l'avis lié à une commande (sert à bloquer les doublons). */
  getReviewByOrder(orderId: number): Promise<Review | undefined>;
  /** Avis d'un restaurant (du plus récent au plus ancien). */
  getReviewsByRestaurant(restaurantId: number): Promise<Review[]>;
  /** Avis d'un livreur (du plus récent au plus ancien). */
  getReviewsByDriver(driverId: number): Promise<Review[]>;
  /** Liste filtrée pour l'admin. */
  listReviews(filters?: {
    restaurantId?: number; driverId?: number; minRating?: number; maxRating?: number;
  }): Promise<Review[]>;
  /** Note moyenne et nombre d'avis pour un restaurant. */
  getRestaurantRatingSummary(restaurantId: number): Promise<{ average: number; count: number }>;
  /** Note moyenne et nombre d'avis pour un livreur. */
  getDriverRatingSummary(driverId: number): Promise<{ average: number; count: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string) {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }
  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByToken(token: string) {
    const [user] = await db.select().from(users).where(eq(users.authToken, token));
    return user;
  }

  async createUser(user: InsertUser) {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: number, data: Partial<User>) {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number) {
    await db.delete(users).where(eq(users.id, id));
  }

  async getDrivers() {
    return db.select().from(users).where(eq(users.role, "driver")).orderBy(desc(users.createdAt));
  }

  async getOnlineDrivers() {
    return db.select().from(users).where(and(eq(users.role, "driver"), eq(users.isOnline, true), eq(users.isBlocked, false)));
  }

  async getClients() {
    return db.select().from(users).where(eq(users.role, "client")).orderBy(desc(users.createdAt));
  }

  async getAllUsers() {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAdmins() {
    return db.select().from(users).where(eq(users.role, "admin"));
  }

  async getRestaurants() {
    return db.select().from(restaurants).orderBy(desc(restaurants.isFeatured), restaurants.sortOrder, restaurants.name);
  }

  async getRestaurant(id: number) {
    const [r] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return r;
  }

  async createRestaurant(r: InsertRestaurant) {
    const [created] = await db.insert(restaurants).values(r).returning();
    return created;
  }

  async updateRestaurant(id: number, data: Partial<Restaurant>) {
    const [updated] = await db.update(restaurants).set(data).where(eq(restaurants.id, id)).returning();
    return updated;
  }

  async deleteRestaurant(id: number) {
    await db.delete(restaurants).where(eq(restaurants.id, id));
  }

  async getMenuItems(restaurantId: number) {
    return db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
  }

  async createMenuItem(item: InsertMenuItem) {
    const [created] = await db.insert(menuItems).values(item).returning();
    return created;
  }

  async updateMenuItem(id: number, data: Partial<MenuItem>) {
    const [updated] = await db.update(menuItems).set(data).where(eq(menuItems.id, id)).returning();
    return updated;
  }

  async deleteMenuItem(id: number) {
    await db.delete(menuItems).where(eq(menuItems.id, id));
  }

  async getOrders(filters?: { clientId?: number; driverId?: number; status?: string; dateFrom?: Date; dateTo?: Date }) {
    const conditions = [];
    if (filters?.clientId) conditions.push(eq(orders.clientId, filters.clientId));
    if (filters?.driverId) conditions.push(eq(orders.driverId, filters.driverId));
    if (filters?.status) conditions.push(eq(orders.status, filters.status));
    if (filters?.dateFrom) conditions.push(gte(orders.createdAt, filters.dateFrom));
    if (filters?.dateTo) conditions.push(lte(orders.createdAt, filters.dateTo));
    if (conditions.length > 0) {
      return db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt));
    }
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByNumber(orderNumber: string) {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async createOrder(order: InsertOrder) {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrder(id: number, data: Partial<Order>) {
    const [updated] = await db.update(orders).set({ ...data, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getNotifications(userId: number) {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
  }

  async getNotification(id: number) {
    const [n] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    return n;
  }

  async createNotification(n: InsertNotification, opts?: { skipAutoPush?: boolean }) {
    const [created] = await db.insert(notifications).values(n).returning();
    // Push natif (non bloquant) — silencieux si Firebase n'est pas configuré.
    // L'appelant peut désactiver ce push automatique pour le faire lui-même
    // et collecter le PushResult (cas du broadcast admin qui compte sent/failed).
    if (!opts?.skipAutoPush) {
      try {
        const { sendPushToUser } = await import("./lib/push");
        sendPushToUser(n.userId, {
          title: n.title || "MAWEJA",
          body: n.message || "",
          imageUrl: (n as any).imageUrl || undefined,
          data: {
            type: String(n.type || "info"),
            notificationId: String(created.id),
            ...((n as any).data && typeof (n as any).data === "object"
              ? Object.fromEntries(Object.entries((n as any).data).map(([k, v]) => [k, String(v ?? "")]))
              : {}),
          },
        }).catch(() => {});
      } catch {}
    }
    return created;
  }

  async markNotificationRead(id: number) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: number) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async getChatMessages(userId1: number, userId2: number) {
    return db.select().from(chatMessages).where(
      or(
        and(eq(chatMessages.senderId, userId1), eq(chatMessages.receiverId, userId2)),
        and(eq(chatMessages.senderId, userId2), eq(chatMessages.receiverId, userId1))
      )
    ).orderBy(chatMessages.createdAt).limit(100);
  }

  async getChatContacts(userId: number) {
    const sent = await db.select({ id: chatMessages.receiverId }).from(chatMessages).where(eq(chatMessages.senderId, userId));
    const received = await db.select({ id: chatMessages.senderId }).from(chatMessages).where(eq(chatMessages.receiverId, userId));
    const contactIds = [...new Set([...sent.map(s => s.id), ...received.map(r => r.id)])];
    if (contactIds.length === 0) return [];
    const contactUsers = await Promise.all(contactIds.map(id => this.getUser(id)));
    return contactUsers.filter(Boolean).map(u => ({ id: u!.id, name: u!.name, phone: u!.phone, role: u!.role }));
  }

  async createChatMessage(msg: InsertChatMessage) {
    const [created] = await db.insert(chatMessages).values(msg).returning();
    return created;
  }

  async updateChatMessage(id: number, data: Partial<ChatMessage>) {
    await db.update(chatMessages).set(data).where(eq(chatMessages.id, id));
  }

  async getWalletTransactions(userId: number) {
    return db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt));
  }

  async createWalletTransaction(t: InsertWalletTransaction) {
    const [created] = await db.insert(walletTransactions).values(t).returning();
    return created;
  }

  async getFinances(filters?: { type?: string; dateFrom?: Date; dateTo?: Date }) {
    const conditions = [];
    if (filters?.type) conditions.push(eq(finances.type, filters.type));
    if (filters?.dateFrom) conditions.push(gte(finances.createdAt, filters.dateFrom));
    if (filters?.dateTo) conditions.push(lte(finances.createdAt, filters.dateTo));
    if (conditions.length > 0) {
      return db.select().from(finances).where(and(...conditions)).orderBy(desc(finances.createdAt));
    }
    return db.select().from(finances).orderBy(desc(finances.createdAt));
  }

  async createFinance(f: InsertFinance) {
    const [created] = await db.insert(finances).values(f).returning();
    return created;
  }

  async getFinanceSummary(dateFrom?: Date, dateTo?: Date) {
    const conditions = [];
    if (dateFrom) conditions.push(gte(finances.createdAt, dateFrom));
    if (dateTo) conditions.push(lte(finances.createdAt, dateTo));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [summary] = await db.select({
      totalRevenue: sql<number>`coalesce(sum(${finances.amount}) filter (where ${finances.type} = 'revenue'), 0)`,
      totalExpense: sql<number>`coalesce(sum(${finances.amount}) filter (where ${finances.type} = 'expense'), 0)`,
      totalCommission: sql<number>`coalesce(sum(${finances.amount}) filter (where ${finances.category} = 'commission'), 0)`,
      totalDeliveryFees: sql<number>`coalesce(sum(${finances.amount}) filter (where ${finances.category} = 'delivery_fee'), 0)`,
      count: sql<number>`count(*)`,
    }).from(finances).where(whereClause);

    const byCategory = await db.select({
      category: finances.category,
      type: finances.type,
      total: sql<number>`sum(${finances.amount})`,
      count: sql<number>`count(*)`,
    }).from(finances).where(whereClause).groupBy(finances.category, finances.type);

    const daily = await db.select({
      date: sql<string>`to_char(${finances.createdAt}, 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${finances.amount}) filter (where ${finances.type} = 'revenue'), 0)`,
      expense: sql<number>`coalesce(sum(${finances.amount}) filter (where ${finances.type} = 'expense'), 0)`,
    }).from(finances).where(whereClause).groupBy(sql`to_char(${finances.createdAt}, 'YYYY-MM-DD')`).orderBy(sql`to_char(${finances.createdAt}, 'YYYY-MM-DD')`);

    return { summary, byCategory, daily };
  }

  async getRestaurantPayouts() {
    return db.select().from(restaurantPayouts).orderBy(desc(restaurantPayouts.createdAt));
  }

  async getRestaurantPayout(id: number) {
    const [payout] = await db.select().from(restaurantPayouts).where(eq(restaurantPayouts.id, id));
    return payout;
  }

  async createRestaurantPayout(data: InsertRestaurantPayout) {
    const [payout] = await db.insert(restaurantPayouts).values(data).returning();
    return payout;
  }

  async updateRestaurantPayout(id: number, data: Partial<RestaurantPayout>) {
    const [payout] = await db.update(restaurantPayouts).set(data).where(eq(restaurantPayouts.id, id)).returning();
    return payout;
  }

  async deleteRestaurantPayout(id: number) {
    await db.delete(restaurantPayouts).where(eq(restaurantPayouts.id, id));
  }

  async getDashboardStats() {
    const [orderStats] = await db.select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')`,
      active: sql<number>`count(*) filter (where ${orders.status} in ('confirmed','preparing','ready','picked_up'))`,
      delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')`,
      cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')`,
      revenue: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} = 'delivered'), 0)`,
      todayOrders: sql<number>`count(*) filter (where ${orders.createdAt} >= current_date)`,
      todayRevenue: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} = 'delivered' and ${orders.createdAt} >= current_date), 0)`,
    }).from(orders);

    const [driverStats] = await db.select({
      total: sql<number>`count(*)`,
      online: sql<number>`count(*) filter (where ${users.isOnline} = true)`,
      blocked: sql<number>`count(*) filter (where ${users.isBlocked} = true)`,
    }).from(users).where(eq(users.role, "driver"));

    const [clientStats] = await db.select({
      total: sql<number>`count(*)`,
    }).from(users).where(eq(users.role, "client"));

    const [restaurantStats] = await db.select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${restaurants.isActive} = true)`,
    }).from(restaurants);

    const cuisineBreakdown = await db.select({
      cuisine: restaurants.cuisine,
      count: sql<number>`count(*)`,
    }).from(restaurants).groupBy(restaurants.cuisine).orderBy(desc(sql`count(*)`));

    const cuisineOrders = await db.select({
      cuisine: restaurants.cuisine,
      orderCount: sql<number>`count(${orders.id})`,
      revenue: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} = 'delivered'), 0)`,
    }).from(orders).innerJoin(restaurants, eq(orders.restaurantId, restaurants.id)).groupBy(restaurants.cuisine).orderBy(desc(sql`count(${orders.id})`));

    return { orders: orderStats, drivers: driverStats, clients: clientStats, restaurants: restaurantStats, cuisineBreakdown, cuisineOrders };
  }

  async getSavedAddresses(userId: number) {
    return db.select().from(savedAddresses).where(eq(savedAddresses.userId, userId)).orderBy(desc(savedAddresses.createdAt));
  }

  async createSavedAddress(addr: InsertSavedAddress) {
    const [created] = await db.insert(savedAddresses).values(addr).returning();
    return created;
  }

  async updateSavedAddress(id: number, data: Partial<SavedAddress>) {
    const [updated] = await db.update(savedAddresses).set(data).where(eq(savedAddresses.id, id)).returning();
    return updated;
  }

  async deleteSavedAddress(id: number) {
    await db.delete(savedAddresses).where(eq(savedAddresses.id, id));
  }

  async setDefaultAddress(userId: number, addressId: number) {
    await db.update(savedAddresses).set({ isDefault: false }).where(eq(savedAddresses.userId, userId));
    await db.update(savedAddresses).set({ isDefault: true }).where(and(eq(savedAddresses.id, addressId), eq(savedAddresses.userId, userId)));
  }

  async getServiceCategories() {
    return db.select().from(serviceCategories).orderBy(serviceCategories.sortOrder, serviceCategories.name);
  }

  async getServiceCategory(id: number) {
    const [cat] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
    return cat;
  }

  async createServiceCategory(cat: InsertServiceCategory) {
    const [created] = await db.insert(serviceCategories).values(cat).returning();
    return created;
  }

  async updateServiceCategory(id: number, data: Partial<ServiceCategory>) {
    const [updated] = await db.update(serviceCategories).set(data).where(eq(serviceCategories.id, id)).returning();
    return updated;
  }

  async deleteServiceCategory(id: number) {
    await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
  }

  async getServiceRequests(filters?: { clientId?: number; status?: string; categoryId?: number }) {
    const conditions: any[] = [];
    if (filters?.clientId) conditions.push(eq(serviceRequests.clientId, filters.clientId));
    if (filters?.status) conditions.push(eq(serviceRequests.status, filters.status));
    if (filters?.categoryId) conditions.push(eq(serviceRequests.categoryId, filters.categoryId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return db.select().from(serviceRequests).where(where).orderBy(desc(serviceRequests.createdAt));
  }

  async getServiceRequest(id: number) {
    const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id));
    return req;
  }

  async createServiceRequest(req: InsertServiceRequest) {
    const [created] = await db.insert(serviceRequests).values(req).returning();
    return created;
  }

  async updateServiceRequest(id: number, data: Partial<ServiceRequest>) {
    const [updated] = await db.update(serviceRequests).set({ ...data, updatedAt: new Date() }).where(eq(serviceRequests.id, id)).returning();
    return updated;
  }

  async getServiceCatalogItems(categoryId?: number) {
    const where = categoryId ? eq(serviceCatalogItems.categoryId, categoryId) : undefined;
    return db.select().from(serviceCatalogItems).where(where).orderBy(serviceCatalogItems.sortOrder);
  }

  async getServiceCatalogItem(id: number) {
    const [item] = await db.select().from(serviceCatalogItems).where(eq(serviceCatalogItems.id, id));
    return item;
  }

  async createServiceCatalogItem(item: InsertServiceCatalogItem) {
    const [created] = await db.insert(serviceCatalogItems).values(item).returning();
    return created;
  }

  async updateServiceCatalogItem(id: number, data: Partial<ServiceCatalogItem>) {
    const [updated] = await db.update(serviceCatalogItems).set(data).where(eq(serviceCatalogItems.id, id)).returning();
    return updated;
  }

  async deleteServiceCatalogItem(id: number) {
    await db.delete(serviceCatalogItems).where(eq(serviceCatalogItems.id, id));
  }

  async getAdvertisements(activeOnly?: boolean) {
    const where = activeOnly ? eq(advertisements.isActive, true) : undefined;
    return db.select().from(advertisements).where(where).orderBy(advertisements.sortOrder);
  }

  async getAdvertisement(id: number) {
    const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, id));
    return ad;
  }

  async createAdvertisement(ad: InsertAdvertisement) {
    const [created] = await db.insert(advertisements).values(ad).returning();
    return created;
  }

  async updateAdvertisement(id: number, data: Partial<Advertisement>) {
    const [updated] = await db.update(advertisements).set(data).where(eq(advertisements.id, id)).returning();
    return updated;
  }

  async deleteAdvertisement(id: number) {
    await db.delete(advertisements).where(eq(advertisements.id, id));
  }

  async getPromoBanner() {
    const [banner] = await db.select().from(promoBanners).limit(1);
    return banner;
  }

  async upsertPromoBanner(data: Partial<InsertPromoBanner>) {
    const existing = await this.getPromoBanner();
    if (existing) {
      const [updated] = await db.update(promoBanners).set({ ...data, updatedAt: new Date() }).where(eq(promoBanners.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(promoBanners).values({
        tagText: "Offre Spéciale",
        title: "Livraison gratuite",
        subtitle: "Sur votre première commande",
        buttonText: "Commander maintenant",
        bgColorFrom: "#dc2626",
        bgColorTo: "#b91c1c",
        isActive: true,
        ...data,
      }).returning();
      return created;
    }
  }
  async getSettings(): Promise<Record<string, string>> {
    const rows = await db.select().from(appSettings);
    const result: Record<string, string> = {};
    for (const row of rows) result[row.key] = row.value;
    return result;
  }

  async setSetting(key: string, value: string) {
    await db.insert(appSettings).values({ key, value }).onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });
  }

  async setSettings(data: Record<string, string>) {
    for (const [key, value] of Object.entries(data)) {
      await this.setSetting(key, value);
    }
  }

  async getPromotions(): Promise<Promotion[]> {
    return db.select().from(promotions).orderBy(desc(promotions.createdAt));
  }
  async getPromotion(id: number): Promise<Promotion | undefined> {
    const [p] = await db.select().from(promotions).where(eq(promotions.id, id));
    return p;
  }
  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    const [p] = await db.select().from(promotions).where(eq(promotions.code, code));
    return p;
  }
  async createPromotion(data: InsertPromotion): Promise<Promotion> {
    const [p] = await db.insert(promotions).values(data).returning();
    return p;
  }
  async updatePromotion(id: number, data: Partial<Promotion>): Promise<Promotion | undefined> {
    const [p] = await db.update(promotions).set(data).where(eq(promotions.id, id)).returning();
    return p;
  }
  async deletePromotion(id: number): Promise<void> {
    await db.delete(promotions).where(eq(promotions.id, id));
  }

  async getDeliveryZones(): Promise<DeliveryZone[]> {
    return db.select().from(deliveryZones).orderBy(deliveryZones.sortOrder);
  }
  async getDeliveryZone(id: number): Promise<DeliveryZone | undefined> {
    const [z] = await db.select().from(deliveryZones).where(eq(deliveryZones.id, id));
    return z;
  }
  async createDeliveryZone(data: InsertDeliveryZone): Promise<DeliveryZone> {
    const [z] = await db.insert(deliveryZones).values(data as any).returning();
    return z;
  }
  async updateDeliveryZone(id: number, data: Partial<DeliveryZone>): Promise<DeliveryZone | undefined> {
    const [z] = await db.update(deliveryZones).set(data).where(eq(deliveryZones.id, id)).returning();
    return z;
  }
  async deleteDeliveryZone(id: number): Promise<void> {
    await db.delete(deliveryZones).where(eq(deliveryZones.id, id));
  }

  async createPasswordResetRequest(data: InsertPasswordResetRequest): Promise<PasswordResetRequest> {
    const [r] = await db.insert(passwordResetRequests).values(data).returning();
    return r;
  }
  async getPasswordResetRequests(filters?: { status?: string }): Promise<PasswordResetRequest[]> {
    let q = db.select().from(passwordResetRequests).$dynamic();
    if (filters?.status) {
      q = q.where(eq(passwordResetRequests.status, filters.status));
    }
    return q.orderBy(desc(passwordResetRequests.createdAt));
  }
  async getPasswordResetRequestByToken(token: string): Promise<PasswordResetRequest | undefined> {
    const [r] = await db.select().from(passwordResetRequests).where(eq(passwordResetRequests.token, token));
    return r;
  }
  async updatePasswordResetRequest(id: number, data: Partial<PasswordResetRequest>): Promise<PasswordResetRequest | undefined> {
    const [r] = await db.update(passwordResetRequests).set(data).where(eq(passwordResetRequests.id, id)).returning();
    return r;
  }

  async getLoyaltyCredits(userId: number): Promise<LoyaltyCredit[]> {
    return db.select().from(loyaltyCredits)
      .where(eq(loyaltyCredits.userId, userId))
      .orderBy(desc(loyaltyCredits.createdAt));
  }

  async getActiveLoyaltyCredits(userId: number): Promise<LoyaltyCredit[]> {
    return db.select().from(loyaltyCredits)
      .where(and(
        eq(loyaltyCredits.userId, userId),
        eq(loyaltyCredits.isUsed, false),
        gte(loyaltyCredits.expiresAt, new Date()),
      ))
      .orderBy(loyaltyCredits.expiresAt);
  }

  async createLoyaltyCredit(data: InsertLoyaltyCredit): Promise<LoyaltyCredit> {
    const [c] = await db.insert(loyaltyCredits).values(data).returning();
    return c;
  }

  async markLoyaltyCreditUsed(id: number, usedOnOrderId: number): Promise<void> {
    await db.update(loyaltyCredits)
      .set({ isUsed: true, usedOnOrderId })
      .where(eq(loyaltyCredits.id, id));
  }

  // ── Push tokens (multi-device) ────────────────────────────────────────
  async getActivePushTokensByUser(userId: number): Promise<PushToken[]> {
    return db.select().from(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)))
      .orderBy(desc(pushTokens.lastSeenAt));
  }

  async upsertPushToken(data: {
    userId: number;
    token: string;
    platform: string;
    deviceId?: string | null;
    appVersion?: string | null;
  }): Promise<PushToken> {
    const now = new Date();
    const [existing] = await db.select().from(pushTokens).where(eq(pushTokens.token, data.token));
    if (existing) {
      const [updated] = await db.update(pushTokens)
        .set({
          userId: data.userId,
          platform: data.platform,
          deviceId: data.deviceId ?? existing.deviceId ?? null,
          appVersion: data.appVersion ?? existing.appVersion ?? null,
          isActive: true,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(pushTokens.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(pushTokens).values({
      userId: data.userId,
      token: data.token,
      platform: data.platform,
      deviceId: data.deviceId ?? null,
      appVersion: data.appVersion ?? null,
      isActive: true,
      lastSeenAt: now,
    }).returning();
    return created;
  }

  async deactivatePushToken(token: string): Promise<void> {
    await db.update(pushTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(pushTokens.token, token));
  }

  async deactivateAllPushTokensForUser(userId: number): Promise<void> {
    await db.update(pushTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(pushTokens.userId, userId));
  }

  // ── Support tickets ────────────────────────────────────────────────────
  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    const now = new Date();
    const [created] = await db.insert(supportTickets).values({
      orderId: data.orderId ?? null,
      userId: data.userId,
      ticketNumber: data.ticketNumber ?? null,
      assignedAdminId: data.assignedAdminId ?? null,
      category: data.category ?? null,
      status: data.status ?? "open",
      priority: data.priority ?? "normal",
      title: data.title ?? null,
      description: data.description ?? null,
      requestedRefundAmount: data.requestedRefundAmount ?? null,
      approvedRefundAmount: data.approvedRefundAmount ?? null,
      resolutionNote: data.resolutionNote ?? null,
      subject: data.subject ?? null,
      message: data.message ?? null,
      updatedAt: now,
    } as any).returning();
    // Backfill ticketNumber après création (basé sur l'id auto-généré).
    if (!created.ticketNumber) {
      const num = `TKT-${String(created.id).padStart(6, "0")}`;
      const [withNum] = await db.update(supportTickets)
        .set({ ticketNumber: num })
        .where(eq(supportTickets.id, created.id))
        .returning();
      return withNum;
    }
    return created;
  }

  async getOpenSupportTicketByOrder(orderId: number): Promise<SupportTicket | undefined> {
    const rows = await db.select().from(supportTickets)
      .where(and(eq(supportTickets.orderId, orderId), eq(supportTickets.status, "open")))
      .orderBy(desc(supportTickets.createdAt))
      .limit(1);
    return rows[0];
  }

  async getSupportTicketsByOrder(orderId: number): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets)
      .where(eq(supportTickets.orderId, orderId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async listSupportTickets(filters?: { status?: string }): Promise<SupportTicket[]> {
    if (filters?.status) {
      return await db.select().from(supportTickets)
        .where(eq(supportTickets.status, filters.status))
        .orderBy(desc(supportTickets.createdAt));
    }
    return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async closeSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const [updated] = await db.update(supportTickets)
      .set({ status: "closed", closedAt: new Date(), updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return updated;
  }

  // PARTIE 5 — Support Center
  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const [row] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    return row;
  }

  async getSupportTicketsForUser(userId: number): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async listSupportTicketsAdvanced(filters?: {
    status?: string; priority?: string; category?: string; assignedAdminId?: number;
  }): Promise<SupportTicket[]> {
    const conds = [] as any[];
    if (filters?.status) conds.push(eq(supportTickets.status, filters.status));
    if (filters?.priority) conds.push(eq(supportTickets.priority, filters.priority));
    if (filters?.category) conds.push(eq(supportTickets.category, filters.category));
    if (filters?.assignedAdminId !== undefined) {
      conds.push(eq(supportTickets.assignedAdminId, filters.assignedAdminId));
    }
    const q = db.select().from(supportTickets);
    return conds.length > 0
      ? await q.where(and(...conds)).orderBy(desc(supportTickets.createdAt))
      : await q.orderBy(desc(supportTickets.createdAt));
  }

  async updateSupportTicket(id: number, patch: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    const set: any = { ...patch, updatedAt: new Date() };
    delete set.id;
    delete set.createdAt;
    const [updated] = await db.update(supportTickets).set(set).where(eq(supportTickets.id, id)).returning();
    return updated;
  }

  async addSupportTicketMessage(data: InsertSupportTicketMessage): Promise<SupportTicketMessage> {
    const [created] = await db.insert(supportTicketMessages).values({
      ticketId: data.ticketId,
      senderId: data.senderId,
      message: data.message,
      imageUrl: data.imageUrl ?? null,
    }).returning();
    // Bump updatedAt sur le ticket parent (utile pour tri "activité récente").
    await db.update(supportTickets)
      .set({ updatedAt: new Date() })
      .where(eq(supportTickets.id, data.ticketId));
    return created;
  }

  async listSupportTicketMessages(ticketId: number): Promise<SupportTicketMessage[]> {
    return await db.select().from(supportTicketMessages)
      .where(eq(supportTicketMessages.ticketId, ticketId))
      .orderBy(supportTicketMessages.createdAt);
  }

  // ── Driver tracking (PARTIE 4) ──────────────────────────────────────────
  async recordDriverLocation(data: InsertDriverLocation): Promise<DriverLocation> {
    const payload = { ...data, recordedAt: data.recordedAt ?? new Date() };
    const [row] = await db.insert(driverLocations).values(payload).returning();
    return row;
  }

  async getLatestDriverLocation(driverId: number): Promise<DriverLocation | undefined> {
    const [row] = await db.select().from(driverLocations)
      .where(eq(driverLocations.driverId, driverId))
      .orderBy(desc(driverLocations.recordedAt))
      .limit(1);
    return row;
  }

  async getLatestDriverLocationForOrder(orderId: number): Promise<DriverLocation | undefined> {
    const [row] = await db.select().from(driverLocations)
      .where(eq(driverLocations.orderId, orderId))
      .orderBy(desc(driverLocations.recordedAt))
      .limit(1);
    return row;
  }

  // ── Reviews (PARTIE 6) ────────────────────────────────────────────────
  async createReview(data: InsertReview): Promise<Review> {
    const [row] = await db.insert(reviews).values(data).returning();
    return row;
  }

  async getReviewByOrder(orderId: number): Promise<Review | undefined> {
    const [row] = await db.select().from(reviews).where(eq(reviews.orderId, orderId));
    return row;
  }

  async getReviewsByRestaurant(restaurantId: number): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.restaurantId, restaurantId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByDriver(driverId: number): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.driverId, driverId))
      .orderBy(desc(reviews.createdAt));
  }

  async listReviews(filters?: {
    restaurantId?: number; driverId?: number; minRating?: number; maxRating?: number;
  }): Promise<Review[]> {
    const conds: any[] = [];
    if (filters?.restaurantId != null) conds.push(eq(reviews.restaurantId, filters.restaurantId));
    if (filters?.driverId != null) conds.push(eq(reviews.driverId, filters.driverId));
    // minRating/maxRating s'appliquent à la note la plus haute des deux pour
    // ne pas exclure les avis ne portant que sur le livreur ou le restaurant.
    if (filters?.minRating != null) {
      conds.push(sql`GREATEST(COALESCE(${reviews.restaurantRating}, 0), COALESCE(${reviews.driverRating}, 0)) >= ${filters.minRating}`);
    }
    if (filters?.maxRating != null) {
      conds.push(sql`GREATEST(COALESCE(${reviews.restaurantRating}, 0), COALESCE(${reviews.driverRating}, 0)) <= ${filters.maxRating}`);
    }
    let q = db.select().from(reviews).$dynamic();
    if (conds.length) q = q.where(and(...conds));
    return q.orderBy(desc(reviews.createdAt));
  }

  async getRestaurantRatingSummary(restaurantId: number): Promise<{ average: number; count: number }> {
    const rows = await db.select({
      avg: sql<number>`AVG(${reviews.restaurantRating})`,
      cnt: sql<number>`COUNT(${reviews.restaurantRating})`,
    }).from(reviews).where(and(
      eq(reviews.restaurantId, restaurantId),
      sql`${reviews.restaurantRating} IS NOT NULL`,
    ));
    const r = rows[0];
    return { average: Number(r?.avg ?? 0), count: Number(r?.cnt ?? 0) };
  }

  async getDriverRatingSummary(driverId: number): Promise<{ average: number; count: number }> {
    const rows = await db.select({
      avg: sql<number>`AVG(${reviews.driverRating})`,
      cnt: sql<number>`COUNT(${reviews.driverRating})`,
    }).from(reviews).where(and(
      eq(reviews.driverId, driverId),
      sql`${reviews.driverRating} IS NOT NULL`,
    ));
    const r = rows[0];
    return { average: Number(r?.avg ?? 0), count: Number(r?.cnt ?? 0) };
  }
}

export const storage = new DatabaseStorage();
