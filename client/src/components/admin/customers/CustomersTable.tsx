import { Ban, CheckCircle2 } from "lucide-react";
import { formatPrice } from "../../../lib/utils";
import Avatar from "./Avatar";
import SegmentBadge from "./SegmentBadge";
import type { EnrichedCustomer } from "./types";

interface Props {
  customers: EnrichedCustomer[];
  onSelect: (id: number) => void;
  onToggleBlock: (c: EnrichedCustomer) => void;
  blockPending: boolean;
}

export default function CustomersTable({ customers, onSelect, onToggleBlock, blockPending }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
            <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Segment</th>
              <th className="px-4 py-3 text-right">Commandes</th>
              <th className="px-4 py-3 text-right">Dépensé</th>
              <th className="px-4 py-3 text-right">Panier moyen</th>
              <th className="px-4 py-3 text-right">Wallet</th>
              <th className="px-4 py-3 text-right">Points</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr
                key={c.id}
                className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition cursor-pointer"
                onClick={() => onSelect(c.id)}
                data-testid={`row-client-${c.id}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar customer={c} size={38} />
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-white truncate max-w-[180px]">{c.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate max-w-[180px]">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><SegmentBadge customer={c} /></td>
                <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-white">{c.orderCount}</td>
                <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-white">{formatPrice(c.totalSpent)}</td>
                <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{c.aov > 0 ? formatPrice(c.aov) : "—"}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">{formatPrice(c.walletBalance || 0)}</td>
                <td className="px-4 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">{c.loyaltyPoints || 0}</td>
                <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleBlock(c)}
                    disabled={blockPending}
                    data-testid={`btn-toggle-${c.id}`}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      c.isBlocked
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    {c.isBlocked ? <CheckCircle2 size={11} /> : <Ban size={11} />}
                    {c.isBlocked ? "Débloquer" : "Bloquer"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
