import { db } from "./db";
import { eq, desc, and, or, sql, gte, lte, ne } from "drizzle-orm";
import {
  users, restaurants, menuItems, orders, notifications, chatMessages, walletTransactions, finances,
  type User, type InsertUser, type Restaurant, type InsertRestaurant,
  type MenuItem, type InsertMenuItem, type Order, type InsertOrder,
  type Notification, type InsertNotification, type ChatMessage, type InsertChatMessage,
  type WalletTransaction, type InsertWalletTransaction,
  type Finance, type InsertFinance,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  getDrivers(): Promise<User[]>;
  getOnlineDrivers(): Promise<User[]>;
  getClients(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;

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
  createNotification(n: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;

  getChatMessages(userId1: number, userId2: number): Promise<ChatMessage[]>;
  getChatContacts(userId: number): Promise<any[]>;
  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;

  getWalletTransactions(userId: number): Promise<WalletTransaction[]>;
  createWalletTransaction(t: InsertWalletTransaction): Promise<WalletTransaction>;

  getFinances(filters?: { type?: string; dateFrom?: Date; dateTo?: Date }): Promise<Finance[]>;
  createFinance(f: InsertFinance): Promise<Finance>;
  getFinanceSummary(dateFrom?: Date, dateTo?: Date): Promise<any>;

  getDashboardStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async getRestaurants() {
    return db.select().from(restaurants);
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

  async createNotification(n: InsertNotification) {
    const [created] = await db.insert(notifications).values(n).returning();
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

    return { orders: orderStats, drivers: driverStats, clients: clientStats, restaurants: restaurantStats };
  }
}

export const storage = new DatabaseStorage();
