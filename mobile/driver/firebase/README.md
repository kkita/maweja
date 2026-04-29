# Firebase — App MAWEJA Agent (Driver)

## Fichier `google-services.json`

Ce dossier (`mobile/driver/firebase/`) est la **source de vérité** pour le fichier
`google-services.json` exporté depuis la Firebase Console
(projet `maweja-9bf20`).

Le plugin Gradle `com.google.gms.google-services` exige que ce fichier soit
**aussi** présent dans `mobile/driver/android/app/google-services.json`
(emplacement standard Android). Le script `mobile/build-driver.sh` recopie
automatiquement ce fichier au bon endroit avant chaque build.

Pour le mettre à jour :

1. Console Firebase → Paramètres du projet → Onglet *Vos applications* →
   Android (`com.edcorp.maweja.driver`) → bouton *google-services.json* →
   télécharger.
2. Remplacer **ici** le fichier (`mobile/driver/firebase/google-services.json`).
3. Lancer `bash mobile/build-driver.sh` — il recopiera dans `android/app/`.

## Package name

L'app Agent utilise l'`appId` Capacitor `com.edcorp.maweja.driver`
(voir `mobile/driver/capacitor.config.ts`).

Le `google-services.json` actuel contient les trois packages enregistrés
dans Firebase (`com.edcorp.maweja`, `com.edcorp.maweja.driver`,
`com.maweja.client`) — le bon package pour cette app est bien
`com.edcorp.maweja.driver`.
