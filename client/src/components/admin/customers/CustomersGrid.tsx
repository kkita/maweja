import { formatPrice } from "../../../lib/utils";
import Avatar from "./Avatar";
import SegmentBadge from "./SegmentBadge";
import type { EnrichedCustomer } from "./types";

interface Props {
  customers: EnrichedCustomer[];
  onSelect: (id: number) => void;
}

export default function CustomersGrid({ customers, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {customers.map(c => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          data-testid={`card-client-${c.id}`}
          className="text-left bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 hover:shadow-lg hover:border-red-200 dark:hover:border-red-900/40 transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between mb-3">
            <Avatar customer={c} size={48} />
            <SegmentBadge customer={c} />
          </div>
          <p className="font-bold text-zinc-900 dark:text-white truncate">{c.name}</p>
          <p className="text-xs text-zinc-400 truncate mb-3">{c.phone}</p>
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-50 dark:border-zinc-800">
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Commandes</p>
              <p className="font-black text-zinc-900 dark:text-white">{c.orderCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Dépensé</p>
              <p className="font-black text-zinc-900 dark:text-white">{formatPrice(c.totalSpent)}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Wallet</p>
              <p className="font-bold text-green-600 dark:text-green-400 text-sm">{formatPrice(c.walletBalance || 0)}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Points</p>
              <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">{c.loyaltyPoints || 0}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
