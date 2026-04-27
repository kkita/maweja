import { Wallet, Lock, ShieldCheck } from "lucide-react";
import { motion } from "../../../lib/motion";
import { palette, brand, tints } from "../../../design-system/tokens";
import AnimatedBalance from "./AnimatedBalance";

export default function WalletHero({
  user, onTopup,
}: {
  user: { name?: string | null; phone?: string | null; walletBalance?: number | null };
  onTopup: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 24, stiffness: 280 }}
      className="relative overflow-hidden rounded-[28px] p-6 text-white select-none"
      style={{
        background: `linear-gradient(135deg, ${palette.brandDeepest} 0%, ${brand[800]} 40%, ${brand[500]} 100%)`,
        boxShadow: `0 16px 48px ${tints.brand(0.28)}, 0 4px 16px ${tints.black(0.18)}`,
        minHeight: 200,
      }}
      data-testid="wallet-hero-card"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full" style={{ background: `radial-gradient(circle, ${tints.white(0.08)} 0%, transparent 70%)` }} />
        <div className="absolute -bottom-20 -left-12 w-52 h-52 rounded-full" style={{ background: `radial-gradient(circle, ${tints.orange(0.15)} 0%, transparent 70%)` }} />
        <div className="absolute top-0 left-0 right-0 h-px opacity-20" style={{ background: `linear-gradient(90deg, transparent, ${tints.white(0.6)}, transparent)` }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: tints.white(0.15), backdropFilter: "blur(8px)" }}>
              <Wallet size={17} />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-tight">MAWEJA</p>
              <p className="text-red-200 text-[10px] font-medium">E-Wallet</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-6 rounded-[4px] opacity-70" style={{ background: `linear-gradient(135deg, ${palette.gold.chip}, ${palette.gold.shine})`, boxShadow: `0 1px 3px ${tints.black(0.3)}` }} />
            <ShieldCheck size={14} className="text-white/50" />
          </div>
        </div>

        <div className="mb-5">
          <p className="text-red-200 text-[11px] font-semibold uppercase tracking-widest mb-1.5">Solde disponible</p>
          <AnimatedBalance value={user.walletBalance || 0} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Titulaire</p>
            <p className="text-white font-bold text-sm truncate max-w-[140px]">
              {user.name || user.phone || "—"}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onTopup}
            data-testid="button-topup"
            className="flex items-center gap-2 rounded-[14px] px-4 py-2.5 font-bold text-sm"
            style={{
              background: tints.white(0.10),
              backdropFilter: "blur(8px)",
              border: `1px solid ${tints.white(0.15)}`,
              fontSize: 12.5,
              opacity: 0.85,
            }}
            aria-label="Recharge bientôt disponible"
          >
            <Lock size={13} />
            Bientôt
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
