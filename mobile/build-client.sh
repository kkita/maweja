#!/bin/bash
# ============================================================
# Script de build pour l'app Client MAWEJA (Android + iOS)
# ============================================================
# Utilisez ce script depuis la racine du projet MAWEJA
# Usage: bash mobile/build-client.sh
# ============================================================

set -e

echo "================================================"
echo "   MAWEJA CLIENT APP - Build Capacitor"
echo "================================================"

# ---- 1. Vérification de l'URL du backend ----
if [ -z "$VITE_API_BASE_URL" ]; then
  echo ""
  echo "⚠️  ATTENTION: VITE_API_BASE_URL non définie!"
  echo "   Exemple: export VITE_API_BASE_URL=https://votre-backend.replit.app"
  echo "   ou lancez: VITE_API_BASE_URL=https://... bash mobile/build-client.sh"
  echo ""
  read -p "Entrez l'URL du backend (ex: https://maweja.replit.app): " VITE_API_BASE_URL
  export VITE_API_BASE_URL
fi

echo ""
echo "→ Backend URL: $VITE_API_BASE_URL"
echo "→ Mode: CLIENT"
echo ""

# ---- 2. Build Vite ----
echo "[1/4] Build de l'application web (Vite)..."
VITE_MOBILE_MODE=client VITE_API_BASE_URL=$VITE_API_BASE_URL npx vite build --config vite.mobile.config.ts
echo "   ✓ Build web terminé → mobile/client/www/"

# ---- 3. Capacitor Sync ----
echo "[2/4] Synchronisation Capacitor..."
cd mobile/client
npx cap sync
echo "   ✓ Capacitor sync terminé"

# ---- 4. Build Android ----
echo "[3/4] Build Android APK..."
if [ -d "android" ]; then
  npx cap build android --keystorepath ../../keystore/maweja-client.jks \
    --keystorepass ${KEYSTORE_PASSWORD:-maweja2024} \
    --keystorealias maweja-client \
    --keystorealiaspass ${KEYSTORE_PASSWORD:-maweja2024} 2>/dev/null || \
  (echo "   → Ouvrez Android Studio pour compiler manuellement" && npx cap open android)
else
  echo "   → Plateforme Android non initialisée. Lancez: npx cap add android"
fi

echo ""
echo "================================================"
echo "   BUILD CLIENT TERMINÉ"
echo "================================================"
echo ""
echo "APK: mobile/client/android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "Prochaines étapes:"
echo "  1. Connectez-vous à Google Play Console"
echo "  2. Uploadez l'APK ou le fichier .aab"
echo "  3. Complétez les informations de la fiche store"
echo "================================================"
