# FoodDash - Application de Commande de Nourriture

## Overview
Food delivery application with multiple restaurants, menus, cart system, and multiple payment options (Mobile Money, Cash, Credit Card). Currently uses demo data for client-side presentation.

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
- Smooth transitions and interactions

## Pricing Structure
- Subtotal: food items total
- Delivery fee: $2.00
- Service fee: $0.99
- Total = Subtotal + Delivery + Service

## Payment Methods
- Mobile Money (MTN, Airtel, Orange)
- Cash (pay on delivery)
- Credit Card (Visa, Mastercard)
