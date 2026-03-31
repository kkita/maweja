export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  color: string;
  neighborhoods: string[];
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "A",
    name: "Zone A",
    fee: 261,
    color: "#22c55e",
    neighborhoods: [
      "gombe",
      "lingwala",
    ],
  },
  {
    id: "B",
    name: "Zone B",
    fee: 370,
    color: "#f59e0b",
    neighborhoods: [
      "bandalungwa",
      "kinshasa",
      "kintambo",
      "barumbu",
      "ngiri-ngiri",
      "ngiri ngiri",
      "limete 1",
      "limete 2",
      "limete 3",
      "limete 4",
      "limete 5",
      "limete 6",
      "limete 7",
      "1ere rue",
      "2eme rue",
      "3eme rue",
      "4eme rue",
      "5eme rue",
      "6eme rue",
      "7eme rue",
      "1ère rue",
      "2ème rue",
      "3ème rue",
      "4ème rue",
      "5ème rue",
      "6ème rue",
      "7ème rue",
      "saint luc",
      "macampagne",
      "sakombi",
      "station macampagne",
    ],
  },
  {
    id: "C",
    name: "Zone C",
    fee: 609,
    color: "#ef4444",
    neighborhoods: [
      "haute-tension",
      "haute tension",
      "dgc",
      "limete 8",
      "limete 9",
      "limete 10",
      "limete 11",
      "limete 12",
      "limete 13",
      "limete 14",
      "limete 15",
      "limete 16",
      "8eme rue",
      "9eme rue",
      "10eme rue",
      "11eme rue",
      "12eme rue",
      "13eme rue",
      "14eme rue",
      "15eme rue",
      "16eme rue",
      "8ème rue",
      "9ème rue",
      "10ème rue",
      "11ème rue",
      "12ème rue",
      "13ème rue",
      "14ème rue",
      "15ème rue",
      "16ème rue",
      "poids lourds",
      "kingabwa",
      "lemba foire",
      "lemba super",
      "lemba terminus",
      "lemba salongo",
      "ngaliema",
      "brikin",
      "ozone",
      "pigeon",
      "mimosas",
      "delvaux",
      "meteo",
      "météo",
      "gramalic",
      "grammalic",
      "yolo",
    ],
  },
];

export interface ZoneResult {
  zone: DeliveryZone | null;
  fee: number;
  allowed: boolean;
  label: string;
}

export function detectZoneFromAddress(address: string): ZoneResult {
  if (!address || !address.trim()) {
    return { zone: null, fee: 0, allowed: false, label: "Adresse non renseignée" };
  }

  const lower = address.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const zone of DELIVERY_ZONES) {
    for (const hood of zone.neighborhoods) {
      const normalized = hood.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lower.includes(normalized)) {
        return {
          zone,
          fee: zone.fee,
          allowed: true,
          label: `${zone.name} — $${(zone.fee / 100).toFixed(2)}`,
        };
      }
    }
  }

  return { zone: null, fee: 0, allowed: false, label: "Hors zone de livraison" };
}

export function detectZoneFromCoords(lat: number, lng: number): ZoneResult {
  const makeResult = (z: DeliveryZone): ZoneResult => ({
    zone: z, fee: z.fee, allowed: true, label: `${z.name} — $${(z.fee / 100).toFixed(2)}`
  });

  if (lat >= -4.310 && lat <= -4.290 && lng >= 15.280 && lng <= 15.320) {
    return makeResult(DELIVERY_ZONES[0]);
  }

  if (lat >= -4.340 && lat <= -4.310 && lng >= 15.260 && lng <= 15.340) {
    return makeResult(DELIVERY_ZONES[1]);
  }

  if (lat >= -4.390 && lat <= -4.340 && lng >= 15.240 && lng <= 15.380) {
    return makeResult(DELIVERY_ZONES[2]);
  }

  if (lat >= -4.310 && lat <= -4.280 && lng >= 15.240 && lng <= 15.280) {
    return makeResult(DELIVERY_ZONES[1]);
  }

  if (lat >= -4.350 && lat <= -4.310 && lng >= 15.340 && lng <= 15.400) {
    return makeResult(DELIVERY_ZONES[2]);
  }

  return { zone: null, fee: 0, allowed: false, label: "" };
}

export function detectZone(address: string, lat?: number | null, lng?: number | null): ZoneResult {
  const byAddress = detectZoneFromAddress(address);
  if (byAddress.allowed) return byAddress;

  if (lat && lng) {
    const byCoords = detectZoneFromCoords(lat, lng);
    if (byCoords.allowed) return byCoords;
  }

  return { zone: null, fee: 0, allowed: false, label: "Hors zone de livraison" };
}

export function formatZoneFee(fee: number): string {
  return `$${(fee / 100).toFixed(2)}`;
}
