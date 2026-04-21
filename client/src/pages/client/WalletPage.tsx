import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient, authFetchJson } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, Award, Star, Gift, Clock,
  AlertCircle, ChevronRight, TrendingUp, X, Zap, ShieldCheck, Sparkles,
  CreditCard, History, RotateCcw,
} from "lucide-react";
import { formatPrice, formatDate } from "../../lib/utils";
import type { WalletTransaction } from "@shared/schema";
import { MPageHeader, SkeletonPulse } from "../../components/client/ClientUI";
import { motion, AnimatePresence } from "../../lib/motion";
import { useLocation } from "wouter";

/* ── Types ──────────────────────────────────────────────────────────────── */
interface LoyaltyCredit {
  id: number;
  amount: number;
  pointsConverted: number;
  isUsed: boolean;
  isExpired: boolean;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

const TOPUP_METHODS = ["Airtel Money", "M-PESA", "Orange Money", "AfriMoney", "Illico Cash"];
const QUICK_AMOUNTS = ["5", "10", "20", "50"];
const LOYALTY_TIERS = [
  { label: "Bronze",  min: 0,    max: 499,  color: "#CD7F32", bg: "rgba(205,127,50,0.12)" },
  { label: "Argent",  min: 500,  max: 999,  color: "#A8A9AD", bg: "rgba(168,169,173,0.12)" },
  { label: "Or",      min: 1000, max: 2999, color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  { label: "Platine", min: 3000, max: Infinity, color: "#818CF8", bg: "rgba(129,140,248,0.12)" },
];

function getTier(points: number) {
  return LOYALTY_TIERS.find(t => points >= t.min && points <= t.max) ?? LOYALTY_TIERS[0];
}

/* ── Animated balance counter ────────────────────────────────────────────── */
function AnimatedBalance({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const diff = value - start;
    const duration = 600;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * ease);
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = value;
    };
    requestAnimationFrame(tick);
  }, [value]);

  const formatted = display.toFixed(2);
  const [dollars, cents] = formatted.split(".");
  return (
    <span data-testid="text-wallet-balance">
      <span className="text-[44px] font-black leading-none tracking-tight">{dollars}</span>
      <span className="text-[22px] font-black opacity-70">.{cents} $</span>
    </span>
  );
}

/* ── Progress ring ───────────────────────────────────────────────────────── */
function ProgressRing({ pct, color, size = 64, stroke = 5 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
      />
    </svg>
  );
}

/* ── TX group helper ─────────────────────────────────────────────────────── */
function groupByDate(txs: WalletTransaction[]) {
  const map = new Map<string, WalletTransaction[]>();
  txs.forEach(tx => {
    const key = tx.createdAt
      ? new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  });
  return Array.from(map.entries());
}

/* ════════════════════════════════════════════════════════════════════════════
 * WalletPage
 * ════════════════════════════════════════════════════════════════════════════ */
export default function WalletPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Airtel Money");
  const [showTopup, setShowTopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "credits">("history");

  const { data: transactions = [], isLoading: txLoading } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/wallet", user?.id],
    queryFn: () => authFetchJson(`/api/wallet/${user?.id}`),
    enabled: !!user,
  });

  const { data: loyaltyCredits = [] } = useQuery<LoyaltyCredit[]>({
    queryKey: ["/api/loyalty/credits"],
    queryFn: () => authFetchJson("/api/loyalty/credits"),
    enabled: !!user,
  });

  const handleTopup = async () => {
    if (!amount || !user) return;
    setLoading(true);
    try {
      await apiRequest("/api/wallet/topup", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, amount: Number(amount), method }),
      });
      setUser({ ...user, walletBalance: (user.walletBalance || 0) + Number(amount) });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", user.id] });
      toast({ title: "Recharge réussie !", description: `${formatPrice(Number(amount))} ajouté à votre wallet` });
      setAmount("");
      setShowTopup(false);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const points = user?.loyaltyPoints || 0;
  const tier = getTier(points);
  const nextTier = LOYALTY_TIERS.find(t => t.min > points);
  const progressTarget = nextTier ? nextTier.min : LOYALTY_TIERS[LOYALTY_TIERS.length - 1].min;
  const progressPct = Math.min((points / progressTarget) * 100, 100);
  const pointsNeeded = nextTier ? nextTier.min - points : 0;

  const activeCredits = loyaltyCredits.filter(c => c.isActive);
  const totalActiveCredit = activeCredits.reduce((sum, c) => sum + c.amount, 0);
  const nearestExpiry = activeCredits.length > 0
    ? new Date(activeCredits.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())[0].expiresAt)
    : null;

  const totalTopup = transactions.filter(t => t.type === "topup").reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter(t => t.type !== "topup").reduce((s, t) => s + Math.abs(t.amount), 0);
  const grouped = groupByDate(transactions);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0a] pb-28">
        <ClientNav />
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-5"
          >
            <Wallet size={32} className="text-[#E10000]" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <p className="font-black text-xl text-gray-900 dark:text-white mb-2">Connexion requise</p>
            <p className="text-gray-400 text-sm mb-6">Connectez-vous pour accéder à votre wallet</p>
            <button
              onClick={() => navigate("/login")}
              data-testid="button-login-wallet"
              className="px-8 py-3.5 rounded-2xl bg-[#E10000] text-white font-bold text-sm"
              style={{ boxShadow: "0 4px 16px rgba(225,0,0,0.3)" }}
            >
              Se connecter
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0a] pb-28">
      <ClientNav />
      <MPageHeader title="Mon Wallet" />

      <div className="max-w-lg mx-auto px-4 pt-2 space-y-4">

        {/* ════════════════════════════════════════════════════════════
         * HERO WALLET CARD — style carte bancaire premium
         * ════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          className="relative overflow-hidden rounded-[28px] p-6 text-white select-none"
          style={{
            background: "linear-gradient(135deg, #1a0000 0%, #5a0000 40%, #E10000 100%)",
            boxShadow: "0 16px 48px rgba(225,0,0,0.28), 0 4px 16px rgba(0,0,0,0.18)",
            minHeight: 200,
          }}
          data-testid="wallet-hero-card"
        >
          {/* Decorative mesh background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }} />
            <div className="absolute -bottom-20 -left-12 w-52 h-52 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,120,0,0.15) 0%, transparent 70%)" }} />
            <div className="absolute top-0 left-0 right-0 h-px opacity-20" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)" }} />
            {/* Grid pattern */}
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
            {/* Top row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                  <Wallet size={17} />
                </div>
                <div>
                  <p className="text-white font-black text-sm leading-tight">MAWEJA</p>
                  <p className="text-red-200 text-[10px] font-medium">E-Wallet</p>
                </div>
              </div>

              {/* Chip simulation */}
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-6 rounded-[4px] opacity-70" style={{ background: "linear-gradient(135deg, #d4af37, #f5d76e)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                <ShieldCheck size={14} className="text-white/50" />
              </div>
            </div>

            {/* Balance */}
            <div className="mb-5">
              <p className="text-red-200 text-[11px] font-semibold uppercase tracking-widest mb-1.5">Solde disponible</p>
              <AnimatedBalance value={user.walletBalance || 0} />
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between">
              {/* User info */}
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Titulaire</p>
                <p className="text-white font-bold text-sm truncate max-w-[140px]">
                  {user.name || user.phone || "—"}
                </p>
              </div>

              {/* Action button */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => setShowTopup(true)}
                data-testid="button-topup"
                className="flex items-center gap-2 rounded-[14px] px-4 py-2.5 font-bold text-sm"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: 12.5,
                }}
              >
                <Plus size={14} />
                Recharger
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ════════════════════════════════════════════════════════════
         * CREDIT FIDÉLITÉ DISPONIBLE — alerte urgence
         * ════════════════════════════════════════════════════════════ */}
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
                style={{ background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)", border: "1px solid rgba(245,158,11,0.3)" }}
              />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.15)" }}>
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

        {/* ════════════════════════════════════════════════════════════
         * STATS ROW — rechargé / dépensé
         * ════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Total rechargé",
              value: formatPrice(totalTopup),
              icon: ArrowDownLeft,
              color: "#10b981",
              bg: "rgba(16,185,129,0.08)",
              testId: "stat-topup",
            },
            {
              label: "Total dépensé",
              value: formatPrice(totalSpent),
              icon: ArrowUpRight,
              color: "#E10000",
              bg: "rgba(225,0,0,0.07)",
              testId: "stat-spent",
            },
          ].map(({ label, value, icon: Icon, color, bg, testId }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="bg-white dark:bg-[#141414] rounded-[20px] p-4"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.04)" }}
              data-testid={testId}
            >
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center mb-3" style={{ background: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="font-black text-gray-900 dark:text-white text-base leading-tight">{value}</p>
              <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════
         * PROGRAMME FIDÉLITÉ
         * ════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 280, delay: 0.05 }}
          className="relative overflow-hidden rounded-[24px] p-5"
          style={{
            background: "linear-gradient(135deg, #1c1400 0%, #3d2800 50%, #7c4f00 100%)",
            boxShadow: "0 8px 32px rgba(180,100,0,0.22)",
          }}
        >
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)" }} />
          <div className="absolute inset-0 rounded-[24px]" style={{ border: "1px solid rgba(245,158,11,0.2)" }} />

          <div className="relative z-10">
            {/* Header */}
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

              {/* Progress ring + tier badge */}
              <div className="relative flex-shrink-0">
                <ProgressRing pct={progressPct} color="#F59E0B" size={64} stroke={5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <p className="text-white font-black text-sm text-center leading-none">{Math.round(progressPct)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier badge */}
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

            {/* Value proposition */}
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

            {/* Progress bar */}
            <div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #F59E0B, #FBBF24, #FDE68A)" }}
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

        {/* ════════════════════════════════════════════════════════════
         * TABS : HISTORIQUE / CRÉDITS
         * ════════════════════════════════════════════════════════════ */}
        <div
          className="flex gap-1 p-1 rounded-[16px]"
          style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          {(["history", "credits"] as const).map(tab => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab)}
              className="flex-1 flex items-center justify-center gap-2 rounded-[12px] py-2.5 font-bold text-sm transition-colors relative"
              style={{
                color: activeTab === tab ? "#1a1a1a" : "#9ca3af",
                fontSize: 13,
              }}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="wallet-tab-indicator"
                  className="absolute inset-0 rounded-[12px] bg-white dark:bg-[#1c1c1c]"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                  transition={{ type: "spring", damping: 26, stiffness: 380 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab === "history" ? <History size={13} /> : <Gift size={13} />}
                {tab === "history" ? "Historique" : `Crédits${activeCredits.length > 0 ? ` (${activeCredits.length})` : ""}`}
              </span>
            </motion.button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════
         * TAB CONTENT
         * ════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {/* ── HISTORIQUE ─────────────────────────────────────────── */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
            >
              <div
                className="bg-white dark:bg-[#141414] rounded-[24px] overflow-hidden"
                style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.04)" }}
              >
                {/* Header */}
                <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-50 dark:border-zinc-800/60">
                  <div className="w-8 h-8 bg-red-50 dark:bg-red-950/20 rounded-[10px] flex items-center justify-center">
                    <History size={14} className="text-[#E10000]" />
                  </div>
                  <p className="font-black text-gray-900 dark:text-white text-sm">Mouvements</p>
                  <span className="ml-auto text-xs text-gray-400 font-medium">{transactions.length} opérations</span>
                </div>

                {/* Content */}
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
                      onClick={() => setShowTopup(true)}
                      className="mt-5 px-5 py-2.5 rounded-[12px] text-sm font-bold text-white bg-[#E10000]"
                      style={{ boxShadow: "0 4px 14px rgba(225,0,0,0.25)" }}
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
                                  background: isTopup ? "rgba(16,185,129,0.1)" : "rgba(225,0,0,0.08)",
                                }}
                              >
                                {isTopup
                                  ? <ArrowDownLeft size={18} className="text-green-600" />
                                  : <ArrowUpRight size={18} className="text-[#E10000]" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tx.description}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                                    style={{
                                      background: isTopup ? "rgba(16,185,129,0.1)" : "rgba(225,0,0,0.08)",
                                      color: isTopup ? "#059669" : "#E10000",
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
                                style={{ color: isTopup ? "#059669" : "#E10000" }}
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
          )}

          {/* ── CRÉDITS FIDÉLITÉ ───────────────────────────────────── */}
          {activeTab === "credits" && (
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
                  className="bg-white dark:bg-[#141414] rounded-[24px] py-14 flex flex-col items-center text-center px-6"
                  style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.04)" }}
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

                  const stateColor = credit.isUsed ? "#9ca3af"
                    : credit.isExpired ? "#ef4444"
                    : isUrgent ? "#ef4444"
                    : "#F59E0B";
                  const stateBg = credit.isUsed ? "rgba(156,163,175,0.08)"
                    : credit.isExpired ? "rgba(239,68,68,0.08)"
                    : isUrgent ? "rgba(239,68,68,0.08)"
                    : "rgba(245,158,11,0.08)";

                  return (
                    <motion.div
                      key={credit.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, type: "spring", damping: 24, stiffness: 280 }}
                      className="relative overflow-hidden rounded-[20px] p-4"
                      style={{
                        background: "white",
                        border: `1.5px solid ${isUrgent && credit.isActive ? "rgba(239,68,68,0.2)" : "rgba(0,0,0,0.05)"}`,
                        boxShadow: credit.isActive ? "0 4px 16px rgba(0,0,0,0.06)" : "none",
                        opacity: credit.isUsed || credit.isExpired ? 0.65 : 1,
                      }}
                      data-testid={`loyalty-credit-${credit.id}`}
                    >
                      {/* Urgency accent */}
                      {isUrgent && credit.isActive && (
                        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[20px]" style={{ background: "linear-gradient(90deg, #ef4444, #f97316)" }} />
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
                                style={{ background: isUrgent ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)", color: stateColor }}
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
                            <p className="text-[11px] font-medium" style={{ color: isMedium && credit.isActive ? stateColor : "#9ca3af" }}>
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
          )}
        </AnimatePresence>

      </div>

      {/* ════════════════════════════════════════════════════════════════
       * BOTTOM SHEET — RECHARGE
       * ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showTopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[200] flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)" }}
            onClick={() => setShowTopup(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 340 }}
              className="w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-t-[28px]"
              style={{ boxShadow: "0 -12px 60px rgba(0,0,0,0.25)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-[3px] bg-gray-200 dark:bg-zinc-700 rounded-full" />
              </div>

              <div className="px-6 pt-4 pb-[max(env(safe-area-inset-bottom),24px)]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white text-lg">Recharger le wallet</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Paiement sécurisé via mobile money</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setShowTopup(false)}
                    className="w-9 h-9 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center"
                  >
                    <X size={16} className="text-gray-500" />
                  </motion.button>
                </div>

                {/* Amount input */}
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-300 dark:text-zinc-600 text-xl">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    data-testid="input-topup-amount"
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 dark:bg-zinc-800 rounded-[18px] text-2xl font-black text-gray-900 dark:text-white placeholder-gray-200 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#E10000]/20 focus:border-transparent"
                    style={{ border: "1.5px solid rgba(0,0,0,0.07)" }}
                  />
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2 mb-5">
                  {QUICK_AMOUNTS.map(v => (
                    <motion.button
                      key={v}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setAmount(v)}
                      className="flex-1 py-2.5 rounded-[12px] font-bold text-sm transition-colors"
                      style={{
                        background: amount === v ? "#E10000" : "rgba(0,0,0,0.05)",
                        color: amount === v ? "white" : "#6b7280",
                      }}
                    >
                      ${v}
                    </motion.button>
                  ))}
                </div>

                {/* Method */}
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
                        border: method === m ? "1.5px solid #E10000" : "1.5px solid rgba(0,0,0,0.08)",
                        background: method === m ? "rgba(225,0,0,0.06)" : "transparent",
                        color: method === m ? "#E10000" : "#6b7280",
                      }}
                    >
                      {m}
                    </motion.button>
                  ))}
                </div>

                {/* Trust signal */}
                <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-green-50 dark:bg-green-950/20 rounded-[12px]">
                  <ShieldCheck size={14} className="text-green-600 flex-shrink-0" />
                  <p className="text-green-700 dark:text-green-400 text-[11px] font-medium">
                    Paiement chiffré et sécurisé · Crédité instantanément
                  </p>
                </div>

                {/* CTA */}
                <motion.button
                  whileTap={!loading && amount && Number(amount) > 0 ? { scale: 0.97 } : undefined}
                  onClick={handleTopup}
                  disabled={loading || !amount || Number(amount) <= 0}
                  data-testid="button-confirm-topup"
                  className="w-full py-4 rounded-[18px] font-black text-white disabled:opacity-50 flex items-center justify-center gap-2 text-[15px]"
                  style={{
                    background: loading || !amount ? "#ccc" : "linear-gradient(90deg, #E10000, #cc0000)",
                    boxShadow: loading || !amount ? "none" : "0 6px 20px rgba(225,0,0,0.35)",
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
    </div>
  );
}
