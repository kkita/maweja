import { X, ShieldCheck, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "../../../lib/motion";
import { palette, brand, tints, neutralSurface } from "../../../design-system/tokens";
import { formatPrice } from "../../../lib/utils";
import { TOPUP_METHODS, QUICK_AMOUNTS } from "./helpers";

export default function TopupSheet({
  open, amount, setAmount, method, setMethod, loading, onClose, onConfirm,
}: {
  open: boolean;
  amount: string;
  setAmount: (v: string) => void;
  method: string;
  setMethod: (v: string) => void;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex items-end justify-center"
          style={{ background: tints.black(0.55), backdropFilter: "blur(5px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-[28px]"
            style={{ boxShadow: `0 -12px 60px ${tints.black(0.25)}` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-[3px] bg-gray-200 dark:bg-zinc-700 rounded-full" />
            </div>

            <div className="px-6 pt-4 pb-[max(env(safe-area-inset-bottom),24px)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-lg">Recharger le wallet</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Paiement sécurisé via mobile money</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={onClose}
                  className="w-9 h-9 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center"
                >
                  <X size={16} className="text-gray-500" />
                </motion.button>
              </div>

              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-300 dark:text-zinc-600 text-xl">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  data-testid="input-topup-amount"
                  className="w-full pl-10 pr-4 py-4 bg-gray-50 dark:bg-zinc-800 rounded-[18px] text-2xl font-black text-gray-900 dark:text-white placeholder-gray-200 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-transparent"
                  style={{ border: `1.5px solid ${tints.black(0.07)}` }}
                />
              </div>

              <div className="flex gap-2 mb-5">
                {QUICK_AMOUNTS.map(v => (
                  <motion.button
                    key={v}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setAmount(v)}
                    className="flex-1 py-2.5 rounded-[12px] font-bold text-sm transition-colors"
                    style={{
                      background: amount === v ? brand[500] : tints.black(0.05),
                      color: amount === v ? "white" : palette.semantic.neutralStrong,
                    }}
                  >
                    ${v}
                  </motion.button>
                ))}
              </div>

              <p className="text-[10.5px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Méthode de paiement</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {TOPUP_METHODS.map(m => (
                  <motion.button
                    key={m}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMethod(m)}
                    data-testid={`topup-method-${m.toLowerCase().replace(/\s/g, "-")}`}
                    className="px-3.5 py-2 rounded-[11px] text-xs font-semibold transition-colors"
                    style={{
                      border: method === m ? `1.5px solid ${brand[500]}` : `1.5px solid ${tints.black(0.08)}`,
                      background: method === m ? tints.brand(0.06) : "transparent",
                      color: method === m ? brand[500] : palette.semantic.neutralStrong,
                    }}
                  >
                    {m}
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-green-50 dark:bg-green-950/20 rounded-[12px]">
                <ShieldCheck size={14} className="text-green-600 flex-shrink-0" />
                <p className="text-green-700 dark:text-green-400 text-[11px] font-medium">
                  Paiement chiffré et sécurisé · Crédité instantanément
                </p>
              </div>

              <motion.button
                whileTap={!loading && amount && Number(amount) > 0 ? { scale: 0.97 } : undefined}
                onClick={onConfirm}
                disabled={loading || !amount || Number(amount) <= 0}
                data-testid="button-confirm-topup"
                className="w-full py-4 rounded-[18px] font-black text-white disabled:opacity-50 flex items-center justify-center gap-2 text-[15px]"
                style={{
                  background: loading || !amount ? neutralSurface.disabled : `linear-gradient(90deg, ${brand[500]}, ${brand[600]})`,
                  boxShadow: loading || !amount ? "none" : `0 6px 20px ${tints.brand(0.35)}`,
                }}
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard size={16} />
                    Confirmer {amount ? `— ${formatPrice(Number(amount))}` : ""}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
