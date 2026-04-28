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
  - `wallet.routes.ts` — loyalty credits, wallet history. **Top-up admin-only** (`POST /api/wallet/topup` retourne `403 WALLET_TOPUP_DISABLED` pour tout non-admin) car il créditait jusqu'ici instantanément sans vérification de paiement (faille de self-credit). En attendant l'intégration d'un vrai gateway Mobile Money, seul un admin peut créditer un wallet manuellement après vérification du paiement. Les points de fidélité continuent de s'accumuler automatiquement à chaque commande. Côté UI client (`WalletPage`/`WalletHero`) : bouton « Recharger » remplacé par un badge « Bientôt » qui affiche un toast informatif ; `TopupSheet` n'est plus monté.
  - `notifications.routes.ts` — per-user, mark-read, broadcast with segmentation
  - `services.routes.ts` — service categories, catalog items, service requests CRUD
  - `marketing.routes.ts` — analytics, client segments, advertisements, promo banner, finance, restaurant payouts
  - `admin.routes.ts` — password reset requests, settings, users, admin accounts, media gallery, cloud migration

## Security Architecture
- **Password Hashing**: All passwords hashed with bcrypt (12 rounds) via `bcryptjs`. Login uses `verifyPassword()` with transparent migration: plaintext passwords auto-rehashed on first login. `server/auth.ts` centralizes all auth utilities.
- **On-startup migration**: At boot, any remaining plaintext passwords (stored before the refactor) are detected (`NOT LIKE '$2%'`) and bulk-rehashed automatically.
- **SESSION_SECRET**: Required in production (`NODE_ENV=production`) **and must be at least 32 characters**; process exits with FATAL error if missing or too short. Dev uses a non-secret fallback.
- **WebSocket Auth**: All WS connections require `?token=BEARER_TOKEN` validated against DB `authToken`. Connections without a valid token are closed with code 1008. Client sends token from `getAuthToken()` stored in `queryClient.ts`.
- **Logout token revocation**: `/api/auth/logout` nulls `authToken` in DB for both session-based and Bearer-token-based sessions.
- **Rate limiting** (`express-rate-limit`): **Global** `apiGlobalLimiter` (200 req/min/IP) on every `/api/*` route, applied in `server/index.ts` after session middleware. Per-endpoint limiters stack on top: Login (10/15 min), Register (10/15 min), Forgot-password (5/15 min), Upload endpoints (30/10 min), Wallet topup (20/10 min). All return HTTP 429 with FR message and standard `RateLimit-*` headers.
- **Route ownership checks**: `PATCH /api/users/:id` enforces self-only or admin access and always hashes password changes. `GET /api/chat/contacts/:userId` enforces self-only or admin. `GET /api/wallet/:userId` enforces self-only or admin.
- **Zod Validation (COMPLETE)**: All mutating routes (POST/PATCH/PUT) are guarded by Zod middleware from `server/validators.ts`. Three middlewares: `validate(schema)` for body (replaces `req.body` with coerced data, returns HTTP 422 `{errors:[{field,message}]}`), `validateParams(schema)` for URL params, `validateQuery(schema)` for query strings. All domain schemas centralized in `server/validators.ts` under `schemas.*` namespace. Raw `req.body` is never passed directly to DB — every write route parses through a named schema first. POST `/api/drivers` now also hashes the password via bcrypt (was plaintext before). POST `/api/auth/driver-register` also has `registerLimiter` rate limit applied.
- **Unified server logging**: All server runtime modules — `server/routes/*`, `server/replit_integrations/object_storage/*`, `server/middleware/upload.middleware.ts`, `server/lib/cloudSync.ts`, `server/index.ts`, `server/websocket.ts` — route errors and informational messages through the central `logger` from `server/lib/logger.ts`. **Zero `console.log/warn/error/info` direct calls** remain in those modules. Only three exceptions are intentionally kept on `console.*`: `server/lib/logger.ts` (the logger's own implementation), `server/vite.ts` (it implements Vite's `Logger` interface signature), and `server/seed.ts` (one-off CLI seed script).
- **WebSocket cleanup + heartbeat observability**: `setupWebSocket()` schedules a 60s `setInterval` that walks `wsClients`, removes entries whose `readyState` is no longer `OPEN`/`CONNECTING` (prevents the map growing unbounded when clients drop without firing `close`), and **always** logs `[ws] heartbeat: N active connection(s)` via `logger.info` — even when no removals happen — for steady production visibility. Note: `logger.info` was updated to emit in both dev and prod (previously dev-only) so operational/heartbeat lines stay visible in production logs.

## Phase 2 Security Hardening (April 27, 2026)
- `npm audit fix` (non-breaking) applied; then two targeted package changes:
  - `drizzle-orm` upgraded `^0.39.3 → ^0.45.2` to fix high-severity SQL injection CVE GHSA-gpj5-g38j-94v9. Fully backward-compatible with our typed query builder usage; `npm run check` passes.
  - `xlsx` removed entirely (was declared in `package.json` but had **0 imports** in the codebase). This eliminates two high-severity SheetJS CVEs (GHSA-4r6h-8v6p-xvw6 prototype pollution + GHSA-5pgg-2g8v-p4x9 ReDoS) for which no upstream fix exists.
- **Final audit state: 0 critical, 0 high, 9 moderate, 2 low** (all moderate/low are transitive deps — `@google-cloud/firestore/storage`, `firebase-admin`, `exceljs`, `gaxios`, `google-gax`, `retry-request`, `teeny-request`, `uuid`, `@tootallnate/once`, `http-proxy-agent` — all blocked behind semver-major upgrades of `firebase-admin`/`@google-cloud/storage`/`exceljs`. None affect our request handling and are deferred to a future dependency sweep).
- **DB password audit**: SQL `SELECT id, email, role FROM users WHERE password NOT LIKE '$2%' OR password IS NULL` returned **0 rows** at the start of Phase 2 — startup auto-migration (`server/index.ts`) had already converted any legacy plaintext to bcrypt on prior boots.

## Tests (Vitest)
Phase 5 ajoute une couverture minimale automatisée pour bloquer les régressions critiques sans alourdir la maintenance.

**Stack** : `vitest` + `supertest` (devDeps installées). Aucun script `npm test` dédié — lancer avec `npx vitest run` (ou `npx vitest` en mode watch). Config dans `vitest.config.ts` (alias `@`, `@shared`, `@assets`, env Node, pool fork). CI : `.github/workflows/test.yml` exécute `npx vitest run` sur chaque push/PR `main`.

**Structure du dossier `tests/`** :
- `tests/storage.mock.ts` — `MemoryStorage` qui implémente `IStorage` en mémoire (réinitialisable via `.reset()`). Sert de double pour les routes sans toucher à PostgreSQL.
- `tests/validators.test.ts` — pour chaque entrée de `schemas` (50 schémas + 4 sous-schémas `params`) : 1 test "happy path" + 1 test "rejet". Un test global vérifie qu'aucun schéma n'est ajouté sans fixture (lock-step avec `server/validators.ts`).
- `tests/routes.integration.test.ts` — couverture des endpoints critiques : `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/orders`, `POST /api/wallet/topup`, `POST /api/push/register-token`. Chaque endpoint testé pour : auth manquante (401), body invalide (422), erreur métier (400/403/404), succès (200). Tous les modules à effets de bord (`storage`, `db`, `websocket`, `cloudSync`) sont mockés via `vi.mock`.

**Ajouter un nouveau test de schéma** : éditer `tests/validators.test.ts` et ajouter une entrée dans `happyFixtures` + `rejectFixtures` avec la même clé que dans `schemas`. Le test global "every schema key has both a happy and a reject fixture" échouera si vous oubliez l'un des deux.

**Ajouter un test de route** : copier l'un des `describe` de `tests/routes.integration.test.ts`, seeder l'état nécessaire via `memoryStorage.createUser/createRestaurant/...` puis utiliser `request(app).post(...).set("Authorization", "Bearer <TOKEN>")`. Le `beforeEach` réinitialise déjà le mock entre chaque test.

**Hors scope** (à faire séparément si besoin) : E2E (Playwright/Cypress), tests UI React (RTL), couverture exhaustive des 143 endpoints, tests WebSocket temps réel.

## TypeScript Build Configuration
`tsconfig.json` now has `noEmit: true` (with `declaration/declarationMap/sourceMap: false`). The previous setup regenerated thousands of `.js`/`.d.ts`/`.map` files inside `client/src`, `server/`, and `shared/` every time `npm run check` ran (or the LSP/vite triggered tsc). The build pipeline uses **vite** for the client and **esbuild** for the server (see `npm run build`), so tsc only needs to type-check, not emit. This keeps the working tree clean.

## Repo Hygiene (Phase 1 — April 27, 2026)
The codebase previously contained a hybrid setup (a legacy Expo prototype layered on top of the current MAWEJA Capacitor app). Phase 1 cleaned the repo:

**Removed legacy Expo vestiges (root):**
- `app.json`, `eas.json`, `capacitor.config.ts` (root duplicate — only `mobile/{client,driver}/capacitor.config.ts` are used by CI)
- `assets/`, `.expo/`, `ios/` (root)
- All Expo/React Native npm dependencies (15 packages: `expo`, `expo-router`, `react-native`, `@react-navigation/native-stack`, etc.)

**Removed unused npm packages (48 total):**
- All 27 `@radix-ui/*` packages (0 imports — shadcn was never wired)
- `cmdk`, `class-variance-authority`, `embla-carousel-react`, `vaul`, `next-themes`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `tw-animate-css`
- `@hookform/resolvers`, `react-hook-form`, `@uppy/dashboard`
- `passport`, `passport-local`, `memorystore`, `puppeteer`, `@babel/core`, `@octokit/rest`, `sharp`, `zod-validation-error`
- Type packages: `@types/passport`, `@types/passport-local`

**Removed heavy/binary artifacts (>320 MB freed):**
- `attached_assets/*` (179 MB of Replit chat drafts), `exports/` (79 MB), `dist/` (26 MB)
- `maweja-mobile.zip` (72 MB), `maweja-code.zip` (13 MB)
- Obsolete splash assets: `client/{public,src/assets}/maweja-splash.{gif,mp4}`, `splash.mov`, `image_1772833363714.png` (Lottie `maweja-splash.json` is the only splash used)
- Marketing PDFs/PNGs at root (`MAWEJA_Presentation.*`, `dashboard_*.png`, `Facture-*.pdf`)
- Standalone docs: `MOBILE_BUILD.md`, `GITHUB_ACTIONS_BUILD.md`, `ANDROID_SPLASH_SETUP.md` (their content is consolidated into the sections below)

**`.gitignore` enriched:** new entries for `uploads/`, `attached_assets/*`, `exports/`, `*.zip`, `*.rar`, `.expo/`, root `app.json`/`eas.json`/`capacitor.config.ts`, marketing binaries — to prevent these from coming back.

**Kept (used by CI / runtime):**
- `mobile/{client,driver}/capacitor.config.ts` — used by `.github/workflows/build-{android,ios}.yml`
- `android/{app,client-icons,driver-icons}/` — referenced by build-android.yml for icon injection
- `client/src/assets/{maweja-splash.json,maweja-icon-512.png,logo.png}` — actively imported
- `guide-dashboard-maweja.html` — served by `server/routes/auth.routes.ts`
- `uploads/` — still served at `/uploads/*` for legacy order images (cloud-migrated images use `/cloud/*`)

## Mobile Build (Capacitor — Android & iOS)
Two mobile sub-projects share the web frontend through `vite.mobile.config.ts`:

| App | Package ID | Capacitor config | Android | iOS |
|-----|-----------|------------------|:-------:|:---:|
| MAWEJA (Clients) | `com.edcorp.maweja` | `mobile/client/capacitor.config.ts` | ✅ | ✅ |
| MAWEJA Driver (Livreurs) | `com.edcorp.maweja.driver` | `mobile/driver/capacitor.config.ts` | ✅ | ❌ |
| Admin Dashboard | — | (web only) | ❌ | ❌ |

**Local build prerequisites:** Node.js 20+, Java JDK 17, Android Studio (SDK 34 + build-tools 34) for Android; macOS + Xcode 15+ + CocoaPods for iOS.

**Local build flow (one-time init):**
```bash
cd mobile/client && npm install && npx cap add android && npx cap add ios
cd mobile/driver && npm install && npx cap add android   # iOS skipped — Driver = Android only
```

**Per-build:**
```bash
VITE_API_BASE_URL=https://maweja.net bash mobile/build-client.sh
VITE_API_BASE_URL=https://maweja.net bash mobile/build-driver.sh
# then: cd mobile/{client,driver} && npx cap open android   (or ios for client)
```

**Mobile env vars:** `VITE_MOBILE_MODE=client|driver`, `VITE_API_BASE_URL=https://maweja.net`.

**Keystores (Android signing) — never commit, never lose:**
```bash
keytool -genkey -v -keystore keystore/maweja-client.jks -alias maweja-client -keyalg RSA -keysize 2048 -validity 10000
keytool -genkey -v -keystore keystore/maweja-driver.jks -alias maweja-driver -keyalg RSA -keysize 2048 -validity 10000
```
`keystore/`, `*.jks`, `*.p12`, `*.mobileprovision`, `*.b64` are gitignored.

## Cloud Build (GitHub Actions)
Two workflows produce APK/IPA without local Android Studio / Xcode:
- **`.github/workflows/build-android.yml`** — Ubuntu runner, builds both Client and Driver APK/AAB (debug or release), injects icons from `android/{client,driver}-icons/` and Firebase `google-services.json` from `mobile/{client,driver}/firebase/`.
- **`.github/workflows/build-ios.yml`** — macOS runner, builds Client IPA only.

**Required GitHub Secrets:**
- All builds: `API_BASE_URL` (e.g. `https://maweja.net`).
- Android release: `CLIENT_KEYSTORE_BASE64`, `CLIENT_KEYSTORE_PASSWORD`, `CLIENT_KEY_ALIAS`, `CLIENT_KEY_PASSWORD` and equivalents `DRIVER_*` (encode `.jks` via `base64 -i file.jks -o file.b64`).
- iOS release: `IOS_CERTIFICATE_BASE64`, `IOS_CERTIFICATE_PASSWORD`, `IOS_PROVISION_PROFILE_BASE64`, `IOS_PROVISION_PROFILE_NAME`, `IOS_TEAM_ID`.

**Trigger:** GitHub → Actions → select workflow → Run workflow → choose `debug` or `release` → download artifact (~15-25 min Android, ~20-40 min iOS).

**Cost note:** GitHub Free = 2000 min/month Linux + 200 min/month macOS (macOS counts 10x).

## Android Splash Architecture (single splash)
- **Android 12+ (API 31+)**: native `windowSplashScreen` API with `splash_logo.png` on `#EC0000` red background (`values-v31/styles.xml`).
- **Android < 12**: `splash_screen.xml` layer-list drawable (red bg + centered logo) referenced by `AppTheme.Splash` in `values/styles.xml`.
- **Capacitor SplashScreen plugin**: `launchShowDuration: 0` → no second splash, no flicker.
- **Web splash**: Lottie `client/src/assets/maweja-splash.json` rendered by `client/src/components/SplashScreen.tsx`, plays inside the WebView on the same red background.

Resource layout per mobile project (`android/app/src/main/res/`): `values/{colors,styles}.xml`, `values-v31/styles.xml`, `drawable/{splash_screen.xml,splash_logo.png}`, `drawable-v31/splash_logo.png`, plus density-specific `drawable-{m,h,xh,xxh,xxxh}dpi/splash_logo.png`. Source assets live in `android/{client,driver}-icons/` and are injected by `build-android.yml`.

In `MainActivity.java/kt`, switch from splash theme to normal theme **before** `super.onCreate`:
```java
@Override protected void onCreate(Bundle s) { setTheme(R.style.AppTheme); super.onCreate(s); }
```
Set `android:theme="@style/AppTheme.Splash"` on the activity in `AndroidManifest.xml`.

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
- **Web init (admin dashboard)**: same `pushNotifs.ts` — when `!isCapacitor()` and Firebase Web is configured, calls `initWebPush()` which uses Firebase JS SDK (`firebase/messaging`). Registers `/firebase-messaging-sw.js` (in `client/public/`) with the config passed in query string (SW has no access to Vite env). Calls `getToken({ vapidKey })`, posts it with `platform: "web"` to `/api/push/register-token`. Foreground messages (`onMessage`) are shown via `registration.showNotification(...)`. Background/closed-tab messages are handled by the SW's `onBackgroundMessage` handler.
- **Firebase Web init module**: `client/src/lib/firebaseWeb.ts` — lazy `initializeApp` + `getMessaging`, returns `null` silently on Capacitor / unsupported browsers / missing config.
- **Required mobile config (per app)**:
  - Android: place `google-services.json` (from Firebase console) at `mobile/{client,driver}/android/app/google-services.json`, then `npx cap sync android` from each mobile sub-project.
  - iOS: enable Push Notifications + Background Modes (remote notifications) capability in Xcode; upload APNs auth key (.p8) to Firebase Cloud Messaging settings; `npx cap sync ios`.
- **Required backend secret**: `FIREBASE_SERVICE_ACCOUNT_JSON` — paste the full service account JSON downloaded from Firebase Console > Project Settings > Service Accounts > Generate new private key.
- **Required web env vars (admin push)**: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID` (optional), and `VITE_FIREBASE_VAPID_KEY` (Firebase Console > Project Settings > Cloud Messaging > Web push certificates). Public values exposed to the browser — store as env vars (not secrets).

## Production Hardening — Orders & Wallet (server/routes/orders.routes.ts)
Quatre garde-fous critiques côté backend, tous couverts par `tests/routes.integration.test.ts` :
1. **Wallet insuffisant** : `POST /api/orders` refuse en `400 INSUFFICIENT_WALLET_BALANCE` (avec `balance` + `required`) si `paymentMethod === "wallet"` et `walletBalance < total`. Le check précède la création de la commande — aucun débit ni écriture finance n'a lieu en cas de refus. Plus de soldes négatifs masqués via `Math.max(0, ...)`.
2. **Anti double-remboursement** : tous les chemins de refund (`PATCH /api/orders/:id` admin → cancelled/returned, `PATCH /api/orders/:id/cancel` client) utilisent le marqueur `paymentStatus === "refunded"` comme garde unique. Le snapshot `prevStatus` / `prevPaymentStatus` est capturé avant `storage.updateOrder(...)` pour garantir la décision sur l'état d'origine (immune aux mocks par référence et aux re-renders). Une seule transaction `walletTransactions(type=refund, orderId=...)` par commande. `paymentStatus` est mis à `"refunded"` immédiatement après le crédit.
3. **OrderNumber unique sous concurrence** : helper `createOrderWithUniqueNumber()` — boucle de retry (5 tentatives) qui combine (a) lecture du dernier numéro via `db.execute(SELECT…ORDER BY DESC LIMIT 1)`, (b) pré-check `storage.getOrderByNumber()` pour anticiper la collision en mémoire, et (c) catch des violations `UNIQUE` Postgres (code `23505`/`/unique|duplicate/i`) avec incrément + retry. La colonne `order_number` a déjà un `.unique()` constraint en base. En cas d'épuisement des retries : `500 ORDER_NUMBER_GENERATION_FAILED`.
4. **Transitions de statut cohérentes** : `canTransitionStatus()` durci — (a) bloque `currentStatus === newStatus` (defense in depth), (b) bloque toute mutation depuis un statut terminal (`delivered`/`cancelled`/`returned`) sauf via `/status-override` avec code d'accès, (c) interdit aux livreurs de poser `cancelled`/`returned` et leur impose une progression strictement linéaire `pending→confirmed→picked_up→delivered`, (d) admin restreint reste limité à la progression directe sans recul, (e) admin général garde la liberté hors statut terminal.

Tests Vitest correspondants (143 verts au total) :
- `POST /api/orders — wallet hardening` (refus solde insuffisant + débit correct si suffisant)
- `POST /api/orders — orderNumber unique sous concurrence`
- `PATCH /api/orders/:id — anti double-remboursement` (admin double cancel + client double cancel)
- `PATCH /api/orders/:id — transitions de statut` (driver bloqué sur cancelled + admin bloqué sur statut terminal)

## PARTIE 4 — Tracking live livreur (server/lib/eta.ts, server/routes/drivers.routes.ts, server/routes/orders.routes.ts)
Suivi en direct de la position du livreur pendant une livraison, depuis la commande client jusqu'à la fiche admin.

### Schema & storage
- **Table `driver_locations`** (`shared/schema.ts`) : historique des pings GPS (driverId, orderId nullable, latitude/longitude, heading/speed/accuracy/batteryLevel, recordedAt, createdAt) — index `(driver_id, recorded_at DESC)` et `(order_id, recorded_at DESC)`.
- **IStorage** : `recordDriverLocation`, `getLatestDriverLocation(driverId)`, `getLatestDriverLocationForOrder(orderId)` — implémenté en `DatabaseStorage` (drizzle `orderBy desc(recordedAt) limit 1`) et `MemoryStorage` (tests).

### ETA (server/lib/eta.ts)
- `haversineKm(a, b)` distance grand cercle.
- `computeEta(driverPos, dest, speed=22 km/h)` retourne `{distanceKm, minutes, avgSpeedKmh, arrivalAt}` ou `null` si l'un des deux points manque. Vitesse moyenne par défaut adaptée à Kinshasa (trafic urbain motos/voitures).
- `statusTextFromContext(status, distKm)` — libellé contextuel : « Le livreur est à votre porte » <0.3 km, « tout proche » <1 km, « arrive bientôt » <3 km, etc. Préféré côté front à toute logique locale pour rester cohérent avec les notifications futures.
- Module isolé prêt à être remplacé par Google Distance Matrix / Mapbox / OSRM (signature stable).

### Endpoints
- **`POST /api/driver/location`** (livreur authentifié) — enregistre un ping. Si `orderId` est fourni, vérifie `order.driverId === userId` (sinon 403). Stocke dans `driver_locations`, met à jour `users.lat/lng` (compat carte admin existante), broadcaste `driver_location` (ancien format) + `driver_location_update` ciblé client + admins avec `driverLocation`, `eta` et `statusText` déjà calculés. Validé par `schemas.driverLocationPing` (lat/lng required, autres optionnels).
- **`GET /api/orders/:id/tracking`** (client propriétaire / livreur assigné / admin) — agrège en un appel : statut, dernière position livreur, ETA, infos publiques livreur (id, name, phone, vehicleType/Plate, profilePhotoUrl) sans password ni token, et `channels` (canCall / canChat / canOpenSupport).

### Frontend
- **`client/src/hooks/use-driver-location-sharing.ts`** — hook livreur. Activé seulement si `enabled` (statut `confirmed` ou `picked_up`). Push toutes les 15 s vers `POST /api/driver/location` avec orderId. Expose `gpsActive`, `lastSentAt`, `lastError`, `position`. Ne notifie jamais le serveur si la géolocalisation a échoué.
- **`client/src/pages/driver/DriverOrderDetail.tsx`** — intègre le hook + affiche un badge « Position partagée HH:MM:SS » (vert pulsant) ou « GPS indisponible » (ambre) sous le timeline.
- **`client/src/pages/client/TrackingPage.tsx`** — refonte : consomme `/api/orders/:id/tracking` (polling 12 s + invalidation WS sur `driver_location_update` ciblant l'orderId). Carte Leaflet (`LiveTrackingMap`) avec destination fixe + marker livreur live qui se déplace, hero ETA dynamique « Arrivée estimée : N min · HH:MM », statusText contextuel, et trois boutons d'action côté livreur : appeler (`tel:`), chat (`/chat/order/:id`), support (`/support?orderId=`). Fallback texte si pas encore de position GPS.

### Tests (211 verts)
- `tests/validators.test.ts` : fixtures `driverLocationPing` happy/reject.
- `tests/routes.integration.test.ts` (PARTIE 4 — 6 tests) : refus client non livreur (403), ping sans orderId, refus commande non assignée (403), ping commande assignée + maj `users.lat/lng`, refus tracking pour client non propriétaire (403), tracking complet propriétaire (statut, position, ETA, infos livreur sans credentials, channels).

## PARTIE 5 — Support Center après livraison (server/routes/support.routes.ts, client/src/pages/client/SupportPage.tsx, client/src/pages/admin/AdminSupport.tsx)
Système complet de tickets après livraison avec chat client↔admin, remboursements partiels idempotents et notifications.

### Schema & storage
- **Table `support_tickets` étendue** : `ticketNumber` (TKT-XXXXXX unique), `category` (enum order_problem/missing_item/late_delivery/refund_request/payment_problem/driver_problem/restaurant_problem/other), `status` (open/in_review/waiting_customer/resolved/rejected/closed), `priority` (low/normal/high/urgent), `title`, `description`, `assignedAdminId`, `requestedRefundAmount`, `approvedRefundAmount`, `resolutionNote`, `updatedAt`, `resolvedAt`. `orderId` rendu **nullable** (un ticket peut être ouvert sans commande).
- **Nouvelle table `support_ticket_messages`** : conversation bidirectionnelle (ticketId, senderId, message, imageUrl, isFromAdmin, createdAt).
- **IStorage** : `getSupportTicket`, `getSupportTicketsForUser`, `listSupportTicketsAdvanced({status,priority,category,assignedAdminId})`, `updateSupportTicket`, `addSupportTicketMessage`, `listSupportTicketMessages`. Backfill automatique `ticketNumber` au démarrage.

### Endpoints (`server/routes/support.routes.ts`)
- **`POST /api/support/tickets`** — création moderne (catégorie, titre, description, montant souhaité, image) + **rétro-compat** legacy `{orderId, message}` mappé sur `category=other`. Notifie tous les admins.
- **`GET /api/support/tickets/mine`** — tickets du client courant.
- **`GET /api/support/tickets/by-order/:orderId`** — ticket ouvert lié à une commande (compat chat client↔driver).
- **`GET /api/support/tickets`** (admin) — liste filtrable `?status&priority&category&assignedAdminId`.
- **`GET /api/support/tickets/:id`** + **`GET/POST .../messages`** — détail + chat. Bascule auto du statut sur message : admin→`waiting_customer`, client→`in_review` si précédemment `waiting_customer`. Notifie l'autre partie.
- **`PATCH /api/support/tickets/:id`** (admin) — assigner, changer statut/priorité/titre.
- **`POST /api/support/tickets/:id/refund`** (admin) — **idempotent** : refus 409 si `approvedRefundAmount` déjà set ou statut terminal. Crédite `users.walletBalance` via `updateUser` + crée `walletTransaction` avec `reference="support_ticket:<id>"`. Notifie le client.
- **`POST /api/support/tickets/:id/reject`** + **`/resolve`** (admin) — clôturent le ticket avec note. Notifient le client.

### Frontend client (`client/src/pages/client/SupportPage.tsx`)
- Trois vues exportées : liste `SupportPage` (default), formulaire `NewSupportTicketPage`, détail+chat `SupportTicketPage`. Routes `/support`, `/support/new` (avec `?orderId=` pré-rempli), `/support/:id`.
- Bouton « Signaler un problème » ajouté à `OrderDetailPage` (icône LifeBuoy) → `navigate('/support/new?orderId=' + id)`.
- Badges statuts colorés, chat scrollé auto, désactivation de la zone de saisie sur tickets clôturés.

### Frontend admin (`client/src/pages/admin/AdminSupport.tsx`)
- Liste filtrable (statut/priorité/catégorie) + détail latéral. Actions : changer statut/priorité, m'assigner, répondre, **approuver remboursement partiel** (montant + note), rejeter (motif requis), résoudre. Bouton remboursement désactivé si déjà crédité (idempotence reflétée côté UI). Entrée « Support » ajoutée à `AdminSidebar` (clé `support`).

### Tests (234 verts)
- `tests/validators.test.ts` : fixtures `supportTicketCreate/Update/Refund/Reject/Message`.
- `tests/routes.integration.test.ts` (PARTIE 5 — 13 tests) : création moderne + legacy + sans orderId, chat bidirectionnel avec bascule de statut, filtres admin, remboursement idempotent (premier appel crédite wallet, second renvoie 409), rejet, résolution, ACL non-admin sur endpoints admin, isolation `/mine` entre clients.

## PARTIE 6 — Avis et notes type Uber Eats (server/routes/reviews.routes.ts, client/src/pages/admin/AdminReviews.tsx, client/src/pages/driver/DriverFeedback.tsx)
Système d'avis détaillé : note séparée restaurant + livreur, tags rapides, anti-doublon, anonymisation côté livreur, signalements admin.

### Schema & storage
- **Table `reviews`** : `orderId UNIQUE` (1 avis par commande), `userId` (auteur), `restaurantId`/`driverId` nullables, `restaurantRating`/`driverRating` (1-5 nullables), `comment` (text), `tags text[]`. Indices sur `restaurant_id`, `driver_id`, `user_id`.
- **`REVIEW_TAGS`** exporté depuis `shared/schema.ts` : `["rapide", "poli", "bon emballage", "article manquant", "retard", "mauvaise communication"]`.
- **IStorage** : `createReview`, `getReviewByOrder`, `getReviewsByRestaurant/ByDriver`, `listReviews({restaurantId,driverId,minRating,maxRating})`, `getRestaurantRatingSummary`, `getDriverRatingSummary` (AVG/COUNT en SQL via Drizzle, GREATEST pour la note max). `MemoryStorage.reviews` lance `review_already_exists` si doublon `orderId`. **Important** : `reset()` doit vider `this.reviews` aussi (sinon état leak entre tests).
- **Validator `reviewCreate`** : restaurantRating/driverRating optionnels (1-5 entiers), comment max 2000, tags ⊆ REVIEW_TAGS. `.refine()` exige au moins une note. Renvoi 422 si invalide (cohérent avec tout le projet).

### Endpoints (`server/routes/reviews.routes.ts`)
| Verbe | URL | ACL | Comportement |
|---|---|---|---|
| POST | `/api/orders/:orderId/review` | Owner uniquement | Triple garde : owner (`order.clientId === userId`), `status==="delivered"`, pas d'avis existant. Notif livreur si `driverRating` renseigné. Notif admins si min(notes) ≤ 2 (alerte qualité). |
| GET | `/api/orders/:orderId/review` | Owner | Renvoie l'avis du client courant (ou null). |
| GET | `/api/restaurants/:id/reviews` | Public | Liste publique sans userId/driverId. |
| GET | `/api/restaurants/:id/rating-summary` | Public | `{average, count}`. |
| GET | `/api/drivers/:id/rating-summary` | Public | `{average, count}` chiffre seul. |
| GET | `/api/drivers/:id/reviews` | Admin only | Détail avec commentaires (chiffres sensibles côté admin). |
| GET | `/api/drivers/me/feedback` | Driver only | Anonymisé : `{summary, tagCounts, ratingHistogram, recentComments, lowRatingFlag}`. `sanitizeForDriverView` masque emails et numéros (regex). Aucun `userName`/`userEmail` renvoyé. |
| GET | `/api/reviews?restaurantId&driverId&minRating&maxRating` | Admin | Liste filtrée. |
| GET | `/api/reviews/low-rated?threshold&minCount` | Admin | Restaurants & livreurs sous le seuil (3.5 par défaut, ≥3 avis). |

L'ancien endpoint `POST /api/orders/:id/rate` (champs `orders.rating/feedback`) reste actif — la table `reviews` est additive et plus riche.

### Frontend
- **`client/src/components/client/order-detail/ReviewModal.tsx`** : nouveau modal — étoiles séparées restaurant/livreur (affichage conditionnel selon `order.restaurantId`/`order.driverId`), tags rapides toggleables (REVIEW_TAGS), commentaire libre, bouton désactivé tant qu'aucune note n'est sélectionnée. Remplace l'ancien `RateModal` dans `OrderDetailPage`. Mutation vers `/api/orders/:id/review`, invalidation des queries `/api/orders/:id/review` et `/api/orders/:id`. `canRate` calculé sur `existingReview == null` (issu de la query GET).
- **`client/src/pages/admin/AdminReviews.tsx`** (route `/admin/reviews`) : section signalements (restaurants & livreurs sous 3.5/5, ≥3 avis) en haut, liste paginée des avis avec filtre `maxRating` (≤2/≤3/≤4) en bas. Affiche étoiles séparées resto/livreur + tags + commentaire. Lien dans `AdminSidebar` (icône Star, sous "Clients & Com.", badgeKey `reviews`).
- **`client/src/pages/driver/DriverFeedback.tsx`** (route `/driver/feedback`) : moyenne + nombre, histogramme des notes, top tags avec compte, derniers commentaires anonymisés. Encart pédagogique orange si `lowRatingFlag` (avg<3.5 et count≥5). Lien depuis `DriverDashboard` ("Mes évaluations", icône Star jaune).

### Tests (245 verts)
- `tests/validators.test.ts` : fixtures `reviewCreate` happy (restoRating+driverRating+comment+tags) et reject (aucune note → refine).
- `tests/routes.integration.test.ts` (PARTIE 6 — 9 tests) : création complète, refus doublon (409), refus non-livré (409), refus non-owner (403), refus payload sans note (422), calcul moyennes resto+livreur, listing admin + low-rated, ACL admin (403 client), feedback livreur anonymisé (sans email `alice@example.com` ni numéro `+243999111222`, pas de `userName`/`userEmail`).
