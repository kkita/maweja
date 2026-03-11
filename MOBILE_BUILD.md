# MAWEJA — Guide de Build Mobile (Android & iOS)
## Capacitor + Android Studio / Xcode

> **Fait par Khevin Andrew Kita — Ed Corporation**  
> Contact: 0819994041

---

## Vue d'ensemble

Ce guide vous permet de générer deux applications mobiles natives distinctes à partir du projet MAWEJA :

| App | Package ID | Store |
|-----|-----------|-------|
| **MAWEJA** (Client) | `cd.maweja.client` | Google Play + App Store |
| **MAWEJA Driver** (Livreur) | `cd.maweja.driver` | Google Play + App Store |

L'Admin Dashboard reste une application web uniquement.

---

## Prérequis — Ce qu'il faut installer sur votre PC/Mac

### Pour Android (Windows, macOS, ou Linux)
1. **Node.js 18+** — https://nodejs.org
2. **Java JDK 17** — https://adoptium.net
3. **Android Studio** — https://developer.android.com/studio
   - Dans Android Studio → SDK Manager → installer :
     - Android SDK Platform 34 (Android 14)
     - Android SDK Build-Tools 34
     - Android Emulator
4. **Variables d'environnement à configurer :**
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk       # macOS/Linux
   export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

### Pour iOS (macOS uniquement)
1. **macOS Ventura ou plus récent**
2. **Xcode 15+** — depuis le Mac App Store
3. **Xcode Command Line Tools** :
   ```bash
   xcode-select --install
   ```
4. **CocoaPods** :
   ```bash
   sudo gem install cocoapods
   ```

---

## Étape 1 — Récupérer le code source

```bash
# Clonez le projet MAWEJA sur votre machine locale
git clone <URL_DE_VOTRE_REPO> maweja
cd maweja
npm install
```

---

## Étape 2 — Déployer le backend

L'application mobile a besoin d'un backend accessible sur internet (pas localhost).

1. **Déployez le backend** sur Replit :
   - Allez sur votre Repl MAWEJA
   - Cliquez sur **Deploy** en haut à droite
   - Copiez l'URL de déploiement (ex: `https://maweja.replit.app`)

2. **Notez votre URL backend** — vous en aurez besoin pour les builds.

---

## Étape 3 — Initialiser Capacitor (à faire une seule fois)

### App Client

```bash
# Dans le dossier mobile/client
cd mobile/client
npm install

# Ajouter la plateforme Android
npx cap add android

# Ajouter la plateforme iOS (macOS uniquement)
npx cap add ios
```

### App Driver

```bash
# Dans le dossier mobile/driver
cd ../driver
npm install

# Ajouter la plateforme Android
npx cap add android

# Ajouter la plateforme iOS (macOS uniquement)
npx cap add ios
```

---

## Étape 4 — Build de l'App Client (MAWEJA)

```bash
# Retournez à la racine du projet
cd ../..

# Build du web (remplacez par votre URL backend réelle)
VITE_MOBILE_MODE=client VITE_API_BASE_URL=https://maweja.replit.app \
  npx vite build --config vite.mobile.config.ts

# Sync Capacitor
cd mobile/client
npx cap sync android
npx cap sync ios  # macOS uniquement
```

---

## Étape 5 — Build de l'App Driver (MAWEJA Driver)

```bash
# Retournez à la racine du projet
cd ../..

# Build du web (remplacez par votre URL backend réelle)
VITE_MOBILE_MODE=driver VITE_API_BASE_URL=https://maweja.replit.app \
  npx vite build --config vite.mobile.config.ts

# Sync Capacitor
cd mobile/driver
npx cap sync android
npx cap sync ios  # macOS uniquement
```

---

## Étape 6 — Build Android (APK / AAB)

### Option A — Android Studio (recommandé)

```bash
# Ouvrir le projet Android dans Android Studio
cd mobile/client
npx cap open android
```

Dans Android Studio :
1. Attendez que Gradle se synchronise (peut prendre 2-5 minutes)
2. **Build → Generate Signed Bundle / APK...**
3. Choisissez **Android App Bundle (.aab)** pour le Play Store (recommandé)
   - ou **APK** pour une installation directe
4. Créez ou utilisez votre **keystore** (fichier .jks)
5. Remplissez les infos :
   - Key store path: `keystore/maweja-client.jks`
   - Key alias: `maweja-client`
   - Password: (votre mot de passe)
6. Cliquez **Next → Finish**

> Répétez pour `mobile/driver` (App Driver)

### Option B — Ligne de commande

```bash
cd mobile/client/android

# Debug APK (test uniquement)
./gradlew assembleDebug
# → Output: app/build/outputs/apk/debug/app-debug.apk

# Release AAB (Google Play Store)
./gradlew bundleRelease
# → Output: app/build/outputs/bundle/release/app-release.aab
```

---

## Étape 7 — Créer un Keystore (signature numérique)

> **IMPORTANT** : Sauvegardez votre keystore ! Si vous le perdez, vous ne pourrez plus mettre à jour votre app sur le Play Store.

```bash
mkdir -p keystore

# Créer le keystore pour l'app Client
keytool -genkey -v \
  -keystore keystore/maweja-client.jks \
  -alias maweja-client \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Créer le keystore pour l'app Driver
keytool -genkey -v \
  -keystore keystore/maweja-driver.jks \
  -alias maweja-driver \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Remplissez les informations demandées :
- **Prénom et Nom** : Khevin Andrew Kita
- **Organisation** : Ed Corporation
- **Ville** : Kinshasa
- **État/Province** : Kinshasa
- **Code pays** : CD

---

## Étape 8 — Build iOS (macOS uniquement)

```bash
cd mobile/client
npx cap open ios
```

Dans Xcode :
1. Connectez votre compte Apple Developer (Xcode → Preferences → Accounts)
2. Sélectionnez votre **Team** (compte développeur Apple)
3. Modifiez le Bundle Identifier → `cd.maweja.client`
4. **Product → Archive**
5. Dans l'Organizer → **Distribute App → App Store Connect**

> **Compte Apple Developer requis** : 99 USD/an sur developer.apple.com

---

## Étape 9 — Publication sur les Stores

### Google Play Store (Android)

1. Créez un compte sur **play.google.com/console** (frais uniques de 25 USD)
2. **Créer une nouvelle application**
3. Remplissez :
   - **Nom de l'application** : MAWEJA (ou MAWEJA Driver)
   - **Description courte** : Commandez de la nourriture et des services à Kinshasa
   - **Description longue** : Application de livraison de nourriture et services à Kinshasa, République Démocratique du Congo...
   - **Catégorie** : Alimentation et boissons
4. **Production → Créer une release** → Uploadez votre fichier `.aab`
5. Complétez le formulaire et soumettez pour révision (1-3 jours)

### App Store Apple (iOS)

1. Connectez-vous sur **appstoreconnect.apple.com**
2. **Mes apps → +** (Nouvelle app)
3. Bundle ID : `cd.maweja.client`
4. Remplissez les métadonnées
5. Uploadez via **Xcode → Archive → Distribute**
6. Soumettez pour révision Apple (1-7 jours)

---

## Personnalisation des icônes et splash screen

### Icônes d'application

Placez votre icône (1024x1024 PNG, sans coins arrondis) dans :
```
mobile/client/android/app/src/main/res/
mobile/driver/android/app/src/main/res/
```

Utilisez **Android Asset Studio** pour générer toutes les tailles :
→ https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html

### Splash Screen

Couleur de fond : `#dc2626` (rouge MAWEJA) — déjà configurée dans `capacitor.config.ts`

---

## Scripts rapides (raccourcis)

Depuis la racine du projet :

```bash
# Build + sync App Client
bash mobile/build-client.sh

# Build + sync App Driver
bash mobile/build-driver.sh
```

---

## Structure des fichiers

```
maweja/
├── mobile/
│   ├── client/
│   │   ├── capacitor.config.ts   ← Config Capacitor client
│   │   ├── package.json
│   │   ├── www/                  ← Build web (généré automatiquement)
│   │   ├── android/              ← Projet Android Studio
│   │   └── ios/                  ← Projet Xcode (macOS seulement)
│   ├── driver/
│   │   ├── capacitor.config.ts   ← Config Capacitor driver
│   │   ├── package.json
│   │   ├── www/                  ← Build web (généré automatiquement)
│   │   ├── android/              ← Projet Android Studio
│   │   └── ios/                  ← Projet Xcode (macOS seulement)
│   ├── build-client.sh           ← Script build client
│   └── build-driver.sh           ← Script build driver
├── vite.mobile.config.ts         ← Config Vite pour mobile
├── MOBILE_BUILD.md               ← Ce guide
└── keystore/                     ← Vos keystores (à créer, NE PAS partager!)
```

---

## Variables d'environnement importantes

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_MOBILE_MODE` | Mode de build (`client` ou `driver`) | `client` |
| `VITE_API_BASE_URL` | URL du backend déployé | `https://maweja.replit.app` |

---

## Dépannage fréquent

### Erreur: "ANDROID_HOME is not set"
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Erreur: "Gradle build failed"
```bash
cd mobile/client/android
./gradlew clean
./gradlew assembleDebug
```

### Les cookies de session ne fonctionnent pas
- Vérifiez que `VITE_API_BASE_URL` pointe vers le bon backend
- Le backend accepte les origines `capacitor://localhost` et `https://localhost`

### L'app se charge mais les données ne s'affichent pas
- Vérifiez que le backend est bien déployé et accessible
- Testez l'URL dans votre navigateur : `https://votre-backend.replit.app/api/restaurants`

---

*Made By Khevin Andrew Kita — Ed Corporation | Contact: 0819994041*
