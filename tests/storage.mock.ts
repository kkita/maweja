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
    this.loyaltyCredits = [];
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
  async createNotification(n: Seed<Notification>): Promise<Notification> {
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
  async getChatMessages(_a: number, _b: number): Promise<ChatMessage[]> { return []; }
  async getChatContacts(_userId: number): Promise<unknown[]> { return []; }
  async createChatMessage(msg: Seed<ChatMessage>): Promise<ChatMessage> {
    return { id: this.newId(), createdAt: new Date(), ...msg } as ChatMessage;
  }
  async updateChatMessage(_id: number, _data: Partial<ChatMessage>): Promise<void> { /* no-op */ }

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
}

export const memoryStorage = new MemoryStorage();
