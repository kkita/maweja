# MAWEJA - Systeme de Livraison Kinshasa

## Overview
Production-grade food delivery platform for Kinshasa, RDC with 3 interfaces: Client, Driver, Admin Dashboard. Built with Express + React + PostgreSQL + WebSocket. Red and white color scheme. Uber-style delivery platform with real-time driver tracking via Leaflet maps.

## Branding
- App Name: MAWEJA
- Signature: Made By Khevin Andrew Kita - Ed Corporation
- Logo: attached_assets/image_1772833363714.png (imported as @assets/image_1772833363714.png in all components)
- Primary Color: #dc2626 (red)
- Color Scheme: Red + White

## Architecture
- **Backend**: Express.js + PostgreSQL + WebSocket
- **Frontend**: React + Vite + Tailwind CSS 3
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Session-based with express-session (3 separate cookies: sid_admin, sid_driver, sid_client for multi-tab support)
- **Real-time**: WebSocket for notifications, chat, live updates, driver location
- **Maps**: Leaflet + react-leaflet v4 (OpenStreetMap tiles)
- **Routing**: wouter (client-side)
- **State**: TanStack React Query + Context API
- **File uploads**: multer (uploads/ directory, 5MB limit, jpg/png/webp)

## Key Files
- `server/index.ts` - Server entry, DB setup, table creation with ALTER TABLE migrations
- `server/routes.ts` - API routes (auth, restaurants, orders, drivers CRUD, chat, wallet, finance, CSV export, file upload, driver onboarding/verification)
- `server/storage.ts` - Database operations (IStorage interface with finance & dashboard stats)
- `server/db.ts` - Drizzle DB connection
- `server/seed.ts` - Initial data seeding (restaurants, menu items, admin + drivers)
- `server/vite.ts` - Vite dev server middleware
- `shared/schema.ts` - Database schema + types (users, restaurants, menuItems, orders, notifications, chatMessages, walletTransactions, finances)
- `client/src/App.tsx` - Main router (role-based routing with driver verification gate)
- `client/src/lib/auth.tsx` - Auth context (sessionStorage-based role detection per tab)
- `client/src/lib/queryClient.ts` - Query client, apiRequest, authFetch (all include X-User-Role header)
- `client/src/lib/cart.tsx` - Cart context
- `client/src/lib/websocket.ts` - WebSocket client

## Database Tables
- **users**: email, password, name, phone, role, isBlocked, vehicleType, vehiclePlate, driverLicense, commissionRate, lat/lng, walletBalance, loyaltyPoints, sex, dateOfBirth, fullAddress, idPhotoUrl, profilePhotoUrl, verificationStatus, rejectedFields
- **restaurants**: name, description, cuisine, image, address, rating, deliveryTime, deliveryFee, minOrder, lat/lng, phone, openingHours
- **menu_items**: restaurantId, name, description, price, image, category, isAvailable, popular
- **orders**: orderNumber, clientId, restaurantId, driverId, status, items, subtotal, deliveryFee, commission, total, paymentMethod, paymentStatus, deliveryAddress, deliveryLat/Lng, rating, feedback, estimatedDelivery
- **finances**: type (revenue/expense), category, amount, description, orderId, userId, reference
- **notifications**, **chat_messages**, **wallet_transactions**

## Driver Onboarding & Verification
- Admin creates driver accounts (basic: email, password, name, phone)
- New drivers get `verificationStatus: "not_started"`
- On first login, driver sees onboarding form (NOT the dashboard)
- Driver fills: full name, sex, date of birth, full address, email, phone, profile photo (required), ID photo (required)
- After submission, verificationStatus becomes "pending" and driver sees waiting screen
- Admin reviews on `/admin/verifications` page, can approve or reject specific fields
- If rejected, driver sees only the rejected fields editable, re-submits
- Once approved (verificationStatus: "approved"), driver accesses full app
- WebSocket pushes verification_approved/verification_rejected events in real-time
- Existing drivers (seeded) are pre-set to "approved"

## Guest Browsing & Auth
- Non-authenticated users can browse restaurants, menus, and add to cart
- Login/registration is required only at checkout (inline AuthGate component)
- ClientNav adapts: shows "Connexion" button for guests, full nav for logged-in users
- Driver/admin self-registration is blocked both client-side (no role selector) and server-side (403 response)
- Three separate login pages:
  - `/login` - Client (login + registration, red gradient)
  - `/driver/login` - Driver (login only, dark gradient, admin-created accounts notice)
  - `/admin/login` - Admin (login only, dark slate gradient, dashboard access)
- Backend enforces `expectedRole` on login: rejects mismatched roles with clear error messages

## Pages
### Client
- HomePage - Restaurant listing, search, categories, promo (guest accessible)
- RestaurantPage - Menu with categories, add to cart (guest accessible)
- CartPage - Cart management (guest accessible)
- CheckoutPage - Address, payment selection, order placement (auth required - inline auth gate)
- OrdersPage - Order history
- TrackingPage - Real-time order tracking
- WalletPage - Wallet balance, top-up, transaction history

### Driver
- DriverOnboarding - First-login profile completion + waiting screen (gates unverified drivers)
- DriverDashboard - Online/offline toggle, GPS location broadcasting, available/active orders, earnings, countdown timers, alarm overlay
- DriverOrders - Delivery history
- DriverEarnings - Revenue tracking
- DriverChat - Chat with admin

### Admin Dashboard
- AdminDashboard - KPIs, recent orders, performance metrics
- AdminOrders - Order management with status/driver assignment
- AdminDrivers - 3-column layout: driver details (left), real-time map (center), driver list (right). CRUD, block, alarm, quick chat, countdown timers
- AdminRestaurants - Restaurant management
- AdminCustomers - Customer management, wallet/points
- AdminChat - Messaging with clients and drivers
- AdminFinance - Revenue/expense tracking, category breakdown, daily chart, CSV export
- AdminSettings - App configuration
- AdminVerifications - Review driver onboarding submissions, approve or reject fields individually

## Chat System
- Admin ↔ Driver: Admin can message any driver from AdminChat (dynamic contact list). Driver has dedicated chat page (/driver/chat) to message admins.
- Client → Admin: Floating "Contactez-nous" bubble on client pages with live chat and structured complaint form (predefined subjects).
- Real-time: WebSocket notifications + polling fallback. Unread message counts shown per contact.
- Security: All chat endpoints enforce session ownership (users can only access their own messages/unread counts). Sender ID validated against session.

## API Endpoints
- POST /api/auth/login, /api/auth/register, /api/auth/logout, GET /api/auth/me
- POST /api/upload (file upload, auth required)
- POST /api/driver/onboarding (driver profile completion)
- GET /api/admin/verifications (pending/rejected drivers)
- POST /api/admin/verify/:driverId (approve/reject with field-level rejection)
- CRUD /api/restaurants, /api/restaurants/:id/menu, /api/menu-items
- GET/POST/PATCH /api/orders, POST /api/orders/:id/rate
- GET/POST/PATCH/DELETE /api/drivers, PATCH /api/drivers/:id/block, /api/drivers/:id/location, /api/drivers/:id/status, POST /api/drivers/:id/alarm
- GET/POST /api/finance, GET /api/finance/summary, GET /api/finance/export (CSV)
- GET /api/orders/export (CSV)
- GET /api/dashboard/stats
- GET/POST /api/notifications, /api/wallet
- Chat: GET /api/chat/contacts/:userId, GET /api/chat/users-by-role/:role, GET /api/chat/unread/:userId, PATCH /api/chat/read/:senderId/:receiverId, GET /api/chat/:userId1/:userId2, POST /api/chat

## Accounts (seed data)
- Admin: admin@maweja.cd / admin123
- Drivers: driver1-4@maweja.cd / driver123 (pre-approved)

## Payment Methods
Mobile Money, Cash, Illico Cash, Wallet MAWEJA, Points de fidelite, Carte Bancaire
