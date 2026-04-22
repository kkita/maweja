import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import {
  Users, Award, Wallet, Search, Ban, CheckCircle2, Phone, Mail,
  Calendar, X, TrendingUp, ShoppingBag, Star, MoreVertical,
  Plus, Minus, Trash2, Download, Crown, Sparkles, AlertCircle,
  ArrowUpRight, ArrowDownRight, Filter, Grid3x3, List, MessageCircle,
  Receipt, Clock, MapPin,
} from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import type { Order, WalletTransaction } from "@shared/schema";

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
  address?: string | null;
  role: string;
};

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

  const { data: allUsers = [], isLoading } = useQuery<Client[]>({ queryKey: ["/api/users"] });
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"] });

  const clients = useMemo(() => allUsers.filter(u => u.role === "client"), [allUsers]);

  const stats = useMemo(() => {
    const map: Record<number, { count: number; total: number; lastDate: number | null }> = {};
    for (const o of orders) {
      if (!map[o.clientId]) map[o.clientId] = { count: 0, total: 0, lastDate: null };
      map[o.clientId].count++;
      map[o.clientId].total += o.total;
      const ts = new Date(o.createdAt as any).getTime();
      if (!map[o.clientId].lastDate || ts > (map[o.clientId].lastDate as number)) {
        map[o.clientId].lastDate = ts;
      }
    }
    return map;
  }, [orders]);

  const enriched = useMemo(() => {
    const now = Date.now();
    return clients.map(c => {
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
  }, [clients, stats]);

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
    onError: (err: any) => toast({ title: "Erreur", description: err?.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setSelectedId(null);
      toast({ title: "Client supprimé", description: "Le compte a été anonymisé." });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err?.message, variant: "destructive" }),
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

  const selectedClient = selectedId ? enriched.find(c => c.id === selectedId) : null;

  return (
    <AdminLayout title="Gestion des clients">
      {/* ─── KPI cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard icon={<Users size={18} />} color="indigo" label="Total clients" value={isLoading ? "…" : String(clients.length)} sub={`${blockedCount} bloqués`} />
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
        <ClientsTable clients={filtered} onSelect={setSelectedId} onToggleBlock={(c: any) => blockMutation.mutate({ id: c.id, isBlocked: !c.isBlocked })} blockPending={blockMutation.isPending} />
      ) : (
        <ClientsGrid clients={filtered} onSelect={setSelectedId} />
      )}

      {/* ─── Drawer détail client ──────────────────────────────────── */}
      {selectedClient && (
        <ClientDetailDrawer
          client={selectedClient}
          orders={orders.filter(o => o.clientId === selectedClient.id)}
          onClose={() => setSelectedId(null)}
          onToggleBlock={() => blockMutation.mutate({ id: selectedClient.id, isBlocked: !selectedClient.isBlocked })}
          onDelete={() => {
            if (confirm(`Supprimer définitivement ${selectedClient.name} ? Le compte sera anonymisé.`)) {
              deleteMutation.mutate(selectedClient.id);
            }
          }}
        />
      )}
    </AdminLayout>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────
function KpiCard({ icon, color, label, value, sub }: { icon: React.ReactNode; color: string; label: string; value: string; sub?: string }) {
  const colors: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-600 text-indigo-50",
    amber: "from-amber-500 to-amber-600 text-amber-50",
    emerald: "from-emerald-500 to-emerald-600 text-emerald-50",
    rose: "from-rose-500 to-rose-600 text-rose-50",
    green: "from-green-500 to-green-600 text-green-50",
    yellow: "from-yellow-500 to-yellow-600 text-yellow-50",
  };
  return (
    <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colors[color]} opacity-10 rounded-full blur-2xl -mr-6 -mt-6`} />
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center shadow-md`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Segment badge ──────────────────────────────────────────────────
function SegmentBadge({ client }: { client: any }) {
  if (client.isBlocked) return <Badge color="red" icon={<Ban size={10} />}>Bloqué</Badge>;
  if (client.isVIP) return <Badge color="amber" icon={<Crown size={10} />}>VIP</Badge>;
  if (client.isNew) return <Badge color="emerald" icon={<Sparkles size={10} />}>Nouveau</Badge>;
  if (client.isDormant) return <Badge color="zinc" icon={<Clock size={10} />}>Dormant</Badge>;
  return <Badge color="blue">Régulier</Badge>;
}

function Badge({ children, color, icon }: { children: React.ReactNode; color: string; icon?: React.ReactNode }) {
  const palette: Record<string, string> = {
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/40",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
    zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/40",
    green: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-100 dark:border-green-900/40",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${palette[color]}`}>
      {icon}{children}
    </span>
  );
}

// ─── Table view ────────────────────────────────────────────────────
function ClientsTable({ clients, onSelect, onToggleBlock, blockPending }: any) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
            <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Segment</th>
              <th className="px-4 py-3 text-right">Commandes</th>
              <th className="px-4 py-3 text-right">Dépensé</th>
              <th className="px-4 py-3 text-right">Panier moyen</th>
              <th className="px-4 py-3 text-right">Wallet</th>
              <th className="px-4 py-3 text-right">Points</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c: any) => (
              <tr
                key={c.id}
                className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition cursor-pointer"
                onClick={() => onSelect(c.id)}
                data-testid={`row-client-${c.id}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar client={c} size={38} />
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-white truncate max-w-[180px]">{c.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate max-w-[180px]">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><SegmentBadge client={c} /></td>
                <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-white">{c.orderCount}</td>
                <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-white">{formatPrice(c.totalSpent)}</td>
                <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{c.aov > 0 ? formatPrice(c.aov) : "—"}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">{formatPrice(c.walletBalance || 0)}</td>
                <td className="px-4 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">{c.loyaltyPoints || 0}</td>
                <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleBlock(c)}
                    disabled={blockPending}
                    data-testid={`btn-toggle-${c.id}`}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      c.isBlocked
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    {c.isBlocked ? <CheckCircle2 size={11} /> : <Ban size={11} />}
                    {c.isBlocked ? "Débloquer" : "Bloquer"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Grid view ─────────────────────────────────────────────────────
function ClientsGrid({ clients, onSelect }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {clients.map((c: any) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          data-testid={`card-client-${c.id}`}
          className="text-left bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 hover:shadow-lg hover:border-red-200 dark:hover:border-red-900/40 transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between mb-3">
            <Avatar client={c} size={48} />
            <SegmentBadge client={c} />
          </div>
          <p className="font-bold text-zinc-900 dark:text-white truncate">{c.name}</p>
          <p className="text-xs text-zinc-400 truncate mb-3">{c.phone}</p>
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-50 dark:border-zinc-800">
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Commandes</p>
              <p className="font-black text-zinc-900 dark:text-white">{c.orderCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Dépensé</p>
              <p className="font-black text-zinc-900 dark:text-white">{formatPrice(c.totalSpent)}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Wallet</p>
              <p className="font-bold text-green-600 dark:text-green-400 text-sm">{formatPrice(c.walletBalance || 0)}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Points</p>
              <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">{c.loyaltyPoints || 0}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function Avatar({ client, size = 40 }: { client: any; size?: number }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-red-500 to-red-700 shadow-md"
      style={{ width: size, height: size }}
    >
      {client.avatar ? (
        <img src={client.avatar} alt={client.name} className="w-full h-full rounded-xl object-cover" />
      ) : (
        <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>
          {client.name?.[0]?.toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}

// ─── Drawer détail ─────────────────────────────────────────────────
function ClientDetailDrawer({ client, orders, onClose, onToggleBlock, onDelete }: any) {
  const [adjustWalletOpen, setAdjustWalletOpen] = useState(false);
  const [adjustPointsOpen, setAdjustPointsOpen] = useState(false);
  const { toast } = useToast();

  const { data: walletTxns = [] } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/wallet", client.id],
  });

  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());

  const walletAdjustMutation = useMutation({
    mutationFn: ({ delta, reason }: { delta: number; reason: string }) =>
      apiRequest(`/api/admin/clients/${client.id}/wallet-adjust`, { method: "POST", body: JSON.stringify({ delta, reason }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", client.id] });
      setAdjustWalletOpen(false);
      toast({ title: "Wallet mis à jour" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err?.message, variant: "destructive" }),
  });

  const pointsAdjustMutation = useMutation({
    mutationFn: ({ delta, reason }: { delta: number; reason: string }) =>
      apiRequest(`/api/admin/clients/${client.id}/points-adjust`, { method: "POST", body: JSON.stringify({ delta, reason }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setAdjustPointsOpen(false);
      toast({ title: "Points mis à jour" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err?.message, variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex" data-testid="drawer-client-detail">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl bg-zinc-50 dark:bg-zinc-950 overflow-y-auto shadow-2xl">
        {/* Header avec gradient */}
        <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-6 text-white">
          <button
            onClick={onClose}
            data-testid="btn-close-drawer"
            className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
              {client.avatar ? (
                <img src={client.avatar} alt={client.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className="text-red-700 font-black text-2xl">{client.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black truncate">{client.name}</h2>
              <p className="text-sm text-red-100/90 truncate">{client.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <SegmentBadge client={client} />
                <span className="text-[10px] text-red-100/80">ID #{client.id}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-red-100/80 font-semibold">Commandes</p>
              <p className="text-xl font-black">{client.orderCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-red-100/80 font-semibold">Total dépensé</p>
              <p className="text-xl font-black">{formatPrice(client.totalSpent)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-red-100/80 font-semibold">Panier moyen</p>
              <p className="text-xl font-black">{client.aov > 0 ? formatPrice(client.aov) : "—"}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Contact */}
          <Section title="Coordonnées">
            <div className="space-y-2">
              <ContactRow icon={<Phone size={14} />} label="Téléphone" value={client.phone} />
              <ContactRow icon={<Mail size={14} />} label="Email" value={client.email} />
              {client.address && <ContactRow icon={<MapPin size={14} />} label="Adresse" value={client.address} />}
              <ContactRow icon={<Calendar size={14} />} label="Inscrit le" value={client.createdAt ? new Date(client.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—"} />
              {client.lastOrderTs && (
                <ContactRow icon={<Clock size={14} />} label="Dernière commande" value={new Date(client.lastOrderTs).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} />
              )}
            </div>
          </Section>

          {/* Wallet & Points */}
          <Section title="Portefeuille & Fidélité">
            <div className="grid grid-cols-2 gap-3">
              <WalletCard
                icon={<Wallet size={18} />}
                color="green"
                label="Solde wallet"
                value={formatPrice(client.walletBalance || 0)}
                onAdjust={() => setAdjustWalletOpen(true)}
              />
              <WalletCard
                icon={<Award size={18} />}
                color="amber"
                label="Points fidélité"
                value={String(client.loyaltyPoints || 0)}
                onAdjust={() => setAdjustPointsOpen(true)}
              />
            </div>
          </Section>

          {/* Orders */}
          <Section title={`Commandes récentes (${sortedOrders.length})`}>
            {sortedOrders.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-4">Aucune commande pour ce client.</p>
            ) : (
              <div className="space-y-2">
                {sortedOrders.slice(0, 8).map(o => (
                  <div key={o.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                      <Receipt size={15} className="text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate">#{o.orderNumber}</p>
                      <p className="text-[11px] text-zinc-400">{new Date(o.createdAt as any).toLocaleDateString("fr-FR")} • {orderStatusLabel(o.status)}</p>
                    </div>
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{formatPrice(o.total)}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Wallet history */}
          {walletTxns.length > 0 && (
            <Section title="Historique wallet">
              <div className="space-y-2">
                {walletTxns.slice(0, 6).map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.amount > 0 ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-red-50 dark:bg-red-900/20 text-red-600"}`}>
                      {t.amount > 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{t.description}</p>
                      <p className="text-[11px] text-zinc-400">{new Date(t.createdAt as any).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <p className={`font-bold text-sm ${t.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {t.amount > 0 ? "+" : ""}{formatPrice(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Actions */}
          <Section title="Actions administrateur">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onToggleBlock}
                data-testid="btn-drawer-toggle-block"
                className={`p-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  client.isBlocked
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                }`}
              >
                {client.isBlocked ? <CheckCircle2 size={15} /> : <Ban size={15} />}
                {client.isBlocked ? "Débloquer" : "Bloquer"}
              </button>
              <button
                onClick={onDelete}
                data-testid="btn-drawer-delete"
                className="p-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition"
              >
                <Trash2 size={15} /> Supprimer le compte
              </button>
            </div>
            <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                La suppression anonymise le compte (les commandes historiques sont préservées pour la comptabilité).
              </p>
            </div>
          </Section>
        </div>
      </div>

      {adjustWalletOpen && (
        <AdjustModal
          title="Ajuster le wallet"
          unit="$"
          currentValue={client.walletBalance || 0}
          isMoney
          onCancel={() => setAdjustWalletOpen(false)}
          onConfirm={(delta: number, reason: string) => walletAdjustMutation.mutate({ delta, reason })}
          pending={walletAdjustMutation.isPending}
        />
      )}
      {adjustPointsOpen && (
        <AdjustModal
          title="Ajuster les points fidélité"
          unit="pts"
          currentValue={client.loyaltyPoints || 0}
          onCancel={() => setAdjustPointsOpen(false)}
          onConfirm={(delta: number, reason: string) => pointsAdjustMutation.mutate({ delta, reason })}
          pending={pointsAdjustMutation.isPending}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 px-1">{title}</h3>
      {children}
    </div>
  );
}

function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">{label}</p>
        <p className="text-sm text-zinc-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}

function WalletCard({ icon, color, label, value, onAdjust }: any) {
  const palette: Record<string, { bg: string; text: string }> = {
    green: { bg: "from-green-500 to-emerald-600", text: "text-green-50" },
    amber: { bg: "from-amber-500 to-orange-600", text: "text-amber-50" },
  };
  const p = palette[color];
  return (
    <div className={`relative bg-gradient-to-br ${p.bg} rounded-2xl p-4 text-white shadow-md overflow-hidden`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6" />
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[11px] uppercase tracking-wider font-semibold opacity-90">{label}</p>
      </div>
      <p className="text-2xl font-black mb-3">{value}</p>
      <button
        onClick={onAdjust}
        data-testid={`btn-adjust-${color}`}
        className="w-full bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-lg py-1.5 text-xs font-semibold transition"
      >
        Ajuster
      </button>
    </div>
  );
}

function AdjustModal({ title, unit, currentValue, isMoney, onCancel, onConfirm, pending }: any) {
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const num = parseFloat(amount);
  const valid = isFinite(num) && num > 0 && reason.trim().length > 0;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white">{title}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Solde actuel : <span className="font-bold text-zinc-900 dark:text-white">{isMoney ? formatPrice(currentValue) : `${currentValue} ${unit}`}</span></p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("add")}
              data-testid="btn-mode-add"
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition ${mode === "add" ? "bg-green-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}
            >
              <Plus size={14} /> Créditer
            </button>
            <button
              onClick={() => setMode("remove")}
              data-testid="btn-mode-remove"
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition ${mode === "remove" ? "bg-red-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}
            >
              <Minus size={14} /> Débiter
            </button>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Montant ({unit})</label>
            <input
              type="number"
              step={isMoney ? "0.01" : "1"}
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              data-testid="input-adjust-amount"
              autoFocus
              className="w-full mt-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-lg font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={isMoney ? "0.00" : "0"}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Motif (obligatoire)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              data-testid="input-adjust-reason"
              rows={2}
              maxLength={300}
              className="w-full mt-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Ex: Geste commercial après incident livraison"
            />
          </div>

          {valid && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-500">Nouveau solde après ajustement :</p>
              <p className="text-lg font-black text-zinc-900 dark:text-white">
                {isMoney ? formatPrice(Math.max(0, currentValue + (mode === "add" ? num : -num))) : `${Math.max(0, currentValue + (mode === "add" ? num : -num))} ${unit}`}
              </p>
            </div>
          )}
        </div>
        <div className="p-5 pt-0 flex gap-2">
          <button onClick={onCancel} data-testid="btn-adjust-cancel" className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700">Annuler</button>
          <button
            onClick={() => onConfirm(mode === "add" ? num : -num, reason.trim())}
            disabled={!valid || pending}
            data-testid="btn-adjust-confirm"
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-semibold"
          >
            {pending ? "…" : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function orderStatusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: "En attente", confirmed: "Confirmée", preparing: "En préparation",
    ready: "Prête", picked_up: "Récupérée", delivering: "En livraison",
    delivered: "Livrée", cancelled: "Annulée", returned: "Retournée",
  };
  return map[s] || s;
}
