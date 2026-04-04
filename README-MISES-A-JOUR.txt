═══════════════════════════════════════════════════════════
  MAWEJA — Mises à jour (04 Avril 2026)
═══════════════════════════════════════════════════════════

FICHIERS MODIFIÉS À REPORTER DANS VOTRE DÉPÔT GITHUB :

──────────────────────────────────────────────────────────
  1. CONNEXION AGENT — Email OU Numéro de téléphone
──────────────────────────────────────────────────────────
  client/src/pages/DriverLoginPage.tsx
  server/routes.ts  (route login mise à jour)
  server/storage.ts (nouvelle méthode getUserByPhone)

──────────────────────────────────────────────────────────
  2. BUG CRÉATION PUBLICITÉ — Corrigé
──────────────────────────────────────────────────────────
  server/routes.ts  (POST /api/advertisements corrigé)
    → Conversion types FormData (isActive, sortOrder)
    → Fonction buildUploadUrl réintégrée
    → Gestion d'erreurs ajoutée

──────────────────────────────────────────────────────────
  3. CONFIDENTIALITÉ — Adresse cachée côté client
──────────────────────────────────────────────────────────
  client/src/pages/client/RestaurantPage.tsx
  client/src/pages/client/BoutiquesPage.tsx
    → L'adresse n'est plus visible dans l'app client

──────────────────────────────────────────────────────────
  4. FACTURE AGENT — Frais de service affichés
──────────────────────────────────────────────────────────
  client/src/pages/driver/DriverOrderDetail.tsx
    → Ligne "Frais de service" ajoutée à la facture

──────────────────────────────────────────────────────────
  5. NOTIFICATIONS DASHBOARD — Panneau complet
──────────────────────────────────────────────────────────
  client/src/pages/admin/AdminDashboard.tsx
    → Sonnerie Web Audio sur nouvelle commande/demande
    → Panneau déroulant avec liste de notifications
    → Suppression individuelle ou globale
    → Marquage comme lu automatique

──────────────────────────────────────────────────────────
  ICÔNES APPLICATIONS MOBILES
──────────────────────────────────────────────────────────
  android/driver-icons/   → Icônes app MAWEJA Agent
  android/client-icons/   → Icônes app MAWEJA Client
  mobile/driver/          → Config Capacitor Agent
  mobile/client/          → Config Capacitor Client
  client/public/          → Icônes web

══════════════════════════════════════════════════════════
  INSTRUCTIONS
══════════════════════════════════════════════════════════
  Copiez chaque fichier dans votre dépôt en respectant
  l'arborescence indiquée ci-dessus, puis committez
  et synchronisez via GitHub Desktop.
═══════════════════════════════════════════════════════════
