import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { apiRequest, queryClient, authFetchJson } from "../lib/queryClient";
import { onWSMessage } from "../lib/websocket";
import { ArrowLeft, Send, Lock, MessageCircle, User as UserIcon, Truck, AlertCircle, Loader2, LifeBuoy } from "lucide-react";
import type { ChatMessage, User } from "@shared/schema";
import { AppEmptyState } from "../design-system/primitives";
import { useToast } from "../hooks/use-toast";

type ChatReason =
  | "active"
  | "post_delivery_window"
  | "support_open"
  | "closed"
  | "no_history"
  | "admin"
  | "not_allowed";

interface OrderPartnerInfo {
  partner: User | null;
  active: boolean;
  orderId: number;
  status: string;
  /** Date ISO de livraison effective. */
  deliveredAt?: string | null;
  /** Durée de la fenêtre de chat post-livraison (minutes). */
  postDeliveryWindowMinutes?: number;
  /** Date ISO d'expiration de la fenêtre post-livraison. */
  postDeliveryExpiresAt?: string | null;
  /** Id du ticket support actuellement ouvert pour cette commande, sinon null. */
  supportTicketId?: number | null;
  /** Le chat client↔livreur est-il actuellement autorisé ? */
  chatAllowed?: boolean;
  /** Raison détaillée (utilisée pour le bandeau / message). */
  chatReason?: ChatReason;
}

/**
 * Chat lié à une commande : Client ↔ Agent (driver).
 * Disponible tant que la commande est active.
 * Verrouillé automatiquement dès que la commande est livrée/annulée/retournée.
 *
 * Accepté sur les routes :
 *   /chat/order/:orderId          (compatibilité historique — Client/Admin)
 *   /driver/chat/order/:orderId   (Agent — évite la collision contextuelle mobile)
 */
export default function OrderChatPage() {
  const [, navigate] = useLocation();
  const [, paramsClient] = useRoute("/chat/order/:orderId");
  const [, paramsDriver] = useRoute("/driver/chat/order/:orderId");
  const params = paramsDriver || paramsClient;
  const orderId = Number(params?.orderId);
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const goBack = () => {
    // Retour explicite (jamais navigate(-1) seul) — sur mobile, l'historique
    // peut être vide en deep-link et renverrait vers login/splash.
    if (user?.role === "driver") {
      navigate(`/driver/order/${orderId}`);
    } else if (user?.role === "client") {
      navigate(`/tracking/${orderId}`);
    } else if (user?.role === "admin") {
      navigate(`/admin/orders/${orderId}`);
    } else {
      navigate("/");
    }
  };

  const { data: info, isLoading, error: partnerError } = useQuery<OrderPartnerInfo>({
    queryKey: ["/api/chat/order-partner", orderId],
    queryFn: () => authFetchJson(`/api/chat/order-partner/${orderId}`),
    enabled: !!orderId && !!user,
    refetchInterval: 8000,
    retry: (failureCount, err: any) => {
      // Ne JAMAIS retenter sur 401/403 (autorisation) — sinon on spamme l'API
      // et l'utilisateur reste bloqué sur un faux "loading".
      const status = err?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });

  const partnerErrStatus = (partnerError as any)?.status as number | undefined;
  const isAuthError = partnerErrStatus === 401 || partnerErrStatus === 403;

  const partnerId = info?.partner?.id;
  // Le chat est verrouillé uniquement quand le serveur dit explicitement
  // chatAllowed=false. Tant que le payload n'est pas chargé OU que
  // chatAllowed est undefined (compat ancienne API), on retombe sur l'ancien
  // critère `active`.
  const chatAllowed = info?.chatAllowed ?? info?.active ?? true;
  const isLocked = info ? !chatAllowed : false;
  const chatReason = info?.chatReason;
  const lockedMessage =
    chatReason === "closed" || chatReason === "no_history"
      ? "Le chat avec le livreur est fermé. Vous pouvez contacter le support MAWEJA."
      : "Cette conversation est désormais verrouillée.";

  // Hors fenêtre + pas de ticket actif = on propose d'ouvrir le support
  const canOpenSupportTicket =
    !!info && !chatAllowed && !info.supportTicketId && !!info.orderId;
  const supportTicketAlreadyOpen = !!info?.supportTicketId;
  const { toast } = useToast();
  const [openingTicket, setOpeningTicket] = useState(false);

  const openSupportTicket = async () => {
    if (!info?.orderId || openingTicket) return;
    setOpeningTicket(true);
    try {
      const res = await apiRequest("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({ orderId: info.orderId }),
      });
      const result = (await res.json()) as { ticket: { id: number }; alreadyOpen: boolean };
      toast({
        title: "Ticket support ouvert",
        description: result.alreadyOpen
          ? "Un ticket est déjà ouvert pour cette commande, vous pouvez à nouveau écrire."
          : "Notre équipe a été notifiée. Vous pouvez à nouveau écrire au livreur.",
      });
      // Re-fetch l'état du chat (ré-autorisation grâce au ticket open)
      queryClient.invalidateQueries({ queryKey: ["/api/chat/order-partner", orderId] });
    } catch (e: any) {
      toast({
        title: "Impossible d'ouvrir le ticket",
        description: e?.message || "Réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setOpeningTicket(false);
    }
  };

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", user?.id, partnerId],
    queryFn: () => authFetchJson(`/api/chat/${user!.id}/${partnerId}`),
    enabled: !!user && !!partnerId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    return onWSMessage(data => {
      if (data.type === "chat_message" || data.type === "notification") {
        queryClient.invalidateQueries({ queryKey: ["/api/chat", user?.id, partnerId] });
      }
      if (data.type === "order_updated" || data.type === "order_status") {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/order-partner", orderId] });
      }
    });
  }, [user?.id, partnerId, orderId]);

  // Marquer comme lu au chargement
  useEffect(() => {
    if (!user?.id || !partnerId) return;
    apiRequest(`/api/chat/read/${partnerId}/${user.id}`, { method: "PATCH" })
      .then(() => queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] }))
      .catch(() => {});
  }, [user?.id, partnerId, messages.length]);

  const [sendError, setSendError] = useState<string | null>(null);
  const send = async () => {
    if (!text.trim() || !user?.id || !partnerId || sending || isLocked) return;
    setSending(true);
    setSendError(null);
    try {
      await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({ senderId: user.id, receiverId: partnerId, message: text.trim() }),
      });
      setText("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat", user.id, partnerId] });
    } catch (e: any) {
      // 401/403 → message inline, AUCUN logout, AUCUN clear de token
      const status = e?.status;
      if (status === 401 || status === 403) {
        setSendError("Conversation indisponible. Vérifiez que cette commande vous est bien assignée.");
      } else {
        setSendError("Échec d'envoi du message. Réessayez dans un instant.");
      }
      // Re-fetch l'info pour rafraîchir l'état (ex: commande passée à terminée)
      queryClient.invalidateQueries({ queryKey: ["/api/chat/order-partner", orderId] });
    } finally {
      setSending(false);
    }
  };

  const partnerLabel = info?.partner?.role === "driver" ? "Votre agent" : info?.partner?.role === "client" ? "Votre client" : "Contact";
  const PartnerIcon = info?.partner?.role === "driver" ? Truck : UserIcon;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 dark:bg-zinc-950" data-testid="order-chat-page">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 shadow-sm">
        <button
          onClick={goBack}
          className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center"
          data-testid="button-back"
          aria-label="Retour"
        >
          <ArrowLeft size={18} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E10000] to-[#a30000] flex items-center justify-center text-white shadow">
          <PartnerIcon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-sm truncate" data-testid="text-partner-name">
            {info?.partner?.name || partnerLabel}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {isLocked ? "Conversation terminée" : info?.partner ? "En direct" : "Chargement…"}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && !info && !isAuthError && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" data-testid="state-loading">
          <Loader2 size={36} className="text-[#E10000] mb-3 animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Chargement de la conversation…</p>
        </div>
      )}

      {/* Auth/Permission error — JAMAIS de logout, JAMAIS de redirection */}
      {isAuthError && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" data-testid="state-auth-error">
          <AlertCircle size={48} className="text-amber-500 mb-3" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Conversation indisponible
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
            Vérifiez que cette commande vous est bien assignée.
          </p>
          <button
            onClick={goBack}
            data-testid="button-back-error"
            className="mt-5 px-4 py-2 rounded-full bg-gray-100 dark:bg-zinc-800 text-xs font-bold text-gray-700 dark:text-gray-200 active:scale-95 transition-transform"
          >
            Retour
          </button>
        </div>
      )}

      {/* Empty / no partner */}
      {!isLoading && !isAuthError && !info?.partner && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <MessageCircle size={48} className="text-gray-300 dark:text-zinc-700 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="text-no-partner">
            {user?.role === "client"
              ? "Aucun agent assigné à cette commande pour l'instant."
              : "Aucun client lié à cette commande."}
          </p>
        </div>
      )}

      {/* Messages */}
      {!!info?.partner && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" data-testid="messages-list">
          {messages.length === 0 && !isLoading && (
            <AppEmptyState
              icon={MessageCircle}
              title="Aucun message"
              description="Écrivez le premier !"
              size="sm"
            />
          )}
          {messages.map(m => {
            const mine = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
                    mine
                      ? "bg-brand text-white rounded-br-md"
                      : "bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-100 dark:border-zinc-700"
                  }`}
                  data-testid={`message-${m.id}`}
                >
                  {m.message}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      )}

      {/* Locked banner — chat fermé après expiration de la fenêtre post-livraison */}
      {isLocked && (
        <div
          className="mx-4 mb-3 flex flex-col gap-2 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
          data-testid="banner-locked"
        >
          <div className="flex items-start gap-2">
            <Lock size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
              {lockedMessage}
            </p>
          </div>
          {canOpenSupportTicket && user?.role !== "driver" && (
            <button
              onClick={openSupportTicket}
              disabled={openingTicket}
              data-testid="button-contact-support"
              className="self-start inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-brand text-white text-[12px] font-bold active:scale-95 transition-transform disabled:opacity-50 shadow-sm"
            >
              {openingTicket ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <LifeBuoy size={14} />
              )}
              Contacter le support
            </button>
          )}
          {supportTicketAlreadyOpen && (
            <p
              className="text-[11px] text-zinc-500 dark:text-zinc-400"
              data-testid="text-support-ticket-pending"
            >
              Un ticket support est en cours de traitement pour cette commande.
            </p>
          )}
        </div>
      )}

      {/* Inline send error — pas de logout, pas de redirection */}
      {sendError && (
        <div
          className="mx-4 mb-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[12px] text-amber-800 dark:text-amber-200 flex items-start gap-2"
          data-testid="banner-send-error"
        >
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{sendError}</span>
        </div>
      )}

      {/* Input */}
      {!!info?.partner && !isLocked && (
        <div className="px-3 py-3 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-2 safe-area-bottom">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Écrire un message…"
            disabled={sending}
            data-testid="input-message"
            className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 border border-transparent focus:border-[#E10000]/30 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            data-testid="button-send"
            aria-label="Envoyer"
            className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform shadow-md"
          >
            <Send size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
