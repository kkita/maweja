import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import {
  Users, Award, Wallet, Search, TrendingUp, Download, Crown, Sparkles,
  Grid3x3, List,
} from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import type { Order } from "@shared/schema";
import KpiCard from "../../components/admin/customers/KpiCard";
import CustomersTable from "../../components/admin/customers/CustomersTable";
import CustomersGrid from "../../components/admin/customers/CustomersGrid";
import CustomerDetailDrawer from "../../components/admin/customers/CustomerDetailDrawer";
import type { Customer, EnrichedCustomer } from "../../components/admin/customers/types";

type SortKey = "recent" | "name" | "orders" | "spent" | "wallet" | "points";
type StatusFilter = "all" | "active" | "blocked" | "vip" | "new" | "dormant";
type ViewMode = "table" | "grid";

const VIP_THRESHOLD = 500; // $ dépensés
const NEW_DAYS = 30;
const DORMANT_DAYS = 60;

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: allUsers = [], isLoading } = useQuery<Customer[]>({ queryKey: ["/api/users"] });
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"] });

  const customers = useMemo(() => allUsers.filter(u => u.role === "client"), [allUsers]);

  const stats = useMemo(() => {
    const map: Record<number, { count: number; total: number; lastDate: number | null }> = {};
    for (const o of orders) {
      if (!map[o.clientId]) map[o.clientId] = { count: 0, total: 0, lastDate: null };
      map[o.clientId].count++;
      map[o.clientId].total += o.total;
      const ts = new Date(o.createdAt as unknown as string).getTime();
      if (!map[o.clientId].lastDate || ts > (map[o.clientId].lastDate as number)) {
        map[o.clientId].lastDate = ts;
      }
    }
    return map;
  }, [orders]);

  const enriched = useMemo<EnrichedCustomer[]>(() => {
    const now = Date.now();
    return customers.map(c => {
      const s = stats[c.id] || { count: 0, total: 0, lastDate: null };
      const createdTs = c.createdAt ? new Date(c.createdAt).getTime() : 0;
      const ageDays = (now - createdTs) / (1000 * 60 * 60 * 24);
      const sinceLastOrder = s.lastDate ? (now - s.lastDate) / (1000 * 60 * 60 * 24) : Infinity;
      const isVIP = s.total >= VIP_THRESHOLD;
      const isNew = ageDays <= NEW_DAYS;
      const isDormant = s.count > 0 && sinceLastOrder > DORMANT_DAYS;
      const aov = s.count > 0 ? s.total / s.count : 0;
      return { ...c, orderCount: s.count, totalSpent: s.total, lastOrderTs: s.lastDate, aov, isVIP, isNew, isDormant, ageDays };
    });
  }, [customers, stats]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = enriched.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !c.phone.includes(q)) return false;
      if (statusFilter === "blocked") return c.isBlocked;
      if (statusFilter === "active") return !c.isBlocked;
      if (statusFilter === "vip") return c.isVIP;
      if (statusFilter === "new") return c.isNew;
      if (statusFilter === "dormant") return c.isDormant;
      return true;
    });
    list.sort((a, b) => {
      switch (sortKey) {
        case "name": return a.name.localeCompare(b.name);
        case "orders": return b.orderCount - a.orderCount;
        case "spent": return b.totalSpent - a.totalSpent;
        case "wallet": return (b.walletBalance || 0) - (a.walletBalance || 0);
        case "points": return (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0);
        case "recent":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return list;
  }, [enriched, search, statusFilter, sortKey]);

  // ─── KPIs globaux ─────────────────────────────────────────────────
  const totalWallet = enriched.reduce((s, c) => s + (c.walletBalance || 0), 0);
  const totalPoints = enriched.reduce((s, c) => s + (c.loyaltyPoints || 0), 0);
  const totalRevenueClients = enriched.reduce((s, c) => s + c.totalSpent, 0);
  const vipCount = enriched.filter(c => c.isVIP).length;
  const newCount = enriched.filter(c => c.isNew).length;
  const blockedCount = enriched.filter(c => c.isBlocked).length;
  const dormantCount = enriched.filter(c => c.isDormant).length;
  const avgLTV = enriched.length > 0 ? totalRevenueClients / enriched.length : 0;

  // ─── Mutations ────────────────────────────────────────────────────
  const blockMutation = useMutation({
    mutationFn: ({ id, isBlocked }: { id: number; isBlocked: boolean }) =>
      apiRequest(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ isBlocked }) }),
    onSuccess: (_, { isBlocked }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: isBlocked ? "Client bloqué" : "Client débloqué" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err?.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setSelectedId(null);
      toast({ title: "Client supprimé", description: "Le compte a été anonymisé." });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err?.message, variant: "destructive" }),
  });

  const exportClients = () => {
    const headers = ["ID", "Nom", "Email", "Téléphone", "Inscrit le", "Statut", "Segment", "Commandes", "Dépensé ($)", "Panier moyen ($)", "Wallet ($)", "Points", "Dernière commande"];
    const rows = filtered.map(c => [
      c.id, c.name, c.email, c.phone,
      c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : "",
      c.isBlocked ? "Bloqué" : "Actif",
      c.isVIP ? "VIP" : c.isNew ? "Nouveau" : c.isDormant ? "Dormant" : "Régulier",
      c.orderCount, c.totalSpent.toFixed(2), c.aov.toFixed(2),
      (c.walletBalance || 0).toFixed(2), c.loyaltyPoints || 0,
      c.lastOrderTs ? new Date(c.lastOrderTs).toLocaleDateString("fr-FR") : "—",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `clients_maweja_${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const selectedCustomer = selectedId ? enriched.find(c => c.id === selectedId) : null;

  return (
    <AdminLayout title="Gestion des clients">
      {/* ─── KPI cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard icon={<Users size={18} />} color="indigo" label="Total clients" value={isLoading ? "…" : String(customers.length)} sub={`${blockedCount} bloqués`} />
        <KpiCard icon={<Crown size={18} />} color="amber" label="Clients VIP" value={String(vipCount)} sub={`> ${formatPrice(VIP_THRESHOLD)} dépensés`} />
        <KpiCard icon={<Sparkles size={18} />} color="emerald" label="Nouveaux (30j)" value={String(newCount)} sub={`${dormantCount} dormants > 60j`} />
        <KpiCard icon={<TrendingUp size={18} />} color="rose" label="LTV moyen" value={formatPrice(avgLTV)} sub={`CA total ${formatPrice(totalRevenueClients)}`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 mb-5">
        <KpiCard icon={<Wallet size={18} />} color="green" label="Solde wallets cumulé" value={formatPrice(totalWallet)} sub="Crédits clients" />
        <KpiCard icon={<Award size={18} />} color="yellow" label="Points fidélité émis" value={totalPoints.toLocaleString("fr-FR")} sub="En circulation" />
      </div>

      {/* ─── Toolbar ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-3 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher : nom, email ou téléphone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-search-clients"
              className="w-full pl-10 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              data-testid="select-status-filter"
              className="px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white cursor-pointer"
            >
              <option value="all">Tous les segments</option>
              <option value="active">Actifs uniquement</option>
              <option value="blocked">Bloqués</option>
              <option value="vip">⭐ VIP</option>
              <option value="new">✨ Nouveaux (30j)</option>
              <option value="dormant">💤 Dormants (60j+)</option>
            </select>

            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              data-testid="select-sort-clients"
              className="px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white cursor-pointer"
            >
              <option value="recent">Plus récents</option>
              <option value="name">Nom (A→Z)</option>
              <option value="orders">Plus de commandes</option>
              <option value="spent">Plus gros dépensiers</option>
              <option value="wallet">Wallet ↓</option>
              <option value="points">Points ↓</option>
            </select>

            <div className="flex items-center bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-0.5">
              <button
                onClick={() => setViewMode("table")}
                data-testid="btn-view-table"
                className={`p-1.5 rounded-lg transition ${viewMode === "table" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-400"}`}
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                data-testid="btn-view-grid"
                className={`p-1.5 rounded-lg transition ${viewMode === "grid" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-400"}`}
              >
                <Grid3x3 size={15} />
              </button>
            </div>

            <button
              onClick={exportClients}
              data-testid="btn-export-clients"
              className="px-3 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:opacity-90"
            >
              <Download size={13} /> Exporter
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-900 dark:text-white">{filtered.length}</span> client{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
            {statusFilter !== "all" && <span className="ml-2 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-[10px] font-semibold">Filtre actif</span>}
          </p>
        </div>
      </div>

      {/* ─── Liste / Grille ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Chargement des clients…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
          <Users size={40} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
          <p className="font-semibold text-zinc-900 dark:text-white">Aucun client trouvé</p>
          <p className="text-sm text-zinc-400 mt-1">Essayez d'ajuster vos filtres ou la recherche.</p>
        </div>
      ) : viewMode === "table" ? (
        <CustomersTable
          customers={filtered}
          onSelect={setSelectedId}
          onToggleBlock={c => blockMutation.mutate({ id: c.id, isBlocked: !c.isBlocked })}
          blockPending={blockMutation.isPending}
        />
      ) : (
        <CustomersGrid customers={filtered} onSelect={setSelectedId} />
      )}

      {selectedCustomer && (
        <CustomerDetailDrawer
          customer={selectedCustomer}
          orders={orders.filter(o => o.clientId === selectedCustomer.id)}
          onClose={() => setSelectedId(null)}
          onToggleBlock={() => blockMutation.mutate({ id: selectedCustomer.id, isBlocked: !selectedCustomer.isBlocked })}
          onDelete={() => {
            if (confirm(`Supprimer définitivement ${selectedCustomer.name} ? Le compte sera anonymisé.`)) {
              deleteMutation.mutate(selectedCustomer.id);
            }
          }}
        />
      )}
    </AdminLayout>
  );
}
