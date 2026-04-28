import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { authFetchJson, apiRequest, queryClient, resolveImg } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import type { Notification as Notif } from "@shared/schema";
import DriverNav from "../../components/DriverNav";
import { dt } from "../../components/driver/DriverUI";
import {
  AppCard, AppButton, AppBadge, AppEmptyState,
} from "../../design-system/primitives";
import {
  Bell, BellOff, Check, CheckCheck, RefreshCw, Loader2,
  Package, MessageSquare, X, Image as ImageIcon, ChevronRight,
} from "lucide-react";

const dtFormat = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffMin < 1440) return `Il y a ${Math.floor(diffMin / 60)} h`;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(d);
  }
};

const typeLabel = (t?: string | null): string => {
  switch (t) {
    case "order": return "Commande";
    case "order_assigned": return "Nouvelle livraison";
    case "order_status": return "Statut commande";
    case "chat": return "Message";
    case "promo": return "Promotion";
    case "system": return "Système";
    case "wallet": return "Portefeuille";
    default: return "Notification";
  }
};

type Variant = "error" | "brand" | "info" | "cyan" | "gray" | "purple" | "warning" | "success";
const typeVariant = (t?: string | null): Variant => {
  switch (t) {
    case "order":
    case "order_assigned":
    case "order_status":
      return "warning";
    case "chat": return "info";
    case "promo": return "purple";
    case "wallet": return "success";
    default: return "info";
  }
};

export default function DriverNotifications() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Notif | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const notifQueryKey = ["/api/notifications", user?.id] as const;

  const { data: notifications = [], isLoading, isFetching, refetch } = useQuery<Notif[]>({
    queryKey: notifQueryKey,
    queryFn: () => authFetchJson(`/api/notifications/${user?.id}`),
    enabled: !!user,
  });

  // ─── Tri : non lues d'abord, puis par date décroissante ────────────────────
  const sorted = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ─── Mark one (optimiste, rollback si erreur) ──────────────────────────────
  const markOneMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" }),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: notifQueryKey });
      const previous = queryClient.getQueryData<Notif[]>(notifQueryKey);
      queryClient.setQueryData<Notif[]>(notifQueryKey, (old) =>
        (old || []).map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notifQueryKey, ctx.previous);
      toast({ title: "Erreur", description: "Impossible de marquer comme lu", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notifQueryKey });
    },
  });

  // ─── Mark all (action volontaire uniquement, après confirmation) ──────────
  const markAllMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/notifications/read-all/${user?.id}`, { method: "PATCH" }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notifQueryKey });
      const previous = queryClient.getQueryData<Notif[]>(notifQueryKey);
      queryClient.setQueryData<Notif[]>(notifQueryKey, (old) =>
        (old || []).map((n) => ({ ...n, isRead: true })),
      );
      return { previous };
    },
    onSuccess: () => {
      toast({ title: "Tout marqué comme lu", description: `${unreadCount} notification${unreadCount > 1 ? "s" : ""} mise${unreadCount > 1 ? "s" : ""} à jour` });
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notifQueryKey, ctx.previous);
      toast({ title: "Erreur", description: "Impossible de tout marquer comme lu", variant: "destructive" });
    },
    onSettled: () => {
      setConfirmAll(false);
      queryClient.invalidateQueries({ queryKey: notifQueryKey });
    },
  });

  // ─── Actions sur clic notif ────────────────────────────────────────────────
  const openNotification = (n: Notif) => {
    setSelected(n);
    if (!n.isRead) markOneMutation.mutate(n.id);
  };

  const dataAny = (selected?.data || {}) as Record<string, any>;
  const orderId = dataAny.orderId ?? dataAny.order_id;
  const chatId = dataAny.chatId ?? dataAny.chat_id;

  const goToOrder = () => {
    if (!orderId) return;
    setSelected(null);
    navigate(`/driver/order/${orderId}`);
  };

  const goToChat = () => {
    setSelected(null);
    navigate(`/driver/chat`);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: dt.bg, color: dt.text }}>
      <DriverNav />

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* ─── En-tête de page ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(225,0,0,0.1)" }}
            >
              <Bell size={20} style={{ color: dt.accent }} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="font-black text-xl leading-tight" data-testid="text-page-title">Notifications</h1>
              <p className="text-[11px]" style={{ color: dt.text3 }} data-testid="text-unread-summary">
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est lu"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh-notifs"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              style={{ background: dt.surface2, color: dt.text2 }}
              title="Actualiser"
            >
              {isFetching ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            </button>
          </div>
        </div>

        {/* ─── Action "Tout marquer comme lu" ─────────────────────────────── */}
        {unreadCount > 0 && (
          <div className="mb-3">
            {!confirmAll ? (
              <AppButton
                onClick={() => setConfirmAll(true)}
                variant="secondary"
                size="sm"
                icon={CheckCheck}
                fullWidth
                testId="button-mark-all-read"
              >
                Tout marquer comme lu ({unreadCount})
              </AppButton>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border" style={{ background: dt.surface2, borderColor: dt.border }}>
                <span className="text-[12px] font-semibold flex-1" style={{ color: dt.text2 }}>
                  Confirmer ?
                </span>
                <AppButton
                  onClick={() => markAllMutation.mutate()}
                  variant="primary"
                  size="xs"
                  loading={markAllMutation.isPending}
                  testId="button-confirm-mark-all"
                >
                  Oui, tout lire
                </AppButton>
                <AppButton
                  onClick={() => setConfirmAll(false)}
                  variant="ghost"
                  size="xs"
                  testId="button-cancel-mark-all"
                >
                  Annuler
                </AppButton>
              </div>
            )}
          </div>
        )}

        {/* ─── Liste des notifications ────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin" style={{ color: dt.accent }} />
          </div>
        ) : sorted.length === 0 ? (
          <AppEmptyState
            icon={BellOff}
            title="Aucune notification"
            description="Vous serez prévenu ici dès qu'une nouvelle livraison ou un message arrivera."
          />
        ) : (
          <div className="space-y-2.5" data-testid="list-notifications">
            {sorted.map((n) => {
              const data = (n.data || {}) as Record<string, any>;
              const hasOrder = !!(data.orderId ?? data.order_id);
              const hasImage = !!n.imageUrl;
              return (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  data-testid={`card-notif-${n.id}`}
                  className="w-full text-left p-3.5 rounded-2xl border transition-all active:scale-[0.98]"
                  style={{
                    background: n.isRead ? dt.surface : dt.surface2,
                    borderColor: n.isRead ? dt.border : "rgba(225,0,0,0.35)",
                    boxShadow: n.isRead ? "none" : "0 0 0 1px rgba(225,0,0,0.08)",
                  }}
                >
                  <div className="flex gap-3">
                    {/* Miniature image OU pastille type */}
                    {hasImage ? (
                      <img
                        src={resolveImg(n.imageUrl as string)}
                        alt=""
                        loading="lazy"
                        data-testid={`img-notif-thumb-${n.id}`}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        style={{ background: dt.surface3 }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(225,0,0,0.08)" }}
                      >
                        <Bell size={18} style={{ color: dt.accent }} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <h3
                          className="font-bold text-[13px] leading-tight flex-1"
                          style={{ color: dt.text }}
                          data-testid={`text-notif-title-${n.id}`}
                        >
                          {n.title}
                        </h3>
                        {!n.isRead && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                            style={{ background: dt.accent, boxShadow: "0 0 6px rgba(225,0,0,0.5)" }}
                            data-testid={`dot-unread-${n.id}`}
                          />
                        )}
                      </div>

                      <p
                        className="text-[12px] leading-snug line-clamp-2 mb-1.5"
                        style={{ color: dt.text2 }}
                        data-testid={`text-notif-message-${n.id}`}
                      >
                        {n.message}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <AppBadge variant={typeVariant(n.type)} size="xs">
                          {typeLabel(n.type)}
                        </AppBadge>
                        <AppBadge variant={n.isRead ? "gray" : "error"} size="xs">
                          {n.isRead ? "Lu" : "Non lu"}
                        </AppBadge>
                        {hasOrder && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: dt.orange }}>
                            <Package size={10} />
                            Livraison
                          </span>
                        )}
                        <span className="text-[10px] font-medium ml-auto" style={{ color: dt.text3 }}>
                          {dtFormat(n.createdAt)}
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={14} style={{ color: dt.text3 }} className="self-center flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal détail notification ──────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelected(null)}
          data-testid="modal-notif-detail"
        >
          <AppCard
            className="w-full max-w-lg rounded-b-none sm:rounded-2xl max-h-[88vh] overflow-y-auto"
            padding={false}
            style={{ background: dt.surface }}
          >
            <div onClick={(e) => e.stopPropagation()}>
              {selected.imageUrl && (
                <div
                  className="relative w-full"
                  style={{ background: dt.surface3, paddingTop: "56%" }}
                >
                  <img
                    src={resolveImg(selected.imageUrl)}
                    alt=""
                    data-testid="img-notif-large"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <AppBadge variant={typeVariant(selected.type)}>{typeLabel(selected.type)}</AppBadge>
                      <span className="text-[11px] font-medium" style={{ color: dt.text3 }}>
                        {dtFormat(selected.createdAt)}
                      </span>
                    </div>
                    <h2 className="font-black text-lg leading-tight" data-testid="text-detail-title">
                      {selected.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    data-testid="button-close-detail"
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: dt.surface2, color: dt.text2 }}
                  >
                    <X size={15} />
                  </button>
                </div>

                <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: dt.text2 }} data-testid="text-detail-message">
                  {selected.message}
                </p>

                {/* Actions contextuelles selon le payload */}
                <div className="space-y-2 pt-2">
                  {orderId && (
                    <AppButton
                      onClick={goToOrder}
                      variant="primary"
                      size="md"
                      icon={Package}
                      fullWidth
                      testId="button-go-to-order"
                    >
                      Voir la livraison
                    </AppButton>
                  )}
                  {(chatId || dataAny.clientId) && (
                    <AppButton
                      onClick={goToChat}
                      variant="secondary"
                      size="md"
                      icon={MessageSquare}
                      fullWidth
                      testId="button-go-to-chat"
                    >
                      Ouvrir le chat
                    </AppButton>
                  )}
                  {!selected.isRead && (
                    <AppButton
                      onClick={() => markOneMutation.mutate(selected.id)}
                      variant="ghost"
                      size="sm"
                      icon={Check}
                      fullWidth
                      loading={markOneMutation.isPending}
                      testId="button-mark-one-read"
                    >
                      Marquer comme lu
                    </AppButton>
                  )}
                </div>
              </div>
            </div>
          </AppCard>
        </div>
      )}
    </div>
  );
}
