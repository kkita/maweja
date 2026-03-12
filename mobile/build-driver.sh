#!/bin/bash
# ============================================================
# MAWEJA DRIVER APP — Build Capacitor
# Package ID : com.edcorp.maweja.driver
# Plateformes : Android UNIQUEMENT (pas d'iOS)
# ============================================================
# Usage: bash mobile/build-driver.sh
# ============================================================

set -e

echo "================================================"
echo "   MAWEJA DRIVER — com.edcorp.maweja.driver"
echo "   Plateforme : Android uniquement"
echo "================================================"

# ---- 1. URL du backend ----
if [ -z "$VITE_API_BASE_URL" ]; then
  echo ""
  echo "VITE_API_BASE_URL non définie."
  read -p "URL du backend déployé (ex: https://maweja.net): " VITE_API_BASE_URL
  export VITE_API_BASE_URL
fi

echo ""
echo "→ Backend : $VITE_API_BASE_URL"
echo "→ Mode    : DRIVER"
echo ""

# ---- 2. Build Vite ----
echo "[1/3] Build application web..."
VITE_MOBILE_MODE=driver VITE_API_BASE_URL=$VITE_API_BASE_URL \
  npx vite build --config vite.mobile.config.ts
echo "   ✓ Web build → mobile/driver/www/"

# ---- 3. Capacitor Sync Android ----
echo "[2/3] Synchronisation Capacitor (Android)..."
cd mobile/driver
npx cap sync android 2>/dev/null && echo "   ✓ Android sync OK" || echo "   ! Android non initialisé — lancez: npx cap add android"

# ---- 4. Instructions ----
echo ""
echo "================================================"
echo "   BUILD DRIVER TERMINÉ"
echo "================================================"
echo ""
echo "Android APK :"
echo "  cd mobile/driver && npx cap open android"
echo "  → Build → Generate Signed Bundle/APK dans Android Studio"
echo ""
echo "APK output : mobile/driver/android/app/build/outputs/apk/"
echo "Package ID : com.edcorp.maweja.driver"
echo "================================================"
echo ""
echo "NOTE: L'app Driver est Android uniquement."
echo "      Aucune publication iOS prévue."
echo "================================================"
