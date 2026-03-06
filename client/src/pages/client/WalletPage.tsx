import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import { Wallet, ArrowUpRight, ArrowDownLeft, Smartphone, Plus, Award } from "lucide-react";
import { formatPrice, formatDate } from "../../lib/utils";
import type { WalletTransaction } from "@shared/schema";

export default function WalletPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Airtel Money");
  const [showTopup, setShowTopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: transactions = [] } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/wallet", user?.id],
    queryFn: () => authFetch(`/api/wallet/${user?.id}`).then((r) => r.json()),
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
      toast({ title: "Recharge reussie!", description: `${formatPrice(Number(amount))} ajoute a votre wallet` });
      setAmount("");
      setShowTopup(false);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const topupMethods = ["Airtel Money", "M-PESA", "Orange Money", "AfriMoney", "Illico Cash"];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-6 text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={18} />
              <span className="text-sm font-medium text-red-200">Mon Wallet</span>
            </div>
            <p className="text-4xl font-black mt-2">{formatPrice(user?.walletBalance || 0)}</p>
            <div className="flex items-center gap-2 mt-4">
              <Award size={14} className="text-yellow-300" />
              <span className="text-sm text-red-200">{user?.loyaltyPoints || 0} points de fidelite</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowTopup(!showTopup)}
          data-testid="button-topup"
          className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 mb-4 hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
            <Plus size={20} className="text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-gray-900">Recharger mon wallet</p>
            <p className="text-xs text-gray-500">Via Mobile Money ou Illico Cash</p>
          </div>
        </button>

        {showTopup && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 animate-in slide-in-from-top">
            <input
              type="number"
              placeholder="Montant en FC"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-testid="input-topup-amount"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex flex-wrap gap-2 mb-3">
              {topupMethods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  data-testid={`topup-method-${m.toLowerCase().replace(/\s/g, "-")}`}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    method === m ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-600"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={handleTopup}
              disabled={loading || !amount}
              data-testid="button-confirm-topup"
              className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {loading ? "Traitement..." : "Confirmer la recharge"}
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900">Historique des transactions</h3>
          </div>
          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm">Aucune transaction</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <div key={t.id} className="p-4 flex items-center gap-3" data-testid={`transaction-${t.id}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    t.type === "topup" ? "bg-green-50" : "bg-red-50"
                  }`}>
                    {t.type === "topup" ? <ArrowDownLeft size={18} className="text-green-600" /> : <ArrowUpRight size={18} className="text-red-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{t.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(t.createdAt!)}</p>
                  </div>
                  <span className={`font-bold text-sm ${t.type === "topup" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "topup" ? "+" : "-"}{formatPrice(Math.abs(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
