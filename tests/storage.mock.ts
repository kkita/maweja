/**
 * In-memory implementation of IStorage for use in tests.
 *
 * Each entity array is typed with the corresponding entity from
 * `@shared/schema` so the test fixtures stay aligned with the production
 * data model. Methods that are not exercised by the current test suite
 * still satisfy the IStorage shape but return empty/no-op defaults.
 */
import type {
  User,
  Restaurant,
  Order,
  Notification,
  WalletTransaction,
  Finance,
  Promotion,
  DeliveryZone,
  LoyaltyCredit,
  MenuItem,
  ChatMessage,
  SavedAddress,
  ServiceCategory,
  ServiceRequest,
  ServiceCatalogItem,
  Advertisement,
  PromoBanner,
  RestaurantPayout,
  PasswordResetRequest,
  PushToken,
  SupportTicket,
  InsertSupportTicket,
  SupportTicketMessage,
  InsertSupportTicketMessage,
  DriverLocation,
  InsertDriverLocation,
  Review,
  InsertReview,
} from "@shared/schema";

/** A partial entity used as test seed input. */
type Seed<T> = Partial<T> & Record<string, unknown>;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export class MemoryStorage {
  users: User[] = [];
  orders: Order[] = [];
  notifications: Notification[] = [];
  walletTxns: WalletTransaction[] = [];
  finances: Finance[] = [];
  restaurants: Restaurant[] = [];
  zones: DeliveryZone[] = [];
  promotions: Promotion[] = [];
  loyaltyCredits: LoyaltyCredit[] = [];
  chatMessages: ChatMessage[] = [];
  pushTokens: PushToken[] = [];
  supportTickets: SupportTicket[] = [];
  supportTicketMessages: SupportTicketMessage[] = [];
  driverLocations: DriverLocation[] = [];
  settings: Record<string, string> = {};
  private nextId = 1;

  reset(): void {
    this.users = [];
    this.orders = [];
    this.notifications = [];
    this.walletTxns = [];
    this.finances = [];
    this.restaurants = [];
    this.zones = [];
    this.promotions = [];
    this.chatMessages = [];
    this.pushTokens = [];
    this.supportTickets = [];
    this.supportTicketMessages = [];
    this.driverLocations = [];
    this.loyaltyCredits = [];
    this.reviews = [];
    this.settings = {};
    this.nextId = 1;
  }

  private newId(): number {
    return this.nextId++;
  }

  // ── Users ──────────────────────────────────────────────────────────────
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email === email);
  }
  async getUserByPhone(phone: string): Promise<User | undefined> {
    return this.users.find((u) => u.phone === phone);
  }
  async getUserByToken(token: string): Promise<User | undefined> {
    return this.users.find((u) => u.authToken === token);
  }
  async createUser(data: Seed<User>): Promise<User> {
    const u = { id: this.newId(), createdAt: new Date(), ...data } as User;
    this.users.push(u);
    return clone(u);
  }
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const u = this.users.find((x) => x.id === id);
    if (!u) return undefined;
    Object.assign(u, data);
    return clone(u);
  }
  async deleteUser(id: number): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id);
  }
  async getDrivers(): Promise<User[]> {
    return this.users.filter((u) => u.role === "driver");
  }
  async getOnlineDrivers(): Promise<User[]> {
    return this.users.filter((u) => u.role === "driver" && u.isOnline && !u.isBlocked);
  }
  async getClients(): Promise<User[]> {
    return this.users.filter((u) => u.role === "client");
  }
  async getAllUsers(): Promise<User[]> {
    return clone(this.users);
  }
  async getAdmins(): Promise<User[]> {
    return this.users.filter((u) => u.role === "admin");
  }

  // ── Restaurants ────────────────────────────────────────────────────────
  async getRestaurants(): Promise<Restaurant[]> {
    return clone(this.restaurants);
  }
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.find((r) => r.id === id);
  }
  async createRestaurant(r: Seed<Restaurant>): Promise<Restaurant> {
    const x = { id: this.newId(), ...r } as Restaurant;
    this.restaurants.push(x);
    return clone(x);
  }
  async updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant | undefined> {
    const r = this.restaurants.find((x) => x.id === id);
    if (!r) return undefined;
    Object.assign(r, data);
    return clone(r);
  }
  async deleteRestaurant(id: number): Promise<void> {
    this.restaurants = this.restaurants.filter((r) => r.id !== id);
  }

  // ── Menu items ─────────────────────────────────────────────────────────
  async getMenuItems(_restaurantId: number): Promise<MenuItem[]> { return []; }
  async createMenuItem(item: Seed<MenuItem>): Promise<MenuItem> {
    return { id: this.newId(), ...item } as MenuItem;
  }
  async updateMenuItem(_id: number, _data: Partial<MenuItem>): Promise<MenuItem | undefined> { return undefined; }
  async deleteMenuItem(_id: number): Promise<void> { /* no-op */ }

  // ── Orders ─────────────────────────────────────────────────────────────
  async getOrders(filters?: {
    clientId?: number; driverId?: number; status?: string; dateFrom?: Date; dateTo?: Date;
  }): Promise<Order[]> {
    let res = clone(this.orders);
    if (filters?.clientId !== undefined) res = res.filter((o) => o.clientId === filters.clientId);
    if (filters?.driverId !== undefined) res = res.filter((o) => o.driverId === filters.driverId);
    if (filters?.status !== undefined) res = res.filter((o) => o.status === filters.status);
    return res;
  }
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.find((o) => o.id === id);
  }
  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return this.orders.find((o) => o.orderNumber === orderNumber);
  }
  async createOrder(o: Seed<Order>): Promise<Order> {
    const x = {
      id: this.newId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
      ...o,
    } as Order;
    this.orders.push(x);
    return clone(x);
  }
  async updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined> {
    const o = this.orders.find((x) => x.id === id);
    if (!o) return undefined;
    Object.assign(o, data, { updatedAt: new Date() });
    return clone(o);
  }

  // ── Notifications ──────────────────────────────────────────────────────
  async getNotifications(userId: number): Promise<Notification[]> {
    return this.notifications.filter((n) => n.userId === userId);
  }
  async getNotification(id: number): Promise<Notification | undefined> {
    const n = this.notifications.find((x) => x.id === id);
    return n ? clone(n) : undefined;
  }
  async createNotification(n: Seed<Notification>, _opts?: { skipAutoPush?: boolean }): Promise<Notification> {
    const x = { id: this.newId(), createdAt: new Date(), isRead: false, ...n } as Notification;
    this.notifications.push(x);
    return clone(x);
  }
  async markNotificationRead(id: number): Promise<void> {
    const n = this.notifications.find((x) => x.id === id);
    if (n) n.isRead = true;
  }
  async markAllNotificationsRead(userId: number): Promise<void> {
    this.notifications.filter((n) => n.userId === userId).forEach((n) => (n.isRead = true));
  }

  // ── Chat ───────────────────────────────────────────────────────────────
  async getChatMessages(a: number, b: number): Promise<ChatMessage[]> {
    return clone(
      this.chatMessages.filter(
        (m) =>
          (m.senderId === a && m.receiverId === b) ||
          (m.senderId === b && m.receiverId === a),
      ),
    );
  }
  async getChatContacts(_userId: number): Promise<unknown[]> { return []; }
  async createChatMessage(msg: Seed<ChatMessage>): Promise<ChatMessage> {
    const x = { id: this.newId(), createdAt: new Date(), ...msg } as ChatMessage;
    this.chatMessages.push(x);
    return clone(x);
  }
  async updateChatMessage(id: number, data: Partial<ChatMessage>): Promise<void> {
    const m = this.chatMessages.find((x) => x.id === id);
    if (m) Object.assign(m, data);
  }

  // ── Wallet ─────────────────────────────────────────────────────────────
  async getWalletTransactions(userId: number): Promise<WalletTransaction[]> {
    return this.walletTxns.filter((t) => t.userId === userId);
  }
  async createWalletTransaction(t: Seed<WalletTransaction>): Promise<WalletTransaction> {
    const x = { id: this.newId(), createdAt: new Date(), ...t } as WalletTransaction;
    this.walletTxns.push(x);
    return clone(x);
  }

  // ── Finance ────────────────────────────────────────────────────────────
  async getFinances(_filters?: { type?: string; dateFrom?: Date; dateTo?: Date }): Promise<Finance[]> {
    return clone(this.finances);
  }
  async createFinance(f: Seed<Finance>): Promise<Finance> {
    const x = { id: this.newId(), createdAt: new Date(), ...f } as Finance;
    this.finances.push(x);
    return clone(x);
  }
  async getFinanceSummary(_a?: Date, _b?: Date): Promise<{
    summary: { totalRevenue: number; totalExpense: number };
    byCategory: unknown[];
    daily: unknown[];
  }> {
    return { summary: { totalRevenue: 0, totalExpense: 0 }, byCategory: [], daily: [] };
  }

  // ── Saved addresses ────────────────────────────────────────────────────
  async getSavedAddresses(_userId: number): Promise<SavedAddress[]> { return []; }
  async createSavedAddress(addr: Seed<SavedAddress>): Promise<SavedAddress> {
    return { id: this.newId(), ...addr } as SavedAddress;
  }
  async updateSavedAddress(_id: number, _data: Partial<SavedAddress>): Promise<SavedAddress | undefined> { return undefined; }
  async deleteSavedAddress(_id: number): Promise<void> { /* no-op */ }
  async setDefaultAddress(_userId: number, _addressId: number): Promise<void> { /* no-op */ }

  // ── Service categories / requests / catalog ────────────────────────────
  async getServiceCategories(): Promise<ServiceCategory[]> { return []; }
  async getServiceCategory(_id: number): Promise<ServiceCategory | undefined> { return undefined; }
  async createServiceCategory(c: Seed<ServiceCategory>): Promise<ServiceCategory> {
    return { id: this.newId(), ...c } as ServiceCategory;
  }
  async updateServiceCategory(_id: number, _d: Partial<ServiceCategory>): Promise<ServiceCategory | undefined> { return undefined; }
  async deleteServiceCategory(_id: number): Promise<void> { /* no-op */ }

  async getServiceRequests(_filters?: { clientId?: number; status?: string; categoryId?: number }): Promise<ServiceRequest[]> { return []; }
  async getServiceRequest(_id: number): Promise<ServiceRequest | undefined> { return undefined; }
  async createServiceRequest(r: Seed<ServiceRequest>): Promise<ServiceRequest> {
    return { id: this.newId(), ...r } as ServiceRequest;
  }
  async updateServiceRequest(_id: number, _d: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> { return undefined; }

  async getServiceCatalogItems(_categoryId?: number): Promise<ServiceCatalogItem[]> { return []; }
  async getServiceCatalogItem(_id: number): Promise<ServiceCatalogItem | undefined> { return undefined; }
  async createServiceCatalogItem(i: Seed<ServiceCatalogItem>): Promise<ServiceCatalogItem> {
    return { id: this.newId(), ...i } as ServiceCatalogItem;
  }
  async updateServiceCatalogItem(_id: number, _d: Partial<ServiceCatalogItem>): Promise<ServiceCatalogItem | undefined> { return undefined; }
  async deleteServiceCatalogItem(_id: number): Promise<void> { /* no-op */ }

  // ── Advertisements / banner / settings ─────────────────────────────────
  async getAdvertisements(_active?: boolean): Promise<Advertisement[]> { return []; }
  async getAdvertisement(_id: number): Promise<Advertisement | undefined> { return undefined; }
  async createAdvertisement(a: Seed<Advertisement>): Promise<Advertisement> {
    return { id: this.newId(), ...a } as Advertisement;
  }
  async updateAdvertisement(_id: number, _d: Partial<Advertisement>): Promise<Advertisement | undefined> { return undefined; }
  async deleteAdvertisement(_id: number): Promise<void> { /* no-op */ }
  async getPromoBanner(): Promise<PromoBanner | undefined> { return undefined; }
  async getSettings(): Promise<Record<string, string>> { return { ...this.settings }; }
  async setSetting(key: string, value: string): Promise<void> { this.settings[key] = value; }
  async setSettings(data: Record<string, string>): Promise<void> { Object.assign(this.settings, data); }
  async upsertPromoBanner(d: Partial<PromoBanner>): Promise<PromoBanner> {
    return { id: 1, ...d } as PromoBanner;
  }

  // ── Restaurant payouts ─────────────────────────────────────────────────
  async getRestaurantPayouts(): Promise<RestaurantPayout[]> { return []; }
  async getRestaurantPayout(_id: number): Promise<RestaurantPayout | undefined> { return undefined; }
  async createRestaurantPayout(d: Seed<RestaurantPayout>): Promise<RestaurantPayout> {
    return { id: this.newId(), ...d } as RestaurantPayout;
  }
  async updateRestaurantPayout(_id: number, _d: Partial<RestaurantPayout>): Promise<RestaurantPayout | undefined> { return undefined; }
  async deleteRestaurantPayout(_id: number): Promise<void> { /* no-op */ }

  // ── Promotions ─────────────────────────────────────────────────────────
  async getPromotions(): Promise<Promotion[]> { return clone(this.promotions); }
  async getPromotion(id: number): Promise<Promotion | undefined> {
    return this.promotions.find((p) => p.id === id);
  }
  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    return this.promotions.find((p) => p.code === code);
  }
  async createPromotion(d: Seed<Promotion>): Promise<Promotion> {
    const x = { id: this.newId(), usedCount: 0, ...d } as Promotion;
    this.promotions.push(x);
    return clone(x);
  }
  async updatePromotion(id: number, data: Partial<Promotion>): Promise<Promotion | undefined> {
    const p = this.promotions.find((x) => x.id === id);
    if (!p) return undefined;
    Object.assign(p, data);
    return clone(p);
  }
  async deletePromotion(id: number): Promise<void> {
    this.promotions = this.promotions.filter((p) => p.id !== id);
  }

  // ── Delivery zones ─────────────────────────────────────────────────────
  async getDeliveryZones(): Promise<DeliveryZone[]> { return clone(this.zones); }
  async getDeliveryZone(id: number): Promise<DeliveryZone | undefined> {
    return this.zones.find((z) => z.id === id);
  }
  async createDeliveryZone(d: Seed<DeliveryZone>): Promise<DeliveryZone> {
    const x = { id: this.newId(), ...d } as DeliveryZone;
    this.zones.push(x);
    return clone(x);
  }
  async updateDeliveryZone(_id: number, _d: Partial<DeliveryZone>): Promise<DeliveryZone | undefined> { return undefined; }
  async deleteDeliveryZone(_id: number): Promise<void> { /* no-op */ }

  // ── Dashboard / password reset / loyalty ──────────────────────────────
  async getDashboardStats(): Promise<{
    orders: Record<string, number>;
    drivers: Record<string, number>;
    clients: Record<string, number>;
    restaurants: Record<string, number>;
    cuisineBreakdown: unknown[];
    cuisineOrders: unknown[];
  }> {
    return { orders: {}, drivers: {}, clients: {}, restaurants: {}, cuisineBreakdown: [], cuisineOrders: [] };
  }

  async createPasswordResetRequest(d: Seed<PasswordResetRequest>): Promise<PasswordResetRequest> {
    return { id: this.newId(), ...d } as PasswordResetRequest;
  }
  async getPasswordResetRequests(_f?: { status?: string }): Promise<PasswordResetRequest[]> { return []; }
  async getPasswordResetRequestByToken(_t: string): Promise<PasswordResetRequest | undefined> { return undefined; }
  async updatePasswordResetRequest(_id: number, _d: Partial<PasswordResetRequest>): Promise<PasswordResetRequest | undefined> { return undefined; }

  async getLoyaltyCredits(userId: number): Promise<LoyaltyCredit[]> {
    return this.loyaltyCredits.filter((c) => c.userId === userId);
  }
  async getActiveLoyaltyCredits(userId: number): Promise<LoyaltyCredit[]> {
    const now = new Date();
    return this.loyaltyCredits.filter(
      (c) => c.userId === userId && !c.isUsed && new Date(c.expiresAt) >= now
    );
  }
  async createLoyaltyCredit(d: Seed<LoyaltyCredit>): Promise<LoyaltyCredit> {
    const x = { id: this.newId(), createdAt: new Date(), isUsed: false, ...d } as LoyaltyCredit;
    this.loyaltyCredits.push(x);
    return clone(x);
  }
  async markLoyaltyCreditUsed(id: number, usedOnOrderId: number): Promise<void> {
    const c = this.loyaltyCredits.find((x) => x.id === id);
    if (c) {
      c.isUsed = true;
      c.usedOnOrderId = usedOnOrderId;
    }
  }

  // ── Push tokens (multi-device) ─────────────────────────────────────────
  async getActivePushTokensByUser(userId: number): Promise<PushToken[]> {
    return clone(
      this.pushTokens
        .filter((t) => t.userId === userId && t.isActive)
        .sort((a, b) => +new Date(b.lastSeenAt!) - +new Date(a.lastSeenAt!)),
    );
  }
  async upsertPushToken(data: {
    userId: number;
    token: string;
    platform: string;
    deviceId?: string | null;
    appVersion?: string | null;
  }): Promise<PushToken> {
    const now = new Date();
    const existing = this.pushTokens.find((t) => t.token === data.token);
    if (existing) {
      existing.userId = data.userId;
      existing.platform = data.platform;
      if (data.deviceId !== undefined) existing.deviceId = data.deviceId ?? null;
      if (data.appVersion !== undefined) existing.appVersion = data.appVersion ?? null;
      existing.isActive = true;
      existing.lastSeenAt = now;
      existing.updatedAt = now;
      return clone(existing);
    }
    const x: PushToken = {
      id: this.newId(),
      userId: data.userId,
      token: data.token,
      platform: data.platform,
      deviceId: data.deviceId ?? null,
      appVersion: data.appVersion ?? null,
      isActive: true,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.pushTokens.push(x);
    return clone(x);
  }
  async deactivatePushToken(token: string): Promise<void> {
    const t = this.pushTokens.find((x) => x.token === token);
    if (t) {
      t.isActive = false;
      t.updatedAt = new Date();
    }
  }
  async deactivateAllPushTokensForUser(userId: number): Promise<void> {
    for (const t of this.pushTokens) {
      if (t.userId === userId) {
        t.isActive = false;
        t.updatedAt = new Date();
      }
    }
  }

  // ── Support tickets ────────────────────────────────────────────────────
  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    const id = this.newId();
    const now = new Date();
    const t: SupportTicket = {
      id,
      orderId: data.orderId ?? null,
      userId: data.userId,
      ticketNumber: data.ticketNumber ?? `TKT-${String(id).padStart(6, "0")}`,
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
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      closedAt: null,
    };
    this.supportTickets.push(t);
    return clone(t);
  }
  async getOpenSupportTicketByOrder(orderId: number): Promise<SupportTicket | undefined> {
    const found = this.supportTickets.find(
      (t) => t.orderId === orderId && t.status === "open",
    );
    return found ? clone(found) : undefined;
  }
  async getSupportTicketsByOrder(orderId: number): Promise<SupportTicket[]> {
    return clone(
      this.supportTickets
        .filter((t) => t.orderId === orderId)
        .sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!)),
    );
  }
  async listSupportTickets(filters?: { status?: string }): Promise<SupportTicket[]> {
    let list = this.supportTickets.slice();
    if (filters?.status) list = list.filter((t) => t.status === filters.status);
    return clone(list.sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!)));
  }
  async closeSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const t = this.supportTickets.find((x) => x.id === id);
    if (!t) return undefined;
    t.status = "closed";
    t.closedAt = new Date();
    t.updatedAt = new Date();
    return clone(t);
  }

  // PARTIE 5 — Support Center
  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const t = this.supportTickets.find((x) => x.id === id);
    return t ? clone(t) : undefined;
  }
  async getSupportTicketsForUser(userId: number): Promise<SupportTicket[]> {
    return clone(
      this.supportTickets
        .filter((t) => t.userId === userId)
        .sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!)),
    );
  }
  async listSupportTicketsAdvanced(filters?: {
    status?: string; priority?: string; category?: string; assignedAdminId?: number;
  }): Promise<SupportTicket[]> {
    let list = this.supportTickets.slice();
    if (filters?.status) list = list.filter((t) => t.status === filters.status);
    if (filters?.priority) list = list.filter((t) => t.priority === filters.priority);
    if (filters?.category) list = list.filter((t) => t.category === filters.category);
    if (filters?.assignedAdminId !== undefined) {
      list = list.filter((t) => t.assignedAdminId === filters.assignedAdminId);
    }
    return clone(list.sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!)));
  }
  async updateSupportTicket(id: number, patch: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    const t = this.supportTickets.find((x) => x.id === id);
    if (!t) return undefined;
    for (const k of Object.keys(patch) as (keyof SupportTicket)[]) {
      if (k === "id" || k === "createdAt") continue;
      (t as any)[k] = (patch as any)[k];
    }
    t.updatedAt = new Date();
    return clone(t);
  }
  async addSupportTicketMessage(data: InsertSupportTicketMessage): Promise<SupportTicketMessage> {
    const m: SupportTicketMessage = {
      id: this.newId(),
      ticketId: data.ticketId,
      senderId: data.senderId,
      message: data.message,
      imageUrl: data.imageUrl ?? null,
      createdAt: new Date(),
    };
    this.supportTicketMessages.push(m);
    const t = this.supportTickets.find((x) => x.id === data.ticketId);
    if (t) t.updatedAt = new Date();
    return clone(m);
  }
  async listSupportTicketMessages(ticketId: number): Promise<SupportTicketMessage[]> {
    return clone(
      this.supportTicketMessages
        .filter((m) => m.ticketId === ticketId)
        .sort((a, b) => +new Date(a.createdAt!) - +new Date(b.createdAt!)),
    );
  }

  // ── Driver tracking (PARTIE 4) ─────────────────────────────────────────
  async recordDriverLocation(data: InsertDriverLocation): Promise<DriverLocation> {
    const row: DriverLocation = {
      id: this.newId(),
      driverId: data.driverId,
      orderId: data.orderId ?? null,
      latitude: data.latitude,
      longitude: data.longitude,
      heading: data.heading ?? null,
      speed: data.speed ?? null,
      accuracy: data.accuracy ?? null,
      batteryLevel: data.batteryLevel ?? null,
      recordedAt: data.recordedAt ?? new Date(),
      createdAt: new Date(),
    };
    this.driverLocations.push(row);
    return clone(row);
  }
  async getLatestDriverLocation(driverId: number): Promise<DriverLocation | undefined> {
    const list = this.driverLocations
      .filter((l) => l.driverId === driverId)
      .sort((a, b) => +new Date(b.recordedAt!) - +new Date(a.recordedAt!));
    return list[0] ? clone(list[0]) : undefined;
  }
  async getLatestDriverLocationForOrder(orderId: number): Promise<DriverLocation | undefined> {
    const list = this.driverLocations
      .filter((l) => l.orderId === orderId)
      .sort((a, b) => +new Date(b.recordedAt!) - +new Date(a.recordedAt!));
    return list[0] ? clone(list[0]) : undefined;
  }

  // ── Reviews (PARTIE 6) ────────────────────────────────────────────────
  reviews: Review[] = [];

  async createReview(data: InsertReview): Promise<Review> {
    if (this.reviews.some((r) => r.orderId === data.orderId)) {
      throw new Error("review_already_exists");
    }
    const r: Review = {
      id: this.reviews.length + 1,
      orderId: data.orderId,
      userId: data.userId,
      restaurantId: data.restaurantId ?? null,
      driverId: data.driverId ?? null,
      restaurantRating: data.restaurantRating ?? null,
      driverRating: data.driverRating ?? null,
      comment: data.comment ?? null,
      tags: (data.tags as any) ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reviews.push(r);
    return clone(r);
  }
  async getReviewByOrder(orderId: number): Promise<Review | undefined> {
    const r = this.reviews.find((x) => x.orderId === orderId);
    return r ? clone(r) : undefined;
  }
  async getReviewsByRestaurant(restaurantId: number): Promise<Review[]> {
    return this.reviews
      .filter((r) => r.restaurantId === restaurantId)
      .sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!))
      .map(clone);
  }
  async getReviewsByDriver(driverId: number): Promise<Review[]> {
    return this.reviews
      .filter((r) => r.driverId === driverId)
      .sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!))
      .map(clone);
  }
  async listReviews(filters?: {
    restaurantId?: number; driverId?: number; minRating?: number; maxRating?: number;
  }): Promise<Review[]> {
    let list = this.reviews.slice();
    if (filters?.restaurantId != null) list = list.filter((r) => r.restaurantId === filters.restaurantId);
    if (filters?.driverId != null) list = list.filter((r) => r.driverId === filters.driverId);
    const maxOf = (r: Review) => Math.max(r.restaurantRating ?? 0, r.driverRating ?? 0);
    if (filters?.minRating != null) list = list.filter((r) => maxOf(r) >= filters.minRating!);
    if (filters?.maxRating != null) list = list.filter((r) => maxOf(r) <= filters.maxRating!);
    return list
      .sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!))
      .map(clone);
  }
  async getRestaurantRatingSummary(restaurantId: number): Promise<{ average: number; count: number }> {
    const xs = this.reviews
      .filter((r) => r.restaurantId === restaurantId && r.restaurantRating != null)
      .map((r) => r.restaurantRating!);
    return { average: xs.length ? xs.reduce((s, n) => s + n, 0) / xs.length : 0, count: xs.length };
  }
  async getDriverRatingSummary(driverId: number): Promise<{ average: number; count: number }> {
    const xs = this.reviews
      .filter((r) => r.driverId === driverId && r.driverRating != null)
      .map((r) => r.driverRating!);
    return { average: xs.length ? xs.reduce((s, n) => s + n, 0) / xs.length : 0, count: xs.length };
  }
}

export const memoryStorage = new MemoryStorage();
