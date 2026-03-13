import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
// seedDatabase importé mais désactivé — données de production uniquement
// import { seedDatabase } from "./seed";
import { db, pool } from "./db";
import { sql } from "drizzle-orm";

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

const sessionOpts = {
  store: pgStore,
  secret: process.env.SESSION_SECRET || "maweja-secret-2024",
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
  if (path.startsWith("/api/admin") || path === "/api/dashboard/stats") return adminSession(req, res, next);
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
      delivery_fee INTEGER NOT NULL DEFAULT 2500,
      min_order INTEGER NOT NULL DEFAULT 5000,
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

  // Seed admin par défaut — crée les comptes s'ils n'existent pas encore
  await db.execute(sql`
    INSERT INTO users (email, password, name, phone, role, is_online, verification_status)
    VALUES
      ('admin@maweja.cd', 'admin123', 'Super Admin', '0819994041', 'admin', true, 'not_started'),
      ('admin@maweja.net', 'Maweja2026', 'Admin MAWEJA', '0819994041', 'admin', true, 'not_started')
    ON CONFLICT (email) DO NOTHING
  `);

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

  const server = await registerRoutes(app);

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`MAWEJA server running on port ${port}`);
  });
})();
