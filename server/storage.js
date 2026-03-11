import { db } from "./db";
import { eq, desc, and, or, sql, gte, lte } from "drizzle-orm";
import { users, restaurants, menuItems, orders, notifications, chatMessages, walletTransactions, finances, savedAddresses, serviceCategories, serviceRequests, serviceCatalogItems, advertisements, } from "@shared/schema";
export class DatabaseStorage {
    async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }
    async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
    }
    async createUser(user) {
        const [created] = await db.insert(users).values(user).returning();
        return created;
    }
    async updateUser(id, data) {
        const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
        return updated;
    }
    async deleteUser(id) {
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
    async getRestaurant(id) {
        const [r] = await db.select().from(restaurants).where(eq(restaurants.id, id));
        return r;
    }
    async createRestaurant(r) {
        const [created] = await db.insert(restaurants).values(r).returning();
        return created;
    }
    async updateRestaurant(id, data) {
        const [updated] = await db.update(restaurants).set(data).where(eq(restaurants.id, id)).returning();
        return updated;
    }
    async deleteRestaurant(id) {
        await db.delete(restaurants).where(eq(restaurants.id, id));
    }
    async getMenuItems(restaurantId) {
        return db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
    }
    async createMenuItem(item) {
        const [created] = await db.insert(menuItems).values(item).returning();
        return created;
    }
    async updateMenuItem(id, data) {
        const [updated] = await db.update(menuItems).set(data).where(eq(menuItems.id, id)).returning();
        return updated;
    }
    async deleteMenuItem(id) {
        await db.delete(menuItems).where(eq(menuItems.id, id));
    }
    async getOrders(filters) {
        const conditions = [];
        if (filters?.clientId)
            conditions.push(eq(orders.clientId, filters.clientId));
        if (filters?.driverId)
            conditions.push(eq(orders.driverId, filters.driverId));
        if (filters?.status)
            conditions.push(eq(orders.status, filters.status));
        if (filters?.dateFrom)
            conditions.push(gte(orders.createdAt, filters.dateFrom));
        if (filters?.dateTo)
            conditions.push(lte(orders.createdAt, filters.dateTo));
        if (conditions.length > 0) {
            return db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt));
        }
        return db.select().from(orders).orderBy(desc(orders.createdAt));
    }
    async getOrder(id) {
        const [order] = await db.select().from(orders).where(eq(orders.id, id));
        return order;
    }
    async getOrderByNumber(orderNumber) {
        const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
        return order;
    }
    async createOrder(order) {
        const [created] = await db.insert(orders).values(order).returning();
        return created;
    }
    async updateOrder(id, data) {
        const [updated] = await db.update(orders).set({ ...data, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
        return updated;
    }
    async getNotifications(userId) {
        return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
    }
    async createNotification(n) {
        const [created] = await db.insert(notifications).values(n).returning();
        return created;
    }
    async markNotificationRead(id) {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    }
    async markAllNotificationsRead(userId) {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
    }
    async getChatMessages(userId1, userId2) {
        return db.select().from(chatMessages).where(or(and(eq(chatMessages.senderId, userId1), eq(chatMessages.receiverId, userId2)), and(eq(chatMessages.senderId, userId2), eq(chatMessages.receiverId, userId1)))).orderBy(chatMessages.createdAt).limit(100);
    }
    async getChatContacts(userId) {
        const sent = await db.select({ id: chatMessages.receiverId }).from(chatMessages).where(eq(chatMessages.senderId, userId));
        const received = await db.select({ id: chatMessages.senderId }).from(chatMessages).where(eq(chatMessages.receiverId, userId));
        const contactIds = [...new Set([...sent.map(s => s.id), ...received.map(r => r.id)])];
        if (contactIds.length === 0)
            return [];
        const contactUsers = await Promise.all(contactIds.map(id => this.getUser(id)));
        return contactUsers.filter(Boolean).map(u => ({ id: u.id, name: u.name, phone: u.phone, role: u.role }));
    }
    async createChatMessage(msg) {
        const [created] = await db.insert(chatMessages).values(msg).returning();
        return created;
    }
    async updateChatMessage(id, data) {
        await db.update(chatMessages).set(data).where(eq(chatMessages.id, id));
    }
    async getWalletTransactions(userId) {
        return db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt));
    }
    async createWalletTransaction(t) {
        const [created] = await db.insert(walletTransactions).values(t).returning();
        return created;
    }
    async getFinances(filters) {
        const conditions = [];
        if (filters?.type)
            conditions.push(eq(finances.type, filters.type));
        if (filters?.dateFrom)
            conditions.push(gte(finances.createdAt, filters.dateFrom));
        if (filters?.dateTo)
            conditions.push(lte(finances.createdAt, filters.dateTo));
        if (conditions.length > 0) {
            return db.select().from(finances).where(and(...conditions)).orderBy(desc(finances.createdAt));
        }
        return db.select().from(finances).orderBy(desc(finances.createdAt));
    }
    async createFinance(f) {
        const [created] = await db.insert(finances).values(f).returning();
        return created;
    }
    async getFinanceSummary(dateFrom, dateTo) {
        const conditions = [];
        if (dateFrom)
            conditions.push(gte(finances.createdAt, dateFrom));
        if (dateTo)
            conditions.push(lte(finances.createdAt, dateTo));
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const [summary] = await db.select({
            totalRevenue: sql `coalesce(sum(${finances.amount}) filter (where ${finances.type} = 'revenue'), 0)`,
            totalExpense: sql `coalesce(sum(${finances.amount}) filter (where ${finances.type} = 'expense'), 0)`,
            totalCommission: sql `coalesce(sum(${finances.amount}) filter (where ${finances.category} = 'commission'), 0)`,
            totalDeliveryFees: sql `coalesce(sum(${finances.amount}) filter (where ${finances.category} = 'delivery_fee'), 0)`,
            count: sql `count(*)`,
        }).from(finances).where(whereClause);
        const byCategory = await db.select({
            category: finances.category,
            type: finances.type,
            total: sql `sum(${finances.amount})`,
            count: sql `count(*)`,
        }).from(finances).where(whereClause).groupBy(finances.category, finances.type);
        const daily = await db.select({
            date: sql `to_char(${finances.createdAt}, 'YYYY-MM-DD')`,
            revenue: sql `coalesce(sum(${finances.amount}) filter (where ${finances.type} = 'revenue'), 0)`,
            expense: sql `coalesce(sum(${finances.amount}) filter (where ${finances.type} = 'expense'), 0)`,
        }).from(finances).where(whereClause).groupBy(sql `to_char(${finances.createdAt}, 'YYYY-MM-DD')`).orderBy(sql `to_char(${finances.createdAt}, 'YYYY-MM-DD')`);
        return { summary, byCategory, daily };
    }
    async getDashboardStats() {
        const [orderStats] = await db.select({
            total: sql `count(*)`,
            pending: sql `count(*) filter (where ${orders.status} = 'pending')`,
            active: sql `count(*) filter (where ${orders.status} in ('confirmed','preparing','ready','picked_up'))`,
            delivered: sql `count(*) filter (where ${orders.status} = 'delivered')`,
            cancelled: sql `count(*) filter (where ${orders.status} = 'cancelled')`,
            revenue: sql `coalesce(sum(${orders.total}) filter (where ${orders.status} = 'delivered'), 0)`,
            todayOrders: sql `count(*) filter (where ${orders.createdAt} >= current_date)`,
            todayRevenue: sql `coalesce(sum(${orders.total}) filter (where ${orders.status} = 'delivered' and ${orders.createdAt} >= current_date), 0)`,
        }).from(orders);
        const [driverStats] = await db.select({
            total: sql `count(*)`,
            online: sql `count(*) filter (where ${users.isOnline} = true)`,
            blocked: sql `count(*) filter (where ${users.isBlocked} = true)`,
        }).from(users).where(eq(users.role, "driver"));
        const [clientStats] = await db.select({
            total: sql `count(*)`,
        }).from(users).where(eq(users.role, "client"));
        const [restaurantStats] = await db.select({
            total: sql `count(*)`,
            active: sql `count(*) filter (where ${restaurants.isActive} = true)`,
        }).from(restaurants);
        const cuisineBreakdown = await db.select({
            cuisine: restaurants.cuisine,
            count: sql `count(*)`,
        }).from(restaurants).groupBy(restaurants.cuisine).orderBy(desc(sql `count(*)`));
        const cuisineOrders = await db.select({
            cuisine: restaurants.cuisine,
            orderCount: sql `count(${orders.id})`,
            revenue: sql `coalesce(sum(${orders.total}) filter (where ${orders.status} = 'delivered'), 0)`,
        }).from(orders).innerJoin(restaurants, eq(orders.restaurantId, restaurants.id)).groupBy(restaurants.cuisine).orderBy(desc(sql `count(${orders.id})`));
        return { orders: orderStats, drivers: driverStats, clients: clientStats, restaurants: restaurantStats, cuisineBreakdown, cuisineOrders };
    }
    async getSavedAddresses(userId) {
        return db.select().from(savedAddresses).where(eq(savedAddresses.userId, userId)).orderBy(desc(savedAddresses.createdAt));
    }
    async createSavedAddress(addr) {
        const [created] = await db.insert(savedAddresses).values(addr).returning();
        return created;
    }
    async updateSavedAddress(id, data) {
        const [updated] = await db.update(savedAddresses).set(data).where(eq(savedAddresses.id, id)).returning();
        return updated;
    }
    async deleteSavedAddress(id) {
        await db.delete(savedAddresses).where(eq(savedAddresses.id, id));
    }
    async setDefaultAddress(userId, addressId) {
        await db.update(savedAddresses).set({ isDefault: false }).where(eq(savedAddresses.userId, userId));
        await db.update(savedAddresses).set({ isDefault: true }).where(and(eq(savedAddresses.id, addressId), eq(savedAddresses.userId, userId)));
    }
    async getServiceCategories() {
        return db.select().from(serviceCategories).orderBy(serviceCategories.name);
    }
    async getServiceCategory(id) {
        const [cat] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
        return cat;
    }
    async createServiceCategory(cat) {
        const [created] = await db.insert(serviceCategories).values(cat).returning();
        return created;
    }
    async updateServiceCategory(id, data) {
        const [updated] = await db.update(serviceCategories).set(data).where(eq(serviceCategories.id, id)).returning();
        return updated;
    }
    async deleteServiceCategory(id) {
        await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
    }
    async getServiceRequests(filters) {
        const conditions = [];
        if (filters?.clientId)
            conditions.push(eq(serviceRequests.clientId, filters.clientId));
        if (filters?.status)
            conditions.push(eq(serviceRequests.status, filters.status));
        if (filters?.categoryId)
            conditions.push(eq(serviceRequests.categoryId, filters.categoryId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        return db.select().from(serviceRequests).where(where).orderBy(desc(serviceRequests.createdAt));
    }
    async getServiceRequest(id) {
        const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id));
        return req;
    }
    async createServiceRequest(req) {
        const [created] = await db.insert(serviceRequests).values(req).returning();
        return created;
    }
    async updateServiceRequest(id, data) {
        const [updated] = await db.update(serviceRequests).set({ ...data, updatedAt: new Date() }).where(eq(serviceRequests.id, id)).returning();
        return updated;
    }
    async getServiceCatalogItems(categoryId) {
        const where = categoryId ? eq(serviceCatalogItems.categoryId, categoryId) : undefined;
        return db.select().from(serviceCatalogItems).where(where).orderBy(serviceCatalogItems.sortOrder);
    }
    async getServiceCatalogItem(id) {
        const [item] = await db.select().from(serviceCatalogItems).where(eq(serviceCatalogItems.id, id));
        return item;
    }
    async createServiceCatalogItem(item) {
        const [created] = await db.insert(serviceCatalogItems).values(item).returning();
        return created;
    }
    async updateServiceCatalogItem(id, data) {
        const [updated] = await db.update(serviceCatalogItems).set(data).where(eq(serviceCatalogItems.id, id)).returning();
        return updated;
    }
    async deleteServiceCatalogItem(id) {
        await db.delete(serviceCatalogItems).where(eq(serviceCatalogItems.id, id));
    }
    async getAdvertisements(activeOnly) {
        const where = activeOnly ? eq(advertisements.isActive, true) : undefined;
        return db.select().from(advertisements).where(where).orderBy(advertisements.sortOrder);
    }
    async getAdvertisement(id) {
        const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, id));
        return ad;
    }
    async createAdvertisement(ad) {
        const [created] = await db.insert(advertisements).values(ad).returning();
        return created;
    }
    async updateAdvertisement(id, data) {
        const [updated] = await db.update(advertisements).set(data).where(eq(advertisements.id, id)).returning();
        return updated;
    }
    async deleteAdvertisement(id) {
        await db.delete(advertisements).where(eq(advertisements.id, id));
    }
}
export const storage = new DatabaseStorage();
//# sourceMappingURL=storage.js.map