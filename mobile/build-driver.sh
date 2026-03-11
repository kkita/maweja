#!/bin/bash
# ============================================================
# Script de build pour l'app Driver MAWEJA (Android + iOS)
# ============================================================
# Usage: bash mobile/build-driver.sh
# ============================================================

set -e

echo "================================================"
echo "   MAWEJA DRIVER APP - Build Capacitor"
echo "================================================"

# ---- 1. Vérification de l'URL du backend ----
if [ -z "$VITE_API_BASE_URL" ]; then
  echo ""
  echo "⚠️  ATTENTION: VITE_API_BASE_URL non définie!"
  read -p "Entrez l'URL du backend (ex: https://maweja.replit.app): " VITE_API_BASE_URL
  export VITE_API_BASE_URL
fi

echo ""
echo "→ Backend URL: $VITE_API_BASE_URL"
echo "→ Mode: DRIVER"
echo ""

# ---- 2. Build Vite ----
echo "[1/4] Build de l'application web (Vite)..."
VITE_MOBILE_MODE=driver VITE_API_BASE_URL=$VITE_API_BASE_URL npx vite build --config vite.mobile.config.ts
echo "   ✓ Build web terminé → mobile/driver/www/"

# ---- 3. Capacitor Sync ----
echo "[2/4] Synchronisation Capacitor..."
cd mobile/driver
npx cap sync
echo "   ✓ Capacitor sync terminé"

# ---- 4. Build Android ----
echo "[3/4] Build Android APK..."
if [ -d "android" ]; then
  npx cap build android --keystorepath ../../keystore/maweja-driver.jks \
    --keystorepass ${KEYSTORE_PASSWORD:-maweja2024} \
    --keystorealias maweja-driver \
    --keystorealiaspass ${KEYSTORE_PASSWORD:-maweja2024} 2>/dev/null || \
  (echo "   → Ouvrez Android Studio pour compiler manuellement" && npx cap open android)
else
  echo "   → Plateforme Android non initialisée. Lancez: npx cap add android"
fi

echo ""
echo "================================================"
echo "   BUILD DRIVER TERMINÉ"
echo "================================================"
echo ""
echo "APK: mobile/driver/android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "Prochaines étapes:"
echo "  1. Connectez-vous à Google Play Console"
echo "  2. Uploadez l'APK ou le fichier .aab"
echo "================================================"
