import { Gift, Clock } from "lucide-react";
import { motion, AnimatePresence } from "../../../lib/motion";
import { palette, tints } from "../../../design-system/tokens";
import { formatPrice } from "../../../lib/utils";

export default function LoyaltyCreditAlert({
  totalActiveCredit, nearestExpiry,
}: {
  totalActiveCredit: number;
  nearestExpiry: Date | null;
}) {
  return (
    <AnimatePresence>
      {totalActiveCredit > 0 && nearestExpiry && (
        <motion.div
          initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -4, scaleY: 0.97 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          style={{ originY: 0 }}
          className="relative overflow-hidden rounded-[20px] px-4 py-3.5"
          data-testid="loyalty-credit-alert"
        >
          <div
            className="absolute inset-0 rounded-[20px]"
            style={{ background: `linear-gradient(135deg, ${palette.gold.light} 0%, ${palette.gold.soft} 100%)`, border: `1px solid ${tints.gold(0.3)}` }}
          />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: tints.gold(0.15) }}>
              <Gift size={18} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-900 font-black text-sm">Crédit disponible — {formatPrice(totalActiveCredit)}</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Valable jusqu'au{" "}
                <span className="font-bold">
                  {nearestExpiry.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                </span>
                {" "}· À utiliser au prochain achat
              </p>
            </div>
            <Clock size={16} className="text-amber-500 flex-shrink-0" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
