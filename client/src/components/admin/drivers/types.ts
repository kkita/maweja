/* Type partagé pour les sous-composants d'AdminDrivers.
   La forme exacte vient de la jointure users + driverProfiles côté API,
   non typée à la racine — on capture ici seulement les champs utilisés. */
export interface DispatchDriver {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  driverLicense?: string | null;
  commissionRate?: number | null;
  isOnline?: boolean | null;
  isActive?: boolean | null;
  isAvailable?: boolean | null;
  isVerified?: boolean | null;
  isBlocked?: boolean | null;
  avatar?: string | null;
  rating?: number | null;
  totalDeliveries?: number | null;
  walletBalance?: number | null;
  lat?: number | null;
  lng?: number | null;
  createdAt?: string | Date | null;
  [k: string]: unknown;
}
