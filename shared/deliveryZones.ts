export interface DeliveryZoneData {
  id: number;
  name: string;
  fee: number;
  color: string;
  neighborhoods: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface ZoneResult {
  zone: DeliveryZoneData | null;
  fee: number;
  allowed: boolean;
  label: string;
}

const AMBIGUOUS_CITY_NAMES = ["kinshasa", "kin", "rdc", "congo"];

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function wordBoundaryMatch(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|[\\s,./;:\\-–—'"()\\[\\]])${escaped}(?:$|[\\s,./;:\\-–—'"()\\[\\]])`, "i");
  return regex.test(` ${haystack} `);
}

export function detectZoneFromAddress(address: string, zones: DeliveryZoneData[]): ZoneResult {
  if (!address || !address.trim()) {
    return { zone: null, fee: 0, allowed: false, label: "Adresse non renseignée" };
  }

  const lower = normalizeText(address);
  const activeZones = zones.filter(z => z.isActive);
  const allMatches: { zone: DeliveryZoneData; hood: string; length: number }[] = [];

  for (const zone of activeZones) {
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
    label: `${best.zone.name} — $${best.zone.fee.toFixed(2)}`,
  };
}

export function detectZone(address: string, zones: DeliveryZoneData[]): ZoneResult {
  return detectZoneFromAddress(address, zones);
}

export function formatZoneFee(fee: number): string {
  return `$${fee.toFixed(2)}`;
}
