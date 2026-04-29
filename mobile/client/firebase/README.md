# Firebase — App MAWEJA Client

## Fichier `google-services.json`

Ce dossier (`mobile/client/firebase/`) est la **source de vérité** pour le fichier
`google-services.json` exporté depuis la Firebase Console
(projet `maweja-9bf20`).

Le plugin Gradle `com.google.gms.google-services` exige que ce fichier soit
**aussi** présent dans `mobile/client/android/app/google-services.json`
(emplacement standard Android). Le script `mobile/build-client.sh` recopie
automatiquement ce fichier au bon endroit avant chaque build.

Pour le mettre à jour :

1. Console Firebase → Paramètres du projet → Onglet *Vos applications* →
   Android (`com.edcorp.maweja`) → bouton *google-services.json* → télécharger.
2. Remplacer **ici** le fichier (`mobile/client/firebase/google-services.json`).
3. Lancer `bash mobile/build-client.sh` — il recopiera dans `android/app/`.

## Package name

L'app Client utilise l'`appId` Capacitor `com.edcorp.maweja`
(voir `mobile/client/capacitor.config.ts`).

Le `google-services.json` actuel contient également l'ancien package
`com.maweja.client` pour rétro-compatibilité avec d'anciennes versions
internes — le bon package en production est bien `com.edcorp.maweja`.
