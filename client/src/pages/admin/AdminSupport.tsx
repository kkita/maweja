/**
 * PARTIE 5 — Support Center (vue admin).
 *
 * Centre de gestion des tickets : liste filtrable, détail conversation,
 * actions admin (assigner, prioriser, répondre, approuver remboursement
 * partiel, rejeter, marquer résolu).
 *
 * L'approbation de remboursement est protégée côté backend par une garde
 * d'idempotence (anti double crédit). On affiche tout de même un état
 * désactivé pour les tickets déjà clôturés.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../lib/auth";
import { formatDate, formatPrice } from "../../lib/utils";
import {
  LifeBuoy, Send, CheckCircle2, XCircle, Clock, MessageSquare,
  AlertTriangle, DollarSign, UserCheck, Filter,
} from "lucide-react";
import type { SupportTicket, SupportTicketMessage } from "@shared/schema";

const CATEGORY_LABELS: Record<string, string> = {
  order_problem: "Problème commande",
  missing_item: "Article manquant",
  late_delivery: "Retard livraison",
  refund_request: "Remboursement",
  payment_problem: "Paiement",
  driver_problem: "Livreur",
  restaurant_problem: "Restaurant",
  other: "Autre",
};

const STATUSES = ["open", "in_review", "waiting_customer", "resolved", "rejected"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

const STATUS_CLS: Record<string, string> = {
  open: "bg-amber-100 text-amber-800",
  in_review: "bg-blue-100 text-blue-800",
  waiting_customer: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-800",
};

const PRIORITY_CLS: Record<string, string> = {
  low: "bg-gray-50 text-gray-600",
  normal: "bg-slate-100 text-slate-700",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-200 text-red-900 font-bold",
};

export default function AdminSupport() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const queryKey = useMemo(
    () => ["/api/support/tickets", statusFilter, priorityFilter, categoryFilter] as const,
    [statusFilter, priorityFilter, categoryFilter],
  );

  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey,
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (statusFilter) sp.set("status", statusFilter);
      if (priorityFilter) sp.set("priority", priorityFilter);
      if (categoryFilter) sp.set("category", categoryFilter);
      const url = `/api/support/tickets${sp.toString() ? `?${sp.toString()}` : ""}`;
      const res = await apiRequest(url);
      return res.json();
    },
  });

  const selected = tickets?.find(t => t.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
            <LifeBuoy size={20} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Centre de support</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Gestion des tickets après livraison
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 mb-4 flex flex-wrap gap-2 items-center">
          <Filter size={14} className="text-gray-500" />
          <FilterSelect label="Statut" value={statusFilter} onChange={setStatusFilter} options={STATUSES} testid="filter-status" />
          <FilterSelect label="Priorité" value={priorityFilter} onChange={setPriorityFilter} options={PRIORITIES} testid="filter-priority" />
          <FilterSelect label="Catégorie" value={categoryFilter} onChange={setCategoryFilter} options={Object.keys(CATEGORY_LABELS)} testid="filter-category" labels={CATEGORY_LABELS} />
          {(statusFilter || priorityFilter || categoryFilter) && (
            <button
              onClick={() => { setStatusFilter(""); setPriorityFilter(""); setCategoryFilter(""); }}
              className="text-xs text-red-600 underline ml-2"
              data-testid="button-clear-filters"
            >
              Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Liste */}
          <div className="lg:col-span-1 space-y-2 max-h-[80vh] overflow-y-auto pr-1">
            {isLoading && <p className="text-sm text-gray-500">Chargement…</p>}
            {!isLoading && tickets?.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8" data-testid="empty-admin-tickets">
                Aucun ticket avec ces filtres.
              </p>
            )}
            {tickets?.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left bg-white dark:bg-gray-900 rounded-xl border p-3 transition-all ${
                  selectedId === t.id
                    ? "border-red-400 dark:border-red-700 shadow-md"
                    : "border-gray-100 dark:border-gray-800 hover:border-red-200"
                }`}
                data-testid={`admin-ticket-${t.id}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-gray-500">{t.ticketNumber}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_CLS[t.priority] ?? ""}`}>
                    {t.priority}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {t.title || t.subject || CATEGORY_LABELS[t.category ?? "other"]}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">{CATEGORY_LABELS[t.category ?? "other"]}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_CLS[t.status] ?? ""}`}>
                    {t.status}
                  </span>
                  <span className="text-[10px] text-gray-400">{formatDate(t.createdAt!)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Détail */}
          <div className="lg:col-span-2">
            {selected ? (
              <TicketDetail key={selected.id} ticket={selected} onChanged={() => queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] })} />
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center">
                <MessageSquare size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                <p className="text-sm text-gray-500">Sélectionnez un ticket dans la liste.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options, testid, labels,
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; testid: string; labels?: Record<string, string> }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-9 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
      data-testid={testid}
    >
      <option value="">{label} : tous</option>
      {options.map(o => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
    </select>
  );
}

function TicketDetail({ ticket, onChanged }: { ticket: SupportTicket; onChanged: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const [refundAmount, setRefundAmount] = useState<string>(
    ticket.requestedRefundAmount != null ? String(ticket.requestedRefundAmount) : "",
  );
  const [refundNote, setRefundNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const { data: messages } = useQuery<SupportTicketMessage[]>({
    queryKey: ["/api/support/tickets", ticket.id, "messages"],
  });

  const send = useMutation({
    mutationFn: async (body: { message: string }) => {
      const res = await apiRequest(`/api/support/tickets/${ticket.id}/messages`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets", ticket.id, "messages"] });
      onChanged();
    },
    onError: (e: any) => toast({ title: "Erreur", description: e?.message, variant: "destructive" }),
  });

  function patch(body: any, msg: string) {
    return apiRequest(`/api/support/tickets/${ticket.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then(() => {
      onChanged();
      toast({ title: msg });
    });
  }

  const refund = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/support/tickets/${ticket.id}/refund`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(refundAmount), note: refundNote || null }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Remboursement approuvé", description: "Le wallet du client a été crédité." });
      onChanged();
    },
    onError: (e: any) => toast({ title: "Erreur", description: e?.message, variant: "destructive" }),
  });

  const reject = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/support/tickets/${ticket.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason }),
      });
    },
    onSuccess: () => { toast({ title: "Ticket rejeté" }); onChanged(); },
    onError: (e: any) => toast({ title: "Erreur", description: e?.message, variant: "destructive" }),
  });

  const resolve = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/support/tickets/${ticket.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ note: refundNote || null }),
      });
    },
    onSuccess: () => { toast({ title: "Ticket résolu" }); onChanged(); },
    onError: (e: any) => toast({ title: "Erreur", description: e?.message, variant: "destructive" }),
  });

  const isTerminal = ["resolved", "rejected", "closed"].includes(ticket.status);
  const refundLocked = ticket.approvedRefundAmount != null;

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages?.length]);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-4">
      {/* En-tête */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="text-[10px] font-mono text-gray-500">{ticket.ticketNumber}</p>
            <h3 className="text-base font-bold text-gray-900 dark:text-white" data-testid="text-detail-title">
              {ticket.title || ticket.subject || "Ticket"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{CATEGORY_LABELS[ticket.category ?? "other"]}</p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_CLS[ticket.status] ?? ""}`}>{ticket.status}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded ${PRIORITY_CLS[ticket.priority] ?? ""}`}>{ticket.priority}</span>
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-200 mt-2 whitespace-pre-wrap">{ticket.description}</p>
        <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-gray-500">
          {ticket.orderId && <span>Commande #{ticket.orderId}</span>}
          {ticket.requestedRefundAmount != null && <span>Demandé : <b>{formatPrice(ticket.requestedRefundAmount)}</b></span>}
          {ticket.approvedRefundAmount != null && <span className="text-green-700">Crédité : <b>{formatPrice(ticket.approvedRefundAmount)}</b></span>}
        </div>
      </div>

      {/* Actions admin */}
      {!isTerminal && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
          <select
            value={ticket.status}
            onChange={e => patch({ status: e.target.value }, "Statut mis à jour")}
            className="h-9 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950"
            data-testid="select-detail-status"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={ticket.priority}
            onChange={e => patch({ priority: e.target.value }, "Priorité mise à jour")}
            className="h-9 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950"
            data-testid="select-detail-priority"
          >
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={() => user?.id && patch({ assignedAdminId: user.id, status: "in_review" }, "Ticket assigné")}
            disabled={!user?.id || ticket.assignedAdminId === user?.id}
            className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 text-xs flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            data-testid="button-self-assign"
            type="button"
          >
            <UserCheck size={12} /> {ticket.assignedAdminId === user?.id ? "Assigné" : "M'assigner"}
          </button>
        </div>
      )}

      {/* Conversation */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Conversation</p>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1" data-testid="admin-chat">
          {messages?.map(m => {
            const fromCustomer = m.senderId === ticket.userId;
            return (
              <div key={m.id} className={`flex ${fromCustomer ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  fromCustomer
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    : "bg-red-600 text-white"
                }`}>
                  <p className="whitespace-pre-wrap">{m.message}</p>
                  {m.imageUrl && <img src={m.imageUrl} alt="" className="mt-1 rounded max-h-32" />}
                  <p className={`text-[10px] mt-1 ${fromCustomer ? "text-gray-500" : "text-white/70"}`}>{formatDate(m.createdAt!)}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        {!isTerminal && (
          <div className="flex gap-2 mt-2">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && draft.trim() && send.mutate({ message: draft })}
              placeholder="Répondre au client…"
              className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm"
              data-testid="input-admin-message"
            />
            <button
              onClick={() => draft.trim() && send.mutate({ message: draft })}
              disabled={!draft.trim() || send.isPending}
              className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center disabled:opacity-50"
              data-testid="button-admin-send"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Décisions finales */}
      {!isTerminal && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          {/* Remboursement */}
          <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold text-green-800 dark:text-green-300 flex items-center gap-1.5">
              <DollarSign size={12} /> Approuver remboursement
            </p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={refundAmount}
              onChange={e => setRefundAmount(e.target.value)}
              placeholder="Montant FC"
              className="w-full h-9 px-2 text-sm rounded-lg border border-green-200 dark:border-green-800 bg-white dark:bg-gray-900"
              data-testid="input-refund-amount"
              disabled={refundLocked}
            />
            <input
              value={refundNote}
              onChange={e => setRefundNote(e.target.value)}
              placeholder="Note (facultatif)"
              className="w-full h-9 px-2 text-sm rounded-lg border border-green-200 dark:border-green-800 bg-white dark:bg-gray-900"
              data-testid="input-refund-note"
              disabled={refundLocked}
            />
            <button
              onClick={() => refund.mutate()}
              disabled={refundLocked || !Number(refundAmount) || refund.isPending}
              className="w-full h-9 rounded-lg bg-green-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              data-testid="button-approve-refund"
            >
              <CheckCircle2 size={12} />
              {refundLocked ? "Déjà remboursé" : refund.isPending ? "…" : "Créditer le wallet"}
            </button>
          </div>

          {/* Rejet / résolution */}
          <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Rejet / résolution
            </p>
            <input
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Motif (rejet)"
              className="w-full h-9 px-2 text-sm rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900"
              data-testid="input-reject-reason"
            />
            <div className="flex gap-2">
              <button
                onClick={() => rejectReason.trim().length >= 3 && reject.mutate()}
                disabled={rejectReason.trim().length < 3 || reject.isPending}
                className="flex-1 h-9 rounded-lg bg-red-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                data-testid="button-reject-ticket"
              >
                <XCircle size={12} /> Rejeter
              </button>
              <button
                onClick={() => resolve.mutate()}
                disabled={resolve.isPending}
                className="flex-1 h-9 rounded-lg bg-gray-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                data-testid="button-resolve-ticket"
              >
                <CheckCircle2 size={12} /> Résoudre
              </button>
            </div>
          </div>
        </div>
      )}

      {isTerminal && (
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 text-xs text-gray-500">
          {ticket.resolutionNote && <p>Note finale : <span className="italic">{ticket.resolutionNote}</span></p>}
          {ticket.resolvedAt && <p>Clôturé le {formatDate(ticket.resolvedAt)}</p>}
        </div>
      )}
    </div>
  );
}
