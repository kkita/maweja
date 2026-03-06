import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import {
  users, restaurants, menuItems, orders, notifications, chatMessages, walletTransactions,
  type User, type InsertUser, type Restaurant, type InsertRestaurant,
  type MenuItem, type InsertMenuItem, type Order, type InsertOrder,
  type Notification, type InsertNotification, type ChatMessage, type InsertChatMessage,
  type WalletTransaction, type InsertWalletTransaction,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  getDrivers(): Promise<User[]>;
  getOnlineDrivers(): Promise<User[]>;

  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  createRestaurant(r: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant | undefined>;

  getMenuItems(restaurantId: number): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, data: Partial<MenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<void>;

  getOrders(filters?: { clientId?: number; driverId?: number; status?: string }): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined>;

  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(n: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;

  getChatMessages(userId1: number, userId2: number): Promise<ChatMessage[]>;
  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;

  getWalletTransactions(userId: number): Promise<WalletTransaction[]>;
  createWalletTransaction(t: InsertWalletTransaction): Promise<WalletTransaction>;

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

  async getDrivers() {
    return db.select().from(users).where(eq(users.role, "driver"));
  }

  async getOnlineDrivers() {
    return db.select().from(users).where(and(eq(users.role, "driver"), eq(users.isOnline, true)));
  }

  async getRestaurants() {
    return db.select().from(restaurants).where(eq(restaurants.isActive, true));
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

  async getOrders(filters?: { clientId?: number; driverId?: number; status?: string }) {
    let query = db.select().from(orders);
    const conditions = [];
    if (filters?.clientId) conditions.push(eq(orders.clientId, filters.clientId));
    if (filters?.driverId) conditions.push(eq(orders.driverId, filters.driverId));
    if (filters?.status) conditions.push(eq(orders.status, filters.status));
    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(orders.createdAt));
    }
    return query.orderBy(desc(orders.createdAt));
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
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(n: InsertNotification) {
    const [created] = await db.insert(notifications).values(n).returning();
    return created;
  }

  async markNotificationRead(id: number) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async getChatMessages(userId1: number, userId2: number) {
    return db.select().from(chatMessages).where(
      or(
        and(eq(chatMessages.senderId, userId1), eq(chatMessages.receiverId, userId2)),
        and(eq(chatMessages.senderId, userId2), eq(chatMessages.receiverId, userId1))
      )
    ).orderBy(chatMessages.createdAt);
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

  async getDashboardStats() {
    const [orderStats] = await db.select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')`,
      active: sql<number>`count(*) filter (where ${orders.status} in ('confirmed','preparing','ready','picked_up'))`,
      delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')`,
      revenue: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} = 'delivered'), 0)`,
    }).from(orders);

    const [driverStats] = await db.select({
      total: sql<number>`count(*)`,
      online: sql<number>`count(*) filter (where ${users.isOnline} = true)`,
    }).from(users).where(eq(users.role, "driver"));

    const [clientStats] = await db.select({
      total: sql<number>`count(*)`,
    }).from(users).where(eq(users.role, "client"));

    return {
      orders: orderStats,
      drivers: driverStats,
      clients: clientStats,
    };
  }
}

export const storage = new DatabaseStorage();
