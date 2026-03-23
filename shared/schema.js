import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    role: text("role").notNull().default("client"),
    avatar: text("avatar"),
    walletBalance: integer("wallet_balance").notNull().default(0),
    loyaltyPoints: integer("loyalty_points").notNull().default(0),
    isOnline: boolean("is_online").notNull().default(false),
    isBlocked: boolean("is_blocked").notNull().default(false),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    address: text("address"),
    vehicleType: text("vehicle_type"),
    vehiclePlate: text("vehicle_plate"),
    driverLicense: text("driver_license"),
    commissionRate: integer("commission_rate").default(15),
    sex: text("sex"),
    dateOfBirth: text("date_of_birth"),
    fullAddress: text("full_address"),
    idPhotoUrl: text("id_photo_url"),
    profilePhotoUrl: text("profile_photo_url"),
    verificationStatus: text("verification_status").default("not_started"),
    rejectedFields: jsonb("rejected_fields"),
    adminRole: text("admin_role"),
    adminPermissions: jsonb("admin_permissions"),
    authToken: text("auth_token"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const restaurants = pgTable("restaurants", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    cuisine: text("cuisine").notNull(),
    image: text("image").notNull(),
    logoUrl: text("logo_url"),
    coverVideoUrl: text("cover_video_url"),
    address: text("address").notNull(),
    rating: doublePrecision("rating").notNull().default(4.5),
    deliveryTime: text("delivery_time").notNull().default("30-45 min"),
    deliveryFee: integer("delivery_fee").notNull().default(2500),
    minOrder: integer("min_order").notNull().default(5000),
    isActive: boolean("is_active").notNull().default(true),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    phone: text("phone"),
    openingHours: text("opening_hours"),
    email: text("email"),
    managerName: text("manager_name"),
    brandName: text("brand_name"),
    hqAddress: text("hq_address"),
    prepTime: text("prep_time").default("20-30 min"),
    restaurantCommissionRate: integer("restaurant_commission_rate").notNull().default(20),
    discountPercent: integer("discount_percent").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    discountLabel: text("discount_label"),
    isFeatured: boolean("is_featured").notNull().default(false),
});
export const restaurantPayouts = pgTable("restaurant_payouts", {
    id: serial("id").primaryKey(),
    restaurantId: integer("restaurant_id").notNull(),
    restaurantName: text("restaurant_name").notNull(),
    period: text("period").notNull(),
    orderCount: integer("order_count").notNull().default(0),
    grossAmount: integer("gross_amount").notNull().default(0),
    mawejaCommission: integer("maweja_commission").notNull().default(0),
    netAmount: integer("net_amount").notNull().default(0),
    isPaid: boolean("is_paid").notNull().default(false),
    paidAt: timestamp("paid_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const menuItems = pgTable("menu_items", {
    id: serial("id").primaryKey(),
    restaurantId: integer("restaurant_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    image: text("image").notNull(),
    category: text("category").notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
    popular: boolean("popular").notNull().default(false),
});
export const orders = pgTable("orders", {
    id: serial("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    clientId: integer("client_id").notNull(),
    restaurantId: integer("restaurant_id").notNull(),
    driverId: integer("driver_id"),
    status: text("status").notNull().default("pending"),
    items: jsonb("items").notNull(),
    subtotal: integer("subtotal").notNull(),
    deliveryFee: integer("delivery_fee").notNull(),
    commission: integer("commission").notNull().default(0),
    total: integer("total").notNull(),
    paymentMethod: text("payment_method").notNull(),
    paymentStatus: text("payment_status").notNull().default("pending"),
    deliveryAddress: text("delivery_address").notNull(),
    deliveryLat: doublePrecision("delivery_lat"),
    deliveryLng: doublePrecision("delivery_lng"),
    notes: text("notes"),
    estimatedDelivery: text("estimated_delivery"),
    rating: integer("rating"),
    feedback: text("feedback"),
    cancelReason: text("cancel_reason"),
    orderName: text("order_name"),
    orderPhone: text("order_phone"),
    taxAmount: integer("tax_amount").notNull().default(0),
    promoCode: text("promo_code"),
    promoDiscount: integer("promo_discount").notNull().default(0),
    deviceType: text("device_type").default("web"),
    auditLog: jsonb("audit_log"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull().default("info"),
    isRead: boolean("is_read").notNull().default(false),
    data: jsonb("data"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const chatMessages = pgTable("chat_messages", {
    id: serial("id").primaryKey(),
    senderId: integer("sender_id").notNull(),
    receiverId: integer("receiver_id").notNull(),
    orderId: integer("order_id"),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
});
export const walletTransactions = pgTable("wallet_transactions", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    amount: integer("amount").notNull(),
    type: text("type").notNull(),
    description: text("description").notNull(),
    reference: text("reference"),
    orderId: integer("order_id"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const finances = pgTable("finances", {
    id: serial("id").primaryKey(),
    type: text("type").notNull(),
    category: text("category").notNull(),
    amount: integer("amount").notNull(),
    description: text("description").notNull(),
    orderId: integer("order_id"),
    userId: integer("user_id"),
    reference: text("reference"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const savedAddresses = pgTable("saved_addresses", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    label: text("label").notNull(),
    address: text("address").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
});
export const serviceCategories = pgTable("service_categories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("Briefcase"),
    imageUrl: text("image_url").default(""),
    description: text("description").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    serviceTypes: text("service_types").array().default([]),
    createdAt: timestamp("created_at").defaultNow(),
});
export const serviceRequests = pgTable("service_requests", {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull(),
    categoryId: integer("category_id").notNull(),
    categoryName: text("category_name").notNull(),
    status: text("status").notNull().default("pending"),
    scheduledType: text("scheduled_type").notNull().default("asap"),
    scheduledDate: text("scheduled_date"),
    scheduledTime: text("scheduled_time"),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    serviceType: text("service_type"),
    budget: text("budget"),
    photoUrl: text("photo_url"),
    additionalInfo: text("additional_info"),
    contactMethod: text("contact_method").notNull().default("phone"),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const serviceCatalogItems = pgTable("service_catalog_items", {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull(),
    price: text("price"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
});
export const advertisements = pgTable("advertisements", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    mediaUrl: text("media_url").notNull(),
    mediaType: text("media_type").notNull().default("image"),
    linkUrl: text("link_url"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
});
export const promoBanners = pgTable("promo_banners", {
    id: serial("id").primaryKey(),
    tagText: text("tag_text").notNull().default("Offre Spéciale"),
    title: text("title").notNull().default("Livraison gratuite"),
    subtitle: text("subtitle").notNull().default("Sur votre première commande"),
    buttonText: text("button_text").notNull().default("Commander maintenant"),
    linkUrl: text("link_url"),
    bgColorFrom: text("bg_color_from").notNull().default("#dc2626"),
    bgColorTo: text("bg_color_to").notNull().default("#b91c1c"),
    isActive: boolean("is_active").notNull().default(true),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const promotions = pgTable("promotions", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    description: text("description").notNull(),
    type: text("type").notNull().default("percent"),
    value: integer("value").notNull().default(10),
    minOrder: integer("min_order").notNull().default(0),
    maxUses: integer("max_uses").notNull().default(0),
    usedCount: integer("used_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true, createdAt: true, usedCount: true });
export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({ id: true, createdAt: true });
export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceCatalogItemSchema = createInsertSchema(serviceCatalogItems).omit({ id: true, createdAt: true });
export const insertAdvertisementSchema = createInsertSchema(advertisements).omit({ id: true, createdAt: true });
export const insertSavedAddressSchema = createInsertSchema(savedAddresses).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({ id: true, createdAt: true });
export const insertFinanceSchema = createInsertSchema(finances).omit({ id: true, createdAt: true });
export const appSettings = pgTable("app_settings", {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertPromoBannerSchema = createInsertSchema(promoBanners).omit({ id: true, updatedAt: true });
export const insertRestaurantPayoutSchema = createInsertSchema(restaurantPayouts).omit({ id: true, createdAt: true });
export const restaurantCategories = pgTable("restaurant_categories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    emoji: text("emoji").notNull().default("🍽️"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
});
export const insertRestaurantCategorySchema = createInsertSchema(restaurantCategories).omit({ id: true });
//# sourceMappingURL=schema.js.map