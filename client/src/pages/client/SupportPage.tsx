/**
 * PARTIE 5 — Support Center (vue client).
 *
 * Deux pages exportées depuis ce module :
 *  - `SupportPage`        → liste les tickets du client + ouvrir un nouveau
 *  - `SupportTicketPage`  → détail d'un ticket + chat avec l'admin
 *
 * Le formulaire de création couvre tous les cas : avec ou sans commande
 * associée, choix de catégorie, montant souhaité, image de preuve.
 * Les statuts sont rendus avec des badges couleur lisibles d'un coup d'œil.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { formatDate, formatPrice } from "../../lib/utils";
import ClientNav from "../../components/ClientNav";
import {
  ArrowLeft, LifeBuoy, Plus, Send, Image as ImageIcon, X,
  CheckCircle2, XCircle, Clock, MessageSquare, AlertTriangle,
} from "lucide-react";
import type { SupportTicket, SupportTicketMessage } from "@shared/schema";

const CATEGORY_LABELS: Record<string, string> = {
  order_problem: "Problème de commande",
  missing_item: "Article manquant",
  late_delivery: "Livraison en retard",
  refund_request: "Demande de remboursement",
  payment_problem: "Problème de paiement",
  driver_problem: "Problème avec le livreur",
  restaurant_problem: "Problème avec le restaurant",
  other: "Autre",
};

const STATUS_BADGES: Record<string, { label: string; cls: string; icon: any }> = {
  open:              { label: "Ouvert",            cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300", icon: Clock },
  in_review:         { label: "En traitement",     cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300", icon: MessageSquare },
  waiting_customer:  { label: "En attente de vous",cls: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300", icon: AlertTriangle },
  resolved:          { label: "Résolu",            cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300", icon: CheckCircle2 },
  rejected:          { label: "Rejeté",            cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300", icon: XCircle },
  closed:            { label: "Clôturé",           cls: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const b = STATUS_BADGES[status] ?? STATUS_BADGES.open;
  const Icon = b.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${b.cls}`}
      data-testid={`badge-status-${status}`}
    >
      <Icon size={11} /> {b.label}
    </span>
  );
}

// ─── Liste des tickets du client ────────────────────────────────────────────
export default function SupportPage() {
  const [, navigate] = useLocation();
  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets/mine"],
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700"
            data-testid="button-back-home"
          >
            <ArrowLeft size={18} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Support MAWEJA</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Vos demandes d'assistance</p>
          </div>
          <button
            onClick={() => navigate("/support/new")}
            className="px-3 h-10 rounded-xl bg-red-600 text-white text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-red-200"
            data-testid="button-new-ticket"
          >
            <Plus size={16} /> Nouveau
          </button>
        </div>

        {isLoading && (
          <div className="text-sm text-gray-500 dark:text-gray-400 py-10 text-center">Chargement…</div>
        )}

        {!isLoading && (!tickets || tickets.length === 0) && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 text-center" data-testid="empty-tickets">
            <LifeBuoy size={36} className="mx-auto text-red-600 mb-2" />
            <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">Aucun ticket pour le moment</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Si vous avez un problème avec une commande, ouvrez un ticket et notre équipe vous répondra rapidement.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {tickets?.map((t) => (
            <Link key={t.id} to={`/support/${t.id}`}>
              <a
                className="block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:border-red-200 dark:hover:border-red-800 transition-all"
                data-testid={`card-ticket-${t.id}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{t.ticketNumber}</p>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white" data-testid={`text-title-${t.id}`}>
                      {t.title || t.subject || CATEGORY_LABELS[t.category ?? "other"]}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {CATEGORY_LABELS[t.category ?? "other"]}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                {t.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{t.description}</p>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] text-gray-500">{formatDate(t.createdAt!)}</span>
                  {t.approvedRefundAmount != null && (
                    <span className="text-[11px] font-bold text-green-600">
                      Remboursé : {formatPrice(t.approvedRefundAmount)}
                    </span>
                  )}
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Création d'un ticket ───────────────────────────────────────────────────
export function NewSupportTicketPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  // Récupère ?orderId=N depuis l'URL pour pré-remplir
  const params = new URLSearchParams(window.location.search);
  const presetOrderId = params.get("orderId");

  const [orderId, setOrderId] = useState(presetOrderId ?? "");
  const [category, setCategory] = useState("order_problem");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestedRefundAmount, setRequestedRefundAmount] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const create = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets/mine"] });
      toast({ title: "Ticket envoyé", description: "Notre équipe va revenir vers vous." });
      navigate(`/support/${data.ticket.id}`);
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e?.message ?? "Envoi impossible", variant: "destructive" });
    },
  });

  // Upload basique : on lit en data-URL pour la prévisualisation locale.
  // Le backend object-storage existant accepte les URLs absolues uploadées
  // ailleurs ; ici on se contente d'une URL embed pour la démo (le routeur
  // accepte une string non vide).
  function onPickImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => setImageUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  function submit() {
    if (title.trim().length < 3) {
      toast({ title: "Titre trop court", variant: "destructive" });
      return;
    }
    if (description.trim().length < 5) {
      toast({ title: "Description trop courte", variant: "destructive" });
      return;
    }
    create.mutate({
      orderId: orderId ? Number(orderId) : null,
      category,
      title: title.trim(),
      description: description.trim(),
      requestedRefundAmount: requestedRefundAmount ? Number(requestedRefundAmount) : null,
      imageUrl: imageUrl || null,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/support")}
            className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700"
            data-testid="button-back-support"
          >
            <ArrowLeft size={18} className="text-gray-700 dark:text-gray-300" />
          </button>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Signaler un problème</h2>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-4">
          {presetOrderId && (
            <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 rounded-lg px-2 py-1">
              Commande #{presetOrderId}
            </p>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 text-sm text-gray-900 dark:text-white"
              data-testid="select-category"
            >
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {!presetOrderId && (
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">N° commande (facultatif)</label>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.replace(/\D/g, ""))}
                className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 text-sm text-gray-900 dark:text-white"
                placeholder="ex: 1234"
                data-testid="input-orderId"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Titre</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 text-sm text-gray-900 dark:text-white"
              placeholder="Résumé en quelques mots"
              data-testid="input-title"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
              rows={5}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white"
              placeholder="Expliquez ce qui s'est passé"
              data-testid="textarea-description"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Remboursement demandé (FC, facultatif)
            </label>
            <input
              value={requestedRefundAmount}
              onChange={(e) => setRequestedRefundAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 text-sm text-gray-900 dark:text-white"
              placeholder="0"
              data-testid="input-refund-amount"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Photo de preuve (facultatif)
            </label>
            {imageUrl ? (
              <div className="relative inline-block">
                <img src={imageUrl} alt="" className="h-24 rounded-xl border border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => setImageUrl(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center"
                  data-testid="button-remove-image"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="px-3 h-10 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                data-testid="button-pick-image"
              >
                <ImageIcon size={14} /> Ajouter une photo
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onPickImage(e.target.files[0])}
            />
          </div>

          <button
            onClick={submit}
            disabled={create.isPending}
            className="w-full h-12 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-200 disabled:opacity-50"
            data-testid="button-submit-ticket"
          >
            {create.isPending ? "Envoi…" : "Envoyer le ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Détail d'un ticket + chat ──────────────────────────────────────────────
export function SupportTicketPage() {
  const [, params] = useRoute<{ id: string }>("/support/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id ?? 0);
  const { toast } = useToast();
  const [draft, setDraft] = useState("");

  const { data: ticket } = useQuery<SupportTicket>({
    queryKey: ["/api/support/tickets", id],
    enabled: id > 0,
  });
  const { data: messages, isLoading: loadingMsgs } = useQuery<SupportTicketMessage[]>({
    queryKey: ["/api/support/tickets", id, "messages"],
    enabled: id > 0,
  });

  const send = useMutation({
    mutationFn: async (body: { message: string }) => {
      const res = await apiRequest(`/api/support/tickets/${id}/messages`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets", id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets", id] });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e?.message, variant: "destructive" }),
  });

  // Auto-scroll en bas du chat à chaque nouveau message.
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages?.length]);

  const isTerminal = ticket && ["resolved", "rejected", "closed"].includes(ticket.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/support")}
            className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700"
            data-testid="button-back-support-list"
          >
            <ArrowLeft size={18} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{ticket?.ticketNumber}</p>
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate" data-testid="text-ticket-title">
              {ticket?.title || ticket?.subject || "Ticket"}
            </h2>
          </div>
          {ticket && <StatusBadge status={ticket.status} />}
        </div>

        {ticket && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{CATEGORY_LABELS[ticket.category ?? "other"]}</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{ticket.description}</p>
            {ticket.requestedRefundAmount != null && (
              <p className="text-xs text-gray-500 mt-2">Remboursement demandé : <b>{formatPrice(ticket.requestedRefundAmount)}</b></p>
            )}
            {ticket.approvedRefundAmount != null && (
              <p className="text-xs text-green-700 dark:text-green-400 mt-1 font-semibold">
                Crédité : {formatPrice(ticket.approvedRefundAmount)}
              </p>
            )}
            {ticket.resolutionNote && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">Note : {ticket.resolutionNote}</p>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 space-y-2 max-h-[55vh] overflow-y-auto" data-testid="chat-messages">
          {loadingMsgs && <p className="text-xs text-gray-500 text-center py-4">Chargement…</p>}
          {messages?.map((m) => {
            const mine = ticket && m.senderId === ticket.userId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                  }`}
                  data-testid={`msg-${m.id}`}
                >
                  <p className="whitespace-pre-wrap">{m.message}</p>
                  {m.imageUrl && <img src={m.imageUrl} alt="" className="mt-1 rounded-lg max-h-40" />}
                  <p className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-gray-500"}`}>
                    {formatDate(m.createdAt!)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {!isTerminal ? (
          <div className="fixed bottom-20 left-0 right-0 px-4">
            <div className="max-w-lg mx-auto flex gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 shadow-lg">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && draft.trim() && send.mutate({ message: draft })}
                placeholder="Écrire un message…"
                className="flex-1 h-11 px-3 rounded-xl bg-gray-50 dark:bg-gray-950 text-sm text-gray-900 dark:text-white border border-transparent focus:border-red-300 outline-none"
                data-testid="input-chat-message"
              />
              <button
                onClick={() => draft.trim() && send.mutate({ message: draft })}
                disabled={!draft.trim() || send.isPending}
                className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center disabled:opacity-50"
                data-testid="button-send-message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="fixed bottom-20 left-0 right-0 px-4">
            <div className="max-w-lg mx-auto bg-gray-100 dark:bg-gray-900 text-center text-xs text-gray-600 dark:text-gray-400 rounded-2xl p-3 border border-gray-200 dark:border-gray-800">
              Ce ticket est clôturé. Vous pouvez ouvrir un nouveau ticket si besoin.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
