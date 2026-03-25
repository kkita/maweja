#!/bin/bash
# ============================================================
# MAWEJA CLIENT APP — Build Capacitor
# Package ID : com.edcorp.maweja
# Plateformes : Android + iOS
# ============================================================
# Usage: bash mobile/build-client.sh
# ============================================================

set -e

echo "================================================"
echo "   MAWEJA CLIENT — com.edcorp.maweja"
echo "   Plateformes : Android + iOS"
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
echo "→ Mode    : CLIENT"
echo ""

# ---- 2. Build Vite ----
echo "[1/3] Build application web..."
VITE_MOBILE_MODE=client VITE_API_BASE_URL=$VITE_API_BASE_URL \
  npx vite build --config vite.mobile.config.ts
echo "   ✓ Web build → mobile/client/www/"

# ---- 3. Capacitor Sync ----
echo "[2/3] Synchronisation Capacitor (Android + iOS)..."
cd mobile/client
npx cap sync android 2>/dev/null && echo "   ✓ Android sync OK" || echo "   ! Android non initialisé — lancez: npx cap add android"
npx cap sync ios    2>/dev/null && echo "   ✓ iOS sync OK"     || echo "   ! iOS non initialisé — lancez: npx cap add ios (macOS requis)"

# ---- 3b. Icône notification Android (ic_stat_notify) ----
ANDROID_RES="android/app/src/main/res"
if [ -d "$ANDROID_RES" ]; then
  echo "[2b/3] Copie icônes notification Android..."
  ROOT=$(cd ../.. && pwd)
  declare -A DENSITIES=( ["mdpi"]="24" ["hdpi"]="36" ["xhdpi"]="48" ["xxhdpi"]="72" ["xxxhdpi"]="96" )
  for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    mkdir -p "${ANDROID_RES}/drawable-${density}"
    cp "${ROOT}/resources/android/notification/ic_stat_notify_${density}.png" \
       "${ANDROID_RES}/drawable-${density}/ic_stat_notify.png" 2>/dev/null && \
       echo "   ✓ ic_stat_notify → drawable-${density}" || true
    cp "${ROOT}/resources/android/notification/ic_notif_large_${density}.png" \
       "${ANDROID_RES}/drawable-${density}/ic_notif_large.png" 2>/dev/null && \
       echo "   ✓ ic_notif_large → drawable-${density}" || true
  done
else
  echo "   ! (Android pas encore initialisé, icons copiés après 'npx cap add android')"
fi

# ---- 4. Instructions ----
echo ""
echo "================================================"
echo "   BUILD CLIENT TERMINÉ"
echo "================================================"
echo ""
echo "Android APK :"
echo "  cd mobile/client && npx cap open android"
echo "  → Build → Generate Signed Bundle/APK dans Android Studio"
echo ""
echo "iOS IPA (macOS uniquement) :"
echo "  cd mobile/client && npx cap open ios"
echo "  → Product → Archive dans Xcode"
echo ""
echo "APK output : mobile/client/android/app/build/outputs/apk/"
echo "Package ID : com.edcorp.maweja"
echo "================================================"
