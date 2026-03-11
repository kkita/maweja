# MAWEJA — Guide de Build Mobile (Android & iOS)
## Capacitor + Android Studio / Xcode

> **Fait par Khevin Andrew Kita — Ed Corporation**  
> Contact: 0819994041

---

## Vue d'ensemble

| App | Package ID | Android | iOS |
|-----|-----------|:-------:|:---:|
| **MAWEJA** (Clients) | `com.edcorp.maweja` | ✅ | ✅ |
| **MAWEJA Driver** (Livreurs) | `com.edcorp.maweja.driver` | ✅ | ❌ |
| Admin Dashboard | — (web uniquement) | ❌ | ❌ |

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
   # macOS / Linux
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

   # Windows (PowerShell)
   $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
   ```

### Pour iOS — App Client uniquement (macOS requis)
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
git clone <URL_DE_VOTRE_REPO> maweja
cd maweja
npm install
```

---

## Étape 2 — Déployer le backend

L'application mobile a besoin d'un backend accessible sur internet.

1. Sur Replit → cliquez **Deploy** en haut à droite
2. Notez l'URL obtenue (ex: `https://maweja.replit.app`)

---

## Étape 3 — Initialiser Capacitor (une seule fois)

### App Client (com.edcorp.maweja) — Android + iOS

```bash
cd mobile/client
npm install

# Ajouter Android
npx cap add android

# Ajouter iOS (macOS uniquement)
npx cap add ios
```

### App Driver (com.edcorp.maweja.driver) — Android uniquement

```bash
cd mobile/driver
npm install

# Ajouter Android
npx cap add android

# ⚠️  Ne pas ajouter iOS — Driver app est Android uniquement
```

---

## Étape 4 — Builders les apps

### App Client

```bash
# Depuis la racine du projet
VITE_API_BASE_URL=https://maweja.replit.app bash mobile/build-client.sh
```

### App Driver

```bash
# Depuis la racine du projet
VITE_API_BASE_URL=https://maweja.replit.app bash mobile/build-driver.sh
```

---

## Étape 5 — Build Android APK (les deux apps)

```bash
# Ouvrir dans Android Studio
cd mobile/client && npx cap open android   # App Client
cd mobile/driver && npx cap open android   # App Driver
```

Dans Android Studio :
1. Attendez la synchronisation Gradle (2-5 minutes)
2. **Build → Generate Signed Bundle / APK...**
3. Choisissez **Android App Bundle (.aab)** pour le Play Store
4. Créez un keystore (voir Étape 7 ci-dessous)
5. Remplissez les infos et cliquez **Finish**

---

## Étape 6 — Build iOS (App Client uniquement — macOS requis)

```bash
cd mobile/client
npx cap open ios
```

Dans Xcode :
1. Connectez votre compte Apple Developer
2. Bundle Identifier : `com.edcorp.maweja`
3. **Product → Archive**
4. Organizer → **Distribute App → App Store Connect**

> **Compte Apple Developer requis** : 99 USD/an sur developer.apple.com

---

## Étape 7 — Créer les Keystores (signature Android)

> **IMPORTANT** : Sauvegardez vos keystores ! Sans eux, vous ne pourrez plus mettre à jour vos apps.

```bash
mkdir -p keystore

# Keystore pour l'App Client (com.edcorp.maweja)
keytool -genkey -v \
  -keystore keystore/maweja-client.jks \
  -alias maweja-client \
  -keyalg RSA -keysize 2048 -validity 10000

# Keystore pour l'App Driver (com.edcorp.maweja.driver)
keytool -genkey -v \
  -keystore keystore/maweja-driver.jks \
  -alias maweja-driver \
  -keyalg RSA -keysize 2048 -validity 10000
```

Informations à renseigner :
- **Prénom et Nom** : Khevin Andrew Kita
- **Organisation** : Ed Corporation
- **Ville** : Kinshasa
- **Code pays** : CD

---

## Étape 8 — Publication sur les Stores

### Google Play Store

| Champ | App Client | App Driver |
|-------|-----------|-----------|
| Nom | MAWEJA | MAWEJA Driver |
| Package | `com.edcorp.maweja` | `com.edcorp.maweja.driver` |
| Catégorie | Alimentation et boissons | Cartes et navigation |
| Frais d'inscription | 25 USD (unique) | (même compte) |

1. Créez un compte sur **play.google.com/console**
2. **Créer une application** → remplissez les informations
3. **Production → Créer une release** → uploadez le fichier `.aab`

### App Store (App Client uniquement)

1. Connectez-vous sur **appstoreconnect.apple.com**
2. **Mes apps → +** → Bundle ID : `com.edcorp.maweja`
3. Complétez les métadonnées et soumettez

---

## Récapitulatif des identifiants

| | App Client | App Driver |
|--|-----------|-----------|
| **Package ID** | `com.edcorp.maweja` | `com.edcorp.maweja.driver` |
| **Nom affiché** | MAWEJA | MAWEJA Driver |
| **Android** | ✅ | ✅ |
| **iOS** | ✅ | ❌ |
| **Keystore** | `keystore/maweja-client.jks` | `keystore/maweja-driver.jks` |

---

## Structure des fichiers

```
maweja/
├── mobile/
│   ├── client/
│   │   ├── capacitor.config.ts   ← com.edcorp.maweja (Android + iOS)
│   │   ├── package.json
│   │   ├── www/                  ← Build web (auto-généré)
│   │   ├── android/              ← Projet Android Studio
│   │   └── ios/                  ← Projet Xcode (macOS seulement)
│   ├── driver/
│   │   ├── capacitor.config.ts   ← com.edcorp.maweja.driver (Android seul)
│   │   ├── package.json
│   │   ├── www/                  ← Build web (auto-généré)
│   │   └── android/              ← Projet Android Studio
│   ├── build-client.sh           ← Build client (Android + iOS)
│   └── build-driver.sh           ← Build driver (Android uniquement)
├── vite.mobile.config.ts
├── MOBILE_BUILD.md               ← Ce guide
└── keystore/                     ← Vos keystores (NE PAS partager ni commiter!)
```

---

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_MOBILE_MODE` | `client` ou `driver` | `client` |
| `VITE_API_BASE_URL` | URL du backend déployé | `https://maweja.replit.app` |

---

## Dépannage fréquent

### "ANDROID_HOME is not set"
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### "Gradle build failed"
```bash
cd mobile/client/android   # ou mobile/driver/android
./gradlew clean && ./gradlew assembleDebug
```

### Les données ne s'affichent pas dans l'app
- Vérifiez que `VITE_API_BASE_URL` pointe vers le backend déployé
- Testez l'URL : `https://maweja.replit.app/api/restaurants`

---

*Made By Khevin Andrew Kita — Ed Corporation | Contact: 0819994041*
