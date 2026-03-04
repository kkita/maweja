# Mon Food Livreur - Guide de generation APK avec Apache Cordova

## Pre-requis a installer sur votre machine

### 1. Node.js
- Telechargez et installez Node.js depuis : https://nodejs.org/
- Version recommandee : 18 ou superieure
- Verifiez l'installation : `node --version`

### 2. Java JDK
- Installez Java JDK 17 : https://adoptium.net/
- Configurez la variable JAVA_HOME :
  - Windows : Panneau de config > Variables d'environnement > JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17...
  - Mac/Linux : `export JAVA_HOME=/usr/lib/jvm/java-17`

### 3. Android Studio
- Telechargez depuis : https://developer.android.com/studio
- Pendant l'installation, cochez "Android SDK"
- Apres installation, ouvrez Android Studio > SDK Manager > Installez :
  - Android SDK Platform 33 (ou superieur)
  - Android SDK Build-Tools
  - Android SDK Command-line Tools
- Configurez ANDROID_HOME :
  - Windows : `ANDROID_HOME = C:\Users\VOTRE_NOM\AppData\Local\Android\Sdk`
  - Mac : `export ANDROID_HOME=~/Library/Android/sdk`
  - Linux : `export ANDROID_HOME=~/Android/Sdk`
- Ajoutez au PATH : `%ANDROID_HOME%\platform-tools` et `%ANDROID_HOME%\tools`

### 4. Gradle
- Telechargez depuis : https://gradle.org/releases/
- Ajoutez au PATH

### 5. Apache Cordova
```bash
npm install -g cordova
```

## Etapes pour generer l'APK

### Etape 1 : Extraire le ZIP
Extrayez le fichier `mon-food-livreur-cordova.zip` dans un dossier sur votre machine.

### Etape 2 : Ouvrir un terminal
Ouvrez un terminal (CMD, PowerShell ou Terminal) et naviguez vers le dossier extrait :
```bash
cd chemin/vers/mon-food-livreur-cordova
```

### Etape 3 : Ajouter la plateforme Android
```bash
cordova platform add android
```

### Etape 4 : Compiler en mode Debug (pour tester)
```bash
cordova build android
```
L'APK sera genere dans :
`platforms/android/app/build/outputs/apk/debug/app-debug.apk`

### Etape 5 : Compiler en mode Release (pour publier)
```bash
cordova build android --release
```
L'APK sera dans :
`platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk`

### Etape 6 : Signer l'APK (pour le Play Store)
```bash
# Generer une cle de signature (une seule fois)
keytool -genkey -v -keystore mon-food-livreur.keystore -alias monfoodlivreur -keyalg RSA -keysize 2048 -validity 10000

# Signer l'APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore mon-food-livreur.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk monfoodlivreur

# Optimiser avec zipalign
zipalign -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk mon-food-livreur.apk
```

### Etape 7 : Installer sur un telephone
```bash
# Connectez votre telephone en USB (mode developpeur active)
adb install mon-food-livreur.apk
```
Ou copiez simplement le fichier APK sur votre telephone et ouvrez-le.

## Depannage

### Erreur "ANDROID_HOME is not set"
Verifiez que la variable d'environnement ANDROID_HOME pointe vers votre SDK Android.

### Erreur "No installed build tools found"
Ouvrez Android Studio > SDK Manager > SDK Tools > Installez "Android SDK Build-Tools".

### Erreur "Could not determine java version"
Verifiez que JAVA_HOME pointe vers JDK 17 et que `java --version` fonctionne.

## Support
Khevin Andrew Kita - Ed Corporation
Tel: 0911742202
