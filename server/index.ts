import express from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { seedDatabase } from "./seed";
import { db } from "./db";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "maweja-secret-2024",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

(async () => {
  // Create tables
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
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

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
      lng DOUBLE PRECISION
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
      total INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      delivery_address TEXT NOT NULL,
      delivery_lat DOUBLE PRECISION,
      delivery_lng DOUBLE PRECISION,
      notes TEXT,
      estimated_delivery TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

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
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await seedDatabase();

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
