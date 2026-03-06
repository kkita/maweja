# MAWEJA - Systeme de Livraison Kinshasa

## Overview
Production-grade food delivery platform for Kinshasa, RDC with 3 interfaces: Client, Driver, Admin Dashboard. Built with Express + React + PostgreSQL + WebSocket. Red and white color scheme. Uber-style delivery platform with real-time driver tracking via Leaflet maps.

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
- **Real-time**: WebSocket for notifications, chat, live updates, driver location
- **Maps**: Leaflet + react-leaflet v4 (OpenStreetMap tiles)
- **Routing**: wouter (client-side)
- **State**: TanStack React Query + Context API

## Key Files
- `server/index.ts` - Server entry, DB setup, table creation with ALTER TABLE migrations
- `server/routes.ts` - API routes (auth, restaurants, orders, drivers CRUD, chat, wallet, finance, CSV export)
- `server/storage.ts` - Database operations (IStorage interface with finance & dashboard stats)
- `server/db.ts` - Drizzle DB connection
- `server/seed.ts` - Initial data seeding (restaurants, menu items, admin + drivers)
- `server/vite.ts` - Vite dev server middleware
- `shared/schema.ts` - Database schema + types (users, restaurants, menuItems, orders, notifications, chatMessages, walletTransactions, finances)
- `client/src/App.tsx` - Main router (role-based routing)
- `client/src/lib/auth.tsx` - Auth context
- `client/src/lib/cart.tsx` - Cart context
- `client/src/lib/websocket.ts` - WebSocket client

## Database Tables
- **users**: email, password, name, phone, role, isBlocked, vehicleType, vehiclePlate, driverLicense, commissionRate, lat/lng, walletBalance, loyaltyPoints
- **restaurants**: name, description, cuisine, image, address, rating, deliveryTime, deliveryFee, minOrder, lat/lng, phone, openingHours
- **menu_items**: restaurantId, name, description, price, image, category, isAvailable, popular
- **orders**: orderNumber, clientId, restaurantId, driverId, status, items, subtotal, deliveryFee, commission, total, paymentMethod, paymentStatus, deliveryAddress, deliveryLat/Lng, rating, feedback
- **finances**: type (revenue/expense), category, amount, description, orderId, userId, reference
- **notifications**, **chat_messages**, **wallet_transactions**

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
- DriverDashboard - Online/offline toggle, GPS location broadcasting, available/active orders, earnings
- DriverOrders - Delivery history
- DriverEarnings - Revenue tracking

### Admin Dashboard
- AdminDashboard - KPIs, recent orders, performance metrics
- AdminOrders - Order management with status/driver assignment
- AdminDrivers - Driver CRUD (add/edit/delete/block), Leaflet map with real-time driver positions
- AdminRestaurants - Restaurant management
- AdminCustomers - Customer management, wallet/points
- AdminChat - Messaging with clients and drivers
- AdminFinance - Revenue/expense tracking, category breakdown, daily chart, CSV export
- AdminSettings - App configuration

## API Endpoints
- POST /api/auth/login, /api/auth/register, /api/auth/logout, GET /api/auth/me
- CRUD /api/restaurants, /api/restaurants/:id/menu, /api/menu-items
- GET/POST/PATCH /api/orders, POST /api/orders/:id/rate
- GET/POST/PATCH/DELETE /api/drivers, PATCH /api/drivers/:id/block, /api/drivers/:id/location, /api/drivers/:id/status
- GET/POST /api/finance, GET /api/finance/summary, GET /api/finance/export (CSV)
- GET /api/orders/export (CSV)
- GET /api/dashboard/stats
- GET/POST /api/notifications, /api/chat, /api/wallet

## Accounts (seed data)
- Admin: admin@maweja.cd / admin123
- Drivers: driver1-4@maweja.cd / driver123

## Payment Methods
Mobile Money, Cash, Illico Cash, Wallet MAWEJA, Points de fidelite, Carte Bancaire
