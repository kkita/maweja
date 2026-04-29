#!/bin/bash
# ============================================================
# MAWEJA AGENT APP — Build Capacitor
# Package ID : com.edcorp.maweja.driver
# Plateformes : Android UNIQUEMENT (pas d'iOS)
# ============================================================
# Usage: bash mobile/build-driver.sh
# ============================================================

set -e

echo "================================================"
echo "   MAWEJA AGENT — com.edcorp.maweja.driver"
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

# ---- 3a. google-services.json (Firebase Cloud Messaging) ----
# Source de vérité : mobile/driver/firebase/google-services.json (downloadable depuis
# Firebase Console). Le plugin Gradle 'com.google.gms.google-services' attend
# le fichier dans android/app/. On le recopie systématiquement.
if [ -f "firebase/google-services.json" ]; then
  if [ -d "android/app" ]; then
    cp firebase/google-services.json android/app/google-services.json
    echo "   ✓ google-services.json → android/app/ (com.edcorp.maweja.driver)"
  else
    echo "   ! android/app introuvable — google-services.json non copié (lancez 'npx cap add android' d'abord)"
  fi
else
  echo "   ! mobile/driver/firebase/google-services.json absent — push notifications désactivées"
  echo "     → Téléchargez-le depuis Firebase Console (projet maweja-9bf20)"
fi

# ---- 3b. Icône notification Android (ic_stat_notify) ----
ANDROID_RES="android/app/src/main/res"
if [ -d "$ANDROID_RES" ]; then
  echo "[2b/3] Copie icônes notification Android..."
  ROOT=$(cd ../.. && pwd)
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
echo "   BUILD AGENT TERMINÉ"
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
echo "NOTE: L'app Agent est Android uniquement."
echo "      Aucune publication iOS prévue."
echo "================================================"
