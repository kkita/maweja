import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { Users, Award, Wallet, Search, Ban, CheckCircle, Phone, Mail, Calendar } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import type { Order } from "@shared/schema";

type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  loyaltyPoints: number;
  isBlocked: boolean;
  createdAt: string;
  avatar: string | null;
};

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: allUsers = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/users"],
  });

  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"] });

  const clients = allUsers.filter((u) => (u as any).role === "client");

  const blockMutation = useMutation({
    mutationFn: ({ id, isBlocked }: { id: number; isBlocked: boolean }) =>
      apiRequest(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ isBlocked }) }),
    onSuccess: (_, { isBlocked }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: isBlocked ? "Client bloqué" : "Client débloqué",
        description: isBlocked ? "Le client ne peut plus se connecter." : "Le client peut à nouveau se connecter.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible de modifier le statut du client",
        variant: "destructive",
      });
    },
  });

  const clientOrders = orders.reduce((acc: Record<number, { count: number; total: number }>, o) => {
    if (!acc[o.clientId]) acc[o.clientId] = { count: 0, total: 0 };
    acc[o.clientId].count++;
    acc[o.clientId].total += o.total;
    return acc;
  }, {});

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const totalWallet = clients.reduce((s, c) => s + (c.walletBalance || 0), 0);
  const totalPoints = clients.reduce((s, c) => s + (c.loyaltyPoints || 0), 0);

  return (
    <AdminLayout title="Gestion des clients">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="w-11 h-11 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-3">
            <Users size={20} className="text-purple-600" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{isLoading ? "…" : clients.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total clients inscrits</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="w-11 h-11 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-3">
            <Wallet size={20} className="text-green-600" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{formatPrice(totalWallet)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Solde total wallets</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="w-11 h-11 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center mb-3">
            <Award size={20} className="text-yellow-600" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{totalPoints}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Points de fidélité</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, email ou téléphone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-clients"
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Liste des clients {!isLoading && <span className="text-gray-400 font-normal text-sm">({filtered.length})</span>}
          </h3>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Chargement des clients…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun client trouvé</p>
            <p className="text-sm mt-1">{search ? "Essayez un autre terme de recherche" : "Les nouveaux clients apparaîtront ici automatiquement"}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {filtered.map((client) => (
              <div key={client.id} className="p-4 flex items-center gap-4" data-testid={`client-row-${client.id}`}>
                {/* Avatar */}
                <div className="w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  {client.avatar ? (
                    <img src={client.avatar} alt={client.name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <span className="text-red-600 font-bold text-lg">{client.name[0]?.toUpperCase()}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{client.name}</p>
                    {client.isBlocked && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Bloqué</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Mail size={10} />{client.email}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Phone size={10} />{client.phone}
                    </span>
                  </div>
                  {client.createdAt && (
                    <span className="flex items-center gap-1 text-xs text-gray-300 dark:text-gray-600 mt-0.5">
                      <Calendar size={10} />Inscrit le {new Date(client.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6">
                  <div className="text-center">
                    <p className="font-black text-gray-900 dark:text-white text-sm">{clientOrders[client.id]?.count || 0}</p>
                    <p className="text-[10px] text-gray-400">Commandes</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-gray-900 dark:text-white text-sm">{formatPrice(clientOrders[client.id]?.total || 0)}</p>
                    <p className="text-[10px] text-gray-400">Dépenses</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-green-600 text-sm">{formatPrice(client.walletBalance || 0)}</p>
                    <p className="text-[10px] text-gray-400">Wallet</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-yellow-600 text-sm">{client.loyaltyPoints || 0}</p>
                    <p className="text-[10px] text-gray-400">Points</p>
                  </div>
                </div>

                {/* Action bloquer/débloquer */}
                <button
                  onClick={() => blockMutation.mutate({ id: client.id, isBlocked: !client.isBlocked })}
                  disabled={blockMutation.isPending}
                  data-testid={`btn-toggle-block-${client.id}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    client.isBlocked
                      ? "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {client.isBlocked ? <CheckCircle size={13} /> : <Ban size={13} />}
                  {client.isBlocked ? "Débloquer" : "Bloquer"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
