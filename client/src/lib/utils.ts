import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return "$" + new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-CD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export const statusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmee",
  preparing: "En preparation",
  ready: "Prete",
  picked_up: "En livraison",
  delivered: "Livree",
  returned: "Retournee",
  cancelled: "Annulee",
};

export const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  picked_up: "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
  returned: "bg-amber-100 text-amber-800",
  cancelled: "bg-red-100 text-red-800",
};

export const paymentLabels: Record<string, string> = {
  mobile_money: "Mobile Money",
  cash: "Cash",
  illico_cash: "Illico Cash",
  wallet: "Wallet MAWEJA",
  loyalty: "Points de fidelite",
  card: "Carte Bancaire",
  google_pay: "Google Pay",
  pos: "POS",
  credit_card: "Carte de Credit",
};
