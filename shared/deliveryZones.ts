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
      "commune de kinshasa",
      "c/kinshasa",
      "kintambo",
      "barumbu",
      "ngiri-ngiri",
      "ngiri ngiri",
      "ngiri",
      "kalamu",
      "makala",
      "bumbu",
      "kasavubu",
      "kasa-vubu",
      "kasa vubu",
      "limete 1",
      "limete 2",
      "limete 3",
      "limete 4",
      "limete 5",
      "limete 6",
      "limete 7",
      "1ere rue limete",
      "2eme rue limete",
      "3eme rue limete",
      "4eme rue limete",
      "5eme rue limete",
      "6eme rue limete",
      "7eme rue limete",
      "1ère rue limete",
      "2ème rue limete",
      "3ème rue limete",
      "4ème rue limete",
      "5ème rue limete",
      "6ème rue limete",
      "7ème rue limete",
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
      "8eme rue limete",
      "9eme rue limete",
      "10eme rue limete",
      "11eme rue limete",
      "12eme rue limete",
      "13eme rue limete",
      "14eme rue limete",
      "15eme rue limete",
      "16eme rue limete",
      "8ème rue limete",
      "9ème rue limete",
      "10ème rue limete",
      "11ème rue limete",
      "12ème rue limete",
      "13ème rue limete",
      "14ème rue limete",
      "15ème rue limete",
      "16ème rue limete",
      "selembao",
      "poids lourds",
      "kingabwa",
      "lemba foire",
      "lemba super",
      "lemba terminus",
      "lemba salongo",
      "lemba",
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

const AMBIGUOUS_CITY_NAMES = ["kinshasa", "kin", "rdc", "congo"];

export interface ZoneResult {
  zone: DeliveryZone | null;
  fee: number;
  allowed: boolean;
  label: string;
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function wordBoundaryMatch(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|[\\s,./;:\\-–—'"()\\[\\]])${escaped}(?:$|[\\s,./;:\\-–—'"()\\[\\]])`, "i");
  return regex.test(` ${haystack} `);
}

export function detectZoneFromAddress(address: string): ZoneResult {
  if (!address || !address.trim()) {
    return { zone: null, fee: 0, allowed: false, label: "Adresse non renseignée" };
  }

  const lower = normalizeText(address);

  const allMatches: { zone: DeliveryZone; hood: string; length: number }[] = [];

  for (const zone of DELIVERY_ZONES) {
    for (const hood of zone.neighborhoods) {
      const normalized = normalizeText(hood);
      if (AMBIGUOUS_CITY_NAMES.includes(normalized)) continue;

      if (wordBoundaryMatch(lower, normalized)) {
        allMatches.push({ zone, hood: normalized, length: normalized.length });
      }
    }
  }

  if (allMatches.length === 0) {
    return { zone: null, fee: 0, allowed: false, label: "Hors zone de livraison" };
  }

  allMatches.sort((a, b) => b.length - a.length);
  const best = allMatches[0];

  return {
    zone: best.zone,
    fee: best.zone.fee,
    allowed: true,
    label: `${best.zone.name} — $${(best.zone.fee / 100).toFixed(2)}`,
  };
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
