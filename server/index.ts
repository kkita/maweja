import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { seedDatabase } from "./seed";
import { db, pool } from "./db";
import { sql } from "drizzle-orm";
import { hashPassword } from "./auth";
import { logger } from "./lib/logger";

const app = express();

// Faire confiance au reverse proxy Replit (nécessaire pour les cookies sécurisés en prod)
app.set("trust proxy", 1);

const CAPACITOR_ORIGINS = [
  "capacitor://localhost",
  "capacitor://com.edcorp.maweja",
  "capacitor://com.edcorp.maweja.driver",
  "ionic://localhost",
  "https://localhost",
  "http://localhost",
  "http://localhost:8100",
  "https://localhost:8100",
  "https://maweja.net",
  "https://www.maweja.net",
];

const IS_PROD = process.env.NODE_ENV === "production";

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isCapacitor =
    origin &&
    (CAPACITOR_ORIGINS.includes(origin) ||
      origin.startsWith("capacitor://") ||
      origin.startsWith("ionic://") ||
      origin === "null");

  if (isCapacitor && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-User-Role,Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PgSession = connectPgSimple(session);

const pgStore = new PgSession({
  pool,
  tableName: "user_sessions",
  createTableIfMissing: true,
});

if (IS_PROD && !process.env.SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET is not set. Refusing to start in production without it.");
  process.exit(1);
}

const sessionOpts = {
  store: pgStore,
  secret: process.env.SESSION_SECRET || "maweja-dev-secret-do-not-use-in-prod",
  resave: true,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    // En production: sameSite=none + secure=true pour les apps APK Capacitor (cross-origin)
    // En développement: sameSite=lax + secure=false pour le navigateur local
    secure: IS_PROD,
    httpOnly: true,
    sameSite: (IS_PROD ? "none" : "lax") as "none" | "lax",
    maxAge: 14 * 24 * 60 * 60 * 1000,
  },
};

const adminSession = session({ ...sessionOpts, name: "sid_admin" });
const driverSession = session({ ...sessionOpts, name: "sid_driver" });
const clientSession = session({ ...sessionOpts, name: "sid_client" });

app.use((req: any, res, next) => {
  const role = req.headers["x-user-role"] as string;
  if (role === "admin") return adminSession(req, res, next);
  if (role === "driver") return driverSession(req, res, next);
  if (role === "client") return clientSession(req, res, next);

  const path = req.path;
  if (path.startsWith("/api/admin") || path === "/api/dashboard/stats" || path === "/api/orders/export" || path === "/api/finance/export" || path.startsWith("/api/restaurant-payouts") || path.startsWith("/api/analytics")) return adminSession(req, res, next);
  if (path.startsWith("/api/driver")) return driverSession(req, res, next);

  return clientSession(req, res, next);
});

(async () => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      avatar TEXT,
      wallet_balance INTEGER NOT NULL DEFAULT 0,
      loyalty_points INTEGER NOT NULL DEFAULT 0,
      is_online BOOLEAN NOT NULL DEFAULT false,
      is_blocked BOOLEAN NOT NULL DEFAULT false,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      address TEXT,
      vehicle_type TEXT,
      vehicle_plate TEXT,
      driver_license TEXT,
      commission_rate INTEGER DEFAULT 15,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_type TEXT`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_plate TEXT`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS driver_license TEXT`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate INTEGER DEFAULT 15`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS restaurants (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      cuisine TEXT NOT NULL,
      image TEXT NOT NULL,
      address TEXT NOT NULL,
      rating DOUBLE PRECISION NOT NULL DEFAULT 4.5,
      delivery_time TEXT NOT NULL DEFAULT '30-45 min',
      delivery_fee DOUBLE PRECISION NOT NULL DEFAULT 2,
      min_order DOUBLE PRECISION NOT NULL DEFAULT 5,
      is_active BOOLEAN NOT NULL DEFAULT true,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      phone TEXT,
      opening_hours TEXT
    )
  `);
  await db.execute(sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone TEXT`);
  await db.execute(sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS opening_hours TEXT`);
  await db.execute(sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS logo_url TEXT`);
  await db.execute(sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cover_video_url TEXT`);
  await db.execute(sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS email TEXT`);
  await db.execute(sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS manager_name TEXT`);
  await db.execute(sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS brand_name TEXT`);
  await db.execute(sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS hq_address TEXT`);
  await db.execute(sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS prep_time TEXT DEFAULT '20-30 min'`);
  await db.execute(sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'restaurant'`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS boutique_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '🛍️',
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS menu_item_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      store_type TEXT NOT NULL DEFAULT 'restaurant',
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS delivery_zones (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      fee DOUBLE PRECISION NOT NULL DEFAULT 2,
      color TEXT NOT NULL DEFAULT '#22c55e',
      neighborhoods JSONB NOT NULL DEFAULT '[]',
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      image TEXT NOT NULL,
      category TEXT NOT NULL,
      is_available BOOLEAN NOT NULL DEFAULT true,
      popular BOOLEAN NOT NULL DEFAULT false
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      client_id INTEGER NOT NULL,
      restaurant_id INTEGER NOT NULL,
      driver_id INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      items JSONB NOT NULL,
      subtotal INTEGER NOT NULL,
      delivery_fee INTEGER NOT NULL,
      commission INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      delivery_address TEXT NOT NULL,
      delivery_lat DOUBLE PRECISION,
      delivery_lng DOUBLE PRECISION,
      notes TEXT,
      estimated_delivery TEXT,
      rating INTEGER,
      feedback TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission INTEGER NOT NULL DEFAULT 0`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating INTEGER`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS feedback TEXT`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount INTEGER NOT NULL DEFAULT 0`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_discount INTEGER NOT NULL DEFAULT 0`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'web'`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS audit_log JSONB`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone TEXT`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_accepted BOOLEAN NOT NULL DEFAULT false`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS refusal_reason TEXT`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_remarks JSONB`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_modifications JSONB`);
  await db.execute(sql`ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS show_budget BOOLEAN NOT NULL DEFAULT false`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read BOOLEAN NOT NULL DEFAULT false,
      data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      order_id INTEGER,
      message TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      reference TEXT,
      order_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.execute(sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS order_id INTEGER`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS saved_addresses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      address TEXT NOT NULL,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS finances (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT NOT NULL,
      order_id INTEGER,
      user_id INTEGER,
      reference TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS service_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'Briefcase',
      description TEXT NOT NULL DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS service_requests (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      category_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      scheduled_type TEXT NOT NULL DEFAULT 'asap',
      scheduled_date TEXT,
      scheduled_time TEXT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      service_type TEXT,
      budget TEXT,
      photo_url TEXT,
      additional_info TEXT,
      contact_method TEXT NOT NULL DEFAULT 'phone',
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS advertisements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      media_url TEXT NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'image',
      link_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Colonnes supplémentaires utilisateurs (ajoutées progressivement)
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS sex TEXT`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TEXT`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_address TEXT`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_photo_url TEXT`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_started'`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS rejected_fields JSONB`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_token TEXT`);

  // Migrate monetary columns from INTEGER to DOUBLE PRECISION
  await db.execute(sql`ALTER TABLE users ALTER COLUMN wallet_balance TYPE DOUBLE PRECISION USING wallet_balance::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE restaurants ALTER COLUMN delivery_fee TYPE DOUBLE PRECISION USING delivery_fee::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE restaurants ALTER COLUMN min_order TYPE DOUBLE PRECISION USING min_order::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE menu_items ALTER COLUMN price TYPE DOUBLE PRECISION USING price::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE orders ALTER COLUMN subtotal TYPE DOUBLE PRECISION USING subtotal::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE orders ALTER COLUMN delivery_fee TYPE DOUBLE PRECISION USING delivery_fee::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE orders ALTER COLUMN commission TYPE DOUBLE PRECISION USING commission::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE orders ALTER COLUMN total TYPE DOUBLE PRECISION USING total::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE orders ALTER COLUMN tax_amount TYPE DOUBLE PRECISION USING tax_amount::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE orders ALTER COLUMN promo_discount TYPE DOUBLE PRECISION USING promo_discount::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE wallet_transactions ALTER COLUMN amount TYPE DOUBLE PRECISION USING amount::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE finances ALTER COLUMN amount TYPE DOUBLE PRECISION USING amount::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE restaurant_payouts ALTER COLUMN gross_amount TYPE DOUBLE PRECISION USING gross_amount::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE restaurant_payouts ALTER COLUMN maweja_commission TYPE DOUBLE PRECISION USING maweja_commission::DOUBLE PRECISION`);
  await db.execute(sql`ALTER TABLE restaurant_payouts ALTER COLUMN net_amount TYPE DOUBLE PRECISION USING net_amount::DOUBLE PRECISION`);

  await db.execute(sql`UPDATE restaurants SET delivery_fee = 2 WHERE delivery_fee > 100`);
  await db.execute(sql`UPDATE restaurants SET min_order = 5 WHERE min_order > 100`);
  await db.execute(sql`UPDATE menu_items SET price = ROUND((price / 2500.0)::numeric, 2)::double precision WHERE price > 500`);

  // Seed admin par défaut — hash passwords before inserting
  const [hash1, hash2] = await Promise.all([
    hashPassword("admin123"),
    hashPassword("Maweja2026"),
  ]);
  await db.execute(sql`
    INSERT INTO users (email, password, name, phone, role, is_online, verification_status)
    VALUES
      ('admin@maweja.cd', ${hash1}, 'Super Admin', '0802540138', 'admin', true, 'not_started'),
      ('admin@maweja.net', ${hash2}, 'Admin MAWEJA', '0802540138', 'admin', true, 'not_started')
    ON CONFLICT (email) DO NOTHING
  `);

  // Transparent password migration: rehash any account whose password is still plaintext
  // (does not start with $2 which is the bcrypt prefix)
  try {
    const plainUsers = await db.execute(sql`SELECT id, password FROM users WHERE password NOT LIKE '$2%'`);
    for (const row of plainUsers.rows as { id: number; password: string }[]) {
      const hashed = await hashPassword(row.password);
      await db.execute(sql`UPDATE users SET password = ${hashed} WHERE id = ${row.id}`);
    }
    if (plainUsers.rows.length > 0) {
      console.log(`[security] Migrated ${plainUsers.rows.length} plaintext password(s) to bcrypt.`);
    }
  } catch (e) {
    console.warn("[security] Password migration skipped:", e);
  }

  // Seed default service categories
  const existingCats = await db.execute(sql`SELECT COUNT(*) as count FROM service_categories`);
  if (Number((existingCats.rows[0] as any).count) === 0) {
    await db.execute(sql`INSERT INTO service_categories (name, icon, description) VALUES
      ('Hotellerie', 'Hotel', 'Services hôteliers et hébergement'),
      ('Transport', 'Car', 'Services de transport et logistique'),
      ('Nettoyage', 'Sparkles', 'Services de nettoyage et entretien'),
      ('Demenagement', 'Package', 'Services de déménagement'),
      ('Evenementiel', 'PartyPopper', 'Organisation d''événements'),
      ('Reparation', 'Wrench', 'Services de réparation et maintenance'),
      ('Coursier', 'Bike', 'Services de coursier et livraison express'),
      ('Autre', 'HelpCircle', 'Autres services sur demande')
    `);
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS password_reset_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL DEFAULT 'client',
      user_email TEXT,
      user_phone TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      request_type TEXT NOT NULL DEFAULT 'chat',
      token TEXT,
      token_expiry TIMESTAMP,
      message TEXT,
      admin_note TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      resolved_at TIMESTAMP
    )
  `);

  const existingZones = await db.execute(sql`SELECT COUNT(*) as count FROM delivery_zones`);
  if (Number((existingZones.rows[0] as any).count) === 0) {
    await db.execute(sql`INSERT INTO delivery_zones (name, fee, color, neighborhoods, is_active, sort_order) VALUES
      ('Zone A', 1.50, '#22c55e', ${JSON.stringify(["gombe","lingwala"])}::jsonb, true, 0),
      ('Zone B', 2.50, '#f59e0b', ${JSON.stringify(["bandalungwa","commune de kinshasa","c/kinshasa","kintambo","barumbu","ngiri-ngiri","ngiri ngiri","ngiri","kalamu","makala","bumbu","kasavubu","kasa-vubu","kasa vubu","limete 1","limete 2","limete 3","limete 4","limete 5","limete 6","limete 7","1ere rue limete","2eme rue limete","3eme rue limete","4eme rue limete","5eme rue limete","6eme rue limete","7eme rue limete","1ère rue limete","2ème rue limete","3ème rue limete","4ème rue limete","5ème rue limete","6ème rue limete","7ème rue limete","saint luc","macampagne","sakombi","station macampagne"])}::jsonb, true, 1),
      ('Zone C', 4.00, '#ef4444', ${JSON.stringify(["haute-tension","haute tension","dgc","limete 8","limete 9","limete 10","limete 11","limete 12","limete 13","limete 14","limete 15","limete 16","8eme rue limete","9eme rue limete","10eme rue limete","11eme rue limete","12eme rue limete","13eme rue limete","14eme rue limete","15eme rue limete","16eme rue limete","8ème rue limete","9ème rue limete","10ème rue limete","11ème rue limete","12ème rue limete","13ème rue limete","14ème rue limete","15ème rue limete","16ème rue limete","selembao","poids lourds","kingabwa","lemba foire","lemba super","lemba terminus","lemba salongo","lemba","ngaliema","brikin","ozone","pigeon","mimosas","delvaux","meteo","météo","gramalic","grammalic","yolo"])}::jsonb, true, 2)
    `);
  }

  const existingMenuCats = await db.execute(sql`SELECT COUNT(*) as count FROM menu_item_categories`);
  if (Number((existingMenuCats.rows[0] as any).count) === 0) {
    await db.execute(sql`INSERT INTO menu_item_categories (name, store_type, is_active, sort_order) VALUES
      ('Principal', 'restaurant', true, 0),
      ('Entrée', 'restaurant', true, 1),
      ('Dessert', 'restaurant', true, 2),
      ('Boisson', 'restaurant', true, 3),
      ('Snack', 'restaurant', true, 4),
      ('Accompagnement', 'restaurant', true, 5),
      ('Produit phare', 'boutique', true, 0),
      ('Vêtements', 'boutique', true, 1),
      ('Électronique', 'boutique', true, 2),
      ('Beauté & Santé', 'boutique', true, 3),
      ('Alimentation', 'boutique', true, 4),
      ('Maison & Déco', 'boutique', true, 5)
    `);
  }

  // Chat file attachments migration
  await db.execute(sql`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS file_url TEXT`);
  await db.execute(sql`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS file_type TEXT`);

  // Loyalty points system migrations
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_awarded BOOLEAN NOT NULL DEFAULT false`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_credit_id INTEGER`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_credit_discount DOUBLE PRECISION NOT NULL DEFAULT 0`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS loyalty_credits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      amount DOUBLE PRECISION NOT NULL DEFAULT 10,
      points_converted INTEGER NOT NULL DEFAULT 1000,
      source_order_id INTEGER,
      is_used BOOLEAN NOT NULL DEFAULT false,
      used_on_order_id INTEGER,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS wallet_payment_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      deposit_id TEXT UNIQUE NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      correspondent TEXT NOT NULL,
      method_label TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'INITIATED',
      failure_reason TEXT,
      credited BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  if (!IS_PROD) {
    process.env.FORCE_SEED = "1";
  }
  await seedDatabase();

  const server = await registerRoutes(app);

  app.use((err: any, _req: any, res: any, _next: any) => {
    logger.error("Unhandled server error", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    logger.info(`MAWEJA server running on port ${port}`);
  });
})();
