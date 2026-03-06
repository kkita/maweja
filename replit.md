# MAWEJA - Systeme de Livraison Kinshasa

## Overview
Complete food delivery system for Kinshasa, RDC with 3 interfaces: Client, Driver, Admin Dashboard. Built with Express + React + PostgreSQL + WebSocket. Red and white color scheme. Uber-style delivery platform.

## Branding
- App Name: MAWEJA
- Signature: Demo by Khevin Andrew Kita - Ed Corporation 0911742202
- Primary Color: #dc2626 (red)
- Color Scheme: Red + White

## Architecture
- **Backend**: Express.js + PostgreSQL + WebSocket
- **Frontend**: React + Vite + Tailwind CSS 3
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Session-based with express-session
- **Real-time**: WebSocket for notifications, chat, live updates
- **Routing**: wouter (client-side)
- **State**: TanStack React Query + Context API

## Key Files
- `server/index.ts` - Server entry, DB setup, table creation, seeding
- `server/routes.ts` - API routes (auth, restaurants, orders, drivers, chat, wallet)
- `server/storage.ts` - Database operations (IStorage interface)
- `server/db.ts` - Drizzle DB connection
- `server/seed.ts` - Demo data seeding
- `server/vite.ts` - Vite dev server middleware
- `shared/schema.ts` - Database schema + types
- `client/src/App.tsx` - Main router (role-based routing)
- `client/src/lib/auth.tsx` - Auth context
- `client/src/lib/cart.tsx` - Cart context
- `client/src/lib/websocket.ts` - WebSocket client

## Pages
### Client
- HomePage - Restaurant listing, search, categories, promo
- RestaurantPage - Menu with categories, add to cart
- CartPage - Cart management
- CheckoutPage - Address, payment selection, order placement
- OrdersPage - Order history
- TrackingPage - Real-time order tracking
- WalletPage - Wallet balance, top-up, transaction history

### Driver
- DriverDashboard - Available/active orders, stats
- DriverOrders - Delivery history
- DriverEarnings - Revenue tracking

### Admin Dashboard
- AdminDashboard - KPIs, recent orders, performance
- AdminOrders - Order management with status/driver assignment
- AdminDrivers - Driver management, online status, stats
- AdminRestaurants - Restaurant management
- AdminCustomers - Customer management, wallet/points
- AdminChat - Messaging with clients and drivers
- AdminSettings - App configuration

## Demo Accounts
- Client: client@test.cd / test123
- Driver: driver1@maweja.cd / driver123
- Admin: admin@maweja.cd / admin123

## Payment Methods
Mobile Money, Cash, Illico Cash, Wallet MAWEJA, Points de fidelite, Carte Bancaire

## Restaurants
Aldar, KFC, Hunga Busta, Hilton Kinshasa, Golden Tulip, Kin Marche, La Terrasse Gombe, City Market
