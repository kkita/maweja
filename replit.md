# Voss - React Native/Expo

## Overview
Food delivery application for Kinshasa, RDC built with React Native and Expo. Features real Kinshasa restaurants, menus, cart system, and multiple payment options (Mobile Money + Cash + Card). Uses demo data for client-side presentation. Can be built as an Android APK via EAS Build.

## Branding
- App Name: Mon Food Livreur
- Signature: Demo by Khevin Andrew Kita - Ed Corporation 0911742202
- Package: com.edcorporation.monfoodlivreur
- Primary Color: #f97316 (orange)

## Architecture
- **Framework**: React Native + Expo SDK 52
- **Navigation**: React Navigation (native-stack)
- **Styling**: React Native StyleSheet with theme constants
- **State Management**: useSyncExternalStore for cart (global external store)
- **Icons**: @expo/vector-icons (Feather)
- **Data**: Demo data in `src/lib/demo-data.ts`

## Key Files
- `App.tsx` - Root component with React Navigation stack
- `index.js` - Expo entry point (registerRootComponent)
- `app.json` - Expo configuration
- `eas.json` - EAS Build configuration
- `babel.config.cjs` - Babel config for Expo
- `metro.config.cjs` - Metro bundler config
- `src/lib/demo-data.ts` - All demo restaurants, menus, categories
- `src/lib/cart-store.ts` - Global cart state with useSyncExternalStore
- `src/lib/theme.ts` - Theme constants (colors, spacing, borderRadius, fontSize)
- `src/screens/HomeScreen.tsx` - Home with search, categories, promo, restaurants
- `src/screens/RestaurantScreen.tsx` - Restaurant detail with menu
- `src/screens/CartScreen.tsx` - Cart with quantity controls, summary
- `src/screens/CheckoutScreen.tsx` - Checkout with address, payment
- `src/screens/OrderSuccessScreen.tsx` - Order confirmation
- `src/screens/TrackingScreen.tsx` - Order tracking simulation

## Screens
1. Home - Search, categories, promo banner, restaurant list
2. Restaurant - Restaurant detail with menu items, category tabs
3. Cart - Shopping cart with grouped items, quantity controls
4. Checkout - Address, payment method selection (Mobile Money, Cash, Card)
5. Order Success - Confirmation with order ID
6. Tracking - Step-by-step order tracking simulation

## Restaurants
Aldar, KFC, Hunga Busta, City Market, Hilton Kinshasa, Golden Tulip, Kin Marché, La Terrasse Gombe

## Payment Methods
Airtel Money, M-PESA, Orange Money, AfriMoney, Illico Cash, Cash, Credit Card

## Building APK
- Development: `npx expo start --web --port 5000`
- APK Build: `eas build --platform android --profile preview`
- Production: `eas build --platform android --profile production`
