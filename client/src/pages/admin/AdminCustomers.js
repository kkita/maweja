import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { Users, Award, Wallet, Search, Ban, CheckCircle, Phone, Mail, Calendar } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
export default function AdminCustomers() {
    const [search, setSearch] = useState("");
    const { toast } = useToast();
    const { data: allUsers = [], isLoading } = useQuery({
        queryKey: ["/api/users"],
    });
    const { data: orders = [] } = useQuery({ queryKey: ["/api/orders"] });
    const clients = allUsers.filter((u) => u.role === "client");
    const blockMutation = useMutation({
        mutationFn: ({ id, isBlocked }) => apiRequest(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ isBlocked }) }),
        onSuccess: (_, { isBlocked }) => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({
                title: isBlocked ? "Client bloqué" : "Client débloqué",
                description: isBlocked ? "Le client ne peut plus se connecter." : "Le client peut à nouveau se connecter.",
            });
        },
        onError: (err) => {
            toast({
                title: "Erreur",
                description: err?.message || "Impossible de modifier le statut du client",
                variant: "destructive",
            });
        },
    });
    const clientOrders = orders.reduce((acc, o) => {
        if (!acc[o.clientId])
            acc[o.clientId] = { count: 0, total: 0 };
        acc[o.clientId].count++;
        acc[o.clientId].total += o.total;
        return acc;
    }, {});
    const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search));
    const totalWallet = clients.reduce((s, c) => s + (c.walletBalance || 0), 0);
    const totalPoints = clients.reduce((s, c) => s + (c.loyaltyPoints || 0), 0);
    return (_jsxs(AdminLayout, { title: "Gestion des clients", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm", children: [_jsx("div", { className: "w-11 h-11 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-3", children: _jsx(Users, { size: 20, className: "text-purple-600" }) }), _jsx("p", { className: "text-3xl font-black text-gray-900 dark:text-white", children: isLoading ? "…" : clients.length }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Total clients inscrits" })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm", children: [_jsx("div", { className: "w-11 h-11 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-3", children: _jsx(Wallet, { size: 20, className: "text-green-600" }) }), _jsx("p", { className: "text-3xl font-black text-gray-900 dark:text-white", children: formatPrice(totalWallet) }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Solde total wallets" })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm", children: [_jsx("div", { className: "w-11 h-11 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center mb-3", children: _jsx(Award, { size: 20, className: "text-yellow-600" }) }), _jsx("p", { className: "text-3xl font-black text-gray-900 dark:text-white", children: totalPoints }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Points de fid\u00E9lit\u00E9" })] })] }), _jsxs("div", { className: "relative mb-4", children: [_jsx(Search, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher par nom, email ou t\u00E9l\u00E9phone\u2026", value: search, onChange: (e) => setSearch(e.target.value), "data-testid": "input-search-clients", className: "w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] }), _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden", children: [_jsx("div", { className: "px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between", children: _jsxs("h3", { className: "font-bold text-gray-900 dark:text-white", children: ["Liste des clients ", !isLoading && _jsxs("span", { className: "text-gray-400 font-normal text-sm", children: ["(", filtered.length, ")"] })] }) }), isLoading ? (_jsxs("div", { className: "p-10 text-center text-gray-400", children: [_jsx("div", { className: "w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" }), "Chargement des clients\u2026"] })) : filtered.length === 0 ? (_jsxs("div", { className: "p-10 text-center text-gray-400", children: [_jsx(Users, { size: 40, className: "mx-auto mb-3 opacity-30" }), _jsx("p", { className: "font-medium", children: "Aucun client trouv\u00E9" }), _jsx("p", { className: "text-sm mt-1", children: search ? "Essayez un autre terme de recherche" : "Les nouveaux clients apparaîtront ici automatiquement" })] })) : (_jsx("div", { className: "divide-y divide-gray-50 dark:divide-gray-800", children: filtered.map((client) => (_jsxs("div", { className: "p-4 flex items-center gap-4", "data-testid": `client-row-${client.id}`, children: [_jsx("div", { className: "w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0", children: client.avatar ? (_jsx("img", { src: client.avatar, alt: client.name, className: "w-full h-full rounded-xl object-cover" })) : (_jsx("span", { className: "text-red-600 font-bold text-lg", children: client.name[0]?.toUpperCase() })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "font-semibold text-gray-900 dark:text-white truncate", children: client.name }), client.isBlocked && (_jsx("span", { className: "text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium", children: "Bloqu\u00E9" }))] }), _jsxs("div", { className: "flex items-center gap-3 mt-0.5", children: [_jsxs("span", { className: "flex items-center gap-1 text-xs text-gray-400", children: [_jsx(Mail, { size: 10 }), client.email] }), _jsxs("span", { className: "flex items-center gap-1 text-xs text-gray-400", children: [_jsx(Phone, { size: 10 }), client.phone] })] }), client.createdAt && (_jsxs("span", { className: "flex items-center gap-1 text-xs text-gray-300 dark:text-gray-600 mt-0.5", children: [_jsx(Calendar, { size: 10 }), "Inscrit le ", new Date(client.createdAt).toLocaleDateString("fr-FR")] }))] }), _jsxs("div", { className: "hidden sm:flex items-center gap-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-black text-gray-900 dark:text-white text-sm", children: clientOrders[client.id]?.count || 0 }), _jsx("p", { className: "text-[10px] text-gray-400", children: "Commandes" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-black text-gray-900 dark:text-white text-sm", children: formatPrice(clientOrders[client.id]?.total || 0) }), _jsx("p", { className: "text-[10px] text-gray-400", children: "D\u00E9penses" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-black text-green-600 text-sm", children: formatPrice(client.walletBalance || 0) }), _jsx("p", { className: "text-[10px] text-gray-400", children: "Wallet" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-black text-yellow-600 text-sm", children: client.loyaltyPoints || 0 }), _jsx("p", { className: "text-[10px] text-gray-400", children: "Points" })] })] }), _jsxs("button", { onClick: () => blockMutation.mutate({ id: client.id, isBlocked: !client.isBlocked }), disabled: blockMutation.isPending, "data-testid": `btn-toggle-block-${client.id}`, className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${client.isBlocked
                                        ? "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                        : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"}`, children: [client.isBlocked ? _jsx(CheckCircle, { size: 13 }) : _jsx(Ban, { size: 13 }), client.isBlocked ? "Débloquer" : "Bloquer"] })] }, client.id))) }))] })] }));
}
//# sourceMappingURL=AdminCustomers.js.map