/**
 * Calcul d'ETA (PARTIE 4 — tracking livreur).
 *
 * Implémentation volontairement simple : distance haversine entre la
 * position actuelle du livreur et la destination du client, divisée par
 * une vitesse moyenne configurable. Pas d'appel à une API tierce pour
 * commencer — l'objectif est d'avoir un signal raisonnable côté client
 * sans dépendance externe.
 *
 * Plus tard, on pourra brancher Google Maps Distance Matrix / Mapbox /
 * OSRM derrière la même interface (`computeEta`) sans toucher aux
 * appelants : il suffira de remplacer le corps de la fonction.
 */

/** Vitesse moyenne par défaut d'un livreur à Kinshasa (km/h, embouteillages compris). */
export const DEFAULT_AVG_SPEED_KMH = 22;

/** Buffer minimal ajouté à toute estimation (minutes) — temps client/parking. */
const ETA_MIN_BUFFER_MINUTES = 2;

export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Distance grand-cercle entre deux points (en kilomètres).
 * Formule de haversine, R = 6371 km.
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface EtaResult {
  /** Distance restante en kilomètres (arrondie à 0.1 près). */
  distanceKm: number;
  /** Estimation du temps restant en minutes (entier). */
  minutes: number;
  /** Vitesse moyenne utilisée (km/h). */
  avgSpeedKmh: number;
  /** Date estimée d'arrivée (ISO string). */
  arrivalAt: string;
}

/**
 * Calcule l'ETA entre la position du livreur et la destination du client.
 * Renvoie `null` si l'une des coordonnées est manquante ou invalide.
 */
export function computeEta(
  driverPos: LatLng | null | undefined,
  destination: LatLng | null | undefined,
  avgSpeedKmh: number = DEFAULT_AVG_SPEED_KMH,
): EtaResult | null {
  if (
    !driverPos ||
    !destination ||
    !Number.isFinite(driverPos.latitude) ||
    !Number.isFinite(driverPos.longitude) ||
    !Number.isFinite(destination.latitude) ||
    !Number.isFinite(destination.longitude)
  ) {
    return null;
  }
  const speed = avgSpeedKmh > 0 ? avgSpeedKmh : DEFAULT_AVG_SPEED_KMH;
  const distanceKm = haversineKm(driverPos, destination);
  const rawMinutes = (distanceKm / speed) * 60;
  const minutes = Math.max(1, Math.round(rawMinutes + ETA_MIN_BUFFER_MINUTES));
  const arrivalAt = new Date(Date.now() + minutes * 60_000).toISOString();
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    minutes,
    avgSpeedKmh: speed,
    arrivalAt,
  };
}

/**
 * Texte de statut « parlant » pour le client en fonction de la distance
 * restante et du statut commande.
 */
export function statusTextFromContext(
  orderStatus: string,
  distanceKm: number | null,
): string {
  if (orderStatus === "delivered") return "Commande livrée";
  if (orderStatus === "cancelled") return "Commande annulée";
  if (orderStatus === "pending") return "Commande en attente de validation";
  if (orderStatus === "confirmed" || orderStatus === "preparing") {
    return "Le restaurant prépare votre commande";
  }
  if (orderStatus === "ready") return "Votre commande est prête à être récupérée";
  if (orderStatus === "picked_up") {
    if (distanceKm == null) return "Votre livreur est en route";
    if (distanceKm < 0.3) return "Le livreur est à votre porte";
    if (distanceKm < 1) return "Le livreur est tout proche";
    if (distanceKm < 3) return "Votre livreur arrive bientôt";
    return "Votre livreur est en route";
  }
  return "Suivi en cours";
}
