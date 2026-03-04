# Mon Food Livreur - Application de Commande de Nourriture

## Overview
Food delivery application for Kinshasa with real restaurant names (Aldar, KFC, Hunga Busta, City Market, Hilton, Golden Tulip, Kin Marche, La Terrasse Gombe), menus, cart system, and multiple payment options (Mobile Money: Airtel Money, M-PSA, Orange Money, AfriMoney, Illico Cash + Cash + Credit Card). Uses demo data for client-side presentation.

## Branding
- App Name: Mon Food Livreur
- Signature: Demo by Khevin Andrew Kita - Ed Corporation 0911742202
- Icons: /icon-192.png, /icon-512.png (generated)
- PWA manifest configured

## Architecture
- **Frontend**: React + Vite with Tailwind CSS and Shadcn UI
- **Backend**: Express.js (minimal, demo mode)
- **Routing**: Wouter
- **State Management**: useSyncExternalStore for cart (global external store)
- **Data**: Demo data in `client/src/lib/demo-data.ts`

## Key Files
- `client/src/lib/demo-data.ts` - All demo restaurants, menus, categories, promotions
- `client/src/lib/cart-store.ts` - Global cart state with useSyncExternalStore
- `client/src/pages/home.tsx` - Home page with search, categories, promotions, restaurant list
- `client/src/pages/restaurant.tsx` - Restaurant detail with menu items, category tabs
- `client/src/pages/cart.tsx` - Cart with grouped items, quantity controls, order summary
- `client/src/pages/checkout.tsx` - Checkout with address, phone, payment method selection
- `client/src/pages/order-success.tsx` - Order confirmation page
- `client/src/pages/tracking.tsx` - Order tracking with step-by-step progress
- `client/public/manifest.json` - PWA manifest for mobile app

## Pages
1. `/` - Home (search, categories, promo banner, featured & all restaurants)
2. `/restaurant/:id` - Restaurant detail with menu
3. `/cart` - Shopping cart
4. `/checkout` - Checkout & payment
5. `/order-success` - Order confirmation
6. `/tracking` - Order tracking simulation

## Design
- Font: Plus Jakarta Sans
- Primary color: Orange (24 95% 53%)
- Clean, modern, mobile-first design
- Glassmorphism headers (backdrop-blur)

## Pricing Structure
- Subtotal: food items total
- Delivery fee: varies by restaurant
- Service fee: $0.99
- Total = Subtotal + Delivery + Service

## Payment Methods
- Mobile Money (Airtel Money, M-PSA, Orange Money, AfriMoney, Illico Cash)
- Cash (pay on delivery)
- Credit Card (Visa, Mastercard)
