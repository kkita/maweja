/* ─────────────────────────────────────────────────────────────
   MAWEJA — Notify : événements agents, vérifications & alertes
   ───────────────────────────────────────────────────────────── */
import { playRingtone, vibrate, showNotif } from "./notifyAudio";

export interface DriverEventData {
  type: string;
  reason?: string;
  driverName?: string;
  name?: string;
  [k: string]: unknown;
}

/**
 * Returns true if the event was matched & handled.
 */
export function handleDriverEvent(data: DriverEventData): boolean {
  switch (data.type) {
    case "alarm": {
      playRingtone(); vibrate("long");
      showNotif("🚨 MAWEJA – ALERTE", data.reason || "Urgence - Contactez l'administration");
      return true;
    }
    case "verification_approved": {
      playRingtone(); vibrate("double");
      showNotif("✅ MAWEJA – Vérification", "Votre compte a été approuvé !");
      return true;
    }
    case "verification_rejected": {
      playRingtone(); vibrate("medium");
      showNotif("⚠️ MAWEJA – Vérification", "Des corrections sont requises sur votre profil.");
      return true;
    }
    case "driver_verification": {
      playRingtone(); vibrate("medium");
      showNotif("📋 MAWEJA – Admin", data.driverName ? `${data.driverName} a soumis ses documents` : "Un agent a soumis ses documents pour vérification");
      return true;
    }
    case "new_user": {
      playRingtone(); vibrate("light");
      showNotif("👤 MAWEJA – Admin", data.name ? `${data.name} vient de s'inscrire` : "Un nouvel utilisateur s'est inscrit");
      return true;
    }
    default:
      return false;
  }
}
