# MAWEJA - Systeme de Livraison Kinshasa

## Overview
MAWEJA is a production-grade food and service delivery platform designed for Kinshasa, RDC. It features three distinct interfaces: Client, Driver, and Admin Dashboard. The platform aims to be an Uber-style delivery service, providing real-time driver tracking and a comprehensive system for managing orders, services, and logistics.

**Key Capabilities:**
- Real-time order tracking and driver location via Leaflet maps.
- Multi-role support: Client for ordering food and requesting services, Driver for deliveries, and Admin for comprehensive management.
- Internationalization (French/English) across all interfaces.
- Integrated service catalog and request system alongside food delivery.
- Robust financial tracking, marketing analytics, and driver verification workflows.

**Business Vision & Market Potential:**
MAWEJA seeks to become the leading delivery service in Kinshasa, offering a reliable and feature-rich platform to connect customers with food establishments and essential services. The platform is designed for scalability and aims to capture a significant share of the burgeoning on-demand delivery market in the region.

## Recent Changes (March 23, 2026)
- **Returned Orders**: New "returned" order status with automatic refund for wallet payments, finance logging, and client notification. Available in admin order status dropdown alongside existing statuses.
- **Advanced Analytics Dashboard**: Rebuilt Marketing & Analytics page with 5 tabs:
  - **Vue d'ensemble**: 11 KPI cards (including returned orders, new clients), trends with switchable chart types (bar/pie/area/line), orders by hour/day of week, payment modes, product ranking, status breakdown
  - **Part de marché**: Restaurant revenue ranking with share %, volume charts, rating comparison
  - **Comportement clients**: Client profiles with favorite restaurants, cuisine preferences, revenue contribution, inactivity detection, expenditure details, system revenue generated per client
  - **Livreurs**: Driver performance table with ponctuality rate bars, rating, online status
  - **Rétention & Alertes**: Inactive client alerts (+14 days), client-restaurant affinity matrix (heatmap), automated push notification suggestions based on preferences and behavior
- **Dynamic Restaurant Categories**: `restaurant_categories` table replaces hardcoded food filter pills. Admin page at `/admin/restaurant-categories` with emoji picker (auto-suggestions based on category name, WhatsApp-style). Client-side filters update dynamically.
- **Auto Promos Category**: Special "Promos" category that auto-includes restaurants with `discountPercent > 0`. Restaurants can belong to multiple categories simultaneously.
- **Logo Centering**: Dashboard sidebar logo now properly centered.
- **Forced Login**: Unauthenticated users are now redirected to /login before accessing any client feature. Only login, register, and presentation pages remain public.
- **Promotions Admin (CRUD)**: New `promotions` DB table replaces hardcoded promo codes. Full admin page at `/admin/promotions` with create/edit/delete, toggle active/inactive, expiration dates, usage limits, and minimum order thresholds. Sidebar entry added.
- **Featured Stores (Partenaires)**: `isFeatured` boolean on restaurants. Admin toggle in restaurant edit form. Featured restaurants appear first in client list with a gold "Partenaire" badge.
- **Fixed Service Fee ($0.76)**: Replaced the 5% tax with a flat $0.76 service fee per order, displayed in CartPage and CheckoutPage. Fee is included in the final total.
- **Editable Recipient at Checkout**: Summary step now shows editable name + phone fields (pre-filled from profile). Users can order for another person while keeping their own account for tracking.
- **Restaurant Cards Simplified**: Removed address and delivery fee from client-facing restaurant cards.
- **Photo Persistence**: Uploads stored in `uploads/` directory which persists across Replit deployments. Seed script protects all custom data (never overwrites user-uploaded images, ads, or orders).

## Previous Changes (March 2026)
- **Gallery Feature**: New "Galerie Médias" menu in admin sidebar. `GET /api/admin/gallery` returns all uploaded files with absolute URLs. `DELETE /api/admin/gallery/:filename` deletes a file. `POST /api/admin/gallery/fix-urls` migrates all relative `/uploads/…` paths in the DB to absolute URLs (for production fixes). Gallery page has grid/list view, tab filtering (images/video), search, copy-URL, open-in-new-tab, and delete per file. GalleryPicker component (modal) added to AdminAds (URL media field), AdminRestaurants (all MediaUploadButton instances + menu item form), and AdminServices (category image + catalog item image). `requireAdmin` middleware guards all gallery endpoints. `canAccess("gallery")` added to sidebar permission system.


- **Admin Granular Permissions**: Replaced fixed role presets with checkbox-based per-menu permissions system. Added `admin_permissions` JSONB column. AdminAccounts page now shows "Super Admin" vs "Accès Limité" toggle + individual menu permission checkboxes. Block/unblock functionality for sub-admin accounts added. `requireAdmin` middleware now blocks `isBlocked` admins
- **AdminSidebar**: Updated to use `adminPermissions[]` array for nav filtering (instead of role presets). Dashboard always visible; each other menu requires explicit permission for restricted accounts
- **Driver Photo Upload Fix**: Multer fileFilter now accepts all `image/*` MIME types (includes HEIC/HEIF from iOS). Upload limit increased to 10MB. Error handling improved to show server error messages via toast + inline indicator
- **Admin Sub-Roles Module**: Added `adminRole` column to users table (superadmin/marketing/finance/support); AdminSidebar filters navigation by role; AdminAccounts page for full CRUD management of admin sub-accounts; AdminLayout supports subtitle prop
- **WebSocket Improvements**: `websocket.ts` rewritten with heartbeat (25s ping), duplicate connection guard, `disconnectWS()` function, clean onclose=null before replacing connections
- **Notification Permissions**: `requestNotifPermission()` now called for web browsers (not just native Capacitor) on user login
- **Driver Dashboard Map**: Added `DriverLiveMap` Leaflet component with real-time driver GPS position + active order delivery markers; GPS status bar now acts as toggle for the map; stores `driverPos` state for real-time update
- **Backend Admin Routes**: `/api/admin/accounts` GET/POST/PATCH/DELETE for sub-account management
- **Restaurant CRUD**: Added "Ajouter un restaurant" + Delete + full menu items management (add/edit/delete per restaurant)
- **WhatsApp persistence**: Added `app_settings` DB table; `/api/settings` GET+PATCH; AdminSettings saves to DB; ClientContactBubble uses dynamic WhatsApp number
- **Services/Catalog seeded**: 10 catalog items seeded across categories (Hotellerie, Transport, Nettoyage, Reparation, Evenementiel); 3 default ads seeded
- **AdminChat improved**: Better UX with date separators, phone call button, client-first behavior enforced (clients tab only shows clients who wrote first)
- **AdminDashboard animations**: AnimatedNumber counter, live indicator, ProgressBar animations, hover effects, gradient revenue card, fade-in on load, skeleton loaders

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
- **File Storage**: Multer for image uploads (max 5MB for general, 20MB for media).

**UI/UX Decisions:**
- **Branding**: App Name: MAWEJA. Primary color: Red (#dc2626) with white accents.
- **Admin Dashboard**: Desktop-first layout with a fixed sidebar and content area, responsive breakpoints for grids.
- **Client/Driver Apps**: Mobile-first design, optimized for 375px–430px screens, with sticky headers and fixed bottom navigation.
- **Internationalization**: Full French/English support with language selection at first visit for clients/drivers and a dropdown for admins.
- **Theming**: Dark mode support (Auto/Light/Dark) via `localStorage` and `window.matchMedia`, utilizing Tailwind CSS dark mode classes.
- **Favicons**: Dynamic favicons based on user role (original for client, black-tinted for driver, red-tinted for admin).

**Feature Specifications & Implementations:**
- **Authentication**: Session-based with separate cookies for Admin, Driver, and Client roles to support multi-tab usage. Guest browsing of menus is allowed, with login/registration enforced at checkout.
- **Driver Onboarding & Verification**: Multi-step process where admins create basic driver accounts, drivers complete detailed profiles, and admins review/approve fields with real-time feedback via WebSockets.
- **Service Catalog**: Dynamic service categories and items managed by admin. Clients can browse and request quotes with pre-filled selections.
- **Chat System**: Real-time messaging between Admin ↔ Driver and Client → Admin (via a floating bubble with structured complaint forms).
- **Order Management**: Comprehensive order lifecycle including creation, status updates, driver assignment, real-time tracking, cancellation with refunds, and detailed audit logs.
- **Payment Methods**: Supports multiple payment options including Cash, Mobile Money, Wallet, Google Pay, POS, IllicoCash, and Credit Card.
- **Loyalty Program & Promos**: Loyalty points system and dynamic promo codes (e.g., MAWEJA10, LIVRAISON) applicable at checkout.
- **Location & Addresses**: Integrated Leaflet map with draggable markers, Nominatim reverse geocoding, and saved address management.
- **Marketing & Analytics**: Admin dashboard provides KPIs, revenue/order trends, top products, payment breakdowns, client segmentation, and driver performance analytics. Dynamic promo banners are managed by admins with live previews.
- **Notifications**: Browser push notifications with client segmentation for targeted broadcasts.
- **Settings**: Client and Driver apps include modals for notification preferences, privacy policy, contact support (chat with admin), and app information.

## External Dependencies
- **Mapping Service**: OpenStreetMap (via Leaflet and react-leaflet).
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM.
- **File Uploads**: Multer.
- **Charting Library**: Recharts (for admin analytics).
- **Geocoding**: Nominatim (for reverse geocoding).
- **Payment Gateways**: Integration points for Mobile Money (M-Pesa/Orange Money/Airtel), Google Pay, POS systems, IllicoCash, and Credit Card processing. (Specific providers not detailed, but interfaces exist).
- **WebSocket Library**: (Implied, typically `ws` or `socket.io` for Express).