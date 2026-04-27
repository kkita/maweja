import { Star, Award, ChevronRight, Zap, Gift } from "lucide-react";
import { motion } from "../../../lib/motion";
import { palette, tints } from "../../../design-system/tokens";
import ProgressRing from "./ProgressRing";

export default function LoyaltyCard({
  points, tier, nextTier, progressPct, progressTarget, pointsNeeded,
}: {
  points: number;
  tier: { label: string; color: string; bg: string };
  nextTier: { label: string } | undefined;
  progressPct: number;
  progressTarget: number;
  pointsNeeded: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 24, stiffness: 280, delay: 0.05 }}
      className="relative overflow-hidden rounded-[24px] p-5"
      style={{
        background: `linear-gradient(135deg, ${palette.wallet.goldDeep1} 0%, ${palette.wallet.goldDeep2} 50%, ${palette.wallet.goldDeep3} 100%)`,
        boxShadow: `0 8px 32px ${tints.goldShadow(0.22)}`,
      }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${tints.gold(0.2)} 0%, transparent 70%)` }} />
      <div className="absolute inset-0 rounded-[24px]" style={{ border: `1px solid ${tints.gold(0.2)}` }} />

      <div className="relative z-10">
        <div className="flex items-start gap-3 mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <p className="text-amber-200 text-[11px] font-semibold uppercase tracking-widest">Programme fidélité</p>
            </div>
            <p className="text-white font-black text-lg leading-tight" data-testid="text-loyalty-points-count">
              {points.toLocaleString("fr-FR")} <span className="text-amber-300">pts</span>
            </p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              {nextTier
                ? `+${pointsNeeded.toLocaleString("fr-FR")} pts pour atteindre le rang ${nextTier.label}`
                : "Rang maximum atteint !"}
            </p>
          </div>

          <div className="relative flex-shrink-0">
            <ProgressRing pct={progressPct} color={palette.gold.base} size={64} stroke={5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <p className="text-white font-black text-sm text-center leading-none">{Math.round(progressPct)}%</p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 mb-4"
          style={{ background: tier.bg, border: `1px solid ${tier.color}30` }}
        >
          <Award size={12} style={{ color: tier.color }} />
          <span className="text-xs font-black" style={{ color: tier.color }}>Rang {tier.label}</span>
          {nextTier && (
            <>
              <span className="text-white/20 mx-0.5">·</span>
              <ChevronRight size={11} style={{ color: tier.color, opacity: 0.7 }} />
              <span className="text-[11px] font-semibold opacity-70" style={{ color: tier.color }}>{nextTier.label}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          {[
            { label: "10 pts", sub: "par $1 dépensé", icon: Zap },
            { label: "1 000 pts", sub: "= 10$ de crédit", icon: Gift },
          ].map(({ label, sub, icon: Icon }) => (
            <div key={label} className="flex-1 bg-white/5 rounded-[14px] px-3 py-2.5 border border-white/10">
              <Icon size={12} className="text-amber-400 mb-1" />
              <p className="text-white font-black text-xs">{label}</p>
              <p className="text-amber-300/60 text-[10px]">{sub}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: tints.white(0.1) }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${palette.gold.base}, ${palette.gold.bright}, ${palette.gold.pale})` }}
              initial={{ width: "0%" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              data-testid="loyalty-progress-bar"
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-amber-400/60 text-[10px]">{points.toLocaleString("fr-FR")} pts</span>
            <span className="text-amber-400/60 text-[10px]">{progressTarget.toLocaleString("fr-FR")} pts</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
