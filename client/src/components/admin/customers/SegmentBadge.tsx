import { Ban, Crown, Sparkles, Clock } from "lucide-react";
import type { EnrichedCustomer } from "./types";

export function Badge({ children, color, icon }: { children: React.ReactNode; color: string; icon?: React.ReactNode }) {
  const palette: Record<string, string> = {
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/40",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
    zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/40",
    green: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-100 dark:border-green-900/40",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${palette[color]}`}>
      {icon}{children}
    </span>
  );
}

interface Props {
  customer: Pick<EnrichedCustomer, "isBlocked" | "isVIP" | "isNew" | "isDormant">;
}

export default function SegmentBadge({ customer }: Props) {
  if (customer.isBlocked) return <Badge color="red" icon={<Ban size={10} />}>Bloqué</Badge>;
  if (customer.isVIP) return <Badge color="amber" icon={<Crown size={10} />}>VIP</Badge>;
  if (customer.isNew) return <Badge color="emerald" icon={<Sparkles size={10} />}>Nouveau</Badge>;
  if (customer.isDormant) return <Badge color="zinc" icon={<Clock size={10} />}>Dormant</Badge>;
  return <Badge color="blue">Régulier</Badge>;
}
