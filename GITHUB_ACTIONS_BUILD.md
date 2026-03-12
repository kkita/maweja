# MAWEJA — Build Cloud via GitHub Actions
## APK Android + IPA iOS sans Android Studio ni Xcode local

> **Fait par Khevin Andrew Kita — Ed Corporation**
> Contact: 0819994041

---

## Pourquoi GitHub Actions ?

| | GitHub Actions | EAS Build (Expo) | Ionic Appflow |
|--|:-:|:-:|:-:|
| Compatible Capacitor | ✅ | ❌ (React Native seulement) | ✅ |
| Gratuit | ✅ (2000 min/mois) | ⚠️ (limité) | ❌ (payant) |
| Android APK | ✅ | — | ✅ |
| iOS IPA (cloud) | ✅ (macOS runner) | — | ✅ |
| Aucune install locale | ✅ | — | ✅ |

---

## Architecture des builds

```
GitHub Push → GitHub Actions → Build Cloud → Téléchargement APK/IPA
                  │
                  ├── build-android.yml → Ubuntu runner (gratuit)
                  │     ├── MAWEJA Client APK (com.edcorp.maweja)
                  │     └── MAWEJA Driver APK (com.edcorp.maweja.driver)
                  │
                  └── build-ios.yml → macOS runner (consomme + de minutes)
                        └── MAWEJA Client IPA (com.edcorp.maweja)
```

---

## ÉTAPE 1 — Créer un compte GitHub et pusher le code

### 1.1 — Créer un compte GitHub
→ https://github.com (gratuit)

### 1.2 — Créer un nouveau dépôt (repository)
1. Cliquez **"New repository"**
2. Nom : `maweja`
3. Visibilité : **Private** (recommandé)
4. **Ne pas** cocher "Initialize with README"
5. Cliquez **Create repository**

### 1.3 — Pusher le code depuis Replit

Dans le terminal Replit (Shell) :

```bash
# Configurer git avec vos infos
git config --global user.email "votre@email.com"
git config --global user.name "Khevin Andrew Kita"

# Ajouter le remote GitHub (remplacez par votre URL)
git remote add origin https://github.com/VOTRE_USERNAME/maweja.git

# Pusher le code
git push -u origin main
```

> Si git vous demande un mot de passe, utilisez un **Personal Access Token** GitHub :
> GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
> Cochez : `repo` → Generate → Copiez le token → utilisez-le comme mot de passe

---

## ÉTAPE 2 — Configurer les Secrets GitHub

Dans votre repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**

### Secrets requis pour tous les builds

| Secret | Description | Comment l'obtenir |
|--------|-------------|-------------------|
| `API_BASE_URL` | URL du backend déployé | `https://maweja.net` |

---

### Secrets pour Android Release (Play Store)

Vous devez d'abord créer les keystores (une seule fois) :

#### Créer les keystores sur n'importe quel PC avec Java installé

```bash
# Keystore Client
keytool -genkey -v \
  -keystore maweja-client.jks \
  -alias maweja-client \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass VotreMotDePasse123 \
  -keypass VotreMotDePasse123 \
  -dname "CN=Khevin Andrew Kita, OU=Ed Corporation, O=Ed Corporation, L=Kinshasa, S=Kinshasa, C=CD"

# Keystore Driver
keytool -genkey -v \
  -keystore maweja-driver.jks \
  -alias maweja-driver \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass VotreMotDePasse123 \
  -keypass VotreMotDePasse123 \
  -dname "CN=Khevin Andrew Kita, OU=Ed Corporation, O=Ed Corporation, L=Kinshasa, S=Kinshasa, C=CD"
```

#### Convertir en Base64 pour GitHub Secrets

```bash
# Sur Linux/macOS
base64 -i maweja-client.jks -o maweja-client.jks.b64
base64 -i maweja-driver.jks -o maweja-driver.jks.b64

# Sur Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("maweja-client.jks")) | Out-File maweja-client.jks.b64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("maweja-driver.jks")) | Out-File maweja-driver.jks.b64
```

#### Ajouter dans GitHub Secrets

| Secret | Valeur |
|--------|--------|
| `CLIENT_KEYSTORE_BASE64` | Contenu de `maweja-client.jks.b64` |
| `CLIENT_KEYSTORE_PASSWORD` | `VotreMotDePasse123` |
| `CLIENT_KEY_ALIAS` | `maweja-client` |
| `CLIENT_KEY_PASSWORD` | `VotreMotDePasse123` |
| `DRIVER_KEYSTORE_BASE64` | Contenu de `maweja-driver.jks.b64` |
| `DRIVER_KEYSTORE_PASSWORD` | `VotreMotDePasse123` |
| `DRIVER_KEY_ALIAS` | `maweja-driver` |
| `DRIVER_KEY_PASSWORD` | `VotreMotDePasse123` |

> ⚠️ **CONSERVEZ PRÉCIEUSEMENT** les fichiers `.jks` — sans eux, vous ne pourrez plus mettre à jour vos apps sur le Play Store !

---

### Secrets pour iOS Release (App Store)
> Nécessite un compte Apple Developer (99 USD/an)

| Secret | Description |
|--------|-------------|
| `IOS_CERTIFICATE_BASE64` | Certificat P12 en Base64 |
| `IOS_CERTIFICATE_PASSWORD` | Mot de passe du certificat P12 |
| `IOS_PROVISION_PROFILE_BASE64` | Profil de provisioning en Base64 |
| `IOS_PROVISION_PROFILE_NAME` | Nom du profil (ex: "MAWEJA AppStore") |
| `IOS_TEAM_ID` | Votre Team ID Apple (10 caractères) |

#### Obtenir ces fichiers depuis Apple Developer Portal
1. Allez sur https://developer.apple.com/account
2. **Certificates, Identifiers & Profiles**
3. Créez un **App ID** : `com.edcorp.maweja`
4. Créez un **Distribution Certificate** → téléchargez → exportez en .p12
5. Créez un **App Store Provisioning Profile** → téléchargez `.mobileprovision`
6. Convertissez en Base64 :
   ```bash
   base64 -i certificate.p12 -o certificate.b64
   base64 -i profile.mobileprovision -o profile.b64
   ```

---

## ÉTAPE 3 — Lancer les builds

### Build Android (debug — sans signing, pour tester)

1. GitHub → votre repo → **Actions**
2. Cliquez sur **"Build Android APKs (Client + Driver)"**
3. Cliquez **"Run workflow"** → Branch: `main` → Type: `debug` → **Run workflow**
4. Attendez ~15-25 minutes
5. Cliquez sur le build terminé → **Artifacts** → téléchargez les APKs

### Build Android (release — pour le Play Store)

Même procédure mais choisissez `release` au lieu de `debug`.
→ Produit un fichier `.aab` à uploader sur Google Play Console.

### Build iOS (Client uniquement)

1. GitHub → Actions → **"Build iOS IPA (Client uniquement)"**
2. **"Run workflow"** → Type: `debug` (simulateur) ou `release` (App Store)
3. Attendez ~20-40 minutes (macOS runner est plus lent)
4. Téléchargez l'IPA depuis les artifacts

---

## ÉTAPE 4 — Installer l'APK Debug sur votre téléphone

Pour tester l'APK debug directement :

1. **Activez "Sources inconnues"** sur votre téléphone Android :
   - Paramètres → Sécurité → Sources inconnues → Activer
   - (Ou : Paramètres → Applications → Installation d'apps inconnues)
2. Transférez l'APK sur votre téléphone (USB, WhatsApp, email...)
3. Ouvrez le fichier APK → Installer

---

## ÉTAPE 5 — Publier sur Google Play Store

1. Créez un compte sur **play.google.com/console** (25 USD unique)
2. **Créer une application** → "MAWEJA" + "MAWEJA Driver"
3. Uploadez le fichier `.aab` (release)
4. Complétez la fiche store :
   - **Description courte** : Commandez de la nourriture et services à Kinshasa
   - **Description longue** : MAWEJA est la plateforme de livraison de nourriture et services à Kinshasa, RDC...
   - **Catégorie** : Alimentation et boissons
   - **Captures d'écran** : minimum 2 screenshots de l'app
5. Soumettez → révision 1-3 jours

---

## Résumé des fichiers créés

```
.github/
└── workflows/
    ├── build-android.yml   ← Build APK/AAB Android (Client + Driver)
    └── build-ios.yml       ← Build IPA iOS (Client uniquement)
```

---

## Consommation des minutes GitHub Actions

| Build | Runner | Durée estimée | Minutes GitHub |
|-------|--------|---------------|----------------|
| Android Debug (Client) | Ubuntu | ~15 min | 15 min |
| Android Debug (Driver) | Ubuntu | ~15 min | 15 min |
| iOS Debug (Client) | macOS | ~20 min | 200 min* |
| Android Release (Client) | Ubuntu | ~20 min | 20 min |
| Android Release (Driver) | Ubuntu | ~20 min | 20 min |
| iOS Release (Client) | macOS | ~30 min | 300 min* |

*Les runners macOS consomment 10x plus de minutes.  
**Plan GitHub Free** : 2000 min/mois Linux, 200 min/mois macOS.

→ Pour les builds iOS fréquents, envisagez le plan **GitHub Pro** (4 USD/mois).

---

*Made By Khevin Andrew Kita — Ed Corporation | Contact: 0819994041*
