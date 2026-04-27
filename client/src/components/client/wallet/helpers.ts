import { palette } from "../../../design-system/tokens";
import type { WalletTransaction } from "@shared/schema";

export interface LoyaltyCredit {
  id: number;
  amount: number;
  pointsConverted: number;
  isUsed: boolean;
  isExpired: boolean;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

export const TOPUP_METHODS = ["Airtel Money", "M-PESA", "Orange Money", "AfriMoney", "Illico Cash"];
export const QUICK_AMOUNTS = ["5", "10", "20", "50"];

export const LOYALTY_TIERS = [
  { label: "Bronze",  min: 0,    max: 499,  ...palette.tier.bronze },
  { label: "Argent",  min: 500,  max: 999,  ...palette.tier.silver },
  { label: "Or",      min: 1000, max: 2999, ...palette.tier.gold },
  { label: "Platine", min: 3000, max: Infinity, ...palette.tier.platinum },
];

export function getTier(points: number) {
  return LOYALTY_TIERS.find(t => points >= t.min && points <= t.max) ?? LOYALTY_TIERS[0];
}

export function groupByDate(txs: WalletTransaction[]) {
  const map = new Map<string, WalletTransaction[]>();
  txs.forEach(tx => {
    const key = tx.createdAt
      ? new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  });
  return Array.from(map.entries());
}
