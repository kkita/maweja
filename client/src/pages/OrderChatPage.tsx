import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { apiRequest, queryClient, authFetchJson } from "../lib/queryClient";
import { onWSMessage } from "../lib/websocket";
import { ArrowLeft, Send, Lock, MessageCircle, User as UserIcon, Truck } from "lucide-react";
import type { ChatMessage, User } from "@shared/schema";
import { AppEmptyState } from "../design-system/primitives";

interface OrderPartnerInfo {
  partner: User | null;
  active: boolean;
  orderId: number;
  status: string;
}

/**
 * Chat lié à une commande : Client ↔ Agent (driver).
 * Disponible tant que la commande est active.
 * Verrouillé automatiquement dès que la commande est livrée/annulée/retournée.
 */
export default function OrderChatPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/chat/order/:orderId");
  const orderId = Number(params?.orderId);
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: info, isLoading } = useQuery<OrderPartnerInfo>({
    queryKey: ["/api/chat/order-partner", orderId],
    queryFn: () => authFetchJson(`/api/chat/order-partner/${orderId}`),
    enabled: !!orderId && !!user,
    refetchInterval: 8000,
  });

  const partnerId = info?.partner?.id;
  const isLocked = info ? !info.active : false;

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

  const send = async () => {
    if (!text.trim() || !user?.id || !partnerId || sending || isLocked) return;
    setSending(true);
    try {
      await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({ senderId: user.id, receiverId: partnerId, message: text.trim() }),
      });
      setText("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat", user.id, partnerId] });
    } catch (e: any) {
      // L'erreur 403 (commande terminée) sera gérée par le re-fetch info
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
          onClick={() => navigate(-1 as any)}
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

      {/* Empty / no partner */}
      {!isLoading && !info?.partner && (
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

      {/* Locked banner */}
      {isLocked && (
        <div className="mx-4 mb-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" data-testid="banner-locked">
          <Lock size={14} className="text-zinc-500" />
          <p className="text-[12px] text-zinc-600 dark:text-zinc-300 font-medium">
            Cette commande est terminée. La conversation est désormais verrouillée.
          </p>
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
