import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { authFetchJson } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import { Wallet, ArrowDownLeft, ArrowUpRight, History, Gift } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { WalletTransaction } from "@shared/schema";
import { MPageHeader } from "../../components/client/ClientUI";
import { motion, AnimatePresence } from "../../lib/motion";
import { useLocation } from "wouter";
import { palette, brand, tints } from "../../design-system/tokens";
import { LOYALTY_TIERS, getTier, type LoyaltyCredit } from "../../components/client/wallet/helpers";
import WalletHero from "../../components/client/wallet/WalletHero";
import LoyaltyCreditAlert from "../../components/client/wallet/LoyaltyCreditAlert";
import LoyaltyCard from "../../components/client/wallet/LoyaltyCard";
import TransactionsList from "../../components/client/wallet/TransactionsList";
import CreditsList from "../../components/client/wallet/CreditsList";

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"history" | "credits">("history");

  // Recharge wallet temporairement désactivée (cf. WALLET_TOPUP_DISABLED côté
  // backend) — en attendant l'intégration d'un vrai gateway Mobile Money.
  // Le client peut toujours utiliser son solde existant pour payer ses commandes
  // et continue de gagner des points de fidélité automatiquement.
  const showTopupUnavailable = () => {
    toast({
      title: "Recharge bientôt disponible",
      description:
        "L'intégration Mobile Money est en cours. Pour créditer votre solde, contactez le support MAWEJA. Vos points de fidélité continuent de s'accumuler automatiquement à chaque commande.",
    });
  };

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

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-28">
        <ClientNav />
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-5"
          >
            <Wallet size={32} className="text-brand-500" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <p className="font-black text-xl text-gray-900 dark:text-white mb-2">Connexion requise</p>
            <p className="text-gray-400 text-sm mb-6">Connectez-vous pour accéder à votre wallet</p>
            <button
              onClick={() => navigate("/login")}
              data-testid="button-login-wallet"
              className="px-8 py-3.5 rounded-2xl bg-brand text-white font-bold text-sm"
              style={{ boxShadow: `0 4px 16px ${tints.brand(0.3)}` }}
            >
              Se connecter
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-28">
      <ClientNav />
      <MPageHeader title="Mon Wallet" />

      <div className="max-w-lg mx-auto px-4 pt-2 space-y-4">
        <WalletHero user={user} onTopup={showTopupUnavailable} />

        <LoyaltyCreditAlert totalActiveCredit={totalActiveCredit} nearestExpiry={nearestExpiry} />

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Total rechargé",
              value: formatPrice(totalTopup),
              icon: ArrowDownLeft,
              color: palette.semantic.success,
              bg: tints.success(0.08),
              testId: "stat-topup",
            },
            {
              label: "Total dépensé",
              value: formatPrice(totalSpent),
              icon: ArrowUpRight,
              color: brand[500],
              bg: tints.brand(0.07),
              testId: "stat-spent",
            },
          ].map(({ label, value, icon: Icon, color, bg, testId }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="bg-white dark:bg-zinc-900 rounded-[20px] p-4"
              style={{ boxShadow: `0 2px 12px ${tints.black(0.05)}`, border: `1px solid ${tints.black(0.04)}` }}
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

        <LoyaltyCard
          points={points}
          tier={tier}
          nextTier={nextTier}
          progressPct={progressPct}
          progressTarget={progressTarget}
          pointsNeeded={pointsNeeded}
        />

        <div
          className="flex gap-1 p-1 rounded-[16px]"
          style={{ background: tints.black(0.04), border: `1px solid ${tints.black(0.06)}` }}
        >
          {(["history", "credits"] as const).map(tab => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab)}
              className="flex-1 flex items-center justify-center gap-2 rounded-[12px] py-2.5 font-bold text-sm transition-colors relative"
              style={{
                color: activeTab === tab ? palette.wallet.neutralInk : palette.semantic.neutral,
                fontSize: 13,
              }}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="wallet-tab-indicator"
                  className="absolute inset-0 rounded-[12px] bg-white dark:bg-zinc-900"
                  style={{ boxShadow: `0 2px 8px ${tints.black(0.08)}` }}
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

        <AnimatePresence mode="wait">
          {activeTab === "history" && (
            <TransactionsList
              transactions={transactions}
              txLoading={txLoading}
              onTopupClick={showTopupUnavailable}
            />
          )}
          {activeTab === "credits" && (
            <CreditsList loyaltyCredits={loyaltyCredits} points={points} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
