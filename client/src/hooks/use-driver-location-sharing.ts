import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../lib/queryClient";

/**
 * PARTIE 4 — Partage GPS du livreur pendant une livraison active.
 *
 * Hook activé seulement quand `enabled` est vrai (typiquement quand la
 * commande est `confirmed` ou `picked_up`). Il pousse la position toutes les
 * `intervalMs` (par défaut 15s) vers `POST /api/driver/location` avec
 * l'orderId, ce qui permet au backend :
 *   1. de stocker l'historique dans `driver_locations`,
 *   2. de calculer un ETA,
 *   3. de notifier le client via WebSocket `driver_location_update`.
 *
 * Ne tente jamais d'appeler le serveur si la géolocalisation a échoué :
 * cela évite de marquer le livreur comme « visible » avec une position
 * obsolète. L'indicateur visuel est exposé via `gpsActive` et `lastError`.
 */
export interface DriverLocationSharingState {
  gpsActive: boolean;
  lastSentAt: Date | null;
  lastError: string | null;
  position: { lat: number; lng: number } | null;
}

export function useDriverLocationSharing(
  orderId: number | null | undefined,
  enabled: boolean,
  intervalMs: number = 15000,
): DriverLocationSharingState {
  const [gpsActive, setGpsActive] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled || !orderId) {
      setGpsActive(false);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLastError("Géolocalisation indisponible sur cet appareil");
      setGpsActive(false);
      return;
    }

    const ping = () => {
      if (inFlight.current) return;
      inFlight.current = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsActive(true);
          setLastError(null);
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          apiRequest("/api/driver/location", {
            method: "POST",
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              heading: pos.coords.heading ?? undefined,
              speed: pos.coords.speed ?? undefined,
              accuracy: pos.coords.accuracy ?? undefined,
              orderId,
            }),
          })
            .then(() => setLastSentAt(new Date()))
            .catch((err: any) => setLastError(err?.message ?? "Envoi échoué"))
            .finally(() => {
              inFlight.current = false;
            });
        },
        (err) => {
          setGpsActive(false);
          setLastError(err.message || "GPS indisponible");
          inFlight.current = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
      );
    };

    ping();
    const id = setInterval(ping, intervalMs);
    return () => {
      clearInterval(id);
      inFlight.current = false;
    };
  }, [orderId, enabled, intervalMs]);

  return { gpsActive, lastSentAt, lastError, position };
}
