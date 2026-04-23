# MAWEJA - Systeme de Livraison Kinshasa

## Overview
MAWEJA is a production-grade food and service delivery platform designed for Kinshasa, RDC. It features three distinct interfaces: Client, Driver, and Admin Dashboard. The platform aims to be an Uber-style delivery service, providing real-time driver tracking and a comprehensive system for managing orders, services, and logistics. MAWEJA seeks to become the leading delivery service in Kinshasa, offering a reliable and feature-rich platform to connect customers with food establishments and essential services, designed for scalability to capture a significant share of the on-demand delivery market.

**Key Capabilities:**
- Real-time order tracking and driver location via Leaflet maps.
- Multi-role support: Client for ordering food and requesting services, Driver for deliveries, and Admin for comprehensive management.
- Internationalization (French/English) across all interfaces.
- Integrated service catalog and request system alongside food delivery.
- Robust financial tracking, marketing analytics, and driver verification workflows.

## User Preferences
- I prefer simple language.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.

## System Architecture
**Core Technologies:**
- **Backend**: Express.js, PostgreSQL, WebSocket
- **Frontend**: React, Vite, Tailwind CSS 3
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSockets for notifications, chat, live updates, and driver location.
- **Mapping**: Leaflet with react-leaflet v4 and OpenStreetMap tiles.
- **State Management**: TanStack React Query and Context API.
- **Client-side Routing**: Wouter.
- **File Storage**: Replit Object Storage (Google Cloud Storage) for persistent uploads. Multer receives files locally, then `uploadToCloudStorage()` copies them to the cloud bucket and returns `/cloud/public/uploads/filename` paths. The `/cloud/{*cloudPath}` Express route serves files from the bucket. Legacy `/uploads/` paths still served from local disk for backward compatibility. Admin Gallery has "Migrate to Cloud" button to batch-migrate existing local files. At startup, `syncLocalUploadsToCloud()` auto-uploads local images to cloud and migrates DB URLs from `/uploads/` to `/cloud/public/uploads/`. Seed preserves existing cloud URLs (won't overwrite `/cloud/` paths).

**UI/UX Decisions:**
- **Branding**: App Name: MAWEJA. Primary color: Red (#dc2626) with white accents.
- **Admin Dashboard**: Desktop-first layout with a fixed sidebar and content area, responsive breakpoints for grids.
- **Client/Driver Apps**: Mobile-first design, optimized for 375px–430px screens, with sticky headers and fixed bottom navigation.
- **Internationalization**: Full French/English support with language selection at first visit for clients/drivers and a dropdown for admins.
- **Theming**: Dark mode support (Auto/Light/Dark) via `localStorage` and `window.matchMedia`, utilizing Tailwind CSS dark mode classes.
- **Favicons**: Dynamic favicons based on user role (original for client, black-tinted for driver, red-tinted for admin).

**Feature Specifications & Implementations:**
- **Authentication**: Session-based with separate cookies for Admin, Driver, and Client roles. Guest browsing allowed, login enforced at checkout.
- **Driver Onboarding & Verification**: Multi-step process with admin creation, driver profile completion, and admin review/approval via WebSockets.
- **Service Catalog**: Dynamic categories and items managed by admin, client browsing and quote requests.
- **Chat System**: Real-time messaging between Admin ↔ Driver and Client → Admin with structured complaint forms.
- **Order Management**: Comprehensive lifecycle including creation, status updates, driver assignment, real-time tracking, cancellation with refunds, and audit logs. Includes "returned" status with automated refunds.
- **Payment Methods**: Supports Cash, Mobile Money, Wallet, Google Pay, POS, IllicoCash, and Credit Card.
- **Loyalty Program & Promos**: Loyalty points and dynamic promo codes with expiration, usage limits, and minimum order thresholds. Promotions can be restaurant-specific.
- **Location & Addresses**: Leaflet map with draggable markers, Nominatim reverse geocoding, and saved address management.
- **Marketing & Analytics**: Admin dashboard with KPIs, revenue/order trends, top products, payment breakdowns, client segmentation, and driver performance analytics. Includes advanced analytics with market share, client behavior, retention, and alerts.
- **Notifications**: Browser push notifications and WebSocket-driven system for real-time updates and targeted broadcasts.
- **Settings**: Client and Driver apps include modals for notification preferences, privacy policy, contact support, and app information. Admin settings are configurable via API.
- **Admin Granular Permissions**: Checkbox-based per-menu permissions system replaces fixed role presets for sub-admin accounts.
- **Media Management**: Admin "Galerie Médias" for managing uploaded files, integrating with ads, restaurants, and services.
- **Restaurant Categorization**: Dynamic restaurant categories with emoji picker, replacing hardcoded food filters. Includes "Promos" category for restaurants with active discounts.
- **Boutiques/Commerces System**: Restaurants table has a `type` field (`"restaurant"` | `"boutique"`) for distinguishing stores. Separate `boutique_categories` table and CRUD API at `/api/boutique-categories`. Admin pages for boutiques management (reuses AdminRestaurants with storeType prop) and boutique category management. Client-side BoutiquesPage at `/boutiques` with search and category filtering. API supports `?type=` query parameter for filtering.
- **Delivery Zones**: Fully dynamic zone-based delivery pricing managed from admin dashboard. Zones stored in `delivery_zones` DB table with name, fee (USD), color, neighborhoods (jsonb array), isActive, sortOrder. Admin page at `/admin/delivery-zones` with Leaflet map-based neighborhood selection (click map → reverse geocode → add neighborhood) and manual text entry. CRUD API at `/api/delivery-zones`. Zone detection via `detectZone(address, zones[])` in `shared/deliveryZones.ts` matches address against zone neighborhoods. Default seeded zones: Zone A ($1.50), Zone B ($2.50), Zone C ($4.00). Out-of-zone addresses block checkout with warning. Zone name stored in `delivery_zone` column on orders. Zone badge shown on Cart, Checkout, Order Detail, Tracking, Admin Orders, and Driver views. Service fee also configurable from admin settings.
- **Loyalty Points**: 1 point = $0.001. Gain: 10 points per $1 spent (1% cashback). Points can be applied at checkout to reduce total.
- **Fixed Service Fee**: A flat $0.76 service fee replaces percentage-based tax per order.
- **Monetary Values**: All monetary columns use DOUBLE PRECISION (not integer). All prices stored in USD. `formatPrice()` displays 2 decimal places. `formatPaymentMethod()` in `client/src/lib/utils.ts` provides consistent icon+label display for all payment methods across all views (admin, driver, client).
- **Editable Recipient**: Checkout allows editing recipient name and phone for gifting or ordering for others.
- **Progressive Order Status**: Order statuses follow an irreversible sequence `pending→confirmed→preparing→ready→picked_up→delivered`. Non-general admins can only advance forward; cancellation/return always allowed. General admins (superadmin or no permissions set) bypass restrictions. Backend validates via `canTransitionStatus()` in server/routes/orders.routes.ts.
- **Custom Form Fields per Service Category**: `service_categories.custom_fields` (jsonb) stores an array of field definitions (text, number, select, textarea, photo, date) with labels, placeholders, required flag, and options. Admin builds fields via drag-and-drop form builder in category modal. Client `ServiceRequestPage` renders fields dynamically and submits values in `additionalInfo` as `[CustomFields:JSON]` pattern. Admin detail modal parses and displays them.
- **Service Request Admin View**: Detail modal shows contactMethod with colored icon (WhatsApp green, email blue, phone red), phone number prominently, and extracts/displays catalog photos from `[Image: URL]` in additionalInfo.

## Client Mobile Design System (Premium Refonte)
A complete mobile-first design system was built for all client-facing pages:

**New file `client/src/components/client/ClientUI.tsx`** — reusable mobile components:
- `MBtn` — mobile button (primary/secondary/ghost/danger/outline), 3 sizes, loading state
- `MCard` — mobile card wrapper (rounded-[20px], subtle shadow, dark mode)
- `MSectionHeader` — section title with optional action link
- `MBadge` — status badge with animated dot (red/green/amber/blue/cyan/gray variants)
- `MPill` — filter pill (active/inactive, red accent when active)
- `MEmptyState` — full empty state with icon, title, description, action button
- `MPageHeader` — sticky page header with back button, title, subtitle, action slot
- `MTabBar` — segmented tab control
- `SkeletonPulse` — animated skeleton placeholder
- `RestaurantCardSkeleton`, `SmallCardSkeleton` — skeleton loaders for card grids
- `RestaurantCard` — unified card with cover image, logo, rating, delivery time, promo badge
- `BoutiqueCard` — compact card for horizontal scroll (148px wide)
- `PromoCard` — promotion card with PROMO badge overlay (162px wide)
- `ServiceCategoryItem` — service category chip with image/emoji, active ring
- `BottomSheet` — premium bottom sheet with handle, backdrop blur, slide-up animation
- `ORDER_STATUS` — centralized order status config (label + badge variant)

**Design tokens:** `bg-[#f4f4f4]` / `bg-[#0a0a0a]` backgrounds, `bg-white` / `bg-[#141414]` surfaces, `#E10000` red accent, `rounded-[20px]` cards, `rounded-[16px]` inputs.

**Refactored pages:**
- **`ClientNav.tsx`** — 4-tab bottom nav (Accueil, Commandes, Wallet, Profil), premium indicator bar at top of active item, improved address pill, scroll-mode compact search bar
- **`HomePage.tsx`** — inline search bar, services grid (2-row scroll), promo section, boutiques with category pills, restaurants with food-type pills, skeleton loaders, empty state
- **`OrdersPage.tsx`** — active orders banner, MTabBar for active/history, OrderCard with progress bar and status badge, empty states per tab
- **`WalletPage.tsx`** — hero gradient wallet card with balance, loyalty progress bar, credits list, quick stats grid, transaction history with skeleton
- **`CartPage.tsx`** — MCard sections, qty stepper, delivery zone warning, sticky checkout CTA with gradient, slide-up confirm modal
- **`TrackingPage.tsx`** — delivery ETA hero, vertical tracking steps with line connector, driver card with call/chat, order summary, delivered state
- **`ClientSettings.tsx`** — background updated to match new design tokens

**CSS animation added:** `slideInUp` (for bottom sheets and modals)

## Driver/Agent App Design System (Premium Refonte)
A complete field-optimized dark design system was built for all driver-facing pages:

**New file `client/src/components/driver/DriverUI.tsx`** — reusable agent components:
- `dt` — Design tokens: `bg:#0e0e0e`, `surface:#191919`, `surface2:#222222`, `surface3:#2c2c2c`, `accent:#E10000`, semantic colors (green=accept/delivered/online, orange=transit, amber=pending, blue=new order, red=refuse/urgent)
- `DBtn` — field action button with variants: `accept` (green), `refuse` (red outline), `amber`, `blue`, `deliver` (green gradient), `secondary` (ghost), `accent` (red). Sizes: sm/md/lg/xl (56px+ for primary actions)
- `DCard` — dark surface card with subtle border, optional tap handler
- `DStatCard` — compact metric card with icon + color accent
- `DSectionHeader` — section title with badge count and optional action
- `DStatusBadge` — status badge with color/bg per status (dark-optimized)
- `DEmptyState` — dark empty state component
- `DSkeletonCard` — dark skeleton loader
- `DInfoRow` — icon + label + value row with optional tap-to-call
- `DPaymentBadge` — payment method indicator (cash vs mobile, prominent for field use)
- `DRIVER_STATUS` — centralized status config map

**Design philosophy:** Dark-first (AMOLED-friendly), high contrast for outdoor readability, 56px+ touch targets, color-coded actions, payment method ultra-visible, address readable without truncation.

**Refactored pages:**
- **`DriverNav.tsx`** — 5-tab dark bottom nav (Accueil/Livraisons/Chat/Gains/Profil), glass header with MAWEJA AGENT badge, status pill with pulse animation, red accent top bar indicator
- **`DriverDashboard.tsx`** — Scenario-based layout (offline/waiting/active), alarm overlay with sound+vibration, countdown timer, GPS live map toggle, ActiveMissionCard with next-action button, PendingOrderCard queue
- **`DriverOrders.tsx`** — 3-tab dark order list (En cours/Livrés/Tous), dark stats bar, OrderCard with status icons, DetailSheet bottom sheet for delivered orders
- **`DriverEarnings.tsx`** — Period filter pills (Today/Week/Month/Custom), hero gains card, 4-stat grid, earnings history list with payment icons
- **`DriverRapport.tsx`** — Period filter, 4 KPI cards, daily breakdown grouped by day with order list
- **`DriverSettings.tsx`** — Profile card with role badge, dark ThemePicker, language toggle, menu items with icons, all modals updated to dark BottomSheet pattern, logout button
- **`DriverOrderDetail.tsx`** — Full dark theme, StatusTimeline (dark), large action buttons (DBtn xl), prominent payment badge, agent earnings card, refuse modal (dark)

## Admin Design System (Premium Refonte)
A complete premium SaaS-grade design system was built for all 20+ admin pages:

**New components in `client/src/components/admin/`:**
- **`AdminUI.tsx`** — Full design system: `KPICard` (animated stats), `SectionCard` (card wrapper), `AdminBadge` (status chips), `DrawerPanel` (slide-in side drawer), `EmptyState`, `FilterChip`, `AdminSearchInput`, `AdminBtn` (primary/secondary/ghost/danger variants), `AdminProgressBar`, `SortableCol`, `SkeletonRows`, `LiveDot`, `AnimatedNumber`, `AdminPageHeader`
- **`index.ts`** — Re-exports all design tokens and components

**Design tokens (Zinc palette):**
- Background: `bg-zinc-50 dark:bg-zinc-950`
- Cards: `bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800`
- Accent: `rose-600` (#E11D48) used sparingly for active states, CTAs, and alerts
- Typography: `font-black` for headlines, `font-semibold` for labels, `text-zinc-500` for muted

**Rewritten components:**
- **`AdminSidebar.tsx`** — Compacted to 240px. Cleaner section labels, zinc-based palette, rose accent on active items, user card at bottom with gradient avatar
- **`AdminLayout.tsx`** — New premium TopBar with: global search (expands on focus, Enter navigates), ThemeToggle, Language selector dropdown, Profile dropdown (navigate to profile/settings/guide, logout)
- **`AdminDashboard.tsx`** — Full redesign: new KPI cards grid, premium notifications panel (slide-in drawer), dark revenue hero card, quick actions grid, recent orders table with EmptyState
- **`AdminOrderDetailPopup.tsx`** — Converted from centered modal to slide-in `DrawerPanel`. Uses `AdminBadge`, `InfoBlock` pattern

**Partially updated (design system imports):**
- **`AdminOrders.tsx`** — Filter chips → `FilterChip`, action buttons → `AdminBtn`, empty state → `EmptyState`

**Animations added to `index.css`:** `slideInRight`, `slideInDown`, `fadeUp` — used for drawers, dropdowns, and notification toasts.

## Backend Modular Architecture
The monolithic `server/routes.ts` (2888 lines) has been fully replaced by a modular structure:

- **`server/routes.ts`** — thin re-export wrapper (`export { registerRoutes } from "./routes/index"`)
- **`server/routes/index.ts`** — orchestrator: runs cloud sync, registers all routers, creates HTTP server, sets up WebSocket
- **`server/websocket.ts`** — WS server setup, `wsClients` Map, `broadcast()`, `sendToUser()`
- **`server/middleware/auth.middleware.ts`** — `requireAuth`, `requireAdmin`, `resolveUserFromRequest`
- **`server/middleware/upload.middleware.ts`** — multer instances, `uploadToCloudStorage()`, `cleanupChatFiles()`
- **`server/lib/cloudSync.ts`** — `normalizeUploadUrls()`, `syncLocalUploadsToCloud()` startup routines
- **Route modules** (all in `server/routes/`):
  - `auth.routes.ts` — login, register, logout, forgot-password, reset, upload, /cloud/* proxy, /uploads static
  - `drivers.routes.ts` — onboarding, verification, CRUD, block, location, status, alarm, driver-register
  - `restaurants.routes.ts` — restaurants, menu items, categories (restaurant/boutique/menu-item), saved addresses, promos
  - `delivery-zones.routes.ts` — GET /api/delivery-zones (public), POST/PATCH/DELETE (admin-only) — full dynamic zone CRUD
  - `orders.routes.ts` — full order lifecycle: create (zone detect, finance entries, loyalty), update (driver payout, loyalty credit, audit log), accept/refuse, status-override, cancel, modify, remarks, rate, export CSV
  - `chat.routes.ts` — messages, contacts, unread counts, file upload
  - `wallet.routes.ts` — loyalty credits, wallet history, top-up
  - `notifications.routes.ts` — per-user, mark-read, broadcast with segmentation
  - `services.routes.ts` — service categories, catalog items, service requests CRUD
  - `marketing.routes.ts` — analytics, client segments, advertisements, promo banner, finance, restaurant payouts
  - `admin.routes.ts` — password reset requests, settings, users, admin accounts, media gallery, cloud migration

## Security Architecture
- **Password Hashing**: All passwords hashed with bcrypt (12 rounds) via `bcryptjs`. Login uses `verifyPassword()` with transparent migration: plaintext passwords auto-rehashed on first login. `server/auth.ts` centralizes all auth utilities.
- **On-startup migration**: At boot, any remaining plaintext passwords (stored before the refactor) are detected (`NOT LIKE '$2%'`) and bulk-rehashed automatically.
- **SESSION_SECRET**: Required in production (`NODE_ENV=production`); process exits with FATAL error if missing. Dev uses a non-secret fallback.
- **WebSocket Auth**: All WS connections require `?token=BEARER_TOKEN` validated against DB `authToken`. Connections without a valid token are closed with code 1008. Client sends token from `getAuthToken()` stored in `queryClient.ts`.
- **Logout token revocation**: `/api/auth/logout` nulls `authToken` in DB for both session-based and Bearer-token-based sessions.
- **Rate limiting** (`express-rate-limit`): Login (10/15 min), Register (10/15 min), Forgot-password (5/15 min), Upload endpoints (30/10 min), Wallet topup (20/10 min).
- **Route ownership checks**: `PATCH /api/users/:id` enforces self-only or admin access and always hashes password changes. `GET /api/chat/contacts/:userId` enforces self-only or admin. `GET /api/wallet/:userId` enforces self-only or admin.
- **Zod Validation (COMPLETE)**: All mutating routes (POST/PATCH/PUT) are guarded by Zod middleware from `server/validators.ts`. Three middlewares: `validate(schema)` for body (replaces `req.body` with coerced data, returns HTTP 422 `{errors:[{field,message}]}`), `validateParams(schema)` for URL params, `validateQuery(schema)` for query strings. All domain schemas centralized in `server/validators.ts` under `schemas.*` namespace. Raw `req.body` is never passed directly to DB — every write route parses through a named schema first. POST `/api/drivers` now also hashes the password via bcrypt (was plaintext before). POST `/api/auth/driver-register` also has `registerLimiter` rate limit applied.

## External Dependencies
- **Mapping Service**: OpenStreetMap (via Leaflet and react-leaflet).
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM.
- **File Uploads**: Multer.
- **Charting Library**: Recharts (for admin analytics).
- **Geocoding**: Nominatim (for reverse geocoding).
- **Payment Gateways**: Integration points for Mobile Money (M-Pesa/Orange Money/Airtel), Google Pay, POS systems, IllicoCash, and Credit Card processing.
## Push Notifications (FCM/APNs)
- **Backend**: `server/lib/push.ts` — Firebase Admin SDK lazy-initialized from one of: `FIREBASE_SERVICE_ACCOUNT_JSON` (raw JSON), `FIREBASE_SERVICE_ACCOUNT_BASE64`, or `GOOGLE_APPLICATION_CREDENTIALS` (file path). Silent no-op if not configured.
- **DB**: `users.push_token` + `users.push_platform` columns store the device FCM/APNs token. Auto-cleaned on token-not-registered errors.
- **Routes**: `POST /api/push/register-token`, `POST /api/push/unregister-token` (`server/routes/push.routes.ts`).
- **Auto-fanout**: `storage.createNotification()` automatically calls `sendPushToUser()` (non-blocking). So every in-app notification (new order, chat message, status change, password reset, etc.) is also a native push if Firebase is configured + user has registered a token.
- **Mobile init**: `client/src/lib/pushNotifs.ts` — dynamic import of `@capacitor/push-notifications` (hidden from Vite scanner). Called from `App.tsx` on user login. Requests permission, registers with FCM/APNs, posts token to backend. Tap-action navigates to `/tracking/:orderId` if `data.orderId` present.
- **Required mobile config (per app)**:
  - Android: place `google-services.json` (from Firebase console) at `mobile/{client,driver}/android/app/google-services.json`, then `npx cap sync android` from each mobile sub-project.
  - iOS: enable Push Notifications + Background Modes (remote notifications) capability in Xcode; upload APNs auth key (.p8) to Firebase Cloud Messaging settings; `npx cap sync ios`.
- **Required backend secret**: `FIREBASE_SERVICE_ACCOUNT_JSON` — paste the full service account JSON downloaded from Firebase Console > Project Settings > Service Accounts > Generate new private key.
