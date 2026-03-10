import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, Award } from "lucide-react";
import { formatPrice, formatDate } from "../../lib/utils";
export default function WalletPage() {
    const { user, setUser } = useAuth();
    const { toast } = useToast();
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("Airtel Money");
    const [showTopup, setShowTopup] = useState(false);
    const [loading, setLoading] = useState(false);
    const { data: transactions = [] } = useQuery({
        queryKey: ["/api/wallet", user?.id],
        queryFn: () => authFetch(`/api/wallet/${user?.id}`).then((r) => r.json()),
        enabled: !!user,
    });
    const handleTopup = async () => {
        if (!amount || !user)
            return;
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
        }
        catch (err) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        }
        finally {
            setLoading(false);
        }
    };
    const topupMethods = ["Airtel Money", "M-PESA", "Orange Money", "AfriMoney", "Illico Cash"];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-24", children: [_jsx(ClientNav, {}), _jsxs("div", { className: "max-w-lg mx-auto px-4 py-4", children: [_jsxs("div", { className: "bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-6 text-white mb-6 relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" }), _jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Wallet, { size: 18 }), _jsx("span", { className: "text-sm font-medium text-red-200", children: "Mon Wallet" })] }), _jsx("p", { className: "text-4xl font-black mt-2", children: formatPrice(user?.walletBalance || 0) }), _jsxs("div", { className: "flex items-center gap-2 mt-4", children: [_jsx(Award, { size: 14, className: "text-yellow-300" }), _jsxs("span", { className: "text-sm text-red-200", children: [user?.loyaltyPoints || 0, " points de fidelite"] })] })] })] }), _jsxs("button", { onClick: () => setShowTopup(!showTopup), "data-testid": "button-topup", className: "w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 mb-4 hover:shadow-md transition-all", children: [_jsx("div", { className: "w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center", children: _jsx(Plus, { size: 20, className: "text-green-600" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "font-semibold text-sm text-gray-900", children: "Recharger mon wallet" }), _jsx("p", { className: "text-xs text-gray-500", children: "Via Mobile Money ou Illico Cash" })] })] }), showTopup && (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 animate-in slide-in-from-top", children: [_jsx("input", { type: "number", placeholder: "Montant en FC", value: amount, onChange: (e) => setAmount(e.target.value), "data-testid": "input-topup-amount", className: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500" }), _jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: topupMethods.map((m) => (_jsx("button", { onClick: () => setMethod(m), "data-testid": `topup-method-${m.toLowerCase().replace(/\s/g, "-")}`, className: `px-3 py-2 rounded-xl text-xs font-medium border transition-all ${method === m ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-600"}`, children: m }, m))) }), _jsx("button", { onClick: handleTopup, disabled: loading || !amount, "data-testid": "button-confirm-topup", className: "w-full bg-red-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50", children: loading ? "Traitement..." : "Confirmer la recharge" })] })), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden", children: [_jsx("div", { className: "px-4 py-3 border-b border-gray-100", children: _jsx("h3", { className: "font-semibold text-sm text-gray-900", children: "Historique des transactions" }) }), transactions.length === 0 ? (_jsx("div", { className: "p-8 text-center", children: _jsx("p", { className: "text-gray-400 text-sm", children: "Aucune transaction" }) })) : (_jsx("div", { className: "divide-y divide-gray-50", children: transactions.map((t) => (_jsxs("div", { className: "p-4 flex items-center gap-3", "data-testid": `transaction-${t.id}`, children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center ${t.type === "topup" ? "bg-green-50" : "bg-red-50"}`, children: t.type === "topup" ? _jsx(ArrowDownLeft, { size: 18, className: "text-green-600" }) : _jsx(ArrowUpRight, { size: 18, className: "text-red-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: t.description }), _jsx("p", { className: "text-xs text-gray-500", children: formatDate(t.createdAt) })] }), _jsxs("span", { className: `font-bold text-sm ${t.type === "topup" ? "text-green-600" : "text-red-600"}`, children: [t.type === "topup" ? "+" : "-", formatPrice(Math.abs(t.amount))] })] }, t.id))) }))] })] })] }));
}
//# sourceMappingURL=WalletPage.js.map