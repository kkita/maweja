import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Wallet, Award, Phone, Mail, Calendar, X, Ban, CheckCircle2,
  Trash2, AlertCircle, ArrowUpRight, ArrowDownRight,
  Receipt, Clock, MapPin,
} from "lucide-react";
import { formatPrice } from "../../../lib/utils";
import { apiRequest, queryClient, authFetchJson } from "../../../lib/queryClient";
import { useToast } from "../../../hooks/use-toast";
import type { WalletTransaction } from "@shared/schema";
import SegmentBadge from "./SegmentBadge";
import CustomerWalletAdjustModal from "./CustomerWalletAdjustModal";
import type { EnrichedCustomer, CustomerOrder } from "./types";

function orderStatusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: "En attente", confirmed: "Confirmée", preparing: "En préparation",
    ready: "Prête", picked_up: "Récupérée", delivering: "En livraison",
    delivered: "Livrée", cancelled: "Annulée", returned: "Retournée",
  };
  return map[s] || s;
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

interface WalletCardProps {
  icon: React.ReactNode;
  color: "green" | "amber";
  label: string;
  value: string;
  onAdjust: () => void;
}

function WalletCard({ icon, color, label, value, onAdjust }: WalletCardProps) {
  const palette: Record<WalletCardProps["color"], { bg: string }> = {
    green: { bg: "from-green-500 to-emerald-600" },
    amber: { bg: "from-amber-500 to-orange-600" },
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

interface Props {
  customer: EnrichedCustomer;
  orders: CustomerOrder[];
  onClose: () => void;
  onToggleBlock: () => void;
  onDelete: () => void;
}

export default function CustomerDetailDrawer({ customer, orders, onClose, onToggleBlock, onDelete }: Props) {
  const [adjustWalletOpen, setAdjustWalletOpen] = useState(false);
  const [adjustPointsOpen, setAdjustPointsOpen] = useState(false);
  const { toast } = useToast();

  const { data: walletTxns = [] } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/wallet", customer.id],
    queryFn: () => authFetchJson(`/api/wallet/${customer.id}`),
  });

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt as unknown as string).getTime() - new Date(a.createdAt as unknown as string).getTime()
  );

  const walletAdjustMutation = useMutation({
    mutationFn: ({ delta, reason }: { delta: number; reason: string }) =>
      apiRequest(`/api/admin/clients/${customer.id}/wallet-adjust`, { method: "POST", body: JSON.stringify({ delta, reason }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", customer.id] });
      setAdjustWalletOpen(false);
      toast({ title: "Wallet mis à jour" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err?.message, variant: "destructive" }),
  });

  const pointsAdjustMutation = useMutation({
    mutationFn: ({ delta, reason }: { delta: number; reason: string }) =>
      apiRequest(`/api/admin/clients/${customer.id}/points-adjust`, { method: "POST", body: JSON.stringify({ delta, reason }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setAdjustPointsOpen(false);
      toast({ title: "Points mis à jour" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err?.message, variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex" data-testid="drawer-client-detail">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl bg-zinc-50 dark:bg-zinc-950 overflow-y-auto shadow-2xl">
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
              {customer.avatar ? (
                <img src={customer.avatar} alt={customer.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className="text-red-700 font-black text-2xl">{customer.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black truncate">{customer.name}</h2>
              <p className="text-sm text-red-100/90 truncate">{customer.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <SegmentBadge customer={customer} />
                <span className="text-[10px] text-red-100/80">ID #{customer.id}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-red-100/80 font-semibold">Commandes</p>
              <p className="text-xl font-black">{customer.orderCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-red-100/80 font-semibold">Total dépensé</p>
              <p className="text-xl font-black">{formatPrice(customer.totalSpent)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-red-100/80 font-semibold">Panier moyen</p>
              <p className="text-xl font-black">{customer.aov > 0 ? formatPrice(customer.aov) : "—"}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <Section title="Coordonnées">
            <div className="space-y-2">
              <ContactRow icon={<Phone size={14} />} label="Téléphone" value={customer.phone} />
              <ContactRow icon={<Mail size={14} />} label="Email" value={customer.email} />
              {customer.address && <ContactRow icon={<MapPin size={14} />} label="Adresse" value={customer.address} />}
              <ContactRow icon={<Calendar size={14} />} label="Inscrit le" value={customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—"} />
              {customer.lastOrderTs && (
                <ContactRow icon={<Clock size={14} />} label="Dernière commande" value={new Date(customer.lastOrderTs).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} />
              )}
            </div>
          </Section>

          <Section title="Portefeuille & Fidélité">
            <div className="grid grid-cols-2 gap-3">
              <WalletCard
                icon={<Wallet size={18} />}
                color="green"
                label="Solde wallet"
                value={formatPrice(customer.walletBalance || 0)}
                onAdjust={() => setAdjustWalletOpen(true)}
              />
              <WalletCard
                icon={<Award size={18} />}
                color="amber"
                label="Points fidélité"
                value={String(customer.loyaltyPoints || 0)}
                onAdjust={() => setAdjustPointsOpen(true)}
              />
            </div>
          </Section>

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
                      <p className="text-[11px] text-zinc-400">{new Date(o.createdAt as unknown as string).toLocaleDateString("fr-FR")} • {orderStatusLabel(o.status)}</p>
                    </div>
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{formatPrice(o.total)}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

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
                      <p className="text-[11px] text-zinc-400">{new Date(t.createdAt as unknown as string).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <p className={`font-bold text-sm ${t.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {t.amount > 0 ? "+" : ""}{formatPrice(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Actions administrateur">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onToggleBlock}
                data-testid="btn-drawer-toggle-block"
                className={`p-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  customer.isBlocked
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                }`}
              >
                {customer.isBlocked ? <CheckCircle2 size={15} /> : <Ban size={15} />}
                {customer.isBlocked ? "Débloquer" : "Bloquer"}
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
        <CustomerWalletAdjustModal
          title="Ajuster le wallet"
          unit="$"
          currentValue={customer.walletBalance || 0}
          isMoney
          onCancel={() => setAdjustWalletOpen(false)}
          onConfirm={(delta, reason) => walletAdjustMutation.mutate({ delta, reason })}
          pending={walletAdjustMutation.isPending}
        />
      )}
      {adjustPointsOpen && (
        <CustomerWalletAdjustModal
          title="Ajuster les points fidélité"
          unit="pts"
          currentValue={customer.loyaltyPoints || 0}
          isMoney={false}
          onCancel={() => setAdjustPointsOpen(false)}
          onConfirm={(delta, reason) => pointsAdjustMutation.mutate({ delta, reason })}
          pending={pointsAdjustMutation.isPending}
        />
      )}
    </div>
  );
}
