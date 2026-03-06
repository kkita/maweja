import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { Users, Award, Wallet } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Order } from "@shared/schema";

export default function AdminCustomers() {
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"] });

  const clientOrders = orders.reduce((acc: Record<number, { count: number; total: number }>, o) => {
    if (!acc[o.clientId]) acc[o.clientId] = { count: 0, total: 0 };
    acc[o.clientId].count++;
    acc[o.clientId].total += o.total;
    return acc;
  }, {});

  const clients = [
    { id: 2, name: "Patrick Kabongo", phone: "0812345678", email: "client@test.cd", walletBalance: 15000, loyaltyPoints: 250 },
    { id: 3, name: "Marie Lukusa", phone: "0898765432", email: "client2@test.cd", walletBalance: 8000, loyaltyPoints: 120 },
  ];

  return (
    <AdminLayout title="Gestion des clients">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center mb-3"><Users size={20} className="text-purple-600" /></div>
          <p className="text-3xl font-black">{clients.length}</p>
          <p className="text-sm text-gray-500">Total clients</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-3"><Wallet size={20} className="text-green-600" /></div>
          <p className="text-3xl font-black">{formatPrice(clients.reduce((s, c) => s + c.walletBalance, 0))}</p>
          <p className="text-sm text-gray-500">Solde total wallets</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-11 h-11 bg-yellow-50 rounded-xl flex items-center justify-center mb-3"><Award size={20} className="text-yellow-600" /></div>
          <p className="text-3xl font-black">{clients.reduce((s, c) => s + c.loyaltyPoints, 0)}</p>
          <p className="text-sm text-gray-500">Points de fidelite</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Liste des clients</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {clients.map((client) => (
            <div key={client.id} className="p-5 flex items-center gap-4" data-testid={`client-row-${client.id}`}>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-red-600 font-bold">{client.name[0]}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{client.name}</p>
                <p className="text-xs text-gray-500">{client.email} - {client.phone}</p>
              </div>
              <div className="text-center px-4">
                <p className="font-black text-gray-900">{clientOrders[client.id]?.count || 0}</p>
                <p className="text-[10px] text-gray-400">Commandes</p>
              </div>
              <div className="text-center px-4">
                <p className="font-black text-gray-900">{formatPrice(clientOrders[client.id]?.total || 0)}</p>
                <p className="text-[10px] text-gray-400">Depenses</p>
              </div>
              <div className="text-center px-4">
                <p className="font-black text-green-600">{formatPrice(client.walletBalance)}</p>
                <p className="text-[10px] text-gray-400">Wallet</p>
              </div>
              <div className="text-center px-4">
                <p className="font-black text-yellow-600">{client.loyaltyPoints}</p>
                <p className="text-[10px] text-gray-400">Points</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
