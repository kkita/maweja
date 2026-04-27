import { Star, Sparkles, Gift, Clock, AlertCircle, RotateCcw } from "lucide-react";
import { motion } from "../../../lib/motion";
import { palette, tints, neutralSurface } from "../../../design-system/tokens";
import { formatPrice, formatDate } from "../../../lib/utils";
import type { LoyaltyCredit } from "./helpers";

export default function CreditsList({
  loyaltyCredits, points,
}: {
  loyaltyCredits: LoyaltyCredit[];
  points: number;
}) {
  return (
    <motion.div
      key="credits"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ type: "spring", damping: 28, stiffness: 340 }}
      className="space-y-3"
    >
      {loyaltyCredits.length === 0 ? (
        <div
          className="bg-white dark:bg-zinc-900 rounded-[24px] py-14 flex flex-col items-center text-center px-6"
          style={{ boxShadow: `0 2px 16px ${tints.black(0.05)}`, border: `1px solid ${tints.black(0.04)}` }}
        >
          <motion.div
            initial={{ scale: 0.7 }} animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center mb-4"
          >
            <Sparkles size={26} className="text-amber-400" />
          </motion.div>
          <p className="font-black text-gray-800 dark:text-gray-200 text-sm mb-1">Aucun crédit fidélité</p>
          <p className="text-gray-400 text-xs max-w-[210px] leading-relaxed">
            Accumulez 1 000 points pour débloquer 10$ de crédit sur vos prochains achats
          </p>
          <div className="mt-5 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-[12px] px-4 py-2.5 border border-amber-100 dark:border-amber-800/30">
            <Star size={12} className="text-amber-500 fill-amber-400" />
            <span className="text-amber-700 dark:text-amber-400 text-xs font-semibold">
              {Math.max(0, 1000 - points)} pts avant votre premier crédit
            </span>
          </div>
        </div>
      ) : (
        loyaltyCredits.map((credit, i) => {
          const expDate = new Date(credit.expiresAt);
          const daysLeft = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const isUrgent = credit.isActive && daysLeft <= 7;
          const isMedium = credit.isActive && daysLeft <= 30;

          const stateColor = credit.isUsed ? palette.semantic.neutral
            : credit.isExpired ? palette.semantic.danger
            : isUrgent ? palette.semantic.danger
            : palette.gold.base;
          const stateBg = credit.isUsed ? tints.mutedGray(0.08)
            : credit.isExpired ? tints.danger(0.08)
            : isUrgent ? tints.danger(0.08)
            : tints.gold(0.08);

          return (
            <motion.div
              key={credit.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring", damping: 24, stiffness: 280 }}
              className="relative overflow-hidden rounded-[20px] p-4"
              style={{
                background: "white",
                border: `1.5px solid ${isUrgent && credit.isActive ? tints.danger(0.2) : tints.black(0.05)}`,
                boxShadow: credit.isActive ? `0 4px 16px ${tints.black(0.06)}` : "none",
                opacity: credit.isUsed || credit.isExpired ? 0.65 : 1,
              }}
              data-testid={`loyalty-credit-${credit.id}`}
            >
              {isUrgent && credit.isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[20px]" style={{ background: `linear-gradient(90deg, ${palette.semantic.danger}, ${neutralSurface.dangerWarm})` }} />
              )}

              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0" style={{ background: stateBg }}>
                  {credit.isUsed
                    ? <RotateCcw size={18} style={{ color: stateColor }} />
                    : credit.isExpired
                    ? <AlertCircle size={18} style={{ color: stateColor }} />
                    : <Gift size={18} style={{ color: stateColor }} />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-black text-gray-900 text-base">
                      {credit.isUsed ? "Crédit utilisé"
                        : credit.isExpired ? "Crédit expiré"
                        : formatPrice(credit.amount)}
                    </p>
                    {credit.isActive && (
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: isUrgent ? tints.danger(0.12) : tints.gold(0.12), color: stateColor }}
                      >
                        {isUrgent ? `${daysLeft}j restant${daysLeft > 1 ? "s" : ""}` : "Actif"}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mb-2">
                    {credit.isUsed
                      ? `Converti depuis ${credit.pointsConverted.toLocaleString("fr-FR")} pts`
                      : `Obtenu via ${credit.pointsConverted.toLocaleString("fr-FR")} points`}
                  </p>

                  <div className="flex items-center gap-1.5">
                    <Clock size={11} style={{ color: stateColor, opacity: 0.7 }} />
                    <p className="text-[11px] font-medium" style={{ color: isMedium && credit.isActive ? stateColor : palette.semantic.neutral }}>
                      {credit.isUsed
                        ? `Utilisé le ${formatDate(credit.createdAt)}`
                        : credit.isExpired
                        ? `Expiré le ${expDate.toLocaleDateString("fr-FR")}`
                        : `Expire le ${expDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
}
