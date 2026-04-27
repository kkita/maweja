import { Wallet, ArrowDownLeft, ArrowUpRight, History } from "lucide-react";
import { motion } from "../../../lib/motion";
import { palette, brand, tints } from "../../../design-system/tokens";
import { formatPrice } from "../../../lib/utils";
import { SkeletonPulse } from "../ClientUI";
import type { WalletTransaction } from "@shared/schema";
import { groupByDate } from "./helpers";

export default function TransactionsList({
  transactions, txLoading, onTopupClick,
}: {
  transactions: WalletTransaction[];
  txLoading: boolean;
  onTopupClick: () => void;
}) {
  const grouped = groupByDate(transactions);
  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ type: "spring", damping: 28, stiffness: 340 }}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-[24px] overflow-hidden"
        style={{ boxShadow: `0 2px 16px ${tints.black(0.05)}`, border: `1px solid ${tints.black(0.04)}` }}
      >
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-50 dark:border-zinc-800/60">
          <div className="w-8 h-8 bg-red-50 dark:bg-red-950/20 rounded-[10px] flex items-center justify-center">
            <History size={14} className="text-brand-500" />
          </div>
          <p className="font-black text-gray-900 dark:text-white text-sm">Mouvements</p>
          <span className="ml-auto text-xs text-gray-400 font-medium">{transactions.length} opérations</span>
        </div>

        {txLoading ? (
          <div className="p-4 space-y-3.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonPulse className="w-11 h-11 rounded-[14px] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonPulse className="h-3.5 w-36 rounded-full" />
                  <SkeletonPulse className="h-2.5 w-24 rounded-full" />
                </div>
                <SkeletonPulse className="h-4 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-14 flex flex-col items-center text-center px-6">
            <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <Wallet size={26} className="text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="font-black text-gray-700 dark:text-gray-300 text-sm mb-1">Aucune transaction</p>
            <p className="text-gray-400 text-xs leading-relaxed max-w-[200px]">
              Rechargez votre wallet pour commencer à commander
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onTopupClick}
              className="mt-5 px-5 py-2.5 rounded-[12px] text-sm font-bold text-white bg-brand"
              style={{ boxShadow: `0 4px 14px ${tints.brand(0.25)}` }}
            >
              Recharger maintenant
            </motion.button>
          </div>
        ) : (
          <div>
            {grouped.map(([date, txs]) => (
              <div key={date}>
                <div className="px-4 pt-3 pb-1.5">
                  <p className="text-[10.5px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{date}</p>
                </div>
                {txs.map((tx, i) => {
                  const isTopup = tx.type === "topup";
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, type: "spring", damping: 24, stiffness: 280 }}
                      className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-zinc-800/40 last:border-0"
                      data-testid={`transaction-${tx.id}`}
                    >
                      <div
                        className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isTopup ? tints.success(0.1) : tints.brand(0.08),
                        }}
                      >
                        {isTopup
                          ? <ArrowDownLeft size={18} className="text-green-600" />
                          : <ArrowUpRight size={18} className="text-brand-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tx.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                            style={{
                              background: isTopup ? tints.success(0.1) : tints.brand(0.08),
                              color: isTopup ? palette.semantic.successDark : brand[500],
                            }}
                          >
                            {isTopup ? "Recharge" : "Paiement"}
                          </span>
                          {tx.createdAt && (
                            <span className="text-[10.5px] text-gray-400">{new Date(tx.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                          )}
                        </div>
                      </div>
                      <span
                        className="font-black text-sm flex-shrink-0"
                        style={{ color: isTopup ? palette.semantic.successDark : brand[500] }}
                      >
                        {isTopup ? "+" : "−"}{formatPrice(Math.abs(tx.amount))}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
