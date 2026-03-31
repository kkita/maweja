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
- **File Storage**: Replit Object Storage (Google Cloud Storage) for persistent uploads. Multer receives files locally, then `uploadToCloudStorage()` copies them to the cloud bucket and returns `/cloud/public/uploads/filename` paths. The `/cloud/{*cloudPath}` Express route serves files from the bucket. Legacy `/uploads/` paths still served from local disk for backward compatibility. Admin Gallery has "Migrate to Cloud" button to batch-migrate existing local files.

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
- **Fixed Service Fee**: A flat $0.76 service fee replaces percentage-based tax per order.
- **Editable Recipient**: Checkout allows editing recipient name and phone for gifting or ordering for others.
- **Progressive Order Status**: Order statuses follow an irreversible sequence `pending→confirmed→preparing→ready→picked_up→delivered`. Non-general admins can only advance forward; cancellation/return always allowed. General admins (superadmin or no permissions set) bypass restrictions. Backend validates via `canTransitionStatus()` in server/routes.ts.
- **Custom Form Fields per Service Category**: `service_categories.custom_fields` (jsonb) stores an array of field definitions (text, number, select, textarea, photo, date) with labels, placeholders, required flag, and options. Admin builds fields via drag-and-drop form builder in category modal. Client `ServiceRequestPage` renders fields dynamically and submits values in `additionalInfo` as `[CustomFields:JSON]` pattern. Admin detail modal parses and displays them.
- **Service Request Admin View**: Detail modal shows contactMethod with colored icon (WhatsApp green, email blue, phone red), phone number prominently, and extracts/displays catalog photos from `[Image: URL]` in additionalInfo.

## External Dependencies
- **Mapping Service**: OpenStreetMap (via Leaflet and react-leaflet).
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM.
- **File Uploads**: Multer.
- **Charting Library**: Recharts (for admin analytics).
- **Geocoding**: Nominatim (for reverse geocoding).
- **Payment Gateways**: Integration points for Mobile Money (M-Pesa/Orange Money/Airtel), Google Pay, POS systems, IllicoCash, and Credit Card processing.